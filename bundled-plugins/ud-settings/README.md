# UD Settings

UD Settings stellt zentrale Einstellungen für WordPress-Projekte bereit. Das Plugin bündelt wiederverwendbare Grundkonfigurationen, die sonst häufig in der `functions.php` eines Themes landen würden.

Ziel ist eine schlankere Theme-Struktur und eine zentral gepflegte Projektkonfiguration für Editor, Admin-Oberfläche, Medienverarbeitung, Kommentare und Wartungsfunktionen.

## Funktionen

Das Plugin enthält aktuell folgende Bereiche:

- Admin-Oberfläche
- Block-Sichtbarkeit
- Kommentare
- Medien
- Revisionen

## Admin-Oberfläche

Die Option „Admin-Oberfläche“ vereinfacht die WordPress-Administration.

Einzeln steuerbar sind:

- WordPress-Logo aus der Admin-Bar entfernen
- „Neu“-Menü aus der Admin-Bar entfernen
- Archiv-Link aus der Admin-Bar entfernen
- Dashboard-Boxen standardmässig ausblenden

Die Einstellungen greifen teilweise erst nach einem Neuladen der Admin-Seite, da Admin-Bar und Dashboard serverseitig beim Seitenaufbau erzeugt werden.

## Block-Sichtbarkeit

Die Option „Block-Sichtbarkeit“ steuert, welche Blöcke im Editor angeboten werden.

Möglich ist:

- registrierte Blöcke im Editor ausblenden
- Block-Variationen ausblenden
- nach Blöcken suchen
- alle gefilterten Einträge ausschliessen oder freigeben

Ausgeschlossene Blöcke werden nicht deregistriert. Bestehende Inhalte bleiben erhalten und werden weiterhin im Frontend ausgegeben. Die Blöcke werden lediglich im Editor nicht mehr zur Auswahl angeboten.

Zusätzlich können aktuell folgende Core-Block-Variationen ausgeblendet werden:

- `core/heading::stretchy-heading`
- `core/paragraph::stretchy-paragraph`

## Kommentare

Die Option „Kommentare“ deaktiviert die Kommentar-Funktion global.

Wenn aktiviert, werden:

- Kommentare und Trackbacks für Post Types deaktiviert
- Kommentare und Pings im Frontend geschlossen
- bestehende Kommentare im Frontend ausgeblendet
- die Kommentar-Seite im Admin entfernt
- Kommentar-Links aus der Admin-Bar entfernt
- Kommentar-Metaboxen aus dem Dashboard entfernt

## Medien

Die Option „Medien“ steuert Uploads und Bildverarbeitung.

Aktuell verfügbar:

- SVG/SVGZ Upload erlauben
- grosse Bilder automatisch auf 2560 px begrenzen
- im Editor standardmässig die Bildgrösse „Maximale Grösse“ verwenden
- neu erzeugte WordPress-Bilddateien von JPEGs optional als AVIF oder WebP speichern

Die JPEG-Konvertierung betrifft von WordPress neu erzeugte Bilddateien. Die hochgeladene Originaldatei bleibt unverändert. PNGs und andere Formate bleiben ebenfalls unverändert.

## Revisionen

Die Option „Revisionen“ dient zur Bereinigung alter WordPress-Revisionen.

Einstellbar ist, wie viele Revisionen pro Inhalt behalten werden sollen. Beim Ausführen der Bereinigung bleiben pro Beitrag, Seite oder individuellem Inhaltstyp nur die neuesten Revisionen in der definierten Anzahl erhalten. Ältere Revisionen werden dauerhaft gelöscht.

Die Bereinigung wird bewusst nicht automatisch beim Speichern ausgeführt, sondern über einen separaten Button gestartet.

## Aufbau

Die Plugin-Optionen sind modular aufgebaut.

```text
includes/
└── options/
    ├── admin-cleanup/
    │   └── admin-cleanup.php
    ├── block-visibility/
    │   └── block-visibility.php
    ├── comments/
    │   └── comments.php
    ├── media-settings/
    │   └── media-settings.php
    └── revisions/
        └── revisions.php

src/
└── options/
    ├── admin-cleanup/
    │   ├── edit.js
    │   └── editor.scss
    ├── block-visibility/
    │   ├── edit.js
    │   ├── editor.js
    │   └── editor.scss
    ├── comments/
    │   ├── edit.js
    │   └── editor.scss
    ├── media-settings/
    │   ├── edit.js
    │   └── editor.scss
    └── revisions/
        ├── edit.js
        └── editor.scss
```

## Entwicklung

Abhängigkeiten installieren:

```bash
npm install
```

Build erstellen:

```bash
npm run build
```

Während der Entwicklung kann je nach Projektkonfiguration auch der Watch-Modus verwendet werden:

```bash
npm run start
```

## Hinweise

Das Plugin verändert teilweise globale WordPress-Funktionen. Die einzelnen Optionen sollten deshalb bewusst eingesetzt und nach dem Aktivieren kurz im Backend und Frontend geprüft werden.

Einige Änderungen, insbesondere an Admin-Bar, Dashboard und Kommentarmenü, werden erst nach dem Neuladen der Admin-Seite sichtbar.

Bereits vorhandene Medien, Bildgrössen und Revisionen werden nicht automatisch rückwirkend angepasst. Die Revisionen-Bereinigung muss manuell gestartet werden.

## Autor

[ulrich.digital gmbh](https://ulrich.digital)

## Lizenz

GPL v2 or later
[https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)
