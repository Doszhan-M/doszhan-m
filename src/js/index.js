export function index() {
  $(window).ready(function () {
    // шаг вниз перед загрузкой и показа preloader
    $("html, body").animate({ scrollTop: $("#about").offset().top }, 200);
    $("html, body").animate({ scrollTop: $("#projects").offset().top }, 200);
    $("html, body").animate({ scrollTop: $("#preview").offset().top }, 10);
  });

  // Preloader
  $(window).on("load", function () {
    var $preloader = $("#p_prldr"),
      $svg_anm = $preloader.find(".svg_anm");
    $svg_anm.fadeOut();
    $preloader.delay(500).fadeOut("slow");
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
  });
  // нажатие на ссылку в меню бургера закрывает меню
  $(".header__moblil_close").click(function (event) {
    $("header, .header__burger, .header__titles").removeClass("active");
  });

  // Анимация при достижении блока в зону видимости
  var windowHeight = $(window).height();
  function animation() {
    $(".anim_item").each(function () {
      var self = $(this),
        height = self.offset().top + self.height();
      if ($(document).scrollTop() + windowHeight >= height) {
        self.addClass("_animation");
      }
      if ($(document).scrollTop() + windowHeight <= height - 300) {
        self.removeClass("_animation");
      }
    });
  }

  // Определить устройство, если телефон, то true
  function isMobile() {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      return true;
    }
    return false;
  }

  // Анимация при достижении блока в зону видимости для больших объектов
  function animationBigItem() {
    $(".big_anim_item").each(function () {
      let self = $(this);

      if (isMobile()) {
        var height = self.offset().top - 400;
      } else {
        var height = self.offset().top - 700;
      }

      if ($(document).scrollTop() >= height) {
        self.addClass("_fade-in");
      }
      if ($(document).scrollTop() < 200) {
        self.removeClass("_fade-in");
      }
    });
  }
  // запустить функции для скрола
  $(document).on("scroll", function () {
    animation();
    animationBigItem();
    headerColor();
  });

  // Фиксация navbar после скрола
  jQuery(window).scroll(function navBar() {
    var the_top = jQuery(document).scrollTop();
    if (the_top > 500) {
      jQuery(".header").addClass("fixed");
    } else {
      jQuery(".header").removeClass("fixed");
    }
  });

  // при достижении одной секции из header на экран, та секция меняет цвет
  function headerColor() {
    $(".header__moblil_close").each(function () {
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
    yearElement.textContent = `©${currentYear}`;
  });
}
