const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// плавный счёт от 0 до значения из data-count
function countUp(el) {
  const target = Number.parseInt(el.dataset.count, 10);
  if (!target || prefersReducedMotion) {
    return;
  }
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString("en-US");
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  el.textContent = "0";
  requestAnimationFrame(tick);
}

// Появление блоков при прокрутке. Срабатывает один раз на элемент;
// соседи в одном контейнере появляются с небольшой задержкой друг за другом.
export function reveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length || !("IntersectionObserver" in window)) {
    return;
  }

  document.documentElement.classList.add("js-reveal");

  const siblingIndex = new Map();
  items.forEach((el) => {
    const parent = el.parentElement;
    const index = siblingIndex.get(parent) || 0;
    siblingIndex.set(parent, index + 1);
    // в сетке проектов задержка по колонке, а не по порядку, иначе нижние ряды ждут слишком долго
    const delay = parent.classList.contains("projects__grid") ? index % 3 : Math.min(index, 4);
    el.style.setProperty("--reveal-delay", `${delay * 0.08}s`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const el = entry.target;
        el.classList.add("is-visible");
        el.querySelectorAll("[data-count]").forEach(countUp);
        // после появления убираем задержку, чтобы hover-эффекты срабатывали сразу
        el.addEventListener(
          "transitionend",
          () => el.style.removeProperty("--reveal-delay"),
          { once: true }
        );
        observer.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}
