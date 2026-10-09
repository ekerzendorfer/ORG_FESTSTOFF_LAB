# ORG_FESTSTOFF_LAB

**Version:** v0.2.0 – Voranalyse plus gezielte Schmelzpunkt-Bestätigung

Browserbasierte Mini-App im Projekt **CHEMIE mit KI**.

## Zweck

Klassische Vorproben an einem unbekannten organischen Feststoff liefern allgemeine Strukturhinweise, ohne die Stoffidentität vorwegzunehmen.

v0.1 enthält:
- Lösungsverhalten
- pH einer wässrigen Phase
- Hydrogencarbonatprobe
- Fe(III)-Probe
- Brennprobe
- Befundjournal
- Zusammenfassung allgemeiner Strukturmerkmale
- Single-Mode
- Bridge-Modus für CHEMIE_ANALYTIK_HUB

Der Schmelzpunkt bleibt bewusst einem späteren Bestätigungsschritt vorbehalten.

## Datenprinzip

Das VCÖ-01-Modell enthält keine Stoffbezeichnung. Hinterlegt werden ausschließlich kuratierte Beobachtungen und Regeln für allgemeine Strukturmerkmale.

## Dateien

- `index.html`
- `styles.css`
- `app.js`
- `data/models.json`
- `ORG_FESTSTOFF_LAB_SPEC_v0.1.md`


## v0.2 – Schmelz-/Mischschmelzpunkt-Bestätigung

Zusätzlich zum bisherigen `qualitative_screening` unterstützt die App einen gezielten Hub-Modus `melting_confirmation`.

Ablauf:
1. Schmelzbereich der unbekannten Probe messen
2. Schmelzbereich des aus der Strukturhypothese gewählten Referenzstandards messen
3. 1:1-Mischprobe herstellen und Mischschmelzpunkt messen

Erst wenn Probe und Referenz übereinstimmen und die Mischung keine relevante Depression oder Verbreiterung zeigt, liefert die App `MELTING_POINT_CONFIRMATION` mit `identity_status: confirmed`.

Für VCÖ-01 ist ein kuratiertes Salicylsäure-Profil hinterlegt. Der Single-Mode der qualitativen Voranalyse bleibt unverändert.
