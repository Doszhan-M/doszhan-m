// Отрисовка картинки превью для соцсетей из шаблона scripts/og/og-image.html.
//
//   node scripts/og/render.js
//
// Результат — src/img/service/og-image.jpg (1200×630), на него ссылаются og:image и
// twitter:image в src/partials/head.html. После смены картинки поменять имя файла не нужно,
// но соцсети кэшируют превью: обновить его можно через их отладчики (Facebook Sharing
// Debugger, LinkedIn Post Inspector).
//
// Playwright — из кэша npx, браузер — системный Chrome (как в scripts/browser/check.js).
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");

function requirePlaywright() {
  try {
    return require("playwright");
  } catch {}
  const npx = path.join(os.homedir(), ".npm", "_npx");
  for (const d of fs.existsSync(npx) ? fs.readdirSync(npx) : []) {
    const p = path.join(npx, d, "node_modules", "playwright");
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error("Playwright не найден: npx -y playwright@1.62.1 --version");
}

(async () => {
  const { chromium } = requirePlaywright();
  const template = path.join(__dirname, "og-image.html");
  const out = path.resolve(__dirname, "..", "..", "src", "img", "service", "og-image.jpg");
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`file://${template}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: "jpeg", quality: 90 });
  await browser.close();
  console.log(`готово: ${path.relative(process.cwd(), out)}`);
})();
