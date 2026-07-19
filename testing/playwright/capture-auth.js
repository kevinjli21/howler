const { chromium } = require('@playwright/test');
const path = require('path');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://howler-teal.vercel.app');

  console.log('Waiting for you to log in (up to 5 minutes)...');
  try {
    // NOTE: '.signed-in' is reused by the loading spinner too (page.js), so it
    // false-positives instantly. '.feed-sticky-header' only renders once truly logged in.
    await page.waitForSelector('.feed-sticky-header', { timeout: 5 * 60 * 1000 });
    console.log('Detected logged-in state.');
  } catch (e) {
    console.log('Timed out waiting for login. Re-run this script when ready.');
    await browser.close();
    process.exit(1);
  }

  await context.storageState({ path: STATE_PATH });
  console.log('Saved session state to', STATE_PATH);
  await browser.close();
})();
