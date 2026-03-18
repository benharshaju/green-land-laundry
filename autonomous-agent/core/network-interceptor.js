/**
 * Network Interceptor
 *
 * Intercepts, logs, modifies, mocks, and analyzes all network traffic.
 * Provides API response caching, request blocking, and traffic analysis.
 */

const fs = require('fs');
const path = require('path');

class NetworkInterceptor {
  constructor(options = {}) {
    this.logs = [];
    this.rules = [];
    this.mocks = new Map();
    this.blockedPatterns = options.blockedPatterns || [];
    this.captureResponses = options.captureResponses !== false;
    this.maxLogSize = options.maxLogSize || 10000;
    this.responseCache = new Map();
    this.listeners = new Map();
  }

  /**
   * Attach interceptor to a page
   */
  async attach(page) {
    // Request interception
    await page.route('**/*', async (route, request) => {
      const url = request.url();
      const method = request.method();
      const resourceType = request.resourceType();

      // Check blocked patterns
      for (const pattern of this.blockedPatterns) {
        if (typeof pattern === 'string' && url.includes(pattern)) {
          await route.abort();
          this._log({ url, method, resourceType, status: 'BLOCKED', pattern });
          return;
        }
        if (pattern instanceof RegExp && pattern.test(url)) {
          await route.abort();
          this._log({ url, method, resourceType, status: 'BLOCKED', pattern: pattern.toString() });
          return;
        }
      }

      // Check mock responses
      for (const [pattern, mockResponse] of this.mocks) {
        const matches = typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url);
        if (matches) {
          await route.fulfill({
            status: mockResponse.status || 200,
            contentType: mockResponse.contentType || 'application/json',
            body: typeof mockResponse.body === 'string' ? mockResponse.body : JSON.stringify(mockResponse.body),
            headers: mockResponse.headers || {},
          });
          this._log({ url, method, resourceType, status: 'MOCKED' });
          return;
        }
      }

      // Apply modification rules
      let modifiedRequest = null;
      for (const rule of this.rules) {
        if (rule.match(url, method, resourceType)) {
          modifiedRequest = rule.transform(request);
          break;
        }
      }

      if (modifiedRequest) {
        await route.continue(modifiedRequest);
      } else {
        await route.continue();
      }
    });

    // Response logging
    page.on('response', async (response) => {
      const request = response.request();
      const entry = {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timing: response.request().timing(),
        timestamp: Date.now(),
      };

      if (this.captureResponses && request.resourceType() === 'fetch') {
        try {
          entry.body = await response.text();
          // Try parsing as JSON
          try { entry.json = JSON.parse(entry.body); } catch {}
        } catch {}
      }

      this._log(entry);
      this._notifyListeners(entry);
    });

    // Track failed requests
    page.on('requestfailed', (request) => {
      this._log({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        status: 'FAILED',
        error: request.failure()?.errorText,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Add a mock response for a URL pattern
   */
  mock(pattern, response) {
    this.mocks.set(pattern, response);
    return this;
  }

  /**
   * Remove a mock
   */
  unmock(pattern) {
    this.mocks.delete(pattern);
    return this;
  }

  /**
   * Block requests matching a pattern
   */
  block(pattern) {
    this.blockedPatterns.push(pattern);
    return this;
  }

  /**
   * Add a request modification rule
   */
  addRule(matchFn, transformFn) {
    this.rules.push({ match: matchFn, transform: transformFn });
    return this;
  }

  /**
   * Listen for specific network events
   */
  on(pattern, callback) {
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, []);
    }
    this.listeners.get(pattern).push(callback);
    return this;
  }

  /**
   * Wait for a specific network request
   */
  async waitForRequest(page, urlPattern, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${urlPattern}`)), timeout);

      const handler = (entry) => {
        const matches = typeof urlPattern === 'string'
          ? entry.url.includes(urlPattern)
          : urlPattern.test(entry.url);
        if (matches) {
          clearTimeout(timer);
          resolve(entry);
        }
      };

      // Temporarily listen
      if (!this.listeners.has('__wait__')) this.listeners.set('__wait__', []);
      this.listeners.get('__wait__').push(handler);
    });
  }

  /**
   * Get traffic analysis
   */
  analyze() {
    const entries = this.logs;
    const byType = {};
    const byStatus = {};
    const byDomain = {};
    let totalSize = 0;
    const slowest = [];

    for (const entry of entries) {
      // By resource type
      byType[entry.resourceType] = (byType[entry.resourceType] || 0) + 1;

      // By status
      const statusGroup = entry.status ? `${Math.floor(entry.status / 100)}xx` : 'other';
      byStatus[statusGroup] = (byStatus[statusGroup] || 0) + 1;

      // By domain
      try {
        const domain = new URL(entry.url).hostname;
        byDomain[domain] = (byDomain[domain] || 0) + 1;
      } catch {}

      // Timing
      if (entry.timing?.responseEnd) {
        slowest.push({ url: entry.url, time: entry.timing.responseEnd });
      }
    }

    slowest.sort((a, b) => b.time - a.time);

    return {
      totalRequests: entries.length,
      byResourceType: byType,
      byStatusCode: byStatus,
      byDomain,
      slowestRequests: slowest.slice(0, 10),
      blockedCount: entries.filter(e => e.status === 'BLOCKED').length,
      failedCount: entries.filter(e => e.status === 'FAILED').length,
      mockedCount: entries.filter(e => e.status === 'MOCKED').length,
    };
  }

  /**
   * Export logs to file
   */
  exportHAR(filePath) {
    const har = {
      log: {
        version: '1.2',
        entries: this.logs
          .filter(e => typeof e.status === 'number')
          .map(e => ({
            startedDateTime: new Date(e.timestamp).toISOString(),
            request: { method: e.method, url: e.url },
            response: { status: e.status, statusText: e.statusText || '' },
            time: e.timing?.responseEnd || 0,
          })),
      },
    };
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(har, null, 2));
  }

  _log(entry) {
    if (this.logs.length >= this.maxLogSize) {
      this.logs.shift();
    }
    this.logs.push(entry);
  }

  _notifyListeners(entry) {
    for (const [pattern, callbacks] of this.listeners) {
      const matches = typeof pattern === 'string'
        ? entry.url.includes(pattern)
        : pattern instanceof RegExp
          ? pattern.test(entry.url)
          : true;

      if (matches) {
        for (const cb of callbacks) {
          try { cb(entry); } catch {}
        }
      }
    }
  }

  getLogs(filter = {}) {
    let result = [...this.logs];
    if (filter.resourceType) result = result.filter(e => e.resourceType === filter.resourceType);
    if (filter.status) result = result.filter(e => e.status === filter.status);
    if (filter.method) result = result.filter(e => e.method === filter.method);
    if (filter.urlPattern) {
      result = result.filter(e =>
        typeof filter.urlPattern === 'string'
          ? e.url.includes(filter.urlPattern)
          : filter.urlPattern.test(e.url)
      );
    }
    return result;
  }
}

module.exports = NetworkInterceptor;
