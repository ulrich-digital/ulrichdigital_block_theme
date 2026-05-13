/* =============================================================== *\
   Frontend Logik

   Enthält alle Interaktionen und Funktionen
   für das Frontend der Website.

   Wird über den Frontend Entry Point geladen.
\* =============================================================== */


/* =============================================================== *\
   Header-Animation
\* =============================================================== */
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





/* =============================================================== *\
   Initialisierung
\* =============================================================== */
document.addEventListener("DOMContentLoaded", () => {
	initHeaderAnimation();
});
