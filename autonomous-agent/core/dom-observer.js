/**
 * DOM Mutation Observer
 *
 * Watches for real-time DOM changes: element additions/removals,
 * attribute changes, text mutations. Triggers callbacks and
 * can auto-react to dynamic content loading.
 */

const EventEmitter = require('events');

class DOMObserver extends EventEmitter {
  constructor(options = {}) {
    super();
    this.watchers = new Map();
    this.mutations = [];
    this.maxMutations = options.maxMutations || 5000;
  }

  /**
   * Start observing DOM mutations on a page
   */
  async observe(page, options = {}) {
    const observerId = `observer_${Date.now()}`;

    await page.evaluate(({ id, config }) => {
      window.__domObservers = window.__domObservers || {};

      const mutations = [];
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          const entry = {
            type: mutation.type,
            timestamp: Date.now(),
          };

          if (mutation.type === 'childList') {
            entry.addedNodes = Array.from(mutation.addedNodes)
              .filter(n => n.nodeType === 1)
              .map(n => ({
                tag: n.tagName?.toLowerCase(),
                id: n.id || null,
                classes: Array.from(n.classList || []),
                text: n.innerText?.substring(0, 100) || null,
              }));
            entry.removedNodes = Array.from(mutation.removedNodes)
              .filter(n => n.nodeType === 1)
              .map(n => ({
                tag: n.tagName?.toLowerCase(),
                id: n.id || null,
              }));
          } else if (mutation.type === 'attributes') {
            entry.target = {
              tag: mutation.target.tagName?.toLowerCase(),
              id: mutation.target.id || null,
            };
            entry.attribute = mutation.attributeName;
            entry.oldValue = mutation.oldValue;
            entry.newValue = mutation.target.getAttribute(mutation.attributeName);
          } else if (mutation.type === 'characterData') {
            entry.oldValue = mutation.oldValue;
            entry.newValue = mutation.target.textContent?.substring(0, 200);
          }

          mutations.push(entry);
        }
      });

      observer.observe(document.body, {
        childList: config.childList !== false,
        attributes: config.attributes !== false,
        characterData: config.characterData || false,
        subtree: config.subtree !== false,
        attributeOldValue: true,
        characterDataOldValue: true,
        attributeFilter: config.attributeFilter || undefined,
      });

      window.__domObservers[id] = { observer, mutations };
    }, { id: observerId, config: options });

    this.watchers.set(observerId, { page, startTime: Date.now() });
    console.log(`[DOMObserver] Started: ${observerId}`);
    return observerId;
  }

  /**
   * Get collected mutations
   */
  async getMutations(page, observerId) {
    const mutations = await page.evaluate((id) => {
      const obs = window.__domObservers?.[id];
      if (!obs) return [];
      const result = [...obs.mutations];
      obs.mutations.length = 0; // Clear after reading
      return result;
    }, observerId);

    this.mutations.push(...mutations);
    if (this.mutations.length > this.maxMutations) {
      this.mutations = this.mutations.slice(-this.maxMutations);
    }

    return mutations;
  }

  /**
   * Wait for a specific DOM change
   */
  async waitForMutation(page, config = {}) {
    const {
      selector = 'body',
      type = 'childList',       // childList | attributes | characterData
      attribute = null,         // specific attribute to watch
      text = null,              // text content to match
      timeout = 10000,
      added = true,             // wait for addition vs removal
    } = config;

    return page.evaluate(({ selector, type, attribute, text, timeout, added }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          observer.disconnect();
          reject(new Error('Mutation timeout'));
        }, timeout);

        const target = document.querySelector(selector) || document.body;

        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type !== type) continue;

            if (type === 'childList') {
              const nodes = added ? mutation.addedNodes : mutation.removedNodes;
              for (const node of nodes) {
                if (node.nodeType !== 1) continue;
                if (text && !node.innerText?.includes(text)) continue;
                clearTimeout(timer);
                observer.disconnect();
                resolve({
                  type: 'childList',
                  tag: node.tagName?.toLowerCase(),
                  id: node.id || null,
                  text: node.innerText?.substring(0, 200) || null,
                });
                return;
              }
            }

            if (type === 'attributes') {
              if (attribute && mutation.attributeName !== attribute) continue;
              clearTimeout(timer);
              observer.disconnect();
              resolve({
                type: 'attributes',
                attribute: mutation.attributeName,
                oldValue: mutation.oldValue,
                newValue: mutation.target.getAttribute(mutation.attributeName),
              });
              return;
            }
          }
        });

        observer.observe(target, {
          childList: type === 'childList',
          attributes: type === 'attributes',
          characterData: type === 'characterData',
          subtree: true,
          attributeOldValue: true,
          ...(attribute ? { attributeFilter: [attribute] } : {}),
        });
      });
    }, { selector, type, attribute, text, timeout, added });
  }

  /**
   * Watch for dynamically loaded content (infinite scroll, lazy loading)
   */
  async watchDynamicContent(page, config = {}) {
    const {
      containerSelector = 'body',
      itemSelector,
      pollInterval = 1000,
      maxWait = 30000,
      onNewItems,
    } = config;

    const seen = new Set();
    const startTime = Date.now();
    let totalNew = 0;

    while (Date.now() - startTime < maxWait) {
      const items = await page.evaluate(({ container, item }) => {
        const el = document.querySelector(container);
        if (!el) return [];
        return Array.from(el.querySelectorAll(item)).map((node, i) => ({
          index: i,
          text: node.innerText?.substring(0, 100) || '',
          id: node.id || null,
          html: node.outerHTML.substring(0, 200),
        }));
      }, { container: containerSelector, item: itemSelector });

      const newItems = items.filter(item => {
        const key = item.id || item.html;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (newItems.length > 0) {
        totalNew += newItems.length;
        this.emit('content:new', { count: newItems.length, total: seen.size, items: newItems });
        if (onNewItems) await onNewItems(newItems);
      }

      await page.waitForTimeout(pollInterval);
    }

    return { totalItems: seen.size, newItems: totalNew };
  }

  /**
   * Stop an observer
   */
  async stop(page, observerId) {
    await page.evaluate((id) => {
      const obs = window.__domObservers?.[id];
      if (obs) {
        obs.observer.disconnect();
        delete window.__domObservers[id];
      }
    }, observerId);

    this.watchers.delete(observerId);
    console.log(`[DOMObserver] Stopped: ${observerId}`);
  }

  /**
   * Stop all observers
   */
  async stopAll(page) {
    for (const [id] of this.watchers) {
      await this.stop(page, id);
    }
  }

  /**
   * Analyze mutation patterns
   */
  analyze() {
    const byType = {};
    const byTag = {};
    const timeline = [];

    for (const m of this.mutations) {
      byType[m.type] = (byType[m.type] || 0) + 1;

      if (m.addedNodes) {
        for (const node of m.addedNodes) {
          byTag[node.tag] = (byTag[node.tag] || 0) + 1;
        }
      }

      if (m.target?.tag) {
        byTag[m.target.tag] = (byTag[m.target.tag] || 0) + 1;
      }
    }

    return {
      totalMutations: this.mutations.length,
      byType,
      byTag,
      activeWatchers: this.watchers.size,
    };
  }
}

module.exports = DOMObserver;
