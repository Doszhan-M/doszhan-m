import { heroReady } from "./video_loader";
import { startPreloader } from "./preloader";

export function index() {
  const preloader = startPreloader();

  // Preloader
  $(window).on("load", function () {
    heroReady
      .then(function () {
        return preloader.finish();
      })
      .then(function () {
        preloader.hide();
      });
  });

  // Плавный scroll до секции
  let sections = ["preview", "about", "projects", "contact"]; // список id ссылок, где нужен e.preventDefault();
  sections.forEach((element) => {
    $(`a[href*="#${element}"]`).on("click", function (e) {
      e.preventDefault();
      $("html, body").animate(
        {
          scrollTop: $($(this).attr("href")).offset().top,
        },
        500
      );
    });
  });

  // нажатие на бургер открывает меню
  $(".header__burger").click(function (event) {
    $("header, .header__burger, .header__titles").toggleClass("active");
    $(this).attr("aria-expanded", $(this).hasClass("active"));
  });
  // бургер доступен с клавиатуры
  $(".header__burger").on("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $(this).click();
    }
  });
  // нажатие на ссылку в меню бургера закрывает меню
  $(".header__moblil_close").click(function (event) {
    $("header, .header__burger, .header__titles").removeClass("active");
    $(".header__burger").attr("aria-expanded", "false");
  });

  // подсветка активного пункта меню при скролле
  $(document).on("scroll", headerColor);

  // Esc закрывает мобильное меню
  $(document).on("keydown", function (event) {
    if (event.key === "Escape" && $(".header").hasClass("active")) {
      $(".header__moblil_close").first().trigger("click");
    }
  });

  // Фиксация navbar после скрола
  jQuery(window).scroll(function navBar() {
    var the_top = jQuery(document).scrollTop();
    // шапка появляется, когда первый экран почти прокручен
    if (the_top > window.innerHeight * 0.6) {
      jQuery(".header").addClass("fixed");
    } else {
      jQuery(".header").removeClass("fixed");
    }
  });

  // при достижении одной секции из header на экран, та секция меняет цвет
  function headerColor() {
    $(".header__link").each(function () {
      let self = $(this);
      let id = self.attr("href");
      let section = $(id);
      let sectionOffsetHeight = section.offset().top; // расстояние от секции до начало страницы
      let sectionAndOfsetHeight = sectionOffsetHeight + section.height();
      let documentScrollTop = $(document).scrollTop() + 10; // расстояние от текущего место до начало документа

      if (
        sectionOffsetHeight <= documentScrollTop &&
        documentScrollTop <= sectionAndOfsetHeight
      ) {
        self.addClass("header_active");
      } else {
        self.removeClass("header_active");
      }
    });
  }

  // показывать текущий год в footer
  document.addEventListener("DOMContentLoaded", () => {
    const yearElement = document.getElementById("currentYear");
    const currentYear = new Date().getFullYear();
    yearElement.textContent = `©2018-${currentYear}`;
  });
}
