# ulrich.digital Block Theme

WordPress Block Theme mit getrennten Quellen und Builds für Frontend, Editor und gemeinsam genutzte Assets.

## Entwicklung

```text
src/    Quellen für SCSS und JavaScript
build/  kompilierte Assets
```

```bash
npm install
npm run build
```

Für die laufende Entwicklung steht `npm run watch` zur Verfügung.

Das Theme verwendet **Google Sans** als Standardschrift. Die normalen und kursiven Variable Fonts liegen unter `assets/fonts/`.

Allgemeine Theme-Funktionen umfassen unter anderem:

- getrennte Styles und Scripts für Frontend, Editor und Shared-Kontext
- internes Branding für den WordPress-Anmeldebildschirm
- öffentliches Seitenlogo über die WordPress-Custom-Logo-Funktion
- Blockstile „Textlink mit Pfeil“ und „UD Bildkarte“

## UD Settings

Das Theme enthält den Plugin `UD Settings` unter:

```text
bundled-plugins/ud-settings/
```

Beim Aktivieren des Themes wird er nach `wp-content/plugins/ud-settings/` kopiert und aktiviert, sofern er dort noch nicht vorhanden ist.

Ein bereits installierter Plugin wird nicht automatisch überschrieben. Nach Änderungen müssen deshalb die gebündelte und die installierte Kopie synchronisiert werden.

Plugin entwickeln und bauen:

```bash
cd bundled-plugins/ud-settings
npm install
npm run build
```

`node_modules/` wird nicht versioniert.

## Autor

[ulrich.digital gmbh](https://ulrich.digital)

## Lizenz

[MIT](https://opensource.org/licenses/MIT)
