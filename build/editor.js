(() => {
  // src/js/editor/editor.js
  wp.domReady(() => {
    if (window.udEditorInitialized) {
      return;
    }
    window.udEditorInitialized = true;
  });
})();
