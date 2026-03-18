/**
 * Retry Strategy Engine
 *
 * Advanced retry patterns: exponential backoff, circuit breaker,
 * jitter, conditional retry, fallback chains, and bulkhead isolation.
 */

const EventEmitter = require('events');

class RetryStrategy extends EventEmitter {
  constructor(options = {}) {
    super();
    this.circuits = new Map();       // name -> circuit breaker state
    this.bulkheads = new Map();      // name -> concurrency semaphore
    this.stats = { attempts: 0, successes: 0, failures: 0, circuitBreaks: 0 };
  }

  /**
   * Execute with exponential backoff
   */
  async withExponentialBackoff(fn, options = {}) {
    const {
      maxRetries = 5,
      baseDelay = 1000,
      maxDelay = 30000,
      factor = 2,
      jitter = true,
      retryOn = null,     // function(error) -> boolean, decides if we should retry
      onRetry = null,     // callback(attempt, error, delay)
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.stats.attempts++;
        const result = await fn(attempt);
        this.stats.successes++;
        return result;
      } catch (err) {
        lastError = err;

        // Check if we should retry this error
        if (retryOn && !retryOn(err)) {
          throw err;
        }

        if (attempt === maxRetries) break;

        // Calculate delay with exponential backoff
        let delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);

        // Add jitter to prevent thundering herd
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }

        if (onRetry) onRetry(attempt, err, delay);
        this.emit('retry', { attempt, error: err.message, delay, maxRetries });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.stats.failures++;
    throw lastError;
  }

  /**
   * Execute with linear backoff
   */
  async withLinearBackoff(fn, options = {}) {
    const { maxRetries = 5, delay = 1000, increment = 1000 } = options;
    return this.withExponentialBackoff(fn, {
      ...options,
      maxRetries,
      baseDelay: delay,
      factor: 1,
      maxDelay: delay + increment * maxRetries,
    });
  }

  /**
   * Circuit Breaker pattern
   *
   * States: CLOSED (normal) -> OPEN (failing, reject fast) -> HALF_OPEN (testing)
   */
  createCircuitBreaker(name, options = {}) {
    const {
      failureThreshold = 5,     // failures before opening
      resetTimeout = 30000,      // ms before trying again (half-open)
      successThreshold = 2,      // successes in half-open before closing
      monitorInterval = 60000,   // stats reset interval
    } = options;

    this.circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailure: null,
      failureThreshold,
      resetTimeout,
      successThreshold,
      lastStateChange: Date.now(),
      totalRequests: 0,
      totalFailures: 0,
    });

    return name;
  }

  async executeWithCircuit(name, fn) {
    let circuit = this.circuits.get(name);
    if (!circuit) {
      this.createCircuitBreaker(name);
      circuit = this.circuits.get(name);
    }

    circuit.totalRequests++;

    // Check state
    if (circuit.state === 'OPEN') {
      // Check if we should transition to HALF_OPEN
      if (Date.now() - circuit.lastFailure >= circuit.resetTimeout) {
        circuit.state = 'HALF_OPEN';
        circuit.successes = 0;
        this.emit('circuit:half-open', { name });
      } else {
        this.stats.circuitBreaks++;
        this.emit('circuit:rejected', { name });
        throw new Error(`Circuit "${name}" is OPEN — request rejected`);
      }
    }

    try {
      const result = await fn();

      if (circuit.state === 'HALF_OPEN') {
        circuit.successes++;
        if (circuit.successes >= circuit.successThreshold) {
          circuit.state = 'CLOSED';
          circuit.failures = 0;
          circuit.lastStateChange = Date.now();
          this.emit('circuit:closed', { name });
        }
      } else {
        circuit.failures = Math.max(0, circuit.failures - 1); // Gradual recovery
      }

      return result;

    } catch (err) {
      circuit.failures++;
      circuit.totalFailures++;
      circuit.lastFailure = Date.now();

      if (circuit.state === 'HALF_OPEN' || circuit.failures >= circuit.failureThreshold) {
        circuit.state = 'OPEN';
        circuit.lastStateChange = Date.now();
        this.emit('circuit:open', { name, failures: circuit.failures });
      }

      throw err;
    }
  }

  /**
   * Fallback chain — try multiple strategies in order
   */
  async withFallback(strategies) {
    const errors = [];

    for (const { name, fn, options } of strategies) {
      try {
        const result = await this.withExponentialBackoff(fn, {
          maxRetries: 1,
          ...options,
        });
        this.emit('fallback:success', { strategy: name });
        return result;
      } catch (err) {
        errors.push({ strategy: name, error: err.message });
        this.emit('fallback:failed', { strategy: name, error: err.message });
      }
    }

    throw new Error(`All fallback strategies failed: ${errors.map(e => `${e.strategy}: ${e.error}`).join('; ')}`);
  }

  /**
   * Bulkhead pattern — limit concurrent executions
   */
  createBulkhead(name, maxConcurrent = 5) {
    this.bulkheads.set(name, {
      max: maxConcurrent,
      active: 0,
      queue: [],
    });
    return name;
  }

  async executeWithBulkhead(name, fn) {
    let bulkhead = this.bulkheads.get(name);
    if (!bulkhead) {
      this.createBulkhead(name);
      bulkhead = this.bulkheads.get(name);
    }

    // Wait for a slot
    if (bulkhead.active >= bulkhead.max) {
      await new Promise(resolve => bulkhead.queue.push(resolve));
    }

    bulkhead.active++;
    try {
      return await fn();
    } finally {
      bulkhead.active--;
      if (bulkhead.queue.length > 0) {
        const next = bulkhead.queue.shift();
        next();
      }
    }
  }

  /**
   * Timeout wrapper
   */
  async withTimeout(fn, timeoutMs = 30000) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Combine retry + circuit breaker + bulkhead + timeout
   */
  async executeResilient(name, fn, options = {}) {
    const { timeout = 30000, retries = 3, bulkhead = 5 } = options;

    return this.executeWithBulkhead(name, () =>
      this.executeWithCircuit(name, () =>
        this.withTimeout(() =>
          this.withExponentialBackoff(fn, { maxRetries: retries }),
          timeout
        )
      )
    );
  }

  getCircuitState(name) {
    return this.circuits.get(name) || null;
  }

  getStats() {
    const circuits = {};
    for (const [name, circuit] of this.circuits) {
      circuits[name] = {
        state: circuit.state,
        failures: circuit.failures,
        totalRequests: circuit.totalRequests,
        totalFailures: circuit.totalFailures,
      };
    }

    return {
      ...this.stats,
      circuits,
      bulkheads: Object.fromEntries(
        Array.from(this.bulkheads.entries()).map(([k, v]) => [k, { active: v.active, queued: v.queue.length, max: v.max }])
      ),
    };
  }
}

module.exports = RetryStrategy;
