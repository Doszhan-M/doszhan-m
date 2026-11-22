// Реальный прогресс загрузки неизвестен: проценты ползут к 90% с замедлением,
// а на 100% добегают, когда страница действительно готова.
// на телефонах вместо робота и флюида в hero видео (см. video_loader.js)
const IS_DESKTOP = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const STATUSES = [
  [0, "initializing"],
  [25, IS_DESKTOP ? "loading 3d robot" : "loading hero video"],
  [50, IS_DESKTOP ? "rendering ascii fluid" : "preparing scene"],
  [75, "preparing projects"],
  [96, "ready"],
];

export function startPreloader() {
  const root = document.getElementById("p_prldr");
  if (!root) {
    return { finish: () => Promise.resolve(), hide: () => Promise.resolve() };
  }

  const counters = root.querySelectorAll(".p_count");
  const status = document.getElementById("p_status");
  const year = document.getElementById("p_year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  let percent = 0;
  let shown = -1;
  const render = () => {
    const value = Math.floor(percent);
    if (value === shown) {
      return;
    }
    shown = value;
    root.style.setProperty("--p", value);
    counters.forEach((el) => {
      el.textContent = value;
    });
    if (status) {
      const label = STATUSES.filter(([from]) => value >= from).pop()[1];
      if (status.textContent !== label) {
        status.textContent = label;
      }
    }
  };

  const creep = setInterval(() => {
    percent += (90 - percent) * 0.04;
    render();
  }, 60);

  return {
    finish() {
      clearInterval(creep);
      return new Promise((resolve) => {
        const fill = setInterval(() => {
          percent = Math.min(100, percent + 4);
          render();
          if (percent >= 100) {
            clearInterval(fill);
            setTimeout(resolve, 350);
          }
        }, 20);
      });
    },
    // шторка уезжает вверх и открывает hero, затем элемент убирается из DOM;
    // промис выполняется, когда прелоадер убран
    hide() {
      root.classList.add("is-done");
      return new Promise((resolve) => {
        const remove = () => {
          if (root.isConnected) {
            root.remove();
          }
          resolve();
        };
        root.addEventListener("transitionend", (e) => e.target === root && remove());
        setTimeout(remove, 1500); // на случай, если transitionend не придёт
      });
    },
  };
}
