const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const svgPath = path.join(__dirname, 'howler-diagram.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent;}
    svg{display:block;}
  </style></head><body>${svgContent}</body></html>`;

  const htmlPath = path.join(__dirname, '_render.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 3760, height: 740 },
    deviceScaleFactor: 2,
  });
  await page.goto('file://' + htmlPath);
  const el = await page.$('svg');
  await el.screenshot({ path: path.join(__dirname, 'howler-diagram.png'), omitBackground: false });
  await browser.close();

  fs.unlinkSync(htmlPath);
  console.log('done');
})();
