// заполнение прогресса
function moveProgress(progress_elem_id, percent_elem_id, progress) {
  let progress_elem = document.getElementById(progress_elem_id);
  let percent_elem = document.getElementById(percent_elem_id);
  let width = 100 - progress;
  let id = setInterval(frame, 10);
  function frame() {
    if (width >= progress) {
      clearInterval(id);
    } else {
      width++;
      progress_elem.style.width = width + "%";
      percent_elem.innerHTML = "";
    }
  }
}

// убывание прогресса
function unMoveProgress(progress_elem_id, percent_elem_id, progress) {
  let progress_elem = document.getElementById(progress_elem_id);
  let percent_elem = document.getElementById(percent_elem_id);
  let width = progress;
  let id = setInterval(frame, 10);
  function frame() {
    if (width <= 20) {
      clearInterval(id);
    } else {
      width--;
      progress_elem.style.width = width + "%";
      percent_elem.innerHTML = "";
    }
  }
}

export function progress() {
  // Заполнить или опустошить прогресс при достижении скрола
  $(document).on("scroll", function () {
    $(".progress_bar").each(function () {
      let self = $(this);
      const progress_elem_id = self.children().first().attr("id");
      const percent_elem_id = self
        .children()
        .filter(":nth-child(2)")
        .attr("id");
      const progress = self.children().last().text();
      let height = self.offset().top + self.height();
      let windowHeight = $(window).height();

      if (!$(this).hasClass("not_progress")) {
        if ($(document).scrollTop() + windowHeight >= height + 20) {
          self.addClass("not_progress");
          setTimeout(function () {
            moveProgress(progress_elem_id, percent_elem_id, progress);
          }, 10);
        }
      } else if ($(this).hasClass("not_progress")) {
        if ($(document).scrollTop() + windowHeight <= height - 300) {
          self.removeClass("not_progress");
          unMoveProgress(progress_elem_id, percent_elem_id, progress);
        }
      }
    });
  });
}
