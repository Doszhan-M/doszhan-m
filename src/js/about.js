document.addEventListener("DOMContentLoaded", () => {
    const firstItemIcon = document.querySelector(".assurances__item:first-child i");
  
    firstItemIcon.addEventListener("mouseenter", () => {
        void firstItemIcon.offsetWidth;
        firstItemIcon.style.animation = "rotateAndFly 0.8s ease-out";
        setTimeout(() => {
                firstItemIcon.classList.add("plane_invisible");
          }, 800);
    });
  
    firstItemIcon.addEventListener("mouseleave", () => {
        void firstItemIcon.offsetWidth;
        firstItemIcon.style.animation = "returnToStart 0.8s ease";
        setTimeout(() => {
            firstItemIcon.classList.remove("plane_invisible");
      }, 600);        
    });
  });
  