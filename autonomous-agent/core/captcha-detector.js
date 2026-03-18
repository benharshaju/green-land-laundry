/**
 * CAPTCHA Detector
 *
 * Detects CAPTCHA presence on pages (reCAPTCHA, hCaptcha, Cloudflare, etc.),
 * notifies the user, and can pause automation until manually solved.
 */

const EventEmitter = require('events');

class CaptchaDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.detections = [];
    this.autoWait = options.autoWait !== false;
    this.maxWaitTime = options.maxWaitTime || 120000; // 2 min
    this.checkInterval = options.checkInterval || 2000;

    // Known CAPTCHA signatures
    this.signatures = [
      {
        name: 'reCAPTCHA v2',
        selectors: ['iframe[src*="recaptcha"]', '.g-recaptcha', '#recaptcha'],
        scripts: ['google.com/recaptcha', 'gstatic.com/recaptcha'],
      },
      {
        name: 'reCAPTCHA v3',
        selectors: ['.grecaptcha-badge'],
        scripts: ['google.com/recaptcha/api.js?render='],
      },
      {
        name: 'hCaptcha',
        selectors: ['iframe[src*="hcaptcha"]', '.h-captcha'],
        scripts: ['hcaptcha.com/1/api.js'],
      },
      {
        name: 'Cloudflare Turnstile',
        selectors: ['iframe[src*="challenges.cloudflare.com"]', '.cf-turnstile'],
        scripts: ['challenges.cloudflare.com/turnstile'],
      },
      {
        name: 'Cloudflare Challenge',
        selectors: ['#challenge-form', '#cf-challenge-running', '.cf-browser-verification'],
        bodyText: ['checking your browser', 'just a moment', 'verify you are human'],
      },
      {
        name: 'AWS WAF',
        selectors: ['#captcha-container'],
        bodyText: ['automated access to this page has been blocked'],
      },
      {
        name: 'PerimeterX',
        selectors: ['#px-captcha'],
        scripts: ['captcha.px-cdn.net'],
      },
      {
        name: 'DataDome',
        selectors: ['iframe[src*="captcha.datadome"]'],
        scripts: ['datadome.co/captcha'],
      },
      {
        name: 'Generic CAPTCHA',
        selectors: [
          'img[src*="captcha"]', 'input[name*="captcha"]',
          '[class*="captcha"]', '[id*="captcha"]',
        ],
        bodyText: ['enter the characters', 'type the text', 'prove you are human'],
      },
    ];
  }

  /**
   * Detect CAPTCHAs on the current page
   */
  async detect(page) {
    const results = [];

    for (const sig of this.signatures) {
      const detected = await this._checkSignature(page, sig);
      if (detected) {
        results.push({
          name: sig.name,
          confidence: detected.confidence,
          evidence: detected.evidence,
          timestamp: Date.now(),
          url: page.url(),
        });
      }
    }

    if (results.length > 0) {
      this.detections.push(...results);
      const best = results.reduce((a, b) => a.confidence > b.confidence ? a : b);
      console.warn(`[CAPTCHA] Detected: ${best.name} (${(best.confidence * 100).toFixed(0)}% confidence)`);
      this.emit('captcha:detected', { captchas: results, best });
    }

    return results;
  }

  /**
   * Detect and wait for manual CAPTCHA resolution
   */
  async detectAndWait(page) {
    const captchas = await this.detect(page);
    if (captchas.length === 0) return { detected: false };

    if (!this.autoWait) {
      return { detected: true, captchas, waited: false };
    }

    console.log(`[CAPTCHA] Waiting for manual resolution (max ${this.maxWaitTime / 1000}s)...`);
    this.emit('captcha:waiting', { captchas });

    const resolved = await this._waitForResolution(page);

    if (resolved) {
      console.log('[CAPTCHA] Resolved! Continuing automation...');
      this.emit('captcha:resolved', { duration: resolved.duration });
    } else {
      console.error('[CAPTCHA] Timeout — CAPTCHA not resolved');
      this.emit('captcha:timeout');
    }

    return { detected: true, captchas, resolved: !!resolved, ...resolved };
  }

  /**
   * Add navigation listener for automatic CAPTCHA detection
   */
  async autoDetect(page) {
    page.on('load', async () => {
      // Small delay to let CAPTCHA elements render
      await page.waitForTimeout(500);
      await this.detect(page);
    });

    // Also check on frame navigation (iframes)
    page.on('framenavigated', async (frame) => {
      const url = frame.url();
      if (url.includes('captcha') || url.includes('challenge')) {
        console.warn(`[CAPTCHA] Suspicious frame navigation: ${url}`);
        this.emit('captcha:frame', { url });
      }
    });
  }

  /**
   * Check for anti-bot detection signals
   */
  async checkBotDetection(page) {
    return page.evaluate(() => {
      const signals = [];

      // Check for common bot-detection indicators
      if (document.title.toLowerCase().includes('blocked')) {
        signals.push('Page title contains "blocked"');
      }
      if (document.title.toLowerCase().includes('access denied')) {
        signals.push('Page title contains "access denied"');
      }

      // Check HTTP status via meta refresh or redirect
      const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        signals.push(`Meta refresh detected: ${metaRefresh.content}`);
      }

      // Check for common block page elements
      const blockIndicators = [
        'rate limit', 'too many requests', 'access denied',
        'forbidden', 'bot detected', 'suspicious activity',
        'please verify', 'security check',
      ];

      const bodyText = document.body?.innerText?.toLowerCase() || '';
      for (const indicator of blockIndicators) {
        if (bodyText.includes(indicator)) {
          signals.push(`Body contains: "${indicator}"`);
        }
      }

      // Check for empty body (potential JS challenge)
      if (document.body?.children.length <= 2 && bodyText.length < 100) {
        signals.push('Nearly empty body (possible JS challenge page)');
      }

      return {
        detected: signals.length > 0,
        signals,
        statusIndicator: document.querySelector('meta[name="robots"]')?.content || null,
      };
    });
  }

  async _checkSignature(page, sig) {
    let confidence = 0;
    const evidence = [];

    // Check selectors
    if (sig.selectors) {
      for (const sel of sig.selectors) {
        const exists = await page.evaluate((s) => !!document.querySelector(s), sel).catch(() => false);
        if (exists) {
          confidence += 0.4;
          evidence.push(`Selector: ${sel}`);
        }
      }
    }

    // Check scripts
    if (sig.scripts) {
      for (const script of sig.scripts) {
        const found = await page.evaluate((src) => {
          return Array.from(document.querySelectorAll('script')).some(s => s.src?.includes(src));
        }, script).catch(() => false);
        if (found) {
          confidence += 0.3;
          evidence.push(`Script: ${script}`);
        }
      }
    }

    // Check body text
    if (sig.bodyText) {
      for (const text of sig.bodyText) {
        const found = await page.evaluate((t) => {
          return document.body?.innerText?.toLowerCase().includes(t);
        }, text).catch(() => false);
        if (found) {
          confidence += 0.3;
          evidence.push(`Text: "${text}"`);
        }
      }
    }

    return confidence > 0.2 ? { confidence: Math.min(confidence, 1), evidence } : null;
  }

  async _waitForResolution(page) {
    const startTime = Date.now();

    while (Date.now() - startTime < this.maxWaitTime) {
      await page.waitForTimeout(this.checkInterval);

      const captchas = await this.detect(page);
      if (captchas.length === 0) {
        return { duration: Date.now() - startTime };
      }

      // Check if page navigated (CAPTCHA might have been solved)
      const botCheck = await this.checkBotDetection(page);
      if (!botCheck.detected) {
        return { duration: Date.now() - startTime };
      }
    }

    return null; // Timeout
  }

  getReport() {
    const byType = {};
    for (const d of this.detections) {
      byType[d.name] = (byType[d.name] || 0) + 1;
    }
    return {
      totalDetections: this.detections.length,
      byType,
      history: this.detections.slice(-20),
    };
  }
}

module.exports = CaptchaDetector;
