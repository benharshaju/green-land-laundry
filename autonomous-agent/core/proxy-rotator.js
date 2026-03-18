/**
 * Proxy Rotator
 *
 * Manages a pool of proxies with health checking, automatic rotation,
 * geo-targeting, and failure-based blacklisting.
 */

const EventEmitter = require('events');

class ProxyRotator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.proxies = [];
    this.blacklist = new Map();         // proxy -> { until, reason, failures }
    this.usage = new Map();             // proxy -> { requests, lastUsed, avgLatency }
    this.currentIndex = 0;
    this.strategy = options.strategy || 'round-robin'; // round-robin | random | least-used | geo
    this.maxFailures = options.maxFailures || 3;
    this.blacklistDuration = options.blacklistDuration || 5 * 60 * 1000; // 5 min
    this.healthCheckInterval = options.healthCheckInterval || 60000;
    this._healthTimer = null;
  }

  /**
   * Add proxies to the pool
   * Format: { server: "http://host:port", username?, password?, country?, label? }
   */
  addProxies(proxyList) {
    for (const proxy of proxyList) {
      const normalized = typeof proxy === 'string'
        ? { server: proxy }
        : proxy;
      this.proxies.push(normalized);
      this.usage.set(normalized.server, { requests: 0, lastUsed: 0, avgLatency: 0, latencies: [] });
    }
    console.log(`[ProxyRotator] Pool size: ${this.proxies.length}`);
    return this;
  }

  /**
   * Get the next proxy based on strategy
   */
  getNext(options = {}) {
    const available = this._getAvailable(options.country);
    if (available.length === 0) {
      console.warn('[ProxyRotator] No available proxies!');
      this.emit('pool:exhausted');
      return null;
    }

    let selected;

    switch (this.strategy) {
      case 'random':
        selected = available[Math.floor(Math.random() * available.length)];
        break;

      case 'least-used': {
        selected = available.reduce((min, proxy) => {
          const usage = this.usage.get(proxy.server);
          const minUsage = this.usage.get(min.server);
          return (usage?.requests || 0) < (minUsage?.requests || 0) ? proxy : min;
        }, available[0]);
        break;
      }

      case 'fastest': {
        selected = available.reduce((fastest, proxy) => {
          const usage = this.usage.get(proxy.server);
          const fastestUsage = this.usage.get(fastest.server);
          return (usage?.avgLatency || Infinity) < (fastestUsage?.avgLatency || Infinity) ? proxy : fastest;
        }, available[0]);
        break;
      }

      case 'geo': {
        const geoFiltered = options.country
          ? available.filter(p => p.country === options.country)
          : available;
        selected = geoFiltered.length > 0
          ? geoFiltered[Math.floor(Math.random() * geoFiltered.length)]
          : available[Math.floor(Math.random() * available.length)];
        break;
      }

      case 'round-robin':
      default:
        this.currentIndex = this.currentIndex % available.length;
        selected = available[this.currentIndex];
        this.currentIndex++;
        break;
    }

    // Track usage
    const usage = this.usage.get(selected.server);
    if (usage) {
      usage.requests++;
      usage.lastUsed = Date.now();
    }

    this.emit('proxy:selected', { proxy: selected.server });
    return {
      server: selected.server,
      ...(selected.username ? { username: selected.username, password: selected.password } : {}),
    };
  }

  /**
   * Report proxy success with latency
   */
  reportSuccess(proxyServer, latencyMs) {
    const usage = this.usage.get(proxyServer);
    if (usage) {
      usage.latencies.push(latencyMs);
      if (usage.latencies.length > 20) usage.latencies.shift();
      usage.avgLatency = usage.latencies.reduce((a, b) => a + b, 0) / usage.latencies.length;
    }
    // Reduce blacklist failures on success
    const bl = this.blacklist.get(proxyServer);
    if (bl) bl.failures = Math.max(0, bl.failures - 1);
  }

  /**
   * Report proxy failure
   */
  reportFailure(proxyServer, reason = 'unknown') {
    const bl = this.blacklist.get(proxyServer) || { failures: 0 };
    bl.failures++;
    bl.reason = reason;

    if (bl.failures >= this.maxFailures) {
      bl.until = Date.now() + this.blacklistDuration;
      console.warn(`[ProxyRotator] Blacklisted ${proxyServer} for ${this.blacklistDuration / 1000}s (${reason})`);
      this.emit('proxy:blacklisted', { proxy: proxyServer, reason, until: bl.until });
    }

    this.blacklist.set(proxyServer, bl);
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(page) {
    if (this._healthTimer) return;
    this._healthTimer = setInterval(async () => {
      // Clean expired blacklist entries
      const now = Date.now();
      for (const [proxy, bl] of this.blacklist) {
        if (bl.until && bl.until < now) {
          bl.failures = 0;
          bl.until = null;
          console.log(`[ProxyRotator] Un-blacklisted ${proxy}`);
        }
      }
      this.emit('health:check', { poolSize: this.proxies.length, available: this._getAvailable().length });
    }, this.healthCheckInterval);
  }

  stopHealthChecks() {
    if (this._healthTimer) {
      clearInterval(this._healthTimer);
      this._healthTimer = null;
    }
  }

  _getAvailable(country = null) {
    const now = Date.now();
    return this.proxies.filter(proxy => {
      const bl = this.blacklist.get(proxy.server);
      if (bl && bl.until && bl.until > now) return false;
      if (country && proxy.country && proxy.country !== country) return false;
      return true;
    });
  }

  getStats() {
    const available = this._getAvailable();
    const stats = {};
    for (const [server, usage] of this.usage) {
      stats[server] = {
        requests: usage.requests,
        avgLatency: Math.round(usage.avgLatency),
        blacklisted: !!this.blacklist.get(server)?.until,
      };
    }
    return {
      total: this.proxies.length,
      available: available.length,
      blacklisted: this.proxies.length - available.length,
      strategy: this.strategy,
      proxies: stats,
    };
  }
}

module.exports = ProxyRotator;
