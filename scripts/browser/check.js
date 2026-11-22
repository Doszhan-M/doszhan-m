// Браузерная проверка собранного сайта (dist/): поведение, а не исходник.
//
//   npm run build && node scripts/browser/check.js
//
// Поднимает статический сервер на dist/, открывает сайт на ПК и телефоне и проверяет:
// ошибки JS, уход прелоадера, шапку и меню, плавную прокрутку, попапы со слайдером,
// фильтры проектов, горизонтальную прокрутку. Скриншоты — в .claude/scratch/browser/shots/.
// Код выхода 1, если хоть одна проверка не прошла.
//
// Playwright и статический сервер — из ./lib.js (без новых зависимостей).
// Spline, Метрика и видео в проверке заблокированы (сеть и WebGL здесь не нужны), поэтому
// hero ждёт свой тайм-аут ~10 с — это ожидаемо.
"use strict";
const fs = require("fs");
const path = require("path");
const { SHOTS, requirePlaywright, serveDist } = require("./lib");

const { chromium } = requirePlaywright();

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function run(browser, base, device) {
  const mobile = device === "mobile";
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
      : { viewport: { width: 1440, height: 900 } }
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(/spline\.design|mc\.yandex|\.mp4$/, (r) => r.abort());
  const tag = (s) => `[${device}] ${s}`;

  await page.goto(base);
  await page.waitForSelector("#p_prldr", { state: "detached", timeout: 25000 }).then(
    () => check(tag("прелоадер уходит"), true),
    async () => {
      const state = await page.evaluate(() => {
        const el = document.getElementById("p_prldr");
        return `readyState=${document.readyState} class="${el && el.className}" p=${el && el.style.getPropertyValue("--p")}`;
      });
      check(tag("прелоадер уходит"), false, `не исчез за 25 с: ${state}`);
    }
  );
  check(tag("jQuery не загружается"), !(await page.evaluate(() => "jQuery" in window)));
  check(tag("год в подвале"), (await page.textContent("#currentYear")).includes(String(new Date().getFullYear())));

  // шапка появляется после первого экрана
  await page.evaluate(() => window.scrollTo(0, document.getElementById("about").offsetTop + 50));
  await page.waitForTimeout(600);
  check(tag("шапка появляется после скролла"), await page.$eval(".header", (h) => h.classList.contains("fixed")));
  check(tag("активный пункт меню — about"),
    await page.$eval('.header__link[href="#about"]', (a) => a.classList.contains("header_active")));

  // плавная прокрутка по ссылке
  if (mobile) {
    await page.click(".header__burger");
    await page.waitForTimeout(500);
    check(tag("бургер открывает меню"), await page.$eval(".header", (h) => h.classList.contains("active")));
    await page.screenshot({ path: path.join(SHOTS, `${device}-menu.png`) });
    await page.click('.header__link[href="#contact"]');
  } else {
    await page.click('.header__link[href="#contact"]');
  }
  // плавная прокрутка идёт разное время — ждём, пока позиция перестанет меняться
  let last = -1;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(150);
    const y = await page.evaluate(() => window.scrollY);
    if (y === last) break;
    last = y;
  }
  const contactTop = await page.$eval("#contact", (s) => Math.abs(s.getBoundingClientRect().top));
  check(tag("ссылка меню прокручивает к секции"), contactTop < 5, `отступ ${Math.round(contactTop)}px`);
  if (mobile) {
    check(tag("ссылка закрывает меню"), !(await page.$eval(".header", (h) => h.classList.contains("active"))));
  }

  // попап: слайдер листает на один слайд и после повторного открытия
  await page.evaluate(() => { location.hash = "finsight"; });
  await page.waitForTimeout(900);
  await page.click("#finsight .slaider__btn_right");
  await page.waitForTimeout(300);
  check(tag("слайдер: один клик — один слайд"), (await page.textContent("#finsight .slaider__counter")).startsWith("2 /"));
  await page.screenshot({ path: path.join(SHOTS, `${device}-popup.png`) });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check(tag("Esc закрывает попап"), (await page.evaluate(() => location.hash)) !== "#finsight");
  await page.evaluate(() => { location.hash = "finsight"; });
  await page.waitForTimeout(800);
  await page.click("#finsight .slaider__btn_right");
  await page.waitForTimeout(300);
  check(tag("слайдер после повторного открытия"), (await page.textContent("#finsight .slaider__counter")).startsWith("2 /"));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // фильтры проектов
  await page.evaluate(() => document.getElementById("projects").scrollIntoView());
  const counts = {};
  for (const f of ["all", "product", "automation", "hardware"]) {
    await page.click(`.filters__btn[data-filter="${f}"]`);
    await page.waitForTimeout(150);
    counts[f] = await page.locator(".project:not(.is-hidden)").count();
  }
  check(tag("фильтры проектов"), counts.all > 0 && counts.product + counts.automation + counts.hardware === counts.all,
    JSON.stringify(counts));
  await page.click('.filters__btn[data-filter="all"]');

  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  check(tag("нет горизонтальной прокрутки"), sw <= iw, `${sw} / ${iw}`);
  check(tag("нет ошибок JS"), errors.length === 0, errors.join(" | "));
  await ctx.close();
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await serveDist();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    await run(browser, base, "desktop");
    await run(browser, base, "mobile");
  } finally {
    await browser.close();
    server.close();
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} проверок прошли. Скриншоты: ${SHOTS}`);
  process.exit(failed ? 1 : 0);
})();
