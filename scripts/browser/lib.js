// Общее для браузерных скриптов: Playwright из кэша npx и статический сервер на dist/.
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const DIST = path.join(ROOT, "dist");
const SHOTS = path.join(ROOT, ".claude", "scratch", "browser", "shots");

// Зависимости не ставятся: Playwright берётся из кэша npx, браузер — системный Chrome.
// Если кэша нет: `npx -y playwright@1.62.1 --version`.
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

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".ttf": "font/ttf", ".otf": "font/otf",
  ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain",
};

// Статический сервер на dist/ на свободном порту; resolve(server), адрес — server.address().port
function serveDist() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    throw new Error("Нет dist/index.html — сначала npm run build");
  }
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(DIST, url === "/" ? "index.html" : url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

module.exports = { ROOT, DIST, SHOTS, requirePlaywright, serveDist };
