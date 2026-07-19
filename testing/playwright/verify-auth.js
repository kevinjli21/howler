const { chromium } = require('@playwright/test');
const path = require('path');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_PATH });
  const page = await context.newPage();
  const resp = await page.request.get('https://howler-teal.vercel.app/api/auth');
  console.log('status:', resp.status());
  console.log('body:', await resp.text());
  await browser.close();
})();
