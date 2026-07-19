const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const path = require('path');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: STATE_PATH, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://howler-teal.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForSelector('.feed-sticky-header', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // A11Y-01: keyboard-only nav check - can we tab to and activate the like button?
  const focusableCount = await page.evaluate(() => {
    const els = document.querySelectorAll('a, button, input, [tabindex]');
    return els.length;
  });
  const likeIsFocusable = await page.evaluate(() => {
    // .interaction-item like/comment/report/delete are plain divs with onClick, no tabindex/role/button
    const el = document.querySelector('.interaction-item');
    if (!el) return null;
    return { tag: el.tagName, tabindex: el.getAttribute('tabindex'), role: el.getAttribute('role') };
  });

  const homeResults = await new AxeBuilder({ page }).analyze();

  // Open comments modal for a second axe pass (dialog-specific issues)
  const commentIcon = page.locator('.interaction-item').filter({ hasText: '💬' }).first();
  await commentIcon.click();
  await page.waitForTimeout(1000);
  const modalResults = await new AxeBuilder({ page }).analyze();
  const modalRole = await page.evaluate(() => {
    const el = document.querySelector('.expanded-modal-overlay, .expanded-modal-container');
    return el ? { role: el.getAttribute('role'), ariaModal: el.getAttribute('aria-modal') } : null;
  });

  const summarize = (r) => r.violations.map(v => ({
    id: v.id, impact: v.impact, help: v.help, nodeCount: v.nodes.length,
    sampleTarget: v.nodes[0]?.target,
  }));

  console.log(JSON.stringify({
    focusableCount,
    likeButtonAccessibility: likeIsFocusable,
    homeViolations: summarize(homeResults),
    modalRole,
    modalViolations: summarize(modalResults),
  }, null, 2));

  await browser.close();
})();
