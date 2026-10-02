// Реальный прогресс загрузки неизвестен: проценты ползут к 90% с замедлением,
// а на 100% добегают, когда страница действительно готова.
export function startPreloader() {
  const count = document.getElementById("p_count");
  const water = document.getElementById("p_water");
  if (!count || !water) {
    return { finish: () => Promise.resolve() };
  }

  let percent = 0;
  const render = () => {
    const value = Math.floor(percent);
    count.textContent = value;
    water.style.transform = `translate(0, ${100 - value}%)`;
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
            setTimeout(resolve, 300);
          }
        }, 20);
      });
    },
  };
}
