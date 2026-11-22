// Слайдер в попапах проектов. Попап открывается по хешу (#finsight и т.п.) через :target.
// Каждый попап инициализируется один раз, иначе при повторном открытии
// обработчики дублируются и слайды листаются через один.
const sliders = new Map();

function createSlider(popup) {
  const track = popup.querySelector(".slaider__img-container");
  const slides = popup.querySelectorAll(".slaider__img-container .img_holder");
  const btnLeft = popup.querySelector(".slaider__btn_left");
  const btnRight = popup.querySelector(".slaider__btn_right");
  const viewport = popup.querySelector(".slaider");

  if (!track || !slides.length || !viewport) {
    return null;
  }

  const counter = document.createElement("span");
  counter.className = "slaider__counter";
  counter.setAttribute("aria-live", "polite");
  viewport.appendChild(counter);

  const single = slides.length < 2;
  if (single) {
    btnLeft && (btnLeft.hidden = true);
    btnRight && (btnRight.hidden = true);
    counter.hidden = true;
  }

  let index = 0;

  function go(next) {
    // остановить видео на уходящем слайде
    const video = slides[index].querySelector("video");
    if (video && !video.paused) {
      video.pause();
    }
    index = (next + slides.length) % slides.length;
    // сдвиг в процентах, чтобы не зависеть от ширины окна при ресайзе
    track.style.transform = `translateX(${-100 * index}%)`;
    counter.textContent = `${index + 1} / ${slides.length}`;
  }

  btnRight && btnRight.addEventListener("click", () => go(index + 1));
  btnLeft && btnLeft.addEventListener("click", () => go(index - 1));

  // свайп на сенсорных экранах
  let touchX = null;
  viewport.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.touches[0].clientX;
    },
    { passive: true }
  );
  viewport.addEventListener("touchend", (e) => {
    if (touchX === null || single) {
      return;
    }
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) {
      go(dx < 0 ? index + 1 : index - 1);
    }
    touchX = null;
  });

  go(0);

  return {
    reset: () => go(0),
    next: () => !single && go(index + 1),
    prev: () => !single && go(index - 1),
    stop: () => {
      popup.querySelectorAll("video").forEach((v) => v.pause());
    },
  };
}

function currentPopup() {
  const id = window.location.hash.slice(1);
  if (!id) {
    return null;
  }
  const el = document.getElementById(id);
  return el && el.classList.contains("popup") ? el : null;
}

let openPopup = null;

function onHashChange() {
  if (openPopup) {
    const prev = sliders.get(openPopup);
    prev && prev.stop();
    document.documentElement.style.overflow = "";
  }

  const popup = currentPopup();
  openPopup = popup;
  if (!popup) {
    return;
  }

  if (!sliders.has(popup)) {
    // слайды за краем ленивая загрузка не трогает — грузим все слайды открытого попапа сразу
    popup.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = "eager";
    });
    sliders.set(popup, createSlider(popup));
  }
  const slider = sliders.get(popup);
  slider && slider.reset();
  // блокируем прокрутку страницы под попапом
  document.documentElement.style.overflow = "hidden";
}

function closePopup() {
  const close = openPopup && openPopup.querySelector(".popup__close");
  if (close) {
    close.click();
  }
}

export function sliderProject() {
  window.addEventListener("hashchange", onHashChange);
  // страница могла открыться сразу с хешем попапа
  onHashChange();

  document.addEventListener("keydown", (event) => {
    if (!openPopup) {
      return;
    }
    const slider = sliders.get(openPopup);
    if (event.key === "Escape") {
      closePopup();
    } else if (event.key === "ArrowRight" && slider) {
      slider.next();
    } else if (event.key === "ArrowLeft" && slider) {
      slider.prev();
    }
  });
}
