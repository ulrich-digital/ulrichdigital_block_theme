import domReady from "@wordpress/dom-ready";
import { unregisterBlockVariation } from "@wordpress/blocks";

domReady(() => {
	const settings = window.udSettingsBlockVisibility || {};
	const excludedVariations = settings.excludedVariations || [];

	excludedVariations.forEach((variation) => {
		if (!variation.blockName || !variation.variationName) {
			return;
		}

		unregisterBlockVariation(variation.blockName, variation.variationName);
	});
});