/**
 * Config-Driven Task Engine
 *
 * Execute automation flows defined in JSON/YAML configs.
 * Supports conditionals, loops, variables, parallel steps, and error recovery.
 */

const EventEmitter = require('events');

class TaskEngine extends EventEmitter {
  constructor(agent) {
    super();
    this.agent = agent;
    this.variables = {};
    this.stepResults = new Map();
    this.executionLog = [];
    this.running = false;
    this.aborted = false;
  }

  /**
   * Execute a task definition
   *
   * Task format:
   * {
   *   name: "Task name",
   *   variables: { key: "value" },
   *   steps: [
   *     { action: "navigate", url: "{{baseUrl}}/login" },
   *     { action: "click", selector: "#login", label: "login-button" },
   *     { action: "type", selector: "#user", text: "{{username}}" },
   *     { action: "screenshot", name: "step1" },
   *     { action: "extract", selector: ".msg", variable: "message" },
   *     { action: "wait", duration: 1000 },
   *     { action: "assert", condition: "{{message}}", contains: "Welcome" },
   *     { action: "if", condition: "{{loggedIn}}", then: [...], else: [...] },
   *     { action: "loop", items: "{{urls}}", as: "url", steps: [...] },
   *     { action: "parallel", steps: [...] },
   *     { action: "script", code: "return document.title;" },
   *   ],
   *   onError: "continue" | "stop" | "retry",
   *   maxRetries: 3,
   * }
   */
  async execute(task, page) {
    this.running = true;
    this.aborted = false;
    this.variables = { ...task.variables };
    this.executionLog = [];

    this.emit('task:start', { name: task.name, timestamp: Date.now() });
    const startTime = Date.now();

    try {
      await this._executeSteps(task.steps, page, task.onError || 'stop', task.maxRetries || 1);
    } catch (err) {
      this.emit('task:error', { name: task.name, error: err.message });
    }

    this.running = false;
    const duration = Date.now() - startTime;
    this.emit('task:complete', {
      name: task.name,
      duration,
      steps: this.executionLog.length,
      variables: { ...this.variables },
    });

    return {
      success: !this.aborted,
      duration,
      variables: { ...this.variables },
      log: this.executionLog,
    };
  }

  async _executeSteps(steps, page, errorMode, maxRetries) {
    for (const step of steps) {
      if (this.aborted) break;

      let success = false;
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await this._executeStep(step, page);
          success = true;
          break;
        } catch (err) {
          lastError = err;
          this._logStep(step, 'RETRY', err.message, attempt);
          if (attempt < maxRetries) {
            await page.waitForTimeout(1000 * attempt);
          }
        }
      }

