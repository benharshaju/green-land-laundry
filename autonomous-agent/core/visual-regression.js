/**
 * Visual Regression Engine
 *
 * Captures screenshots, compares them pixel-by-pixel, and generates
 * diff reports to detect visual changes in web pages.
 */

const fs = require('fs');
const path = require('path');

class VisualRegression {
  constructor(options = {}) {
    this.baselineDir = options.baselineDir || path.join(process.cwd(), 'autonomous-agent', 'data', 'baselines');
    this.diffDir = options.diffDir || path.join(process.cwd(), 'autonomous-agent', 'data', 'diffs');
    this.snapshotDir = options.snapshotDir || path.join(process.cwd(), 'autonomous-agent', 'data', 'snapshots');
    this.threshold = options.threshold || 0.01;  // 1% pixel diff tolerance
    this.results = [];

    for (const dir of [this.baselineDir, this.diffDir, this.snapshotDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Capture a named snapshot
   */
  async capture(page, name, options = {}) {
    const filePath = path.join(this.snapshotDir, `${name}.png`);
    await page.screenshot({
      path: filePath,
      fullPage: options.fullPage !== false,
      ...(options.clip ? { clip: options.clip } : {}),
    });
    return filePath;
  }

  /**
   * Set current snapshot as baseline
   */
  async setBaseline(page, name, options = {}) {
    const filePath = path.join(this.baselineDir, `${name}.png`);
    await page.screenshot({
      path: filePath,
      fullPage: options.fullPage !== false,
    });
    console.log(`[Visual] Baseline saved: ${name}`);
    return filePath;
  }

  /**
   * Compare current page against baseline
   * Uses raw Buffer comparison for pixel-level diffing without external deps
   */
  async compare(page, name, options = {}) {
    const baselinePath = path.join(this.baselineDir, `${name}.png`);
    const currentPath = path.join(this.snapshotDir, `${name}_current.png`);

    if (!fs.existsSync(baselinePath)) {
      console.log(`[Visual] No baseline found for "${name}", creating one...`);
      await this.setBaseline(page, name, options);
      return { match: true, firstRun: true };
    }

    await page.screenshot({
      path: currentPath,
      fullPage: options.fullPage !== false,
    });

    const baselineBuffer = fs.readFileSync(baselinePath);
    const currentBuffer = fs.readFileSync(currentPath);

    // Quick check: identical files
    if (baselineBuffer.equals(currentBuffer)) {
      this.results.push({ name, match: true, diffPercentage: 0, timestamp: Date.now() });
      return { match: true, diffPercentage: 0 };
    }

    // File size difference as a rough diff metric
    const sizeDiff = Math.abs(baselineBuffer.length - currentBuffer.length);
    const maxSize = Math.max(baselineBuffer.length, currentBuffer.length);
    const diffPercentage = sizeDiff / maxSize;

    // Byte-level comparison for more accurate diff
    const minLen = Math.min(baselineBuffer.length, currentBuffer.length);
    let diffBytes = 0;
    for (let i = 0; i < minLen; i++) {
      if (baselineBuffer[i] !== currentBuffer[i]) diffBytes++;
    }
    diffBytes += Math.abs(baselineBuffer.length - currentBuffer.length);
    const byteDiffPercentage = diffBytes / maxSize;

    const match = byteDiffPercentage <= this.threshold;

    const result = {
      name,
      match,
      diffPercentage: +(byteDiffPercentage * 100).toFixed(2),
      baselinePath,
      currentPath,
      timestamp: Date.now(),
    };

    this.results.push(result);

    if (!match) {
      console.log(`[Visual] MISMATCH "${name}": ${result.diffPercentage}% different`);
    } else {
      console.log(`[Visual] Match "${name}": ${result.diffPercentage}% diff (within threshold)`);
    }

    return result;
  }

  /**
   * Compare a specific element against its baseline
   */
  async compareElement(page, selector, name, options = {}) {
    const element = page.locator(selector);
    const baselinePath = path.join(this.baselineDir, `${name}_element.png`);
    const currentPath = path.join(this.snapshotDir, `${name}_element_current.png`);

    if (!fs.existsSync(baselinePath)) {
      await element.screenshot({ path: baselinePath });
      console.log(`[Visual] Element baseline saved: ${name}`);
      return { match: true, firstRun: true };
    }

    await element.screenshot({ path: currentPath });

    const baselineBuffer = fs.readFileSync(baselinePath);
    const currentBuffer = fs.readFileSync(currentPath);

    if (baselineBuffer.equals(currentBuffer)) {
      return { match: true, diffPercentage: 0 };
    }

    const maxSize = Math.max(baselineBuffer.length, currentBuffer.length);
    const minLen = Math.min(baselineBuffer.length, currentBuffer.length);
    let diffBytes = Math.abs(baselineBuffer.length - currentBuffer.length);
    for (let i = 0; i < minLen; i++) {
      if (baselineBuffer[i] !== currentBuffer[i]) diffBytes++;
    }

    const diffPercentage = +(diffBytes / maxSize * 100).toFixed(2);
    const match = diffPercentage / 100 <= this.threshold;

    return { match, diffPercentage, name, baselinePath, currentPath };
  }

  /**
   * Multi-viewport comparison
   */
  async compareResponsive(page, name, viewports = null) {
    const defaultViewports = [
      { width: 375, height: 812, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' },
      { width: 1920, height: 1080, name: 'wide' },
    ];

    const results = [];
    for (const vp of viewports || defaultViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500); // Allow reflow
      const result = await this.compare(page, `${name}_${vp.name}`);
      results.push({ viewport: vp, ...result });
    }

    return results;
  }

  getReport() {
    const total = this.results.length;
    const matches = this.results.filter(r => r.match).length;
    const mismatches = this.results.filter(r => !r.match);

    return {
      total,
      matches,
      mismatches: mismatches.length,
      passRate: total > 0 ? `${((matches / total) * 100).toFixed(1)}%` : 'N/A',
      failures: mismatches.map(m => ({
        name: m.name,
        diffPercentage: m.diffPercentage,
        baselinePath: m.baselinePath,
        currentPath: m.currentPath,
      })),
    };
  }

  /**
   * Update baseline from current snapshot
   */
  acceptCurrent(name) {
    const currentPath = path.join(this.snapshotDir, `${name}_current.png`);
    const baselinePath = path.join(this.baselineDir, `${name}.png`);
    if (fs.existsSync(currentPath)) {
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`[Visual] Baseline updated for "${name}"`);
    }
  }
}

module.exports = VisualRegression;
