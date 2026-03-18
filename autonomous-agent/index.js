/**
 * ============================================================
 *  AUTONOMOUS AGENT - Entry Point & Usage Examples
 * ============================================================
 *
 *  Usage:
 *    node autonomous-agent/index.js                    # Run example
 *    node autonomous-agent/index.js --task tasks/login.json  # Run task file
 *    node autonomous-agent/index.js --record           # Record mode
 *
 * ============================================================
 */

const AutonomousAgent = require('./autonomous-agent');
const path = require('path');

// ────────────────────────────────────────────────────────────
//  EXAMPLE 1: Programmatic Usage
// ────────────────────────────────────────────────────────────
async function exampleProgrammatic() {
  const agent = new AutonomousAgent({
    headless: false,
    stealth: true,
    humanMode: true,
    humanSpeed: 'normal',
    screenshotOnError: true,
    maxRetries: 3,
    network: {
      blockedPatterns: [
        'google-analytics.com',
        'facebook.com/tr',
        'doubleclick.net',
        'adservice.google',
      ],
    },
  });

  // Listen to events
  agent.on('step:start', ({ action }) => console.log(`  → ${action}`));
  agent.on('step:failed', ({ step, error }) => console.error(`  ✗ ${step.action}: ${error}`));
  agent.on('task:complete', ({ name, duration }) => console.log(`\n  Task "${name}" completed in ${duration}ms`));

  try {
    // Start browser
    const page = await agent.start();

    // Start recording for replay later
    agent.startRecording();

    // Navigate
    await page.goto('https://example.com');
    await agent.captureState(page, 'homepage');

    // Smart actions with self-healing
    // These will remember element fingerprints and auto-recover if selectors break
    await agent.smartAction(page, 'click', 'a', 'main-link');

    // Visual regression check
    await agent.visualRegression.compare(page, 'homepage');

    // Save session for future runs
    await agent.saveSession('default', 'example-session');

    // Stop recording and export
    const recording = agent.stopRecording();
    agent.exportRecording(path.join(__dirname, 'tasks', 'recorded-task.json'));

    // Generate beautiful HTML report
    await agent.generateReport('Example Run');

    await agent.stop();
  } catch (err) {
    console.error('Agent error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 2: Config-Driven Task Execution
// ────────────────────────────────────────────────────────────
async function exampleConfigDriven() {
  const agent = new AutonomousAgent({
    headless: true,
    stealth: true,
    humanMode: false,
    maxRetries: 3,
  });

  try {
    await agent.start();

    // Run a task from a JSON config file
    const result = await agent.runTaskFile(
      path.join(__dirname, 'tasks', 'example-login.json')
    );

    console.log('\nTask Result:', {
      success: result.success,
      duration: result.duration,
      stepsExecuted: result.log.length,
      variables: result.variables,
    });

    await agent.generateReport('Config-Driven Login');
    await agent.stop();
  } catch (err) {
    console.error('Error:', err.message);
    await agent.stopAll();
  }
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 3: Parallel Execution
// ────────────────────────────────────────────────────────────
async function exampleParallel() {
  const agent = new AutonomousAgent({
    headless: true,
    maxConcurrent: 5,
  });

  // Run multiple tasks simultaneously
  const tasks = [
    {
      name: 'Check Site A',
      steps: [
        { action: 'navigate', url: 'https://example.com' },
        { action: 'screenshot', name: 'site_a' },
        { action: 'extract', selector: 'h1', variable: 'title' },
      ],
    },
    {
      name: 'Check Site B',
      steps: [
        { action: 'navigate', url: 'https://example.org' },
        { action: 'screenshot', name: 'site_b' },
        { action: 'extract', selector: 'h1', variable: 'title' },
      ],
    },
  ];

  const results = await agent.runParallel(tasks, { maxConcurrent: 3 });
  console.log('Parallel results:', results);

  await agent.generateReport('Parallel Execution');
}

// ────────────────────────────────────────────────────────────
//  EXAMPLE 4: Network Interception
// ────────────────────────────────────────────────────────────
async function exampleNetworkControl() {
  const agent = new AutonomousAgent({
    headless: true,
    stealth: true,
  });

  // Mock API responses
  agent.networkInterceptor.mock('/api/user', {
    status: 200,
    body: { name: 'Test User', role: 'admin' },
  });

  // Block tracking
  agent.networkInterceptor.block('analytics');
  agent.networkInterceptor.block(/tracking/);

  // Listen for specific API calls
  agent.networkInterceptor.on('/api/', (entry) => {
    console.log(`API call: ${entry.method} ${entry.url} → ${entry.status}`);
  });

  const page = await agent.start();
  await page.goto('https://example.com');

  // Get network analysis
  const analysis = agent.networkInterceptor.analyze();
  console.log('Network analysis:', analysis);

  // Export as HAR
  agent.networkInterceptor.exportHAR(
    path.join(__dirname, 'data', 'traffic.har')
  );

  await agent.stop();
}

// ────────────────────────────────────────────────────────────
//  CLI
// ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--task')) {
    const taskIdx = args.indexOf('--task');
    const taskFile = args[taskIdx + 1];
    if (!taskFile) {
      console.error('Usage: node index.js --task <task-file.json>');
      process.exit(1);
    }
    await exampleConfigDriven();
  } else if (args.includes('--parallel')) {
    await exampleParallel();
  } else if (args.includes('--network')) {
    await exampleNetworkControl();
  } else {
    await exampleProgrammatic();
  }
}

main().catch(console.error);
