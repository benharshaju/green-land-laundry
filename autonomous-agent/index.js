/**
 * ============================================================
 *  AUTONOMOUS AGENT v2.0 - Entry Point & Usage Examples
 * ============================================================
 *
 *  Usage:
 *    node autonomous-agent/index.js                     # Run full demo
 *    node autonomous-agent/index.js --task <file.json>  # Run task file
 *    node autonomous-agent/index.js --scrape            # Data scraping demo
 *    node autonomous-agent/index.js --perf              # Performance profiling
 *    node autonomous-agent/index.js --parallel          # Parallel execution
 *    node autonomous-agent/index.js --multi-tab         # Multi-tab demo
 *    node autonomous-agent/index.js --resilient         # Resilience patterns demo
 *
 * ============================================================
 */

const AutonomousAgent = require('./autonomous-agent');
const path = require('path');

// ────────────────────────────────────────────────────────────
//  EXAMPLE 1: Full Featured Agent
// ────────────────────────────────────────────────────────────
async function fullDemo() {
  const agent = new AutonomousAgent({
    headless: false,
    stealth: true,
    humanMode: true,
    humanSpeed: 'normal',
    screenshotOnError: true,
    captchaDetection: true,
    maxRetries: 3,
    network: {
      blockedPatterns: [
        'google-analytics.com',
        'facebook.com/tr',
        'doubleclick.net',
      ],
    },
  });

  // ── Setup webhooks ──────────────────────────────────
  // agent.webhookNotifier.register('slack', {
  //   url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  //   format: 'slack',
  //   events: ['task:complete', 'captcha:detected', 'action:failed'],
  // });

  // ── Setup proxies ──────────────────────────────────
  // agent.proxyRotator.addProxies([
  //   { server: 'http://proxy1:8080', country: 'US' },
  //   { server: 'http://proxy2:8080', country: 'UK' },
  // ]);

  // ── Event listeners ────────────────────────────────
  agent.on('step:start', ({ action }) => console.log(`  → ${action}`));
  agent.on('step:failed', ({ step, error }) => console.error(`  ✗ ${step.action}: ${error}`));
  agent.on('captcha:detected', ({ best }) => console.warn(`  ⚠ CAPTCHA: ${best.name}`));
  agent.on('circuit:open', ({ name }) => console.warn(`  ⚡ Circuit open: ${name}`));
  agent.on('task:complete', ({ name, duration }) => {
    console.log(`\n  Task "${name}" done in ${duration}ms`);
  });

  try {
    const page = await agent.start();

    // Start recording
    agent.startRecording();

    // Watch DOM for changes
    const observerId = await agent.watchDOM(page);

    // Navigate
    await page.goto('https://example.com');
    await agent.captureState(page, 'homepage');

    // Smart action with self-healing + retry
    await agent.smartAction(page, 'click', 'a', 'main-link');

    // Performance profile
    const perf = await agent.profilePage(page, 'homepage');
    console.log(`\n  Performance: FCP=${perf.scores.fcp?.value}ms, LCP=${perf.scores.lcp?.value}ms`);

    // Visual regression
    await agent.visualRegression.compare(page, 'homepage');

    // Get DOM mutations
    const mutations = await agent.domObserver.getMutations(page, observerId);
    console.log(`  DOM mutations: ${mutations.length}`);

    // Save session
    await agent.saveSession('default', 'demo-session');

    // Export recording
    agent.stopRecording();
    agent.exportRecording(path.join(__dirname, 'tasks', 'recorded-task.json'));

    // Full system status
    const status = agent.getSystemStatus();
    console.log('\n  System Status:', JSON.stringify({
      actions: status.actions,
      errors: status.errors,
      network: status.network.totalRequests,
    }));

    // Generate HTML report
    const reportPath = await agent.generateReport('Full Demo Run');
    console.log(`\n  Report: ${reportPath}`);

    await agent.stop();
  } catch (err) {
    console.error('Agent error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 2: Data Scraping Pipeline
// ────────────────────────────────────────────────────────────
async function scrapingDemo() {
  const agent = new AutonomousAgent({
    headless: true,
    stealth: true,
    humanMode: false,
  });

  try {
    const page = await agent.start();

    // Create collection with schema validation
    agent.dataPipeline.createCollection('products', {
      name: { type: 'string', required: true },
      price: { type: 'string', required: true },
    });

    // Add transforms: clean price, add timestamp
    agent.dataPipeline.addTransform('products', (record) => {
      if (record.price) {
        record.priceNumeric = parseFloat(record.price.replace(/[^0-9.]/g, ''));
      }
      record.scrapedAt = new Date().toISOString();
      return record;
    });

    await page.goto('https://example.com');

    // Scrape with pagination
    const result = await agent.scrapePaginated(page, {
      collection: 'products',
      itemSelector: '.product-card',
      fields: {
        name: '.product-name',
        price: '.product-price',
        url: '@href',
      },
      nextButtonSelector: '.pagination .next',
      maxPages: 5,
    });

    console.log(`Scraped ${result.totalRecords} products`);

    // Aggregate
    const avgPrice = agent.dataPipeline.aggregate('products', 'priceNumeric', 'avg');
    console.log(`Average price: $${avgPrice.toFixed(2)}`);

    // Export
    agent.dataPipeline.exportJSON('products');
    agent.dataPipeline.exportCSV('products');
    agent.dataPipeline.exportNDJSON('products');

    await agent.generateReport('Scraping Run');
    await agent.stop();
  } catch (err) {
    console.error('Error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 3: Performance Profiling
// ────────────────────────────────────────────────────────────
async function perfDemo() {
  const agent = new AutonomousAgent({ headless: true });

  try {
    const page = await agent.start();

    const urls = ['https://example.com', 'https://example.org'];
    for (const url of urls) {
      await page.goto(url);
      const profile = await agent.profilePage(page, new URL(url).hostname);

      console.log(`\n${url}:`);
      console.log(`  TTFB:  ${profile.scores.ttfb?.value}ms [${profile.scores.ttfb?.rating}]`);
      console.log(`  FCP:   ${profile.scores.fcp?.value}ms [${profile.scores.fcp?.rating}]`);
      console.log(`  LCP:   ${profile.scores.lcp?.value}ms [${profile.scores.lcp?.rating}]`);
      console.log(`  CLS:   ${profile.cls?.toFixed(3)} [${profile.scores.cls?.rating}]`);
      console.log(`  Size:  ${profile.scores.totalSize?.formatted}`);
      console.log(`  DOM:   ${profile.timing.domNodes} nodes, depth ${profile.timing.domDepth}`);
    }

    await agent.generateReport('Performance Audit');
    await agent.stop();
  } catch (err) {
    console.error('Error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 4: Multi-Tab Coordination
// ────────────────────────────────────────────────────────────
async function multiTabDemo() {
  const agent = new AutonomousAgent({ headless: false, stealth: true });

  try {
    await agent.start();

    // Open multiple tabs
    const tab1 = await agent.openTab('search', 'https://example.com');
    const tab2 = await agent.openTab('results', 'https://example.org');

    // Coordinate work between tabs
    await agent.coordinateTabs([
      {
        name: 'extract-data',
        tab: 'search',
        action: async (page, state) => {
          const title = await page.title();
          return title;
        },
        shareAs: 'searchTitle',
      },
      {
        name: 'use-data',
        tab: 'results',
        waitFor: 'searchTitle',
        action: async (page, state) => {
          console.log(`  Got title from search tab: ${state.searchTitle}`);
          return true;
        },
      },
    ]);

    // Run action on all tabs
    const allTitles = await agent.multiTab.runOnAll(async (page, name) => {
      return page.title();
    });
    console.log('\n  All tab titles:', Object.fromEntries(allTitles));

    // Tab status
    console.log('\n  Tab status:', agent.multiTab.getStatus());

    await agent.generateReport('Multi-Tab Run');
    await agent.stop();
  } catch (err) {
    console.error('Error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 5: Resilience Patterns
// ────────────────────────────────────────────────────────────
async function resilienceDemo() {
  const agent = new AutonomousAgent({ headless: true });

  // Circuit breaker
  agent.retryStrategy.createCircuitBreaker('api-calls', {
    failureThreshold: 3,
    resetTimeout: 10000,
    successThreshold: 2,
  });

  // Bulkhead (limit concurrency)
  agent.retryStrategy.createBulkhead('scraper', 3);

  try {
    const page = await agent.start();

    // Resilient navigation (retry + circuit breaker + bulkhead + timeout)
    await agent.resilientExecute('api-calls', async () => {
      await page.goto('https://example.com');
      return page.title();
    }, { timeout: 15000, retries: 3, bulkhead: 5 });

    // Fallback chain
    const result = await agent.withFallbacks([
      {
        name: 'primary-selector',
        fn: async () => page.$eval('.main-content h1', el => el.textContent),
      },
      {
        name: 'fallback-selector',
        fn: async () => page.$eval('h1', el => el.textContent),
      },
      {
        name: 'title-fallback',
        fn: async () => page.title(),
      },
    ]);
    console.log(`Result: ${result}`);

    // Check circuit breaker state
    console.log('Circuit state:', agent.retryStrategy.getCircuitState('api-calls'));
    console.log('Retry stats:', agent.retryStrategy.getStats());

    await agent.stop();
  } catch (err) {
    console.error('Error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 6: Config-Driven Task
// ────────────────────────────────────────────────────────────
async function taskDemo() {
  const agent = new AutonomousAgent({
    headless: true,
    stealth: true,
    maxRetries: 3,
  });

  try {
    await agent.start();
    const result = await agent.runTaskFile(path.join(__dirname, 'tasks', 'example-login.json'));

    console.log('\nTask Result:', {
      success: result.success,
      duration: result.duration,
      stepsExecuted: result.log.length,
      variables: result.variables,
    });

    await agent.generateReport('Config-Driven Task');
    await agent.stop();
  } catch (err) {
    console.error('Error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 7: Parallel Execution
// ────────────────────────────────────────────────────────────
async function parallelDemo() {
  const agent = new AutonomousAgent({ headless: true, maxConcurrent: 5 });

  const tasks = [
    { name: 'Site A', steps: [{ action: 'navigate', url: 'https://example.com' }, { action: 'screenshot', name: 'a' }, { action: 'extract', selector: 'h1', variable: 'title' }] },
    { name: 'Site B', steps: [{ action: 'navigate', url: 'https://example.org' }, { action: 'screenshot', name: 'b' }, { action: 'extract', selector: 'h1', variable: 'title' }] },
  ];

  const results = await agent.runParallel(tasks, { maxConcurrent: 3 });
  console.log('Parallel results:', results);

  await agent.generateReport('Parallel Execution');
}

// ────────────────────────────────────────────────────────────
//  CLI
// ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--task')) {
    await taskDemo();
  } else if (args.includes('--scrape')) {
    await scrapingDemo();
  } else if (args.includes('--perf')) {
    await perfDemo();
  } else if (args.includes('--parallel')) {
    await parallelDemo();
  } else if (args.includes('--multi-tab')) {
    await multiTabDemo();
  } else if (args.includes('--resilient')) {
    await resilienceDemo();
  } else {
    await fullDemo();
  }
}

main().catch(console.error);
