'use strict';

/**
 * Genspark-Superior Skill — Error Handler
 *
 * Catches errors from subagent executions, logs them, attempts
 * recovery with a fallback model, and suggests prompt improvements.
 */

const fs = require('fs');
const path = require('path');

const ERROR_LOG_PATH = path.join(process.cwd(), '.claude', 'error-log.json');

class SkillErrorHandler {
  /**
   * @param {Error} error
   * @param {{ agent: string, model: string, maxTurns: number, task: string }} context
   */
  async handle(error, context) {
    console.error(`[genspark-superior] Error in agent "${context.agent}": ${error.message}`);

    await this.logError(error, context);

    if (error.isRecoverable !== false) {
      return await this.retryWithFallback(context, error);
    }

    return this.suggestFix(error, context);
  }

  async logError(error, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      agent: context.agent,
      model: context.model,
      task: context.task,
      message: error.message,
      stack: error.stack,
    };

    const logs = fs.existsSync(ERROR_LOG_PATH)
      ? JSON.parse(fs.readFileSync(ERROR_LOG_PATH, 'utf8'))
      : [];

    logs.push(entry);
    fs.mkdirSync(path.dirname(ERROR_LOG_PATH), { recursive: true });
    fs.writeFileSync(ERROR_LOG_PATH, JSON.stringify(logs, null, 2));
  }

  async retryWithFallback(context, originalError) {
    const fallbackChain = ['claude-opus', 'claude-sonnet', 'claude-haiku'];
    const currentIndex = fallbackChain.indexOf(context.model);
    const fallbackModel = fallbackChain[currentIndex + 1] || 'claude-haiku';

    console.log(
      `[genspark-superior] Retrying agent "${context.agent}" with fallback model "${fallbackModel}"`
    );

    const fallbackContext = {
      ...context,
      model: fallbackModel,
      maxTurns: Math.min(context.maxTurns || 10, 5),
      _retryOf: originalError.message,
    };

    // Return updated context for the caller to re-execute
    return { retry: true, context: fallbackContext };
  }

  suggestFix(error, context) {
    const suggestions = [];

    if (/rate.?limit/i.test(error.message)) {
      suggestions.push('Add exponential backoff between API calls.');
      suggestions.push('Switch to a lower-tier model to reduce quota usage.');
    } else if (/token.?limit|context.?length/i.test(error.message)) {
      suggestions.push('Break the task into smaller subtasks.');
      suggestions.push('Use a model with a larger context window (e.g. claude-opus-200k).');
    } else if (/timeout/i.test(error.message)) {
      suggestions.push('Reduce maxTurns for this agent.');
      suggestions.push('Split the work across multiple parallel subagents.');
    } else {
      suggestions.push('Review the agent prompt for ambiguous instructions.');
      suggestions.push('Add more concrete examples to the agent definition.');
    }

    console.warn(`[genspark-superior] Suggested fixes for agent "${context.agent}":`);
    suggestions.forEach((s, i) => console.warn(`  ${i + 1}. ${s}`));

    return { retry: false, suggestions };
  }
}

module.exports = SkillErrorHandler;