      if (!success) {
        this._logStep(step, 'FAILED', lastError.message);
        this.emit('step:failed', { step, error: lastError.message });

        if (errorMode === 'stop') {
          this.aborted = true;
          throw lastError;
        }
        // 'continue' mode: keep going
      }
    }
  }

  async _executeStep(step, page) {
    const resolvedStep = this._resolveVariables(step);
    const startTime = Date.now();

    this.emit('step:start', { action: resolvedStep.action, step: resolvedStep });

    switch (resolvedStep.action) {
      case 'navigate':
        await page.goto(resolvedStep.url, {
          waitUntil: resolvedStep.waitUntil || 'domcontentloaded',
          timeout: resolvedStep.timeout || 30000,
        });
        break;

      case 'click':
        await this.agent.smartAction(page, 'click', resolvedStep.selector, resolvedStep.label);
        break;

      case 'type':
        await this.agent.smartAction(page, 'type', resolvedStep.selector, resolvedStep.label, resolvedStep.text);
        break;

      case 'select':
        await page.selectOption(resolvedStep.selector, resolvedStep.value);
        break;

      case 'check':
        await page.check(resolvedStep.selector);
        break;

      case 'uncheck':
        await page.uncheck(resolvedStep.selector);
        break;

      case 'hover':
        await page.hover(resolvedStep.selector);
        break;

      case 'screenshot':
        await this.agent.captureState(page, resolvedStep.name || `step_${Date.now()}`);
        break;

      case 'extract': {
        const text = await this.agent.smartAction(page, 'extract', resolvedStep.selector, resolvedStep.label);
        if (resolvedStep.variable) {
          this.variables[resolvedStep.variable] = text;
        }
        break;
      }

      case 'extractAll': {
        const elements = await page.locator(resolvedStep.selector).allInnerTexts();
        if (resolvedStep.variable) {
          this.variables[resolvedStep.variable] = elements;
        }
        break;
      }

      case 'extractAttribute': {
        const value = await page.getAttribute(resolvedStep.selector, resolvedStep.attribute);
        if (resolvedStep.variable) {
          this.variables[resolvedStep.variable] = value;
        }
        break;
      }

      case 'wait':
        await page.waitForTimeout(resolvedStep.duration || 1000);
        break;

      case 'waitForSelector':
        await page.waitForSelector(resolvedStep.selector, {
          state: resolvedStep.state || 'visible',
          timeout: resolvedStep.timeout || 10000,
        });
        break;

      case 'waitForNavigation':
        await page.waitForLoadState(resolvedStep.state || 'domcontentloaded');
        break;

      case 'waitForNetwork':
        await this.agent.networkInterceptor.waitForRequest(page, resolvedStep.pattern, resolvedStep.timeout);
        break;

      case 'assert': {
        const value = String(this.variables[resolvedStep.variable] || resolvedStep.condition || '');
        if (resolvedStep.equals !== undefined && value !== String(resolvedStep.equals)) {
          throw new Error(`Assertion failed: "${value}" !== "${resolvedStep.equals}"`);
        }
        if (resolvedStep.contains && !value.includes(resolvedStep.contains)) {
          throw new Error(`Assertion failed: "${value}" does not contain "${resolvedStep.contains}"`);
        }
        if (resolvedStep.matches && !new RegExp(resolvedStep.matches).test(value)) {
          throw new Error(`Assertion failed: "${value}" does not match /${resolvedStep.matches}/`);
        }
        if (resolvedStep.truthy && !value) {
          throw new Error(`Assertion failed: value is falsy`);
        }
        break;
      }

      case 'script': {
        const result = await page.evaluate(resolvedStep.code);
        if (resolvedStep.variable) {
          this.variables[resolvedStep.variable] = result;
        }
        break;
      }

      case 'if': {
        const condition = this._evaluateCondition(resolvedStep.condition);
        const branch = condition ? resolvedStep.then : resolvedStep.else;
        if (branch) {
          await this._executeSteps(branch, page, 'continue', 1);
        }
        break;
      }

      case 'loop': {
        const items = typeof resolvedStep.items === 'string'
          ? this.variables[resolvedStep.items] || []
          : resolvedStep.items || [];

        for (let i = 0; i < items.length; i++) {
          if (this.aborted) break;
          this.variables[resolvedStep.as || 'item'] = items[i];
          this.variables[`${resolvedStep.as || 'item'}_index`] = i;
          await this._executeSteps(resolvedStep.steps, page, 'continue', 1);
        }
        break;
      }

      case 'repeat': {
        const count = resolvedStep.count || 1;
        for (let i = 0; i < count; i++) {
          if (this.aborted) break;
          this.variables['_iteration'] = i;
          await this._executeSteps(resolvedStep.steps, page, 'continue', 1);
        }
        break;
      }

      case 'parallel': {
        const promises = resolvedStep.steps.map(s => this._executeStep(s, page));
        await Promise.allSettled(promises);
        break;
      }

      case 'keyboard':
        await page.keyboard.press(resolvedStep.key);
        break;

      case 'scroll':
        await page.evaluate(({ x, y }) => window.scrollBy(x || 0, y || 0), {
          x: resolvedStep.x || 0,
          y: resolvedStep.y || 500,
        });
        break;

      case 'upload':
        await page.setInputFiles(resolvedStep.selector, resolvedStep.files);
        break;

      case 'download': {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.click(resolvedStep.selector),
        ]);
        const downloadPath = resolvedStep.path || `downloads/${download.suggestedFilename()}`;
        await download.saveAs(downloadPath);
        if (resolvedStep.variable) {
          this.variables[resolvedStep.variable] = downloadPath;
        }
        break;
      }

      case 'dialog': {
        page.once('dialog', async dialog => {
          if (resolvedStep.accept !== false) {
            await dialog.accept(resolvedStep.text || '');
          } else {
            await dialog.dismiss();
          }
        });
        break;
      }

      case 'setVariable':
        this.variables[resolvedStep.name] = resolvedStep.value;
        break;

      case 'log':
        console.log(`[TaskEngine] ${resolvedStep.message}`);
        break;

      default:
        throw new Error(`Unknown action: ${resolvedStep.action}`);
    }

    const duration = Date.now() - startTime;
    this._logStep(resolvedStep, 'OK', null, null, duration);
    this.emit('step:complete', { action: resolvedStep.action, duration });
  }

  _resolveVariables(obj) {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return this.variables[key] !== undefined ? this.variables[key] : `{{${key}}}`;
      });
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this._resolveVariables(item));
    }
    if (obj && typeof obj === 'object') {
      const resolved = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this._resolveVariables(value);
      }
      return resolved;
    }
    return obj;
  }

  _evaluateCondition(condition) {
    if (typeof condition === 'boolean') return condition;
    if (typeof condition === 'string') {
      const resolved = this._resolveVariables(condition);
      return resolved && resolved !== 'false' && resolved !== '0' && resolved !== 'null' && resolved !== 'undefined';
    }
    return !!condition;
  }

  _logStep(step, status, error = null, attempt = null, duration = null) {
    this.executionLog.push({
      action: step.action,
      selector: step.selector,
      label: step.label,
      status,
      error,
      attempt,
      duration,
      timestamp: Date.now(),
    });
  }

  abort() {
    this.aborted = true;
    this.emit('task:aborted');
  }
}

module.exports = TaskEngine;
