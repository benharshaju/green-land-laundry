/**
 * Multi-Tab Orchestrator
 *
 * Manages multiple browser tabs with inter-tab communication,
 * synchronized actions, tab pooling, and workflow coordination.
 */

const EventEmitter = require('events');

class MultiTab extends EventEmitter {
  constructor(context) {
    super();
    this.context = context;       // Browser context
    this.tabs = new Map();        // name -> { page, state, metadata }
    this.tabPool = [];            // Reusable tab pool
    this.maxTabs = 10;
    this.sharedState = {};        // Shared state between tabs
  }

  /**
   * Open a new named tab
   */
  async open(name, url = null, options = {}) {
    if (this.tabs.size >= this.maxTabs) {
      throw new Error(`Max tabs (${this.maxTabs}) reached`);
    }

    // Reuse from pool if available
    let page;
    if (this.tabPool.length > 0) {
      page = this.tabPool.pop();
    } else {
      page = await this.context.newPage();
    }

    if (url) {
      await page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || 30000,
      });
    }

    this.tabs.set(name, {
      page,
      state: 'active',
      url: url || 'about:blank',
      openedAt: Date.now(),
      metadata: options.metadata || {},
    });

    this.emit('tab:opened', { name, url });
    console.log(`[MultiTab] Opened: "${name}" ${url || ''}`);
    return page;
  }

  /**
   * Get a tab's page by name
   */
  get(name) {
    const tab = this.tabs.get(name);
    if (!tab) throw new Error(`Tab "${name}" not found`);
    return tab.page;
  }

  /**
   * Close a tab (returns to pool for reuse)
   */
  async close(name, options = {}) {
    const tab = this.tabs.get(name);
    if (!tab) return;

    if (options.recycle !== false && this.tabPool.length < 3) {
      await tab.page.goto('about:blank');
      this.tabPool.push(tab.page);
    } else {
      await tab.page.close();
    }

    this.tabs.delete(name);
    this.emit('tab:closed', { name });
  }

  /**
   * Close all tabs
   */
  async closeAll() {
    for (const [name] of this.tabs) {
      await this.close(name, { recycle: false });
    }
    for (const page of this.tabPool) {
      await page.close();
    }
    this.tabPool = [];
  }

  /**
   * Switch focus to a tab
   */
  async focus(name) {
    const page = this.get(name);
    await page.bringToFront();
    this.emit('tab:focused', { name });
    return page;
  }

  /**
   * Run an action on a specific tab
   */
  async runOn(name, fn) {
    const page = this.get(name);
    return fn(page, this.sharedState);
  }

  /**
   * Run the same action on all tabs in parallel
   */
  async runOnAll(fn) {
    const results = new Map();
    const promises = Array.from(this.tabs.entries()).map(async ([name, tab]) => {
      try {
        const result = await fn(tab.page, name, this.sharedState);
        results.set(name, { success: true, result });
      } catch (err) {
        results.set(name, { success: false, error: err.message });
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Run actions on tabs sequentially in order
   */
  async runSequential(tabNames, fn) {
    const results = [];
    for (const name of tabNames) {
      const page = this.get(name);
      const result = await fn(page, name, this.sharedState);
      results.push({ name, result });
    }
    return results;
  }

  /**
   * Coordinate actions between tabs (e.g., login in tab A, then scrape in tab B)
   */
  async coordinate(workflow) {
    const results = {};

    for (const step of workflow) {
      const { tab, action, waitFor, shareAs } = step;
      const page = this.get(tab);

      // Wait for a condition from shared state
      if (waitFor) {
        await this._waitForState(waitFor, step.timeout || 30000);
      }

      // Execute action
      const result = await action(page, this.sharedState);

      // Share result to state
      if (shareAs) {
        this.sharedState[shareAs] = result;
        this.emit('state:updated', { key: shareAs, value: result });
      }

      results[`${tab}:${step.name || 'action'}`] = result;
    }

    return results;
  }

  /**
   * Set shared state
   */
  setState(key, value) {
    this.sharedState[key] = value;
    this.emit('state:updated', { key, value });
  }

  /**
   * Get shared state
   */
  getState(key) {
    return key ? this.sharedState[key] : { ...this.sharedState };
  }

  /**
   * Wait for shared state to match a condition
   */
  async _waitForState(condition, timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (typeof condition === 'string') {
        if (this.sharedState[condition] !== undefined) return;
      } else if (typeof condition === 'function') {
        if (condition(this.sharedState)) return;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    throw new Error(`State wait timeout: ${condition}`);
  }

  /**
   * Monitor a tab for navigation or changes
   */
  async monitor(name, options = {}) {
    const page = this.get(name);
    const events = [];

    page.on('load', () => {
      events.push({ type: 'load', url: page.url(), timestamp: Date.now() });
      this.emit('tab:navigated', { name, url: page.url() });
    });

    page.on('dialog', async (dialog) => {
      events.push({ type: 'dialog', message: dialog.message(), timestamp: Date.now() });
      this.emit('tab:dialog', { name, message: dialog.message() });
      if (options.autoAcceptDialogs !== false) {
        await dialog.accept();
      }
    });

    page.on('popup', async (popup) => {
      events.push({ type: 'popup', url: popup.url(), timestamp: Date.now() });
      this.emit('tab:popup', { name, url: popup.url() });
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        events.push({ type: 'console-error', text: msg.text(), timestamp: Date.now() });
      }
    });

    return events;
  }

  /**
   * Get status of all tabs
   */
  getStatus() {
    const status = {};
    for (const [name, tab] of this.tabs) {
      status[name] = {
        url: tab.page.url(),
        state: tab.state,
        openedAt: tab.openedAt,
        uptime: Date.now() - tab.openedAt,
        metadata: tab.metadata,
      };
    }
    return {
      totalTabs: this.tabs.size,
      poolSize: this.tabPool.length,
      maxTabs: this.maxTabs,
      tabs: status,
      sharedState: { ...this.sharedState },
    };
  }
}

module.exports = MultiTab;
