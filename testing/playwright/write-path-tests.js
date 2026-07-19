const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const STATE_PATH = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'storageState.json');
const SHOT_DIR = path.join(process.env.TEMP || '/tmp', 'howler_test_output', 'screenshots');
const MY_USER_ID = '01d1947c-e20c-411e-9fc6-414809abd1ca';
const TEST_CONTENT = '[automated test post - deleting shortly, part of QA testing]';
const TEST_COMMENT = '[automated test comment - deleting shortly]';

const log = [];
const step = (msg, data) => { const entry = { msg, data }; log.push(entry); console.log('STEP:', msg, data ? JSON.stringify(data) : ''); };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_PATH, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('dialog', async d => { step('native dialog auto-accepted', { message: d.message() }); await d.accept(); });

  await page.goto('https://howler-teal.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForSelector('.feed-sticky-header', { timeout: 15000 });

  // --- 1. CREATE test post via real UI flow ---
  await page.click('.howl-btn');
  await page.waitForSelector('.post-textarea', { timeout: 5000 });
  await page.fill('.post-textarea', TEST_CONTENT);
  await page.selectOption('.category-select', { label: 'Random' });
  await page.screenshot({ path: path.join(SHOT_DIR, 'write-01-form-filled.png') });

  const createResp = page.waitForResponse(r => r.url().includes('/api/posts') && r.request().method() === 'POST');
  await page.click('.btn-submit');
  const createResult = await createResp;
  step('create post response', { status: createResult.status() });

  await page.waitForSelector('.post-textarea', { state: 'detached', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // find the new post's ID via the posts API (freshest page 1, match by content)
  const listResp = await page.request.get('https://howler-teal.vercel.app/api/posts?page=1');
  const posts = await listResp.json();
  const testPost = posts.find(p => p.content === TEST_CONTENT);
  step('located test post', { found: !!testPost, id: testPost?.id });

  if (!testPost) {
    step('ABORT: could not locate created post, stopping before any further action');
    console.log(JSON.stringify(log, null, 2));
    await browser.close();
    process.exit(1);
  }
  const postId = testPost.id;

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.feed-sticky-header', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOT_DIR, 'write-02-post-visible-in-feed.png') });

  // locate the post-card for our test post specifically
  const testCard = page.locator('.post-card').filter({ hasText: TEST_CONTENT.slice(0, 30) }).first();
  const cardVisible = await testCard.count();
  step('test post card visible in feed', { cardVisible });

  // --- 2. COMMENT on it via real UI flow ---
  await testCard.locator('.interaction-item').filter({ hasText: '💬' }).click();
  await page.waitForSelector('.expanded-modal-container', { timeout: 5000 });
  await page.fill('.expanded-input-bar-layout input[type="text"]', TEST_COMMENT);
  const commentResp = page.waitForResponse(r => r.url().includes('/api/comments') && r.request().method() === 'POST');
  await page.click('.expanded-input-bar-layout button[type="submit"]');
  const commentResult = await commentResp;
  const commentBody = await commentResult.json();
  step('comment created', { status: commentResult.status(), id: commentBody?.id });
  await page.screenshot({ path: path.join(SHOT_DIR, 'write-03-comment-posted.png') });

  // --- 3. REPORT the test post ---
  // NOTE: PostFeed.js only renders .report-trigger for posts you do NOT own
  // (isMyPost ? delete-trigger : report-trigger), so there is no UI path to report
  // your own post. Calling the API directly instead -- the API itself does not
  // block self-reporting.
  await page.click('.desktop-close-button');
  await page.waitForTimeout(500);
  const reportResp = await page.request.post('https://howler-teal.vercel.app/api/reports', {
    data: { post_id: postId, reason: 'Other' },
    headers: { 'Content-Type': 'application/json' },
  });
  step('report submitted (via API, no UI path exists for self-reports)', { status: reportResp.status() });

  // --- 4. DELETE the comment via real UI flow ---
  await testCard.locator('.interaction-item').filter({ hasText: '💬' }).click();
  await page.waitForSelector('.expanded-modal-container', { timeout: 5000 });
  const deleteCommentResp = page.waitForResponse(r => r.url().includes('/api/comments') && r.request().method() === 'DELETE');
  await page.click('.delete-action');
  const deleteCommentResult = await deleteCommentResp;
  step('comment deleted', { status: deleteCommentResult.status() });
  await page.click('.desktop-close-button');
  await page.waitForTimeout(500);

  // --- 5. DELETE the test post via real UI flow ---
  const deletePostResp = page.waitForResponse(r => r.url().includes('/api/delete_post') && r.request().method() === 'DELETE');
  await testCard.locator('.delete-trigger').click();
  const deletePostResult = await deletePostResp;
  step('post deleted', { status: deletePostResult.status() });

  await page.waitForTimeout(1000);
  const verifyResp = await page.request.get(`https://howler-teal.vercel.app/api/posts?page=1`);
  const postsAfter = await verifyResp.json();
  const stillThere = postsAfter.some(p => p.id === postId);
  step('verified test post removed from feed', { stillThere });

  fs.writeFileSync(path.join(SHOT_DIR, '..', 'write-path-log.json'), JSON.stringify(log, null, 2));
  console.log('=== FULL LOG ===');
  console.log(JSON.stringify(log, null, 2));

  await browser.close();
})();
