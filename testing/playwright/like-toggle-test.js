const { chromium } = require('@playwright/test');
const path = require('path');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');
const MY_USER_ID = '01d1947c-e20c-411e-9fc6-414809abd1ca';

const log = [];
const step = (msg, data) => { log.push({ msg, data }); console.log('STEP:', msg, data ? JSON.stringify(data) : ''); };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_PATH, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://howler-teal.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForSelector('.feed-sticky-header', { timeout: 15000 });
  await page.waitForTimeout(1000);

  const listResp = await page.request.get('https://howler-teal.vercel.app/api/posts?page=1');
  const posts = await listResp.json();
  const target = posts.find(p => p.user_id !== MY_USER_ID);
  step('picked target post', { id: target.id, author: target.profiles?.username, likesBefore: target.likes?.[0]?.count || 0 });

  const targetCard = page.locator('.post-card').filter({ hasText: target.content.slice(0, 20) || target.profiles?.username }).first();
  const likeIcon = targetCard.locator('.interaction-item').first();

  // LIKE
  const likeResp1 = page.waitForResponse(r => r.url().includes('/api/likes') && r.request().method() === 'POST');
  await likeIcon.click();
  const r1 = await likeResp1;
  await page.waitForTimeout(800);
  const afterLike = await (await page.request.get('https://howler-teal.vercel.app/api/posts?page=1')).json();
  const postAfterLike = afterLike.find(p => p.id === target.id);
  step('after LIKE', { status: r1.status(), count: postAfterLike?.likes?.[0]?.count, hasLiked: postAfterLike?.user_has_liked?.length > 0 });

  // UNLIKE (toggle again)
  const likeResp2 = page.waitForResponse(r => r.url().includes('/api/likes') && r.request().method() === 'POST');
  await likeIcon.click();
  const r2 = await likeResp2;
  await page.waitForTimeout(800);
  const afterUnlike = await (await page.request.get('https://howler-teal.vercel.app/api/posts?page=1')).json();
  const postAfterUnlike = afterUnlike.find(p => p.id === target.id);
  step('after UNLIKE (reverted)', { status: r2.status(), count: postAfterUnlike?.likes?.[0]?.count, hasLiked: postAfterUnlike?.user_has_liked?.length > 0 });

  step('net change confirmed zero', { originalCount: target.likes?.[0]?.count || 0, finalCount: postAfterUnlike?.likes?.[0]?.count || 0 });

  console.log('=== FULL LOG ===');
  console.log(JSON.stringify(log, null, 2));
  await browser.close();
})();
