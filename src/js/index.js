import { heroReady } from "./video_loader";
import { startPreloader } from "./preloader";

const SECTIONS = ["preview", "about", "projects", "contact"];

function pageLoaded() {
  return document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) =>
        window.addEventListener("load", resolve, { once: true })
      );
}

export function index() {
  const preloader = startPreloader();

  // Прелоадер уходит, когда загружена страница и готов первый экран (робот или видео)
  pageLoaded()
    .then(() => heroReady)
    .then(() => preloader.finish())
    .then(() => preloader.hide());

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
