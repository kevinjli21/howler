const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');
const SHOT_DIR = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'screenshots');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_PATH,
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('https://howler-teal.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForSelector('.feed-sticky-header', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // open the first post's comments modal (read-only: GET /api/comments)
  const commentIcon = page.locator('.interaction-item').filter({ hasText: '💬' }).first();
  await commentIcon.tap();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-comments-modal.png') });

  // check the modal is dismissible via Escape (ReportModal/CommentsModal both listen for it)
  const modalVisibleBefore = await page.locator('.modal-overlay, [class*="modal"]').count();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const modalVisibleAfter = await page.locator('.modal-overlay, [class*="modal"]').count();

  console.log(JSON.stringify({ modalVisibleBefore, modalVisibleAfter, escapeClosedModal: modalVisibleAfter < modalVisibleBefore }, null, 2));

  await browser.close();
})();
