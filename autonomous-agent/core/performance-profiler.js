/**
 * Performance Profiler
 *
 * Measures page load times, Core Web Vitals, memory usage,
 * resource breakdown, and long tasks. Generates performance reports.
 */

const EventEmitter = require('events');

class PerformanceProfiler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.profiles = [];
    this.thresholds = {
      lcp: options.lcpThreshold || 2500,     // Largest Contentful Paint
      fid: options.fidThreshold || 100,       // First Input Delay
      cls: options.clsThreshold || 0.1,       // Cumulative Layout Shift
      ttfb: options.ttfbThreshold || 800,     // Time to First Byte
      fcp: options.fcpThreshold || 1800,      // First Contentful Paint
      tti: options.ttiThreshold || 3800,      // Time to Interactive
      totalSize: options.totalSizeThreshold || 3 * 1024 * 1024, // 3MB
    };
  }

  /**
   * Run a full performance profile of a page
   */
  async profile(page, name = 'default') {
    const startTime = Date.now();

    // Collect performance timing
    const timing = await page.evaluate(() => {
      const perf = performance;
      const nav = perf.getEntriesByType('navigation')[0] || {};
      const paint = perf.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');

      // Resource breakdown
      const resources = perf.getEntriesByType('resource');
      const resourceBreakdown = {};
      let totalTransferSize = 0;

      for (const res of resources) {
        const type = res.initiatorType || 'other';
        if (!resourceBreakdown[type]) {
          resourceBreakdown[type] = { count: 0, totalSize: 0, totalDuration: 0 };
        }
        resourceBreakdown[type].count++;
        resourceBreakdown[type].totalSize += res.transferSize || 0;
        resourceBreakdown[type].totalDuration += res.duration || 0;
        totalTransferSize += res.transferSize || 0;
      }

      // Long tasks (if available)
      const longTasks = perf.getEntriesByType('longtask') || [];

      return {
        // Navigation timing
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        ssl: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
        ttfb: nav.responseStart - nav.requestStart,
        download: nav.responseEnd - nav.responseStart,
        domParsing: nav.domInteractive - nav.responseEnd,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart,
        loadEvent: nav.loadEventEnd - nav.navigationStart,

        // Paint metrics
        fcp: fcp ? fcp.startTime : null,

        // Resources
        resourceCount: resources.length,
        totalTransferSize,
        resourceBreakdown,

        // Long tasks
        longTaskCount: longTasks.length,
        longestTask: longTasks.length > 0 ? Math.max(...longTasks.map(t => t.duration)) : 0,

        // Memory (Chrome only)
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        } : null,

        // DOM stats
        domNodes: document.querySelectorAll('*').length,
        domDepth: (() => {
          let maxDepth = 0;
          const walk = (node, depth) => {
            if (depth > maxDepth) maxDepth = depth;
            for (const child of node.children) walk(child, depth + 1);
          };
          walk(document.documentElement, 0);
          return maxDepth;
        })(),
      };
    });

    // Collect CLS via Layout Instability API
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsScore = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
        });
        try {
          observer.observe({ type: 'layout-shift', buffered: true });
        } catch { /* not supported */ }
        setTimeout(() => {
          observer.disconnect();
          resolve(clsScore);
        }, 100);
      });
    });

    // Collect LCP
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcpValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            lcpValue = entries[entries.length - 1].startTime;
          }
        });
        try {
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch { /* not supported */ }
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 100);
      });
    });

    const profile = {
      name,
      url: page.url(),
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      timing,
      cls,
      lcp,
      scores: this._calculateScores({ ...timing, cls, lcp }),
    };

    this.profiles.push(profile);
    this.emit('profile:complete', profile);

    return profile;
  }

  /**
   * Monitor page performance in real-time
   */
  async startMonitoring(page, interval = 5000) {
    const monitor = {
      active: true,
      snapshots: [],
    };

    const tick = async () => {
      if (!monitor.active) return;

      const snapshot = await page.evaluate(() => ({
        timestamp: Date.now(),
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
        } : null,
        domNodes: document.querySelectorAll('*').length,
        handlers: (() => {
          // Estimate event listeners
          let count = 0;
          document.querySelectorAll('*').forEach(el => {
            const events = getEventListeners?.(el);
            if (events) count += Object.values(events).flat().length;
          });
          return count;
        })(),
      }));

      monitor.snapshots.push(snapshot);
      this.emit('monitor:snapshot', snapshot);

      if (monitor.active) {
        setTimeout(tick, interval);
      }
    };

    tick();
    return monitor;
  }

  stopMonitoring(monitor) {
    monitor.active = false;
  }

  /**
   * Compare two profiles
   */
  compare(profileA, profileB) {
    const diff = {};
    const fields = ['ttfb', 'fcp', 'lcp', 'cls', 'domContentLoaded', 'loadEvent'];

    for (const field of fields) {
      const a = field === 'cls' || field === 'lcp' ? profileA[field] : profileA.timing?.[field];
      const b = field === 'cls' || field === 'lcp' ? profileB[field] : profileB.timing?.[field];
      if (a !== null && b !== null && a !== undefined && b !== undefined) {
        diff[field] = {
          before: a,
          after: b,
          change: b - a,
          changePercent: a !== 0 ? (((b - a) / a) * 100).toFixed(1) + '%' : 'N/A',
          improved: field === 'cls' ? b < a : b < a,
        };
      }
    }

    return diff;
  }

  /**
   * Get Lighthouse-style scores
   */
  _calculateScores(metrics) {
    const score = (value, threshold, isLowerBetter = true) => {
      if (value === null || value === undefined) return null;
      if (isLowerBetter) {
        if (value <= threshold * 0.5) return 'good';
        if (value <= threshold) return 'needs-improvement';
        return 'poor';
      }
      return value >= threshold ? 'good' : 'poor';
    };

    return {
      ttfb: { value: metrics.ttfb, rating: score(metrics.ttfb, this.thresholds.ttfb) },
      fcp: { value: metrics.fcp, rating: score(metrics.fcp, this.thresholds.fcp) },
      lcp: { value: metrics.lcp, rating: score(metrics.lcp, this.thresholds.lcp) },
      cls: { value: metrics.cls, rating: score(metrics.cls, this.thresholds.cls) },
      totalSize: {
        value: metrics.totalTransferSize,
        rating: score(metrics.totalTransferSize, this.thresholds.totalSize),
        formatted: this._formatBytes(metrics.totalTransferSize),
      },
    };
  }

  _formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let size = bytes;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  getReport() {
    return {
      totalProfiles: this.profiles.length,
      profiles: this.profiles.map(p => ({
        name: p.name,
        url: p.url,
        scores: p.scores,
        domNodes: p.timing.domNodes,
        resources: p.timing.resourceCount,
        totalSize: this._formatBytes(p.timing.totalTransferSize),
      })),
    };
  }
}

module.exports = PerformanceProfiler;
