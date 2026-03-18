/**
 * Self-Healing Selector Engine
 *
 * When a selector breaks, this engine analyzes the DOM to find the most likely
 * matching element using a multi-signal scoring algorithm. It learns from
 * successful interactions and adapts over time.
 */

const fs = require('fs');
const path = require('path');

class SelfHealingEngine {
  constructor(options = {}) {
    this.selectorDb = new Map();           // URL -> element fingerprints
    this.healingHistory = [];              // log of all healing attempts
    this.dbPath = options.dbPath || path.join(process.cwd(), 'autonomous-agent', 'data', 'selector-db.json');
    this.confidenceThreshold = options.confidenceThreshold || 0.6;
    this._loadDb();
  }

  /**
   * Register a known-good element fingerprint for future healing
   */
  async registerElement(page, selector, label) {
    try {
      const fingerprint = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);

        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          classes: Array.from(el.classList),
          text: el.innerText?.trim().substring(0, 100) || null,
          href: el.getAttribute('href') || null,
          type: el.getAttribute('type') || null,
          name: el.getAttribute('name') || null,
          placeholder: el.getAttribute('placeholder') || null,
          ariaLabel: el.getAttribute('aria-label') || null,
          testId: el.getAttribute('data-testid') || null,
          role: el.getAttribute('role') || null,
          parentTag: el.parentElement?.tagName.toLowerCase() || null,
          parentId: el.parentElement?.id || null,
          childIndex: Array.from(el.parentElement?.children || []).indexOf(el),
          siblingCount: el.parentElement?.children.length || 0,
          attributes: Array.from(el.attributes).map(a => ({ name: a.name, value: a.value })),
          position: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          visibility: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
          depth: (() => { let d = 0; let p = el; while (p.parentElement) { d++; p = p.parentElement; } return d; })(),
        };
      }, selector);

      if (fingerprint) {
        const url = new URL(page.url()).pathname;
        const key = `${url}::${label || selector}`;
        this.selectorDb.set(key, {
          originalSelector: selector,
          fingerprint,
          label,
          lastUpdated: Date.now(),
          successCount: (this.selectorDb.get(key)?.successCount || 0) + 1,
        });
        this._saveDb();
      }
    } catch (err) {
      // Silent fail for registration
    }
  }

  /**
   * Attempt to heal a broken selector by finding the best matching element
   */
  async heal(page, originalSelector, label) {
    const url = new URL(page.url()).pathname;
    const key = `${url}::${label || originalSelector}`;
    const known = this.selectorDb.get(key);

    if (!known) {
      console.warn(`[SelfHealing] No fingerprint stored for: ${key}`);
      return null;
    }

    const target = known.fingerprint;

    // Gather all candidate elements from the page
    const candidates = await page.evaluate((targetFp) => {
      const allElements = document.querySelectorAll('*');
      const results = [];

      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;

        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') continue;

        results.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          classes: Array.from(el.classList),
          text: el.innerText?.trim().substring(0, 100) || null,
          href: el.getAttribute('href') || null,
          type: el.getAttribute('type') || null,
          name: el.getAttribute('name') || null,
          placeholder: el.getAttribute('placeholder') || null,
          ariaLabel: el.getAttribute('aria-label') || null,
          testId: el.getAttribute('data-testid') || null,
          role: el.getAttribute('role') || null,
          parentTag: el.parentElement?.tagName.toLowerCase() || null,
          parentId: el.parentElement?.id || null,
          childIndex: Array.from(el.parentElement?.children || []).indexOf(el),
          siblingCount: el.parentElement?.children.length || 0,
          position: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          depth: (() => { let d = 0; let p = el; while (p.parentElement) { d++; p = p.parentElement; } return d; })(),
          // Generate a unique path for re-selection
          path: (() => {
            const parts = [];
            let node = el;
            while (node && node !== document.body) {
              let selector = node.tagName.toLowerCase();
              if (node.id) {
                selector = `#${node.id}`;
                parts.unshift(selector);
                break;
              }
              const idx = Array.from(node.parentElement?.children || [])
                .filter(c => c.tagName === node.tagName)
                .indexOf(node);
              if (idx > 0) selector += `:nth-of-type(${idx + 1})`;
              parts.unshift(selector);
              node = node.parentElement;
            }
            return parts.join(' > ');
          })(),
        });
      }
      return results;
    }, target);

    // Score each candidate against the known fingerprint
    const scored = candidates.map(candidate => {
      let score = 0;
      let maxScore = 0;

      // Tag match (weight: 3)
      maxScore += 3;
      if (candidate.tag === target.tag) score += 3;

      // ID match (weight: 10)
      if (target.id) {
        maxScore += 10;
        if (candidate.id === target.id) score += 10;
      }

      // Class overlap (weight: 5)
      if (target.classes.length > 0) {
        maxScore += 5;
        const overlap = candidate.classes.filter(c => target.classes.includes(c)).length;
        score += (overlap / Math.max(target.classes.length, 1)) * 5;
      }

      // Text similarity (weight: 8)
      if (target.text) {
        maxScore += 8;
        if (candidate.text === target.text) {
          score += 8;
        } else if (candidate.text && target.text) {
          const similarity = this._textSimilarity(candidate.text, target.text);
          score += similarity * 8;
        }
      }

      // Attribute matches (weight: 4 each)
      for (const attr of ['href', 'type', 'name', 'placeholder', 'ariaLabel', 'testId', 'role']) {
        if (target[attr]) {
          maxScore += 4;
          if (candidate[attr] === target[attr]) score += 4;
        }
      }

      // Parent context (weight: 3)
      if (target.parentTag) {
        maxScore += 3;
        if (candidate.parentTag === target.parentTag) score += 2;
        if (candidate.parentId && candidate.parentId === target.parentId) score += 1;
      }

      // Position proximity (weight: 2)
      if (target.position && candidate.position) {
        maxScore += 2;
        const dist = Math.sqrt(
          Math.pow(candidate.position.x - target.position.x, 2) +
          Math.pow(candidate.position.y - target.position.y, 2)
        );
        score += Math.max(0, 2 - dist / 500);
      }

      // DOM depth (weight: 1)
      maxScore += 1;
      if (candidate.depth === target.depth) score += 1;

      // Child index (weight: 2)
      if (target.childIndex !== undefined) {
        maxScore += 2;
        if (candidate.childIndex === target.childIndex) score += 2;
      }

      const confidence = maxScore > 0 ? score / maxScore : 0;
      return { ...candidate, confidence };
    });

    // Sort by confidence, descending
    scored.sort((a, b) => b.confidence - a.confidence);

    const best = scored[0];
    if (!best || best.confidence < this.confidenceThreshold) {
      this.healingHistory.push({
        timestamp: Date.now(),
        url: page.url(),
        originalSelector,
        label,
        healed: false,
        bestConfidence: best?.confidence || 0,
      });
      console.warn(`[SelfHealing] No confident match found (best: ${(best?.confidence * 100).toFixed(1)}%)`);
      return null;
    }

    this.healingHistory.push({
      timestamp: Date.now(),
      url: page.url(),
      originalSelector,
      label,
      healed: true,
      newSelector: best.path,
      confidence: best.confidence,
    });

    console.log(`[SelfHealing] Healed "${label || originalSelector}" → "${best.path}" (${(best.confidence * 100).toFixed(1)}% confidence)`);
    return best.path;
  }

  /**
   * Simple text similarity using bigram overlap (Dice coefficient)
   */
  _textSimilarity(a, b) {
    if (!a || !b) return 0;
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 1;

    const bigramsA = new Set();
    const bigramsB = new Set();
    for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substring(i, i + 2));
    for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.substring(i, i + 2));

    let overlap = 0;
    for (const bg of bigramsA) if (bigramsB.has(bg)) overlap++;

    return (2 * overlap) / (bigramsA.size + bigramsB.size);
  }

  _loadDb() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
        this.selectorDb = new Map(Object.entries(data));
      }
    } catch {
      // Start fresh
    }
  }

  _saveDb() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const obj = Object.fromEntries(this.selectorDb);
      fs.writeFileSync(this.dbPath, JSON.stringify(obj, null, 2));
    } catch (err) {
      console.error('[SelfHealing] Failed to save DB:', err.message);
    }
  }

  getHealingReport() {
    const total = this.healingHistory.length;
    const healed = this.healingHistory.filter(h => h.healed).length;
    return {
      totalAttempts: total,
      successfulHeals: healed,
      successRate: total > 0 ? ((healed / total) * 100).toFixed(1) + '%' : 'N/A',
      history: this.healingHistory,
    };
  }
}

module.exports = SelfHealingEngine;
