
# UD Settings

UD Settings stellt zentrale Einstellungen für WordPress-Projekte bereit.

Das Plugin bündelt wiederverwendbare Grundkonfigurationen, die sonst häufig in der `functions.php` eines Themes landen würden. Ziel ist eine schlankere Theme-Struktur und eine zentral gepflegte Projektkonfiguration für Admin-Oberfläche, Block Editor, Medienverarbeitung, Kommentare und Wartungsfunktionen.

![UD Settings Admin-Oberfläche](assets/ud_settings.webp)

*UD Settings bündelt zentrale WordPress-Einstellungen in einer eigenen Admin-Oberfläche.*

## Funktionen

Aktuell enthält das Plugin folgende Bereiche:

* **Admin-Oberfläche & Rechte**
  Vereinfachung der WordPress-Administration, zum Beispiel durch Ausblenden einzelner Admin-Bar-Elemente und Dashboard-Boxen, Anpassen des Beitrags-Menüs und Freigeben der Datenschutzerklärung für Redaktoren.

* **Block-Sichtbarkeit**
  Steuerung, welche Blöcke und Block-Variationen im Block Editor zur Auswahl stehen.

* **Kommentare**
  Globale Deaktivierung der Kommentar-Funktion inklusive Admin-Menü, Admin-Bar und Frontend-Ausgabe.

* **Medien**
  Einstellungen für Uploads und Bildverarbeitung, unter anderem SVG-Uploads, maximale Bildgrössen und optionale WebP-/AVIF-Erzeugung.

* **Editor-Inserter**
  Vereinfachung des Block-Inserters, etwa durch Reduktion auf eigene Vorlagen und lokale Medienquellen.

* **Redaktionshilfe**
  Kurzanleitung für Redaktoren als Dashboard-Widget mit frei gepflegten Abschnitten und optionalen Screenshots.

* **Revisionen**
  Manuelle Bereinigung alter Revisionen mit einstellbarer Anzahl zu behaltender Revisionen pro Inhalt.

## Admin-Oberfläche & Rechte

Die Option **Admin-Oberfläche & Rechte** vereinfacht die WordPress-Administration und steuert ausgewählte zentrale Berechtigungen.

Einzeln steuerbar sind:

* WordPress-Logo aus der Admin-Bar entfernen
* „Neu“-Menü aus der Admin-Bar entfernen
* Archiv-Link aus der Admin-Bar entfernen
* Dashboard-Boxen standardmässig ausblenden
* Beiträge umbenennen
* Beiträge im Admin-Menü ausblenden
* Datenschutzerklärung für Redaktoren freigeben

Die Einstellungen greifen teilweise erst nach einem Neuladen der Admin-Seite, da Admin-Bar und Dashboard serverseitig beim Seitenaufbau erzeugt werden.

Die Freigabe der Datenschutzerklärung betrifft nur die in WordPress hinterlegte Datenschutzerklärungs-Seite und nur Benutzer, die grundsätzlich Seiten bearbeiten dürfen.

## Block-Sichtbarkeit

Die Option **Block-Sichtbarkeit** steuert, welche Blöcke und Block-Variationen im Block Editor angeboten werden.

Möglich ist:

* registrierte Blöcke im Editor ausblenden
* Block-Variationen ausblenden
* nach Blöcken suchen
* alle gefilterten Einträge ausschliessen oder freigeben

Ausgeschlossene Blöcke werden nicht deregistriert. Bestehende Inhalte bleiben erhalten und werden weiterhin im Frontend ausgegeben. Die Blöcke werden lediglich im Editor nicht mehr zur Auswahl angeboten.

Zusätzlich können aktuell folgende Core-Block-Variationen ausgeblendet werden:

* `core/heading::stretchy-heading`
* `core/paragraph::stretchy-paragraph`

Vorlagen und externe Pattern-Quellen werden im Bereich **Editor-Inserter** gesteuert.

## Kommentare

Die Option **Kommentare** deaktiviert die Kommentar-Funktion global.

Wenn aktiviert, werden:

* Kommentare und Trackbacks für Post Types deaktiviert
* Kommentare und Pings im Frontend geschlossen
* bestehende Kommentare im Frontend ausgeblendet
* die Kommentar-Seite im Admin entfernt
* Kommentar-Links aus der Admin-Bar entfernt
* Kommentar-Metaboxen aus dem Dashboard entfernt

## Medien

Die Option **Medien** steuert Uploads und Bildverarbeitung.

Aktuell verfügbar:

* SVG/SVGZ Upload erlauben
* grosse Bilder automatisch auf 2560 px begrenzen
* im Editor standardmässig die Bildgrösse „Maximale Grösse“ verwenden
* neu erzeugte WordPress-Bilddateien von JPEGs optional als AVIF oder WebP speichern

Die JPEG-Konvertierung betrifft nur von WordPress neu erzeugte Bilddateien. Die hochgeladene Originaldatei bleibt unverändert. PNGs und andere Formate bleiben ebenfalls unverändert.

Bereits vorhandene Medien und Bildgrössen werden nicht rückwirkend angepasst.

## Editor-Inserter

Die Option **Editor-Inserter** vereinfacht den Block-Inserter.

Aktuell verfügbar:

* nur eigene Vorlagen anzeigen
* nur lokale Mediathek anzeigen

Bei aktiver Vorlagen-Einschränkung werden Core-, Theme-, Plugin- und Remote-Vorlagen aus dem Inserter entfernt. Selbst im Editor erstellte Vorlagen bleiben sichtbar.

Bei aktiver Medien-Einschränkung werden externe Medienquellen wie Openverse aus dem Medien-Tab des Inserters entfernt.

## Redaktionshilfe

Die Option **Redaktionshilfe** stellt eine Kurzanleitung als Dashboard-Widget bereit.

Möglich ist:

* Dashboard-Widget aktivieren oder deaktivieren
* Widget-Titel festlegen
* mehrere Abschnitte mit HTML-Inhalt pflegen
* Screenshots je Abschnitt hochladen
* Screenshots im Dashboard per Lightbox vergrössern

## Revisionen

Die Option **Revisionen** dient zur Bereinigung alter WordPress-Revisionen.

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
    ├── editor-help/
    │   └── editor-help.php
    ├── editor-inserter/
    │   └── editor-inserter.php
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
    ├── editor-help/
    │   ├── dashboard.js
    │   ├── edit.js
    │   └── editor.scss
    ├── editor-inserter/
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

Während der Entwicklung kann der Watch-Modus verwendet werden:

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
