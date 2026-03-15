'use strict';

/**
 * Genspark-Superior — Performance Tracker
 *
 * Called via post-tool-use hook:
 *   node scripts/track-performance.js <toolName> <exitCode> [filePath]
 *
 * Appends a log entry to .claude/performance-log.json and warns when
 * the success rate for a tool drops below 80% over its last 10+ runs.
 */

const fs = require('fs');
const path = require('path');

const toolName = process.argv[2] || 'unknown';
const exitCode = process.argv[3] || '0';
const filePath = process.argv[4] || '';

const LOG_PATH = path.join(process.cwd(), '.claude', 'performance-log.json');
const SUCCESS_THRESHOLD = 0.8;
const MIN_SAMPLE_SIZE = 10;

function readLog() {
  if (!fs.existsSync(LOG_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeLog(logs) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
}

function analyzeSuccessRate(logs, tool) {
  const toolLogs = logs.filter((l) => l.tool === tool);
  if (toolLogs.length < MIN_SAMPLE_SIZE) return;

  const successCount = toolLogs.filter((l) => l.success).length;
  const successRate = successCount / toolLogs.length;

  if (successRate < SUCCESS_THRESHOLD) {
    console.warn(
      `[genspark-superior] Low success rate (${(successRate * 100).toFixed(1)}%) ` +
        `for tool "${tool}" over last ${toolLogs.length} runs. ` +
        `Consider reviewing the prompts or inputs for this tool.`
    );
  }
}

const logs = readLog();

const entry = {
  timestamp: new Date().toISOString(),
  tool: toolName,
  success: exitCode === '0',
  exitCode: parseInt(exitCode, 10),
  file: filePath || null,
};

logs.push(entry);

// Keep only the last 1000 entries to avoid unbounded growth
const trimmed = logs.slice(-1000);
writeLog(trimmed);

analyzeSuccessRate(trimmed, toolName);
