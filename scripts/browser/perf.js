// Замер скорости первого захода: сколько ждать прелоадер и что качается за это время.
//
//   npm run build && npm run perf                       — локальный dist/
//   node scripts/browser/perf.js https://doszhan-m.netlify.app/   — прод
//   флаги: --fast (без ограничения сети), --runs N (медиана из N), --video (не блокировать видео)
//
// По умолчанию — «медленный 4G» (1.6 Мбит/с, 150 мс) на ПК и телефоне, свежий профиль.
// Видео hero блокируется: ролик выбирается случайно (от 0.7 до 19 МБ), и разброс съедает
// разницу между правками. Метрика блокируется всегда, чтобы не портить статистику.
// Ограничение сети действует на страницу, но не на service worker — его трафик до ухода
// прелоадера печатается отдельно (цель — ноль).
"use strict";
const { requirePlaywright, serveDist } = require("./lib");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const runsArg = args.indexOf("--runs");
const RUNS = runsArg >= 0 ? Number(args[runsArg + 1]) || 1 : 1;
const URL_ARG = args.find((a) => /^https?:\/\//.test(a));
const SLOW = !flag("--fast");
const BLOCK_VIDEO = !flag("--video");

const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: {
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
  },
};

const kb = (b) => `${Math.round(b / 1024)} КБ`;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// Свой браузер на каждый прогон: WebGL-сцена Spline из прошлого прогона (swiftshader) иногда
// продолжает грузить общий браузер, и следующий замер зависал.
async function measure(chromium, base, device) {
  const browser = await chromium.launch({
    channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    return await measureIn(browser, base, device);
  } finally {
    await browser.close();
  }
}

async function measureIn(browser, base, device) {
  const ctx = await browser.newContext(DEVICES[device]);
  await ctx.route(/mc\.yandex\.|yandex\.ru\/metrika/, (r) => r.abort());
  if (BLOCK_VIDEO) await ctx.route(/\.mp4(\?|$)/, (r) => r.abort());

  // момент удаления прелоадера фиксируется в самой странице (в Node он приходит с задержкой)
  await ctx.addInitScript(() => {
    new MutationObserver((_, obs) => {
      if (document.readyState !== "loading" && !document.getElementById("p_prldr")) {
        window.__preloaderRemovedAt = Date.now();
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  // время старта запросов service worker пишем сами: timing() для них пустой
  const swStarted = new Map();
  ctx.on("request", (r) => {
    if (r.serviceWorker()) swStarted.set(r, Date.now());
  });
  let preloaderGone = false;

  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (SLOW) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8,
    });
  }
  const requests = new Map();
  cdp.on("Network.requestWillBeSent", (e) => requests.set(e.requestId, { url: e.request.url, bytes: 0 }));
  cdp.on("Network.loadingFinished", (e) => {
    const r = requests.get(e.requestId);
    if (r && !preloaderGone) r.bytes = e.encodedDataLength;
  });

  const t0 = Date.now();
  await page.goto(base, { waitUntil: "commit" });
  await page.waitForSelector("#p_prldr", { state: "attached", timeout: 60000 });
  let time = null;
  try {
    await page.waitForSelector("#p_prldr", { state: "detached", timeout: 120000 });
    time = (Date.now() - t0) / 1000;
  } catch {}
  preloaderGone = true;

  // картинки попапов, запрошенные до ухода прелоадера (цель — ни одной)
  await page.waitForTimeout(500);
  const removedAt = await page.evaluate(() => window.__preloaderRemovedAt || Infinity);
  let swBytes = 0;
  let swRequests = 0;
  const withTimeout = (p) => Promise.race([p, new Promise((resolve) => setTimeout(resolve, 2000))]);
  for (const [r, startedAt] of swStarted) {
    if (startedAt >= removedAt) continue;
    swRequests++;
    const sizes = await withTimeout(r.sizes().catch(() => null));
    if (sizes) swBytes += sizes.responseBodySize;
  }

  const popupSrcs = await page.evaluate(() =>
    [...document.querySelectorAll(".popup img")].map((i) => new URL(i.getAttribute("src"), location.href).href)
  );
  const requested = new Set([...requests.values()].map((r) => r.url));
  const popupImages = popupSrcs.filter((u) => requested.has(u)).length;

  const byHost = {};
  let total = 0;
  for (const r of requests.values()) {
    if (!r.bytes) continue;
    let host = "?";
    try {
      host = new URL(r.url).host;
    } catch {}
    byHost[host] = (byHost[host] || 0) + r.bytes;
    total += r.bytes;
  }
  await ctx.close();
  return { time, total, byHost, popupImages, swBytes, swRequests };
}

(async () => {
  const { chromium } = requirePlaywright();
  const server = URL_ARG ? null : await serveDist();
  const base = URL_ARG || `http://127.0.0.1:${server.address().port}/`;
  console.log(`${base} · ${SLOW ? "медленный 4G" : "быстрая сеть"} · видео ${BLOCK_VIDEO ? "заблокировано" : "включено"} · запусков: ${RUNS}`);
  try {
    for (const device of ["desktop", "mobile"]) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) runs.push(await measure(chromium, base, device));
      const times = runs.map((r) => (r.time === null ? Infinity : r.time));
      const m = runs[times.indexOf(median(times))];
      const hosts = Object.entries(m.byHost).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([h, b]) => `${h} ${kb(b)}`).join(", ");
      console.log(`\n[${device}] прелоадер: ${m.time === null ? "> 120 с" : `${m.time.toFixed(1)} с`}` +
        (RUNS > 1 ? ` (все: ${times.map((t) => t.toFixed(1)).join(", ")})` : ""));
      console.log(`  скачано до ухода прелоадера: ${kb(m.total)} — ${hosts}`);
      console.log(`  картинок попапов до ухода прелоадера: ${m.popupImages}`);
      console.log(`  service worker до ухода прелоадера: ${m.swRequests} запросов, ${kb(m.swBytes)}`);
    }
  } finally {
    if (server) server.close();
  }
})();
