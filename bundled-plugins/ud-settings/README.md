# UD Settings

WordPress-Plugin für wiederverwendbare Projekt- und Editor-Einstellungen. Er hält administrative Funktionen aus dem Theme heraus und bündelt sie in einer zentralen Oberfläche.

![UD Settings Admin-Oberfläche](assets/ud_settings.webp)

## Funktionen

- Admin-Oberfläche bereinigen
- Block-Sichtbarkeit steuern
- Kommentare global deaktivieren
- Editor-Werkzeuge und Standardvorlagen reduzieren
- Inserter und Medienquellen einschränken
- Redaktionshilfe im Dashboard bereitstellen
- Medien- und Bildverarbeitung konfigurieren
- Revisionen bereinigen

Ausgeblendete Blöcke werden nicht deregistriert; vorhandene Inhalte bleiben erhalten. Medien und Revisionen werden nur bei ausdrücklich ausgelösten Aktionen verändert.

## Entwicklung

```bash
npm install
npm run build
```

Watch-Modus:

```bash
npm run start
```

Neue Optionen werden modular unter `includes/options/` und `src/options/` angelegt. Kompilierte Dateien liegen in `build/`.

Wenn der Plugin in einem Theme gebündelt wird, müssen die gebündelte und die installierte Kopie nach Änderungen synchronisiert werden.

## Autor

[ulrich.digital gmbh](https://ulrich.digital)

## Lizenz

[GPL v2 or later](https://www.gnu.org/licenses/gpl-2.0.html)
