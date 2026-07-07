const createLightbox = () => {
	const lightbox = document.createElement("div");
	lightbox.className = "ud-settings-editor-help-lightbox";
	lightbox.setAttribute("hidden", "");

	lightbox.innerHTML = `
		<button class="ud-settings-editor-help-lightbox__close" type="button" aria-label="Schliessen">×</button>
		<img class="ud-settings-editor-help-lightbox__image" src="" alt="" />
	`;

	document.body.appendChild(lightbox);

	return lightbox;
};

document.addEventListener("DOMContentLoaded", () => {
	const imageButtons = document.querySelectorAll(
		"[data-ud-settings-lightbox-image]"
	);

	if (!imageButtons.length) {
		return;
	}

	const lightbox = createLightbox();
	const lightboxImage = lightbox.querySelector(
		".ud-settings-editor-help-lightbox__image"
	);
	const closeButton = lightbox.querySelector(
		".ud-settings-editor-help-lightbox__close"
	);

	const closeLightbox = () => {
		lightbox.setAttribute("hidden", "");
		lightboxImage.src = "";
		document.body.classList.remove("ud-settings-lightbox-is-open");
	};

	imageButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const imageUrl = button.getAttribute(
				"data-ud-settings-lightbox-image"
			);

			if (!imageUrl) {
				return;
			}

			lightboxImage.src = imageUrl;
			lightbox.removeAttribute("hidden");
			document.body.classList.add("ud-settings-lightbox-is-open");
		});
	});

	closeButton.addEventListener("click", closeLightbox);

	lightbox.addEventListener("click", (event) => {
		if (event.target === lightbox) {
			closeLightbox();
		}
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeLightbox();
		}
	});
});