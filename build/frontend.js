(() => {
  // src/js/frontend/frontend.js
  function initHeaderAnimation() {
    const header = document.querySelector("header.wp-block-template-part");
    if (!header) {
      return;
    }
    let lastScrollY = window.scrollY;
    let ticking = false;
    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;
      if (currentScrollY <= 20) {
        header.classList.remove("is-hidden");
      } else if (diff > 6) {
        header.classList.add("is-hidden");
      } else if (diff < -6) {
        header.classList.remove("is-hidden");
      }
      lastScrollY = currentScrollY;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    });
  }
  function initContentAnimations() {
    if (document.body.classList.contains("page-template-rechtliches") || document.body.classList.contains("page-template-rechtliches-en")) {
      return;
    }
    const elements = document.querySelectorAll(
      ".entry-content > .wp-block-heading, .wp-block-ud-editorial-item"
    );
    if (!elements.length) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-in-view");
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px"
      }
    );
    elements.forEach((element) => observer.observe(element));
  }
  document.addEventListener("DOMContentLoaded", () => {
    initHeaderAnimation();
    initContentAnimations();
	//console.log("frontend.js");
  });
})();
