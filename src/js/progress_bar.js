export function progress() {
  const progressBars = document.querySelectorAll(".progress_bar");

  if (!progressBars.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const bar = entry.target;
        const fillElement = bar.querySelector(".progress_bar__fill");
        const targetValue = Number.parseInt(bar.dataset.progress || "0", 10);

        if (!fillElement) {
          return;
        }

        if (entry.isIntersecting) {
          fillElement.style.width = `${targetValue}%`;
        } else {
          fillElement.style.width = "0%";
        }
      });
    },
    {
      threshold: 0.4,
    }
  );

  progressBars.forEach((bar) => {
    const fillElement = bar.querySelector(".progress_bar__fill");

    if (fillElement) {
      fillElement.style.width = "0%";
    }

    observer.observe(bar);
  });
}
