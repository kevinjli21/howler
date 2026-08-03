const { chromium } = require('@playwright/test');
const path = require('path');

const HTML_PATH = process.argv[2];
const PDF_PATH = process.argv[3];

if (!HTML_PATH || !PDF_PATH) {
  console.error('Usage: node render-changelog-pdf.js <input.html> <output.pdf>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + path.resolve(HTML_PATH).replace(/\\/g, '/'), { waitUntil: 'networkidle' });

  await page.pdf({
    path: path.resolve(PDF_PATH),
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.6in', bottom: '0.6in', left: '0.5in', right: '0.5in' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size:8px; color:#888; width:100%; padding:0 0.5in; display:flex; justify-content:flex-end; font-family:Arial,sans-serif;">
        <span class="pageNumber"></span>&nbsp;/&nbsp;<span class="totalPages"></span>
      </div>`,
  });

  await browser.close();
  console.log('PDF written to', PDF_PATH);
})();
