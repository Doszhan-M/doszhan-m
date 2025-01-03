document.addEventListener("DOMContentLoaded", () => {
  const firstItemIcon = document.querySelector(
    ".assurances__item:first-child i"
  );

  firstItemIcon.addEventListener("mouseenter", () => {
    void firstItemIcon.offsetWidth;
    firstItemIcon.style.animation = "rotateAndFly 0.8s ease-out";
    firstItemIcon.addEventListener("animationend", () => {
      firstItemIcon.classList.add("plane_invisible");
    });
  });

  firstItemIcon.addEventListener("mouseleave", () => {
    void firstItemIcon.offsetWidth;
    firstItemIcon.style.animation = "returnToStart 0.8s ease";
    firstItemIcon.addEventListener("animationend", () => {
      firstItemIcon.classList.remove("plane_invisible");
    });
  });
});
