(() => {
  // src/js/frontend/frontend.js
  function initHeaderAnimation() {
    const header = document.querySelector("header.wp-block-template-part");
    if (!header) {
      return;
    }
    let lastScrollY = window.scrollY;
    let scrollDirection = 0;
    let scrollDistance = 0;
    let ticking = false;
    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;
      if (currentScrollY <= 20) {
        header.classList.remove("is-hidden");
        scrollDirection = 0;
        scrollDistance = 0;
      } else if (diff !== 0) {
        const nextDirection = diff > 0 ? 1 : -1;
        if (nextDirection !== scrollDirection) {
          scrollDirection = nextDirection;
          scrollDistance = 0;
        }
        scrollDistance += Math.abs(diff);
        if (scrollDistance > 6) {
          header.classList.toggle("is-hidden", scrollDirection > 0);
          scrollDistance = 0;
        }
      }
      lastScrollY = currentScrollY;
      ticking = false;
    };
    updateHeader();
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    initHeaderAnimation();
  });
})();
