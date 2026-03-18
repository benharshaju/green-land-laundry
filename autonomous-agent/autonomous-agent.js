/**
 * ============================================================
 *  AUTONOMOUS BROWSER AGENT
 * ============================================================
 *
 *  A fully autonomous, self-healing, config-driven browser
 *  automation system with:
 *
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
 * ============================================================
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

const BrowserManager = require('./core/browser-manager');
const SelfHealingEngine = require('./core/self-healing-engine');
const NetworkInterceptor = require('./core/network-interceptor');
const TaskEngine = require('./core/task-engine');
const VisualRegression = require('./core/visual-regression');
const ReportGenerator = require('./core/report-generator');
const HumanBehavior = require('./core/human-behavior');

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
      ...config,
    };

    // Core modules
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

    // State tracking
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

    const { browser, context, page } = await this.browserManager.launch(id, {
      headless: this.config.headless,
    });

    // Attach network interceptor
    await this.networkInterceptor.attach(page);

    // Set default timeout
    page.setDefaultTimeout(this.config.defaultTimeout);

    console.log(`[Agent] Started (stealth: ${this.config.stealth}, human: ${this.config.humanMode})`);
    return page;
  }

  async stop(id = 'default') {
    await this.browserManager.close(id);
    this.emit('agent:stop', { id, duration: Date.now() - this.startTime });
  }

  async stopAll() {
    await this.browserManager.closeAll();
  }

  // ============================================================
  //  SMART ACTIONS (with self-healing and human behavior)
  // ============================================================

  async smartAction(page, action, selector, label, ...args) {
    let currentSelector = selector;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Try the current selector
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

          case 'extract':
            const text = await page.locator(currentSelector).innerText();
            this._logAction({ action: 'extract', selector: currentSelector, result: text });
            return text;

          case 'extractAttribute':
            const attr = await page.getAttribute(currentSelector, args[0]);
            this._logAction({ action: 'extractAttribute', selector: currentSelector, attribute: args[0], result: attr });
            return attr;

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

      } catch (err) {
        console.warn(`[Agent] Attempt ${attempt} failed for "${label || selector}": ${err.message}`);

        if (attempt < this.config.maxRetries) {
          // Try self-healing
          const healedSelector = await this.selfHealing.heal(page, selector, label);
          if (healedSelector) {
            currentSelector = healedSelector;
            console.log(`[Agent] Healed: trying "${healedSelector}"`);
          } else {
            await page.waitForTimeout(1000 * attempt);
          }
        } else {
          this.errors.push({ action, selector, label, error: err.message, timestamp: Date.now() });
          if (this.config.screenshotOnError) {
            await this.captureState(page, `error_${Date.now()}`);
          }
          throw err;
        }
      }
    }
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

    return this.taskEngine.execute(task, page);
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

    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(async (task, idx) => {
          const browserId = `parallel_${i + idx}`;
          const page = await this.start(browserId);
          try {
            const result = await this.taskEngine.execute(task, page);
            return result;
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
    return this.reportGenerator.generate({
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
  }

  // ============================================================
  //  INTERNALS
  // ============================================================

  _logAction(entry) {
    this.actionLog.push({ ...entry, timestamp: Date.now() });
  }

  _setupEventListeners() {
    this.taskEngine.on('step:start', (data) => this.emit('step:start', data));
    this.taskEngine.on('step:complete', (data) => this.emit('step:complete', data));
    this.taskEngine.on('step:failed', (data) => this.emit('step:failed', data));
    this.taskEngine.on('task:start', (data) => this.emit('task:start', data));
    this.taskEngine.on('task:complete', (data) => this.emit('task:complete', data));
    this.browserManager.on('browser:launched', (data) => this.emit('browser:launched', data));
    this.browserManager.on('browser:closed', (data) => this.emit('browser:closed', data));
  }
}

module.exports = AutonomousAgent;
