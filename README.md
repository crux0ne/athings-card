# Athings Card

Eine HACS-kompatible Lovelace-Karte für Home Assistant, die alle Sensoren eines Airthings-Geräts in einer kompakten, optisch ansprechenden Übersicht darstellt.

## Features

- Mehrere Sensorwerte eines Geräts in einer Karte
- Layout ähnlich Airthings-App/Dashboard-Karten
- HACS-kompatibel (Frontend / Dashboard)
- Unterstützt:
  - automatische Erkennung über `entity_prefix`
  - manuelle Sensorliste über `entities`
- Header mit Titel, Untertitel, Akku und letzter Synchronisation

## Installation

### HACS (empfohlen)

1. Repository auf GitHub erstellen und diese Dateien ins Repo-Root legen.
2. In Home Assistant: HACS -> Frontend -> Menü (3 Punkte) -> `Custom repositories`
3. Repository-URL hinzufügen, Kategorie `Dashboard`
4. `Athings Card` installieren
5. Home Assistant neu laden / Browser Cache aktualisieren

### Manuell

1. `athings-card.js` nach `<config>/www/` kopieren
2. Ressource hinzufügen:
   - URL: `/local/athings-card.js`
   - Typ: `module`
3. Dashboard neu laden

## Beispiel 1: Automatisch per Prefix

```yaml
type: custom:athings-card
title: Arbeitszimmer
subtitle: Home
entity_prefix: sensor.arbeitszimmer_
battery_entity: sensor.arbeitszimmer_battery
updated_entity: sensor.arbeitszimmer_last_update
header_chip_text: View Plus
columns: 3
```

## Beispiel 2: Manuell definierte Sensoren

```yaml
type: custom:athings-card
title: Arbeitszimmer
subtitle: Home
header_chip_text: View Plus
battery_entity: sensor.arbeitszimmer_battery
updated_entity: sensor.arbeitszimmer_last_update
entities:
  - entity: sensor.arbeitszimmer_radon
    label: RADON
    icon: mdi:radioactive
    top_unit: Bq/m3
    dot_color: "#d94141"
  - entity: sensor.arbeitszimmer_pm25
    label: PM 2.5
    icon: mdi:dots-hexagon
    top_unit: µg/m3
    dot_color: "#f4b400"
  - entity: sensor.arbeitszimmer_co2
    label: CO2
    icon: mdi:cloud-outline
    top_unit: ppm
  - entity: sensor.arbeitszimmer_humidity
    label: FEUCHTE
    icon: mdi:water-percent
    unit: "%"
  - entity: sensor.arbeitszimmer_temperature
    label: TEMP
    icon: mdi:thermometer
    unit: "°"
  - entity: sensor.arbeitszimmer_voc
    label: VOC
    icon: mdi:weather-windy
    top_unit: ppb
    dot_color: "#f4b400"
```

## Konfiguration

- `title` (string): Kartentitel
- `subtitle` (string): Untertitel (z. B. Standort)
- `header_chip_text` (string): Text rechts im Header (z. B. `View Plus`)
- `entity_prefix` (string): Prefix zur automatischen Sensor-Erkennung
- `battery_entity` (string): Entität für Akkuanzeige
- `updated_entity` (string): Entität mit Zeitstempel der letzten Synchronisation
- `columns` (number): Spaltenanzahl (1-4, Standard `3`)
- `entities` (array): Manuelle Sensor-Definitionen

### `entities[]` Felder

- `entity` (string): Entity ID
- `label` (string): Anzeige-Label
- `icon` (string): MDI Icon
- `top_unit` (string): Einheit oberhalb der Zahl
- `unit` (string): Einheit inline neben der Zahl
- `dot_color` (string): Farbpunktsymbol vor dem Label
- `precision` (number): Dezimalstellen

## GitHub / HACS Hinweise

Für bessere Auffindbarkeit im GitHub-Repository Topics setzen:

- `home-assistant`
- `lovelace`
- `hacs`
- `frontend`
- `airthings`

## Lizenz

MIT
