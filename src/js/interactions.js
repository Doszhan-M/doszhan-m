// Подсветка карточек, следующая за курсором (только для мыши).
function spotlight() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }
  document.addEventListener(
    "pointermove",
    (event) => {
      const card = event.target.closest && event.target.closest(".card");
      if (!card) {
        return;
      }
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    },
    { passive: true }
  );
}

// Фильтр проектов по категориям.
function projectFilters() {
  const grid = document.querySelector(".projects__grid");
  const buttons = document.querySelectorAll(".filters__btn");
  if (!grid || !buttons.length) {
    return;
  }
  const projects = grid.querySelectorAll(".project");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      buttons.forEach((b) => {
        const active = b === button;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      grid.classList.toggle("is-filtered", filter !== "all");

      projects.forEach((project) => {
        const show = filter === "all" || project.dataset.category === filter;
        project.classList.toggle("is-hidden", !show);
        project.classList.remove("is-entering");
        if (show) {
          // карточка могла ещё не попасть в зону видимости — показываем её сразу
          project.classList.add("is-visible");
          void project.offsetWidth; // перезапуск анимации
          project.classList.add("is-entering");
        }
      });
    });
  });
}

// Местное время в Алматы в блоке «обо мне».
function localTime() {
  const el = document.getElementById("localTime");
  if (!el) {
    return;
  }
  const format = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  });
  const update = () => {
    el.textContent = format.format(new Date());
  };
  update();
  setInterval(update, 30 * 1000);
}

export function interactions() {
  spotlight();
  projectFilters();
  localTime();
}
