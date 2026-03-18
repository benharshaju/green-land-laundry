/**
 * Webhook Notifier
 *
 * Sends real-time notifications via webhooks (Slack, Discord, Teams, custom)
 * for task completion, errors, CAPTCHA detection, and custom events.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const EventEmitter = require('events');

class WebhookNotifier extends EventEmitter {
  constructor(options = {}) {
    super();
    this.webhooks = new Map();   // name -> { url, format, events, headers }
    this.history = [];
    this.maxHistory = options.maxHistory || 100;
    this.retryAttempts = options.retryAttempts || 2;
    this.retryDelay = options.retryDelay || 3000;
    this.enabled = options.enabled !== false;
  }

  /**
   * Register a webhook endpoint
   */
  register(name, config) {
    this.webhooks.set(name, {
      url: config.url,
      format: config.format || 'json',         // json | slack | discord | teams
      events: config.events || ['*'],           // event types to listen to
      headers: config.headers || {},
      template: config.template || null,        // custom message template
      rateLimit: config.rateLimit || 0,         // min ms between sends
      lastSent: 0,
    });
    console.log(`[Webhook] Registered: ${name} (${config.format || 'json'})`);
    return this;
  }

  /**
   * Send notification to all matching webhooks
   */
  async notify(event, data = {}) {
    if (!this.enabled) return;

    const promises = [];
    for (const [name, webhook] of this.webhooks) {
      if (this._matchesEvent(webhook.events, event)) {
        // Rate limiting
        const now = Date.now();
        if (webhook.rateLimit && now - webhook.lastSent < webhook.rateLimit) continue;
        webhook.lastSent = now;

        promises.push(this._send(name, webhook, event, data));
      }
    }

    return Promise.allSettled(promises);
  }

  /**
   * Send to a specific webhook by name
   */
  async sendTo(name, event, data = {}) {
    const webhook = this.webhooks.get(name);
    if (!webhook) throw new Error(`Webhook "${name}" not found`);
    return this._send(name, webhook, event, data);
  }

  async _send(name, webhook, event, data, attempt = 1) {
    const payload = this._formatPayload(webhook, event, data);
    const body = JSON.stringify(payload);

    try {
      const result = await this._httpPost(webhook.url, body, {
        'Content-Type': 'application/json',
        ...webhook.headers,
      });

      this._logHistory(name, event, 'success', result.statusCode);
      this.emit('webhook:sent', { name, event, status: result.statusCode });
      return result;

    } catch (err) {
      console.error(`[Webhook] Failed to send to "${name}": ${err.message}`);

      if (attempt < this.retryAttempts) {
        await new Promise(r => setTimeout(r, this.retryDelay * attempt));
        return this._send(name, webhook, event, data, attempt + 1);
      }

      this._logHistory(name, event, 'failed', err.message);
      this.emit('webhook:failed', { name, event, error: err.message });
      throw err;
    }
  }

  _formatPayload(webhook, event, data) {
    const timestamp = new Date().toISOString();

    switch (webhook.format) {
      case 'slack':
        return {
          text: this._buildSlackText(event, data),
          blocks: this._buildSlackBlocks(event, data, timestamp),
        };

      case 'discord':
        return {
          embeds: [{
            title: `Agent: ${event}`,
            description: this._buildPlainText(event, data),
            color: this._getStatusColor(event),
            timestamp,
            fields: Object.entries(data).slice(0, 10).map(([k, v]) => ({
              name: k,
              value: String(typeof v === 'object' ? JSON.stringify(v) : v).substring(0, 200),
              inline: String(v).length < 50,
            })),
            footer: { text: 'Autonomous Browser Agent' },
          }],
        };

      case 'teams':
        return {
          '@type': 'MessageCard',
          themeColor: this._getStatusHex(event),
          summary: `Agent: ${event}`,
          sections: [{
            activityTitle: `Agent Event: ${event}`,
            activitySubtitle: timestamp,
            facts: Object.entries(data).slice(0, 10).map(([k, v]) => ({
              name: k,
              value: String(typeof v === 'object' ? JSON.stringify(v) : v).substring(0, 200),
            })),
          }],
        };

      case 'json':
      default:
        return {
          event,
          timestamp,
          data,
          source: 'autonomous-browser-agent',
        };
    }
  }

  _buildSlackText(event, data) {
    const icon = this._getEventIcon(event);
    let text = `${icon} *${event}*`;
    if (data.message) text += `\n${data.message}`;
    if (data.error) text += `\n:x: Error: ${data.error}`;
    if (data.duration) text += `\n:clock1: Duration: ${data.duration}ms`;
    if (data.url) text += `\n:link: ${data.url}`;
    return text;
  }

  _buildSlackBlocks(event, data, timestamp) {
    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${this._getEventIcon(event)} ${event}` },
      },
      {
        type: 'section',
        fields: Object.entries(data).slice(0, 8).map(([k, v]) => ({
          type: 'mrkdwn',
          text: `*${k}:*\n${String(typeof v === 'object' ? JSON.stringify(v) : v).substring(0, 150)}`,
        })),
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Autonomous Agent | ${timestamp}` }],
      },
    ];
    return blocks;
  }

  _buildPlainText(event, data) {
    let text = '';
    if (data.message) text += data.message + '\n';
    if (data.error) text += `Error: ${data.error}\n`;
    if (data.duration) text += `Duration: ${data.duration}ms\n`;
    if (data.url) text += `URL: ${data.url}\n`;
    return text || `Event: ${event}`;
  }

  _getEventIcon(event) {
    if (event.includes('error') || event.includes('fail')) return ':red_circle:';
    if (event.includes('complete') || event.includes('success')) return ':white_check_mark:';
    if (event.includes('captcha')) return ':warning:';
    if (event.includes('start')) return ':rocket:';
    if (event.includes('heal')) return ':wrench:';
    return ':information_source:';
  }

  _getStatusColor(event) {
    if (event.includes('error') || event.includes('fail')) return 0xff4444;
    if (event.includes('complete') || event.includes('success')) return 0x00ff88;
    if (event.includes('captcha') || event.includes('warn')) return 0xffcc00;
    return 0x00d4ff;
  }

  _getStatusHex(event) {
    return this._getStatusColor(event).toString(16).padStart(6, '0');
  }

  _httpPost(urlStr, body, headers) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const mod = url.protocol === 'https:' ? https : http;

      const req = mod.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });

      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
      req.write(body);
      req.end();
    });
  }

  _logHistory(name, event, status, detail) {
    this.history.push({ name, event, status, detail, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) this.history.shift();
  }

  getStats() {
    const sent = this.history.filter(h => h.status === 'success').length;
    const failed = this.history.filter(h => h.status === 'failed').length;
    return {
      registered: this.webhooks.size,
      totalSent: sent,
      totalFailed: failed,
      successRate: sent + failed > 0 ? `${((sent / (sent + failed)) * 100).toFixed(1)}%` : 'N/A',
      recentHistory: this.history.slice(-10),
    };
  }
}

module.exports = WebhookNotifier;
