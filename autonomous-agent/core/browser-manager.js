const { chromium, firefox, webkit } = require('playwright');
const EventEmitter = require('events');

class BrowserManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.browsers = new Map();
    this.contexts = new Map();
    this.pages = new Map();
    this.config = {
      maxConcurrent: config.maxConcurrent || 5,
      defaultBrowser: config.defaultBrowser || 'chromium',
      stealth: config.stealth !== false,
      proxy: config.proxy || null,
      viewport: config.viewport || { width: 1920, height: 1080 },
      ...config,
    };
    this.activeCount = 0;
  }

  _getEngine(name) {
    const engines = { chromium, firefox, webkit };
    return engines[name] || chromium;
  }

  async launch(id = 'default', options = {}) {
    if (this.activeCount >= this.config.maxConcurrent) {
      throw new Error(`Max concurrent browsers (${this.config.maxConcurrent}) reached`);
    }

    const engine = this._getEngine(options.browser || this.config.defaultBrowser);
    const launchOptions = {
      headless: options.headless !== undefined ? options.headless : true,
      args: this.config.stealth ? this._stealthArgs() : [],
      ...(this.config.proxy ? { proxy: this.config.proxy } : {}),
      ...options.launchOptions,
    };

    const browser = await engine.launch(launchOptions);
    const context = await browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.config.stealth ? this._randomUserAgent() : undefined,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      geolocation: options.geolocation,
      permissions: options.permissions || [],
      ...options.contextOptions,
    });

    if (this.config.stealth) {
      await this._applyStealthScripts(context);
    }

    const page = await context.newPage();
    this.browsers.set(id, browser);
    this.contexts.set(id, context);
    this.pages.set(id, page);
    this.activeCount++;

    this.emit('browser:launched', { id, engine: options.browser || this.config.defaultBrowser });
    return { browser, context, page };
  }

  async getPage(id = 'default') {
    return this.pages.get(id);
  }

  async close(id = 'default') {
    const browser = this.browsers.get(id);
    if (browser) {
      await browser.close();
      this.browsers.delete(id);
      this.contexts.delete(id);
      this.pages.delete(id);
      this.activeCount--;
      this.emit('browser:closed', { id });
    }
  }

  async closeAll() {
    for (const [id] of this.browsers) {
      await this.close(id);
    }
  }

  async saveSession(id = 'default', filePath) {
    const context = this.contexts.get(id);
    if (!context) throw new Error(`No context found for ${id}`);
    const storage = await context.storageState();
    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(storage, null, 2));
    this.emit('session:saved', { id, filePath });
  }

  async loadSession(id = 'default', filePath) {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) return false;
    const storage = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const browser = this.browsers.get(id);
    if (!browser) throw new Error(`No browser found for ${id}`);

    const oldContext = this.contexts.get(id);
    const newContext = await browser.newContext({ storageState: storage });
    const newPage = await newContext.newPage();

    if (oldContext) await oldContext.close();
    this.contexts.set(id, newContext);
    this.pages.set(id, newPage);
    this.emit('session:loaded', { id, filePath });
    return true;
  }

  _stealthArgs() {
    return [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ];
  }

  _randomUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:121.0) Gecko/20100101 Firefox/121.0',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  async _applyStealthScripts(context) {
    await context.addInitScript(() => {
      // Hide webdriver flag
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
      });

      // Chrome runtime mock
      window.chrome = { runtime: {} };

      // Permissions mock
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    });
  }
}

module.exports = BrowserManager;
