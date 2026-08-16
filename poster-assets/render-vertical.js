const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const svgPath = path.join(__dirname, 'howler-diagram-vertical.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent;}
    svg{display:block;}
  </style></head><body>${svgContent}</body></html>`;

  const htmlPath = path.join(__dirname, '_render_v.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1800, height: 3000 },
    deviceScaleFactor: 1.5,
  });
  await page.goto('file://' + htmlPath);
  const el = await page.$('svg');
  await el.screenshot({ path: path.join(__dirname, 'howler-diagram-vertical.png'), omitBackground: false });
  await browser.close();

  fs.unlinkSync(htmlPath);
  console.log('done');
})();
