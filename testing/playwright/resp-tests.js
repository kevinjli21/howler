const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');
const SHOT_DIR = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'screenshots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile-375x667', width: 375, height: 667, isMobile: true, hasTouch: true },
  { name: 'tablet-768x1024', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'desktop-1920x1080', width: 1920, height: 1080, isMobile: false, hasTouch: false },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      storageState: STATE_PATH,
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

    await page.goto('https://howler-teal.vercel.app', { waitUntil: 'networkidle' });
    await page.waitForSelector('.feed-sticky-header', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000); // let feed posts render

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));

    // check tap target sizes for key interactive elements
    const targetSizes = await page.evaluate(() => {
      const sel = ['.interaction-item', '.like-count', '.category-badge', 'button'];
      const out = [];
      document.querySelectorAll(sel.join(',')).forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          out.push({ tag: el.tagName, cls: el.className.toString().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
        }
      });
      return out.slice(0, 15);
    });

    const shotPath = path.join(SHOT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    results.push({
      viewport: vp.name,
      hasHorizontalOverflow: overflow.scrollWidth > overflow.clientWidth + 2,
      overflow,
      smallTapTargets: targetSizes.filter(t => t.w < 24 || t.h < 24),
      totalInteractiveFound: targetSizes.length,
      consoleErrors: consoleErrors.slice(0, 10),
      screenshot: shotPath,
    });

    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
