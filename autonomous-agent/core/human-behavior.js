/**
 * Human Behavior Simulator
 *
 * Mimics human-like interactions: natural mouse movement, random delays,
 * typing speed variation, scroll behavior, and attention patterns.
 */

class HumanBehavior {
  constructor(options = {}) {
    this.speed = options.speed || 'normal'; // 'slow', 'normal', 'fast'
    this.profiles = {
      slow: { typeDelay: [80, 200], clickDelay: [300, 800], scrollSpeed: [50, 150], pauseChance: 0.15 },
      normal: { typeDelay: [40, 120], clickDelay: [100, 400], scrollSpeed: [100, 300], pauseChance: 0.08 },
      fast: { typeDelay: [20, 60], clickDelay: [50, 200], scrollSpeed: [200, 500], pauseChance: 0.03 },
    };
  }

  get profile() {
    return this.profiles[this.speed] || this.profiles.normal;
  }

  /**
   * Type text with human-like speed variation and occasional typos
   */
  async humanType(page, selector, text, options = {}) {
    await page.waitForSelector(selector, { state: 'visible' });
    await page.click(selector);

    // Clear existing content
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.value = '';
    }, selector);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Simulate occasional typo (2% chance)
      if (!options.noTypos && Math.random() < 0.02 && text.length > 5) {
        const typoChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
        await page.keyboard.type(typoChar, { delay: this._randomDelay(this.profile.typeDelay) });
        await page.waitForTimeout(this._randomDelay([100, 300]));
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(this._randomDelay([50, 150]));
      }

      await page.keyboard.type(char, { delay: this._randomDelay(this.profile.typeDelay) });

      // Occasional pause (like thinking)
      if (Math.random() < this.profile.pauseChance) {
        await page.waitForTimeout(this._randomDelay([300, 1200]));
      }
    }
  }

  /**
   * Move mouse along a natural Bezier curve path to target element
   */
  async humanMove(page, selector) {
    const element = await page.$(selector);
    if (!element) return;

    const box = await element.boundingBox();
    if (!box) return;

    // Target with slight randomness within the element
    const targetX = box.x + box.width * (0.3 + Math.random() * 0.4);
    const targetY = box.y + box.height * (0.3 + Math.random() * 0.4);

    // Get current mouse position (default to random start)
    const startX = Math.random() * 500;
    const startY = Math.random() * 500;

    // Generate Bezier curve control points
    const cp1x = startX + (targetX - startX) * (0.2 + Math.random() * 0.3);
    const cp1y = startY + (targetY - startY) * (Math.random() * 0.5) + (Math.random() - 0.5) * 100;
    const cp2x = startX + (targetX - startX) * (0.5 + Math.random() * 0.3);
    const cp2y = startY + (targetY - startY) * (0.5 + Math.random() * 0.5) + (Math.random() - 0.5) * 50;

    // Move along the curve
    const steps = 15 + Math.floor(Math.random() * 15);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Cubic Bezier interpolation
      const x = Math.pow(1 - t, 3) * startX +
        3 * Math.pow(1 - t, 2) * t * cp1x +
        3 * (1 - t) * Math.pow(t, 2) * cp2x +
        Math.pow(t, 3) * targetX;
      const y = Math.pow(1 - t, 3) * startY +
        3 * Math.pow(1 - t, 2) * t * cp1y +
        3 * (1 - t) * Math.pow(t, 2) * cp2y +
        Math.pow(t, 3) * targetY;

      await page.mouse.move(x, y);
      await page.waitForTimeout(this._randomDelay([5, 20]));
    }
  }

  /**
   * Click with human-like behavior (move, hover, then click)
   */
  async humanClick(page, selector) {
    await this.humanMove(page, selector);
    await page.waitForTimeout(this._randomDelay([50, 200]));
    await page.mouse.down();
    await page.waitForTimeout(this._randomDelay([30, 100]));
    await page.mouse.up();
  }

  /**
   * Scroll like a human - variable speed, occasional pauses, sometimes overshoot
   */
  async humanScroll(page, options = {}) {
    const direction = options.direction || 'down';
    const distance = options.distance || 800;
    const scrolled = { total: 0 };

    const segments = 5 + Math.floor(Math.random() * 8);
    const segmentSize = distance / segments;

    for (let i = 0; i < segments; i++) {
      const amount = segmentSize * (0.7 + Math.random() * 0.6);
      const dy = direction === 'down' ? amount : -amount;

      await page.mouse.wheel(0, dy);
      scrolled.total += Math.abs(dy);

      // Variable pause between scroll segments
      await page.waitForTimeout(this._randomDelay(this.profile.scrollSpeed));

      // Occasionally pause longer (reading)
      if (Math.random() < 0.15) {
        await page.waitForTimeout(this._randomDelay([500, 2000]));
      }
    }

    return scrolled;
  }

  /**
   * Simulate reading a page — scroll down gradually with pauses
   */
  async simulateReading(page, duration = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < duration) {
      await this.humanScroll(page, { distance: 200 + Math.random() * 300 });
      await page.waitForTimeout(this._randomDelay([800, 2500]));

      // Sometimes scroll back up slightly
      if (Math.random() < 0.1) {
        await this.humanScroll(page, { direction: 'up', distance: 50 + Math.random() * 100 });
      }
    }
  }

  /**
   * Add random delay between actions
   */
  async think(page, complexity = 'normal') {
    const delays = {
      quick: [200, 500],
      normal: [500, 1500],
      long: [1500, 4000],
      complex: [3000, 8000],
    };
    await page.waitForTimeout(this._randomDelay(delays[complexity] || delays.normal));
  }

  _randomDelay([min, max]) {
    return Math.floor(min + Math.random() * (max - min));
  }
}

module.exports = HumanBehavior;
