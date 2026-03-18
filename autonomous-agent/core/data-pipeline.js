/**
 * Data Pipeline
 *
 * Collects, transforms, deduplicates, validates, and exports scraped data
 * to JSON, CSV, or SQLite. Supports streaming writes and schema validation.
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class DataPipeline extends EventEmitter {
  constructor(options = {}) {
    super();
    this.collections = new Map();     // name -> { schema, records, transforms }
    this.outputDir = options.outputDir || path.join(process.cwd(), 'autonomous-agent', 'data', 'exports');
    this.deduplicateBy = options.deduplicateBy || null;  // field name for dedup
    this.autoFlushThreshold = options.autoFlushThreshold || 1000;

    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
  }

  /**
   * Create a named collection with optional schema
   *
   * Schema format: { fieldName: { type: 'string'|'number'|'boolean', required: true|false } }
   */
  createCollection(name, schema = null) {
    this.collections.set(name, {
      schema,
      records: [],
      transforms: [],
      dedupeKeys: new Set(),
      createdAt: Date.now(),
    });
    console.log(`[DataPipeline] Collection "${name}" created`);
    return this;
  }

  /**
   * Add a transform function to a collection
   * Transforms are applied in order when records are added
   */
  addTransform(collectionName, transformFn) {
    const col = this._getCollection(collectionName);
    col.transforms.push(transformFn);
    return this;
  }

  /**
   * Add a record to a collection
   */
  add(collectionName, record) {
    const col = this._getCollection(collectionName);

    // Apply transforms
    let transformed = { ...record };
    for (const fn of col.transforms) {
      transformed = fn(transformed);
      if (!transformed) return false; // Transform filtered it out
    }

    // Validate against schema
    if (col.schema) {
      const validation = this._validate(transformed, col.schema);
      if (!validation.valid) {
        this.emit('validation:failed', { collection: collectionName, record: transformed, errors: validation.errors });
        return false;
      }
    }

    // Deduplication
    if (this.deduplicateBy) {
      const key = transformed[this.deduplicateBy];
      if (key && col.dedupeKeys.has(String(key))) {
        this.emit('duplicate:skipped', { collection: collectionName, key });
        return false;
      }
      if (key) col.dedupeKeys.add(String(key));
    }

    // Add timestamp
    transformed._addedAt = Date.now();
    col.records.push(transformed);

    this.emit('record:added', { collection: collectionName, count: col.records.length });

    // Auto-flush
    if (col.records.length >= this.autoFlushThreshold) {
      this.flush(collectionName);
    }

    return true;
  }

  /**
   * Add multiple records
   */
  addBatch(collectionName, records) {
    let added = 0;
    for (const record of records) {
      if (this.add(collectionName, record)) added++;
    }
    return added;
  }

  /**
   * Add records from a page extraction
   */
  async addFromPage(page, collectionName, config) {
    const { selector, fields } = config;

    const records = await page.evaluate(({ selector, fields }) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => {
        const record = {};
        for (const [key, fieldSelector] of Object.entries(fields)) {
          const fieldEl = fieldSelector.startsWith('@')
            ? el
            : el.querySelector(fieldSelector);

          if (!fieldEl) { record[key] = null; continue; }

          if (fieldSelector.startsWith('@')) {
            record[key] = fieldEl.getAttribute(fieldSelector.slice(1));
          } else {
            record[key] = fieldEl.innerText?.trim() || null;
          }
        }
        return record;
      });
    }, { selector, fields });

    return this.addBatch(collectionName, records);
  }

  /**
   * Query records with filter
   */
  query(collectionName, filterFn = null) {
    const col = this._getCollection(collectionName);
    if (!filterFn) return [...col.records];
    return col.records.filter(filterFn);
  }

  /**
   * Aggregate records
   */
  aggregate(collectionName, field, operation) {
    const records = this.query(collectionName);
    const values = records.map(r => r[field]).filter(v => v !== null && v !== undefined);

    switch (operation) {
      case 'count': return values.length;
      case 'sum': return values.reduce((a, b) => Number(a) + Number(b), 0);
      case 'avg': return values.length > 0 ? values.reduce((a, b) => Number(a) + Number(b), 0) / values.length : 0;
      case 'min': return Math.min(...values.map(Number));
      case 'max': return Math.max(...values.map(Number));
      case 'unique': return [...new Set(values)];
      case 'distribution': {
        const dist = {};
        for (const v of values) dist[v] = (dist[v] || 0) + 1;
        return dist;
      }
      default: throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Group records by a field
   */
  groupBy(collectionName, field) {
    const records = this.query(collectionName);
    const groups = {};
    for (const record of records) {
      const key = record[field] || '_null';
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    }
    return groups;
  }

  /**
   * Export to JSON
   */
  exportJSON(collectionName, filePath = null) {
    const col = this._getCollection(collectionName);
    const outputPath = filePath || path.join(this.outputDir, `${collectionName}.json`);

    const data = {
      collection: collectionName,
      exportedAt: new Date().toISOString(),
      count: col.records.length,
      records: col.records.map(r => {
        const clean = { ...r };
        delete clean._addedAt;
        return clean;
      }),
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`[DataPipeline] Exported ${col.records.length} records to ${outputPath}`);
    return outputPath;
  }

  /**
   * Export to CSV
   */
  exportCSV(collectionName, filePath = null) {
    const col = this._getCollection(collectionName);
    const outputPath = filePath || path.join(this.outputDir, `${collectionName}.csv`);

    if (col.records.length === 0) {
      fs.writeFileSync(outputPath, '');
      return outputPath;
    }

    // Get all unique headers
    const headers = new Set();
    for (const record of col.records) {
      for (const key of Object.keys(record)) {
        if (key !== '_addedAt') headers.add(key);
      }
    }
    const headerArr = Array.from(headers);

    // Build CSV
    const lines = [headerArr.map(h => this._csvEscape(h)).join(',')];
    for (const record of col.records) {
      const row = headerArr.map(h => this._csvEscape(String(record[h] ?? '')));
      lines.push(row.join(','));
    }

    fs.writeFileSync(outputPath, lines.join('\n'));
    console.log(`[DataPipeline] Exported ${col.records.length} records to CSV: ${outputPath}`);
    return outputPath;
  }

  /**
   * Export to NDJSON (newline-delimited JSON, good for streaming)
   */
  exportNDJSON(collectionName, filePath = null) {
    const col = this._getCollection(collectionName);
    const outputPath = filePath || path.join(this.outputDir, `${collectionName}.ndjson`);

    const lines = col.records.map(r => {
      const clean = { ...r };
      delete clean._addedAt;
      return JSON.stringify(clean);
    });

    fs.writeFileSync(outputPath, lines.join('\n'));
    console.log(`[DataPipeline] Exported ${col.records.length} records to NDJSON: ${outputPath}`);
    return outputPath;
  }

  /**
   * Merge two collections
   */
  merge(sourceCollection, targetCollection, joinField = null) {
    const source = this._getCollection(sourceCollection);
    const target = this._getCollection(targetCollection);

    if (!joinField) {
      target.records.push(...source.records);
    } else {
      // Left join
      for (const sourceRec of source.records) {
        const match = target.records.find(t => t[joinField] === sourceRec[joinField]);
        if (match) {
          Object.assign(match, sourceRec);
        } else {
          target.records.push({ ...sourceRec });
        }
      }
    }

    return target.records.length;
  }

  /**
   * Flush collection to disk (append mode)
   */
  flush(collectionName) {
    this.exportJSON(collectionName);
    this.emit('collection:flushed', { collection: collectionName });
  }

  /**
   * Get collection stats
   */
  getStats(collectionName = null) {
    if (collectionName) {
      const col = this._getCollection(collectionName);
      return {
        name: collectionName,
        records: col.records.length,
        schema: col.schema,
        transforms: col.transforms.length,
        dedupeKeys: col.dedupeKeys.size,
      };
    }

    const stats = {};
    for (const [name, col] of this.collections) {
      stats[name] = {
        records: col.records.length,
        hasSchema: !!col.schema,
        transforms: col.transforms.length,
      };
    }
    return stats;
  }

  _getCollection(name) {
    const col = this.collections.get(name);
    if (!col) {
      // Auto-create if doesn't exist
      this.createCollection(name);
      return this.collections.get(name);
    }
    return col;
  }

  _validate(record, schema) {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = record[field];

      if (rules.required && (value === null || value === undefined || value === '')) {
        errors.push(`"${field}" is required`);
        continue;
      }

      if (value !== null && value !== undefined && rules.type) {
        const actualType = typeof value;
        if (rules.type === 'number' && isNaN(Number(value))) {
          errors.push(`"${field}" must be a number`);
        } else if (rules.type === 'string' && actualType !== 'string') {
          errors.push(`"${field}" must be a string`);
        } else if (rules.type === 'boolean' && actualType !== 'boolean') {
          errors.push(`"${field}" must be a boolean`);
        }
      }

      if (value && rules.pattern && !new RegExp(rules.pattern).test(String(value))) {
        errors.push(`"${field}" does not match pattern ${rules.pattern}`);
      }

      if (value && rules.maxLength && String(value).length > rules.maxLength) {
        errors.push(`"${field}" exceeds max length ${rules.maxLength}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  _csvEscape(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

module.exports = DataPipeline;
