/* =============================================================== *\
   Editor Logik

   Enthält alle Anpassungen für den Block-Editor.

   Beispiele:
   - Block-Styles registrieren
   - Editor-Verhalten
   - Gutenberg-Integration

   Wird über den Editor Entry Point geladen.
\* =============================================================== */

/* =============================================================== *\
   Ersetzt den Core-Bildstil "rounded" durch den eigenen Stil
   "ud-rounded-24" und weist ihn neuen Bildblöcken im Editor
   automatisch zu. Die visuelle Darstellung erfolgt über blocks.scss.
\* =============================================================== */
function initImageBlockStyle() {
	const { registerBlockStyle, unregisterBlockStyle } = wp.blocks;
	const { subscribe, select, dispatch } = wp.data;

	unregisterBlockStyle('core/image', 'rounded');

	registerBlockStyle('core/image', {
		name: 'ud-rounded-24',
		label: 'Abgerundet 24px',
	});

	const processedClientIds = new Set();

	subscribe(() => {
		const editorSelect =
			select('core/block-editor') || select('core/editor');

		const editorDispatch =
			dispatch('core/block-editor') || dispatch('core/editor');

		if (!editorSelect || !editorDispatch) {
			return;
		}

		const blocks = editorSelect.getBlocks();

		blocks.forEach((block) => {
			if (!block || block.name !== 'core/image') {
				return;
			}

			if (processedClientIds.has(block.clientId)) {
				return;
			}

			processedClientIds.add(block.clientId);

			const currentClassName = block.attributes.className || '';

			if (currentClassName.includes('is-style-ud-rounded-24')) {
				return;
			}

			if (currentClassName.includes('is-style-rounded')) {
				editorDispatch.updateBlockAttributes(block.clientId, {
					className: currentClassName
						.replace('is-style-rounded', 'is-style-ud-rounded-24')
						.trim(),
				});
				return;
			}

			if (currentClassName.includes('is-style-')) {
				return;
			}

			editorDispatch.updateBlockAttributes(block.clientId, {
				className: [currentClassName, 'is-style-ud-rounded-24']
					.filter(Boolean)
					.join(' '),
			});
		});
	});
}

/* =============================================================== *\
   Eigene Button-Styles für den Core-Button registrieren
\* =============================================================== */
function initButtonBlockStyles() {
	const { registerBlockStyle } = wp.blocks;

	registerBlockStyle("core/button", {
		name: "ud-arrow-left",
		label: "Pfeil links",
	});

	registerBlockStyle("core/button", {
		name: "ud-arrow-right",
		label: "Pfeil rechts",
	});
}


/* =============================================================== *\
   Initialisierung
\* =============================================================== */
wp.domReady(() => {
	if (window.udEditorInitialized) {
		return;
	}

	window.udEditorInitialized = true;

	//initImageBlockStyle();
	//initButtonBlockStyles();
});
