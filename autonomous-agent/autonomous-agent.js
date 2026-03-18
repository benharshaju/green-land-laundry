/**
 * ============================================================
 *  AUTONOMOUS BROWSER AGENT v2.0
 * ============================================================
 *
 *  A fully autonomous, self-healing, config-driven browser
 *  automation system with:
 *
 *  CORE:
 *  - Self-healing selectors (multi-signal DOM fingerprinting)
 *  - Config-driven task execution (JSON workflow engine)
 *  - Network interception, mocking, and analysis
 *  - Visual regression detection
 *  - Human behavior simulation (Bezier mouse, natural typing)
 *  - Stealth anti-detection (fingerprint masking)
 *  - Parallel browser orchestration
 *  - Session persistence (cookies/localStorage)
 *  - Rich HTML report generation
 *  - Action recording and replay
 *
 *  v2.0 ADDITIONS:
 *  - Proxy rotation with health checking & geo-targeting
 *  - Data pipeline (collect, transform, export JSON/CSV/NDJSON)
 *  - Performance profiler (Core Web Vitals, resource analysis)
 *  - DOM mutation observer (real-time change tracking)
 *  - CAPTCHA detection (reCAPTCHA, hCaptcha, Cloudflare, etc.)
 *  - Webhook notifications (Slack, Discord, Teams, custom)
 *  - Retry strategies (exponential backoff, circuit breaker, bulkhead)
 *  - Multi-tab orchestration (inter-tab communication, coordination)
 *
 * ============================================================
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Core modules
const BrowserManager = require('./core/browser-manager');
const SelfHealingEngine = require('./core/self-healing-engine');
const NetworkInterceptor = require('./core/network-interceptor');
const TaskEngine = require('./core/task-engine');
const VisualRegression = require('./core/visual-regression');
const ReportGenerator = require('./core/report-generator');
const HumanBehavior = require('./core/human-behavior');

// v2.0 modules
const ProxyRotator = require('./core/proxy-rotator');
const DataPipeline = require('./core/data-pipeline');
const PerformanceProfiler = require('./core/performance-profiler');
const DOMObserver = require('./core/dom-observer');
const CaptchaDetector = require('./core/captcha-detector');
const WebhookNotifier = require('./core/webhook-notifier');
const RetryStrategy = require('./core/retry-strategy');
const MultiTab = require('./core/multi-tab');

class AutonomousAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      stealth: config.stealth !== false,
      humanMode: config.humanMode || false,
      humanSpeed: config.humanSpeed || 'normal',
      headless: config.headless !== undefined ? config.headless : true,
      maxRetries: config.maxRetries || 3,
      defaultTimeout: config.defaultTimeout || 10000,
      screenshotOnError: config.screenshotOnError !== false,
      captchaDetection: config.captchaDetection !== false,
      ...config,
    };

    // ── Core modules ──────────────────────────────────────
    this.browserManager = new BrowserManager({
      stealth: this.config.stealth,
      maxConcurrent: config.maxConcurrent || 5,
      viewport: config.viewport,
      proxy: config.proxy,
    });
    this.selfHealing = new SelfHealingEngine(config.selfHealing);
    this.networkInterceptor = new NetworkInterceptor(config.network);
    this.taskEngine = new TaskEngine(this);
    this.visualRegression = new VisualRegression(config.visual);
    this.reportGenerator = new ReportGenerator(config.report);
    this.humanBehavior = new HumanBehavior({ speed: this.config.humanSpeed });

    // ── v2.0 modules ─────────────────────────────────────
    this.proxyRotator = new ProxyRotator(config.proxy || {});
    this.dataPipeline = new DataPipeline(config.data || {});
    this.performanceProfiler = new PerformanceProfiler(config.performance || {});
    this.domObserver = new DOMObserver(config.domObserver || {});
    this.captchaDetector = new CaptchaDetector(config.captcha || {});
    this.webhookNotifier = new WebhookNotifier(config.webhooks || {});
    this.retryStrategy = new RetryStrategy(config.retry || {});
    this.multiTab = null; // Initialized per-context

    // ── State tracking ───────────────────────────────────
    this.screenshots = [];
    this.errors = [];
    this.startTime = null;
    this.actionLog = [];
    this.recording = false;
    this.recordedActions = [];

    // Wire up events
    this._setupEventListeners();
  }

  // ============================================================
  //  LIFECYCLE
  // ============================================================

  async start(id = 'default') {
    this.startTime = Date.now();
    this.emit('agent:start', { id, timestamp: this.startTime });

    // Notify via webhooks
    await this.webhookNotifier.notify('agent:start', { id, timestamp: this.startTime });

    const { browser, context, page } = await this.browserManager.launch(id, {
      headless: this.config.headless,
    });

    // Initialize multi-tab for this context
    this.multiTab = new MultiTab(context);

    // Attach network interceptor
    await this.networkInterceptor.attach(page);

    // Attach CAPTCHA auto-detection
    if (this.config.captchaDetection) {
      await this.captchaDetector.autoDetect(page);
    }

    // Set default timeout
    page.setDefaultTimeout(this.config.defaultTimeout);

    console.log(`[Agent] Started (stealth: ${this.config.stealth}, human: ${this.config.humanMode}, captcha: ${this.config.captchaDetection})`);
    return page;
  }

  async stop(id = 'default') {
    if (this.multiTab) await this.multiTab.closeAll();
    await this.browserManager.close(id);
    const duration = Date.now() - this.startTime;
    this.emit('agent:stop', { id, duration });
    await this.webhookNotifier.notify('agent:stop', { id, duration });
  }

  async stopAll() {
    if (this.multiTab) await this.multiTab.closeAll();
    await this.browserManager.closeAll();
    this.proxyRotator.stopHealthChecks();
  }

  // ============================================================
  //  SMART ACTIONS (with self-healing, human behavior, retry)
  // ============================================================

  async smartAction(page, action, selector, label, ...args) {
    return this.retryStrategy.withExponentialBackoff(
      async (attempt) => {
        let currentSelector = selector;

        // On retry attempts, try self-healing first
        if (attempt > 1) {
          const healedSelector = await this.selfHealing.heal(page, selector, label);
          if (healedSelector) {
            currentSelector = healedSelector;
            console.log(`[Agent] Healed: trying "${healedSelector}"`);
          }
        }

        // Check for CAPTCHA before acting
        if (this.config.captchaDetection && attempt === 1) {
          const captchas = await this.captchaDetector.detect(page);
          if (captchas.length > 0) {
            await this.webhookNotifier.notify('captcha:detected', { captchas, url: page.url() });
            await this.captchaDetector.detectAndWait(page);
          }
        }

        // Try the selector
        await page.waitForSelector(currentSelector, { state: 'visible', timeout: 3000 });

        // Register the working element for future healing
        await this.selfHealing.registerElement(page, currentSelector, label);

        // Execute the action
        switch (action) {
          case 'click':
            if (this.config.humanMode) {
              await this.humanBehavior.humanClick(page, currentSelector);
            } else {
              await page.locator(currentSelector).scrollIntoViewIfNeeded();
              await page.locator(currentSelector).click();
            }
            break;

          case 'type':
            if (this.config.humanMode) {
              await this.humanBehavior.humanType(page, currentSelector, args[0]);
            } else {
              await page.locator(currentSelector).fill(args[0]);
            }
            break;

          case 'extract': {
            const text = await page.locator(currentSelector).innerText();
            this._logAction({ action: 'extract', selector: currentSelector, result: text });
            return text;
          }

          case 'extractAttribute': {
            const attr = await page.getAttribute(currentSelector, args[0]);
            this._logAction({ action: 'extractAttribute', selector: currentSelector, attribute: args[0], result: attr });
            return attr;
          }

          case 'hover':
            if (this.config.humanMode) {
              await this.humanBehavior.humanMove(page, currentSelector);
            } else {
              await page.hover(currentSelector);
            }
            break;

          case 'select':
            await page.selectOption(currentSelector, args[0]);
            break;

          case 'check':
            await page.check(currentSelector);
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        this._logAction({ action, selector: currentSelector, label, status: 'OK', attempt });
        if (this.recording) this.recordedActions.push({ action, selector: currentSelector, label, args, timestamp: Date.now() });
        return true;
      },
      {
        maxRetries: this.config.maxRetries,
        baseDelay: 1000,
        onRetry: (attempt, err, delay) => {
          console.warn(`[Agent] Attempt ${attempt} failed for "${label || selector}": ${err.message} (retrying in ${Math.round(delay)}ms)`);
        },
      }
    ).catch(async (err) => {
      this.errors.push({ action, selector, label, error: err.message, timestamp: Date.now() });
      if (this.config.screenshotOnError) {
        await this.captureState(page, `error_${Date.now()}`);
      }
      await this.webhookNotifier.notify('action:failed', { action, selector, label, error: err.message });
      throw err;
    });
  }

  // ============================================================
  //  SCREENSHOTS & VISUAL
  // ============================================================

  async captureState(page, name = 'snapshot') {
    const dir = path.join(process.cwd(), 'autonomous-agent', 'data', 'snapshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const screenshotPath = path.join(dir, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    this.screenshots.push({ name, path: screenshotPath, timestamp: Date.now() });
    console.log(`[Agent] Screenshot: ${screenshotPath}`);
    return screenshotPath;
  }

  // ============================================================
  //  TASK EXECUTION
  // ============================================================

  async runTask(task, browserId = 'default') {
    const page = await this.browserManager.getPage(browserId);
    if (!page) throw new Error(`No page found for browser "${browserId}"`);

    await this.webhookNotifier.notify('task:start', { name: task.name });
    const result = await this.taskEngine.execute(task, page);
    await this.webhookNotifier.notify('task:complete', { name: task.name, duration: result.duration, success: result.success });

    return result;
  }

  async runTaskFile(filePath, browserId = 'default') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const task = JSON.parse(content);
    return this.runTask(task, browserId);
  }

  // ============================================================
  //  PARALLEL EXECUTION
  // ============================================================

  async runParallel(tasks, options = {}) {
    const results = [];
    const maxConcurrent = options.maxConcurrent || 3;

    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(async (task, idx) => {
          const browserId = `parallel_${i + idx}`;
          const page = await this.start(browserId);
          try {
            return await this.taskEngine.execute(task, page);
          } finally {
            await this.stop(browserId);
          }
        })
      );

      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message }));
    }

    return results;
  }

  // ============================================================
  //  DATA COLLECTION (v2.0)
  // ============================================================

  /**
   * Scrape structured data from the page into a named collection
   */
  async scrapeInto(page, collectionName, config) {
    return this.dataPipeline.addFromPage(page, collectionName, config);
  }

  /**
   * Scrape paginated data automatically
   */
  async scrapePaginated(page, config) {
    const {
      collection,
      itemSelector,
      fields,
      nextButtonSelector,
      maxPages = 10,
      waitBetweenPages = 1000,
    } = config;

    this.dataPipeline.createCollection(collection);
    let totalRecords = 0;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const added = await this.scrapeInto(page, collection, { selector: itemSelector, fields });
      totalRecords += added;
      console.log(`[Agent] Page ${pageNum}: scraped ${added} records (total: ${totalRecords})`);

      // Try clicking next
      try {
        await page.waitForSelector(nextButtonSelector, { state: 'visible', timeout: 3000 });
        await page.click(nextButtonSelector);
        await page.waitForTimeout(waitBetweenPages);
        await page.waitForLoadState('domcontentloaded');
      } catch {
        console.log(`[Agent] No more pages after page ${pageNum}`);
        break;
      }
    }

    return {
      collection,
      totalRecords,
      stats: this.dataPipeline.getStats(collection),
    };
  }

  // ============================================================
  //  PERFORMANCE (v2.0)
  // ============================================================

  async profilePage(page, name = 'default') {
    return this.performanceProfiler.profile(page, name);
  }

  // ============================================================
  //  MULTI-TAB (v2.0)
  // ============================================================

  async openTab(name, url, options = {}) {
    if (!this.multiTab) throw new Error('Agent not started — call start() first');
    return this.multiTab.open(name, url, options);
  }

  async runOnTab(name, fn) {
    if (!this.multiTab) throw new Error('Agent not started — call start() first');
    return this.multiTab.runOn(name, fn);
  }

  async coordinateTabs(workflow) {
    if (!this.multiTab) throw new Error('Agent not started — call start() first');
    return this.multiTab.coordinate(workflow);
  }

  // ============================================================
  //  DOM WATCHING (v2.0)
  // ============================================================

  async watchDOM(page, options = {}) {
    return this.domObserver.observe(page, options);
  }

  async waitForDOMChange(page, config) {
    return this.domObserver.waitForMutation(page, config);
  }

  async watchDynamicContent(page, config) {
    return this.domObserver.watchDynamicContent(page, config);
  }

  // ============================================================
  //  RESILIENT EXECUTION (v2.0)
  // ============================================================

  /**
   * Execute a function with full resilience (retry + circuit breaker + bulkhead + timeout)
   */
  async resilientExecute(name, fn, options = {}) {
    return this.retryStrategy.executeResilient(name, fn, options);
  }

  /**
   * Execute with fallback chain
   */
  async withFallbacks(strategies) {
    return this.retryStrategy.withFallback(strategies);
  }

  // ============================================================
  //  RECORDING
  // ============================================================

  startRecording() {
    this.recording = true;
    this.recordedActions = [];
    console.log('[Agent] Recording started');
  }

  stopRecording() {
    this.recording = false;
    console.log(`[Agent] Recording stopped (${this.recordedActions.length} actions)`);
    return this.recordedActions;
  }

  exportRecording(filePath) {
    const task = {
      name: 'Recorded Task',
      variables: {},
      steps: this.recordedActions.map(a => ({
        action: a.action,
        selector: a.selector,
        label: a.label,
        ...(a.args[0] ? { text: a.args[0] } : {}),
      })),
      onError: 'continue',
      maxRetries: 3,
    };

    fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
    console.log(`[Agent] Recording exported to: ${filePath}`);
    return task;
  }

  // ============================================================
  //  SESSION MANAGEMENT
  // ============================================================

  async saveSession(browserId = 'default', name = 'default') {
    const dir = path.join(process.cwd(), 'autonomous-agent', 'data', 'sessions');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${name}.json`);
    await this.browserManager.saveSession(browserId, filePath);
    return filePath;
  }

  async loadSession(browserId = 'default', name = 'default') {
    const filePath = path.join(process.cwd(), 'autonomous-agent', 'data', 'sessions', `${name}.json`);
    return this.browserManager.loadSession(browserId, filePath);
  }

  // ============================================================
  //  REPORTING
  // ============================================================

  async generateReport(taskName = 'Agent Run') {
    const reportPath = this.reportGenerator.generate({
      taskName,
      duration: Date.now() - (this.startTime || Date.now()),
      steps: this.taskEngine.executionLog.length > 0 ? this.taskEngine.executionLog : this.actionLog,
      networkAnalysis: this.networkInterceptor.analyze(),
      healingReport: this.selfHealing.getHealingReport(),
      visualReport: this.visualRegression.getReport(),
      screenshots: this.screenshots,
      variables: this.taskEngine.variables,
      errors: this.errors,
    });

    await this.webhookNotifier.notify('report:generated', { path: reportPath, taskName });
    return reportPath;
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      errors: this.errors.length,
      screenshots: this.screenshots.length,
      actions: this.actionLog.length,
      network: this.networkInterceptor.analyze(),
      healing: this.selfHealing.getHealingReport(),
      visual: this.visualRegression.getReport(),
      performance: this.performanceProfiler.getReport(),
      proxy: this.proxyRotator.getStats(),
      data: this.dataPipeline.getStats(),
      dom: this.domObserver.analyze(),
      captcha: this.captchaDetector.getReport(),
      webhooks: this.webhookNotifier.getStats(),
      retry: this.retryStrategy.getStats(),
      tabs: this.multiTab ? this.multiTab.getStatus() : null,
    };
  }

  // ============================================================
  //  INTERNALS
  // ============================================================

  _logAction(entry) {
    this.actionLog.push({ ...entry, timestamp: Date.now() });
  }

  _setupEventListeners() {
    // Task engine events
    this.taskEngine.on('step:start', (data) => this.emit('step:start', data));
    this.taskEngine.on('step:complete', (data) => this.emit('step:complete', data));
    this.taskEngine.on('step:failed', (data) => this.emit('step:failed', data));
    this.taskEngine.on('task:start', (data) => this.emit('task:start', data));
    this.taskEngine.on('task:complete', (data) => this.emit('task:complete', data));

    // Browser events
    this.browserManager.on('browser:launched', (data) => this.emit('browser:launched', data));
    this.browserManager.on('browser:closed', (data) => this.emit('browser:closed', data));

    // CAPTCHA events → webhook
    this.captchaDetector.on('captcha:detected', async (data) => {
      this.emit('captcha:detected', data);
      await this.webhookNotifier.notify('captcha:detected', data);
    });
    this.captchaDetector.on('captcha:resolved', async (data) => {
      this.emit('captcha:resolved', data);
      await this.webhookNotifier.notify('captcha:resolved', data);
    });

    // Proxy events
    this.proxyRotator.on('proxy:blacklisted', (data) => {
      this.emit('proxy:blacklisted', data);
    });
    this.proxyRotator.on('pool:exhausted', () => {
      this.emit('proxy:exhausted');
    });

    // Circuit breaker events
    this.retryStrategy.on('circuit:open', (data) => {
      this.emit('circuit:open', data);
      this.webhookNotifier.notify('circuit:open', data);
    });

    // DOM events
    this.domObserver.on('content:new', (data) => this.emit('dom:newContent', data));

    // Data pipeline events
    this.dataPipeline.on('validation:failed', (data) => this.emit('data:validationFailed', data));
  }
}

module.exports = AutonomousAgent;
