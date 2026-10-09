# ORG_FESTSTOFF_LAB v0.1

## Ziel
Kleine browserbasierte Voranalyse unbekannter organischer Feststoffe. Sie sammelt Beobachtungen und gibt **nur allgemeine Strukturmerkmale** zurück.

## VCÖ-01 Methoden
- Lösungsverhalten
- pH einer wässrigen Phase
- Hydrogencarbonatprobe
- Fe(III)-Probe
- Brennprobe

Der Schmelzpunkt ist ausdrücklich nicht Teil der Voranalyse.

## Didaktischer Grundsatz
Die App identifiziert keinen Stoff. Zulässige Aussagen sind z. B.:
- Carbonsäurefunktion stark gestützt
- phenolische OH-Gruppe stark gestützt
- Hinweis auf ungesättigtes/aromatisches System

Unzulässig sind Stoffname, substance_id oder identity_status=confirmed.

## Hub-Modus
Aufruf mit `?bridge=1&run=...`.

Erwarteter Input:
- mode = qualitative_screening
- model_ref
- display_label
- allowed_methods
- required_evidence
- output_policy.identify_substance = false

Rückgabe:
- analysis_type = ORGANIC_SOLID_SCREENING
- measurement.methods_completed
- measurement.observations
- evaluation.supported_features
