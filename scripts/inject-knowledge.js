'use strict';

/**
 * Genspark-Superior — Knowledge Injector
 *
 * Called via user-prompt-submit hook before each prompt.
 * Reads the performance log and successful-patterns store, then
 * prints a context block that Claude can use to improve its responses.
 *
 * Output is printed to stdout and will be prepended to the prompt context.
 */

const fs = require('fs');
const path = require('path');

const PERF_LOG_PATH = path.join(process.cwd(), '.claude', 'performance-log.json');
const PATTERNS_PATH = path.join(process.cwd(), '.claude', 'successful-patterns.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

const perfLog = readJSON(PERF_LOG_PATH) || [];
const patterns = readJSON(PATTERNS_PATH) || {};

// Build a quick stats summary per tool
const toolStats = {};
for (const entry of perfLog) {
  if (!toolStats[entry.tool]) {
    toolStats[entry.tool] = { total: 0, success: 0 };
  }
  toolStats[entry.tool].total += 1;
  if (entry.success) toolStats[entry.tool].success += 1;
}

const lowPerformers = Object.entries(toolStats)
  .filter(([, s]) => s.total >= 5 && s.success / s.total < 0.8)
  .map(([tool, s]) => `${tool} (${((s.success / s.total) * 100).toFixed(0)}% success)`);

// Only emit output when there is something meaningful to share
const lines = [];

if (lowPerformers.length > 0) {
  lines.push('<!-- [genspark-superior knowledge] -->');
  lines.push(`The following tools have had low success rates recently: ${lowPerformers.join(', ')}.`);
  lines.push('Be extra careful when using these tools and prefer alternatives where possible.');
}

const patternKeys = Object.keys(patterns);
if (patternKeys.length > 0) {
  if (lines.length === 0) lines.push('<!-- [genspark-superior knowledge] -->');
  lines.push('Successful patterns from previous runs:');
  for (const key of patternKeys.slice(-5)) {
    lines.push(`- ${key}: ${patterns[key]}`);
  }
}

if (lines.length > 0) {
  console.log(lines.join('\n'));
}
