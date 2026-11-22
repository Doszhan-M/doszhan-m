import { heroReady } from "./video_loader";
import { startPreloader } from "./preloader";
import { registerServiceWorker } from "./sw-register";

const SECTIONS = ["preview", "about", "projects", "contact"];

// Прелоадер держится не дольше этого времени от начала загрузки страницы
const PRELOADER_MAX_MS = 3500;

// Готовность первого экрана: шрифты и hero (робот или видео), но не дольше PRELOADER_MAX_MS.
// window.load не ждём: он ждёт всё на странице, включая видео и тяжёлый Spline, —
// на медленном мобильном интернете это десятки секунд.
function firstScreenReady() {
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const limit = new Promise((resolve) =>
    setTimeout(resolve, Math.max(0, PRELOADER_MAX_MS - performance.now()))
  );
  return Promise.race([Promise.all([fonts, heroReady]), limit]);
}

export function index() {
  const preloader = startPreloader();

  firstScreenReady()
    .then(() => preloader.finish())
    .then(() => preloader.hide())
    .then(() => {
      // первый экран показан — теперь можно второстепенное (Метрика ждёт это событие в footer.html)
      window.dispatchEvent(new Event("site:ready"));
      registerServiceWorker();
    });

  const header = document.querySelector(".header");
  const burger = document.querySelector(".header__burger");
  const titles = document.querySelector(".header__titles");
  const navLinks = document.querySelectorAll(".header__link");

  // Плавная прокрутка до секции (ссылки на попапы по-прежнему работают через хеш)
  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }
    const id = link.getAttribute("href").slice(1);
    if (!SECTIONS.includes(id)) {
      return;
    }
    const section = document.getElementById(id);
    if (!section) {
      return;
    }
    event.preventDefault();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Мобильное меню
  function setMenu(open) {
    [header, burger, titles].forEach((el) => el && el.classList.toggle("active", open));
    if (burger) {
      burger.setAttribute("aria-expanded", String(open));
    }
  }

  if (burger) {
    burger.addEventListener("click", () => setMenu(!burger.classList.contains("active")));
    burger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        burger.click();
      }
    });
  }
  // нажатие на ссылку в меню закрывает меню
  document.querySelectorAll(".header__moblil_close").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
  // Esc закрывает мобильное меню
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header && header.classList.contains("active")) {
      setMenu(false);
    }
  });

  // Шапка появляется, когда первый экран почти прокручен,
  // и подсвечивает пункт меню текущей секции
  function onScroll() {
    const top = window.scrollY;
    if (header) {
      header.classList.toggle("fixed", top > window.innerHeight * 0.6);
    }
    const probe = top + 10;
    navLinks.forEach((link) => {
      const section = document.getElementById(link.getAttribute("href").slice(1));
      if (!section) {
        return;
      }
      const start = section.offsetTop;
      const end = start + section.offsetHeight;
      link.classList.toggle("header_active", start <= probe && probe <= end);
    });
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  onScroll();

  // Текущий год в подвале
  const yearElement = document.getElementById("currentYear");
  if (yearElement) {
    yearElement.textContent = `©2018-${new Date().getFullYear()}`;
  }
}
