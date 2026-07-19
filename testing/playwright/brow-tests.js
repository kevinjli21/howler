const { chromium, firefox, webkit } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');
const SHOT_DIR = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'screenshots');

const ENGINES = [
  { name: 'chromium', launcher: chromium },
  { name: 'firefox', launcher: firefox },
  { name: 'webkit', launcher: webkit },
];

(async () => {
  const results = [];
  for (const eng of ENGINES) {
    const browser = await eng.launcher.launch();
    const context = await browser.newContext({ storageState: STATE_PATH, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

    let loadError = null;
    try {
      await page.goto('https://howler-teal.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('.feed-sticky-header', { timeout: 15000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      loadError = e.message;
    }

    const postCount = await page.locator('.post-card').count().catch(() => -1);
    await page.screenshot({ path: path.join(SHOT_DIR, `brow-${eng.name}.png`) }).catch(() => {});

    results.push({
      engine: eng.name,
      loadError,
      postsRendered: postCount,
      consoleErrors: consoleErrors.slice(0, 10),
    });

    await browser.close();
  }
  console.log(JSON.stringify(results, null, 2));
})();
