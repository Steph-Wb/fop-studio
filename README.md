# FOP Studio

[Projektseite](https://Steph-Wb.github.io/fop-studio/) · [HTML herunterladen](https://Steph-Wb.github.io/fop-studio/FOP-Studio.html) · [Buy me a coffee](https://buymeacoffee.com/stephanweibel)

Struktogrammeditor für abas FOP als einzelne HTML-Datei. Keine Installation, kein Backend und kein Upload geöffneter Programme.

## Verwenden

FOP-Studio.html herunterladen und in einem aktuellen Edge oder Chrome öffnen. Die heruntergeladene Datei funktioniert offline. Externe Unterstützungslinks benötigen Internet.

- ETF und SPX 6.5 / TREE 17 importieren; Zeichensatz in der Vorschau prüfen.
- Bedingungen und Texte bearbeiten, Strukturen einfügen, kopieren, verschieben und einklappen.
- Projekte als .fopproj speichern; FOP mit wählbarem Ausgabezeichensatz exportieren.
- Mehrere Dateien, Suche, Prozedurnavigation, DE/EN-Strukturbegriffe und Lesemodus.

Vorschauversion: Generiertes FOP vor produktiver Nutzung in abas prüfen. Automatisierte Tests ersetzen keine abas-Ausführungstests.

## Entwickeln

Node.js 24 verwenden. Der Build benötigt keine Laufzeitbibliotheken.

```sh
npm ci
node build.mjs
npm test
npm run check
npm run lint
npm run format:check
node build-site.mjs
```

Ausgaben: dist/FOP-Studio.html und site/ für GitHub Pages. publication.json enthält Unterstützungslink, Repository-URL und Copyright-Namen. Keine Widgets, externen Schriftarten oder Telemetrie.

## GitHub Pages

In Settings → Pages die Quelle GitHub Actions wählen. Der Workflow prüft Pull Requests und veröffentlicht nach erfolgreichen Tests den main-Branch.

## Beiträge

Fehler mit kleinen, frei teilbaren Beispielen beschreiben. Keine Kundendaten, Zugangsdaten, kommerziellen Generatoren oder abas-Handbücher hochladen. Die öffentlichen Tests verwenden synthetische Beispiele.

## Lizenz

MIT, siehe LICENSE. Unabhängiges Projekt; kein offizielles abas-Produkt.

## Sprache des FOP-Codes

Unter **Exportprofil → Sprache des generierten FOP-Codes** zwischen Deutsch und Englisch wählen. Die Einstellung wird im Projekt gespeichert und ist unabhängig von DE/EN für Strukturbegriffe. Bestehende Projekte ohne Spracheinstellung verwenden Deutsch.

Der Generator verwendet vollständige, kleingeschriebene Befehle: .weiter / .continue, .formel / .formula, .art / .type und .ende / .end. Der Header lautet entsprechend ..!interpreter german translate oder ..!interpreter english translate. Die Option englvar wird nicht gesetzt: Befehlssprache und Sprache der abas-Systemvariablen sind getrennte Einstellungen.

Nur Studio-generierte Befehle werden umgestellt. Eingetragene und importierte Texte, Bedingungen und Variablennamen bleiben unverändert; deren Sprache verantwortet der Anwender. Ein bereits eingefügtes Beispiel bleibt bei einem späteren Sprachwechsel ebenfalls unverändert. Neue Anweisungen und ein frisch geöffnetes Beispiel verwenden die gewählte Code-Sprache.

Anwendervariablen werden mit U| angesprochen. Bei .art / .type steht der deklarierte Name gemäss abas-Syntax ohne U|; beispielsweise .art integer zaehler und danach .formel U|zaehler = 0.

Grundlage: lokale abas-Onlinehilfe, Kapitel FO.INTERPRETER, FO.WEITER, FO.FORMEL, FO.ART und FO.ENDE (Stand 13.10.2023). Die proprietären Unterlagen sind nicht Bestandteil dieses Repositorys. Englisch generierte Programme vor produktiver Nutzung in abas testen.
