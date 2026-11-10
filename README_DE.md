# ELBE LIVE – Aufgabe 2, Phase 1

Zwei responsive Landingpages zu einem fiktiven Produkt mit echten Live-Daten der PEGELONLINE REST-API v2, Station HAMBURG ST. PAULI. Beide Varianten verwenden identische deutsche Inhalte, die gleichen Messdaten und dieselbe Implementierung der interaktiven 24h/7d/30d-Zeitreise. Die Gestaltung (Layout, Bildsprache, Typografie, Kontrast und Farben) unterscheidet sich deutlich.

## Veröffentlichen auf GitHub Pages

Neues öffentliches Repository erstellen, **alle Inhalte** dieses Ordners auf Root-Ebene hochladen, unter Settings → Pages → Deploy from a branch → `main` / `(root)` aktivieren. Die vier URLs liegen anschließend unter `/`, `/variante-a/`, `/variante-b/` und `/ki-logbuch/`.

## Technische Eckpunkte

- Direkter `fetch()` aus dem Browser, offizieller und schlüsselfreier PEGELONLINE-Endpunkt
- `/stations/{uuid}/W/currentmeasurement.json` für aktuellen Messwert
- `/stations/{uuid}/W/measurements.json?start=P30D` für historischen Messverlauf
- Alle fünf Minuten neu laden, außerdem beim Öffnen und nach Rückkehr in den Tab
- Lade-/Fehlerzustände, historische Werte, animierter Timeline-Slider, Play/Pause, Trendvergleich, Diagramm, Wasserflächen-Visualisierung
- Fallback für fehlende Messdaten, Quellenangabe, `noindex`, `robots.txt`, keine externen JS-Abhängigkeiten
- Alle Bilder wurden mit KI generiert und sind als solche gekennzeichnet

## Prüfpflicht vor der Abgabe

Die lokale interaktive Oberfläche kann mit simulierten API-Antworten geprüft werden. **Echte Live-Funktionsprüfung in GitHub Pages** (Browser-Netzwerkansicht, Status 200, Antworten und zwei zeitlich verschiedene Messwerte) muss nach der Veröffentlichung erfolgen und dokumentiert werden. Das KI-Logbuch ist entsprechend transparent gekennzeichnet. Eigene Bearbeitungen, abschließende Designpräferenz und die wirklichen Test-Screenshots bitte persönlich ergänzen.

Offizielle Dokumentation: https://pegelonline.wsv.de/webservice/dokuRestapi

Studienprojekt der Kunstschule Wandsbek, keine offizielle Seite.
