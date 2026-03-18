const { chromium } = require('playwright');
const fs = require('fs');
// Cache for successful selectors
const selectorCache = new Map();
// Smart retry click function
async function smartClick(page, selector, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 3000 });
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.locator(selector).click();
      console.log(`Clicked ${selector} successfully`);
      return true;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed for ${selector}`);
      if (attempt === maxRetries) return false;
      await page.waitForTimeout(1000);
    }
  }
}
// Type safely
async function smartType(page, selector, text) {
  await page.waitForSelector(selector, { state: 'visible' });
  await page.locator(selector).fill(text);
  console.log(`Typed into ${selector}: ${text}`);
}
// Extract data safely
async function smartExtract(page, selector) {
  try {
    await page.waitForSelector(selector, { state: 'visible' });
    const text = await page.locator(selector).innerText();
    console.log(`Extracted from ${selector}: ${text}`);
    return text;
  } catch {
    console.warn(`Failed to extract ${selector}`);
    return null;
  }
}
// DOM + Visual snapshot for feedback
async function captureState(page, name = 'snapshot') {
  const screenshotPath = `snapshots/${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Captured screenshot: ${screenshotPath}`);
}
// Main automation function
async function runAgent() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  // Example: Navigate and log in
  await page.goto('https://example.com');
  // Try cached selector first
  let loginSelector = selectorCache.get(page.url()) || '[data-testid="login-button"]';
  const success = await smartClick(page, loginSelector);
  if (!success) {
    // Retry with alternative selectors
    const alternatives = ['text=Login', '#loginButton'];
    for (let sel of alternatives) {
      if (await smartClick(page, sel)) {
        selectorCache.set(page.url(), sel);
        break;
      }
    }
  }
  await smartType(page, '#username', 'myuser');
  await smartType(page, '#password', 'mypassword');
  await smartClick(page, '#submit-login');
  // Extract a piece of data
  const welcomeText = await smartExtract(page, '.welcome-message');
  console.log('Welcome Text:', welcomeText);
  // Capture visual feedback
  await captureState(page, 'post_login');
  await browser.close();
}
// Ensure snapshot folder exists
if (!fs.existsSync('snapshots')) fs.mkdirSync('snapshots');
// Run the agent
runAgent();
