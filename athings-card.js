class AthingsCard extends HTMLElement {
  static getStubConfig() {
    return {
      title: "Arbeitszimmer",
      subtitle: "Home",
      entity_prefix: "sensor.arbeitszimmer_",
      battery_entity: "sensor.arbeitszimmer_battery",
      updated_entity: "sensor.arbeitszimmer_last_update",
      columns: 3,
      show: {
        radon: true,
        pm25: true,
        co2: true,
        humidity: true,
        temperature: true,
        voc: true,
      },
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Config is required");
    }

    if (!config.entity_prefix && !Array.isArray(config.entities)) {
      throw new Error("Set `entity_prefix` or provide `entities`");
    }

    this._config = {
      columns: 3,
      icon_color: "var(--secondary-text-color)",
      accent_color: "var(--primary-color)",
      ...config,
    };

    if (!this.shadowRoot) {
      this._renderBase();
    }

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    const count = this._resolveSensors().length || 6;
    return Math.max(3, Math.ceil(count / (this._config?.columns || 3)) + 2);
  }

  _renderBase() {
    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
      }

      ha-card {
        border-radius: 22px;
        overflow: hidden;
      }

      .shell {
        display: flex;
        flex-direction: column;
      }

      .header {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px 12px;
        padding: 20px 20px 12px;
        align-items: start;
      }

      .title {
        font-size: 1.85rem;
        line-height: 1.15;
        font-weight: 700;
        color: var(--primary-text-color);
        margin: 0;
      }

      .subtitle {
        margin-top: 3px;
        color: var(--secondary-text-color);
        font-size: 1rem;
        line-height: 1.2;
      }

      .meta {
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: 0.9rem;
      }

      .header-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .chip {
        border: 1.5px solid var(--primary-text-color);
        border-radius: 999px;
        padding: 4px 12px;
        font-size: 0.95rem;
        line-height: 1.2;
        color: var(--primary-text-color);
        background: transparent;
      }

      .battery {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--secondary-text-color);
        font-size: 0.9rem;
      }

      .battery-icon {
        width: 24px;
        height: 12px;
        border: 2px solid currentColor;
        border-radius: 3px;
        position: relative;
        box-sizing: border-box;
      }

      .battery-icon::after {
        content: "";
        position: absolute;
        right: -5px;
        top: 2px;
        width: 3px;
        height: 4px;
        border-radius: 1px;
        background: currentColor;
      }

      .battery-fill {
        position: absolute;
        top: 1px;
        left: 1px;
        bottom: 1px;
        border-radius: 1px;
        background: var(--success-color, #2db84d);
      }

      .divider {
        height: 1px;
        background: var(--divider-color);
      }

      .grid {
        padding: 16px 14px 14px;
        display: grid;
        grid-template-columns: repeat(var(--columns, 3), minmax(0, 1fr));
        gap: 12px 8px;
      }

      .sensor {
        display: grid;
        grid-template-columns: 42px 1fr;
        column-gap: 8px;
        align-items: center;
        padding: 8px 6px;
        border-radius: 14px;
      }

      .sensor-icon {
        display: grid;
        place-items: center;
        color: var(--icon-color, var(--secondary-text-color));
        opacity: 0.95;
      }

      .sensor-icon ha-icon {
        --mdc-icon-size: 32px;
      }

      .sensor-unit {
        color: var(--primary-text-color);
        font-size: 0.85rem;
        line-height: 1.1;
        font-weight: 600;
      }

      .sensor-value {
        display: flex;
        align-items: baseline;
        gap: 4px;
        color: var(--primary-text-color);
        line-height: 1.05;
        margin-top: 2px;
      }

      .sensor-value strong {
        font-size: 2.1rem;
        font-weight: 700;
        letter-spacing: -0.03em;
      }

      .sensor-value .inline-unit {
        color: var(--primary-text-color);
        font-size: 1rem;
        font-weight: 600;
      }

      .sensor-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
        color: var(--primary-text-color);
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--dot-color, transparent);
        flex: 0 0 auto;
      }

      .empty {
        padding: 16px 20px 20px;
        color: var(--secondary-text-color);
      }

      @media (max-width: 640px) {
        .header {
          grid-template-columns: 1fr;
        }

        .header-right {
          align-items: flex-start;
        }

        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .sensor-value strong {
          font-size: 1.7rem;
        }
      }
    `;

    this._card = document.createElement("ha-card");
    this._card.innerHTML = `
      <div class="shell">
        <div class="header">
          <div class="header-left"></div>
          <div class="header-right"></div>
        </div>
        <div class="divider"></div>
        <div class="body"></div>
      </div>
    `;

    this.shadowRoot.append(style, this._card);
  }

  _render() {
    if (!this._card || !this._config) return;

    const headerLeft = this._card.querySelector(".header-left");
    const headerRight = this._card.querySelector(".header-right");
    const body = this._card.querySelector(".body");

    const sensors = this._resolveSensors();
    const battery = this._getState(this._config.battery_entity);
    const updated = this._getState(this._config.updated_entity);
    const columns = Math.max(1, Math.min(4, Number(this._config.columns) || 3));

    headerLeft.innerHTML = "";
    headerRight.innerHTML = "";
    body.innerHTML = "";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = this._config.title || "Airthings";

    const subtitle = document.createElement("div");
    subtitle.className = "subtitle";
    subtitle.textContent = this._config.subtitle || this._config.device_name || "";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = updated ? `Synchronisiert: ${this._formatRelative(updated)}` : "";

    headerLeft.append(title);
    if (subtitle.textContent) headerLeft.append(subtitle);
    if (meta.textContent) headerLeft.append(meta);

    if (this._config.header_chip_text) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = this._config.header_chip_text;
      headerRight.append(chip);
    }

    if (battery) {
      const batteryWrap = document.createElement("div");
      batteryWrap.className = "battery";
      const batteryPercent = this._toNumber(battery.state);
      const batteryColor = this._batteryColor(batteryPercent);
      const fill = Number.isFinite(batteryPercent)
        ? `${Math.max(4, Math.min(100, batteryPercent))}%`
        : "35%";

      batteryWrap.innerHTML = `
        <span class="battery-icon">
          <span class="battery-fill" style="width:${fill};background:${batteryColor};"></span>
        </span>
        <span>${Number.isFinite(batteryPercent) ? `${Math.round(batteryPercent)}%` : battery.state}</span>
      `;
      headerRight.append(batteryWrap);
    }

    if (!sensors.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Keine passenden Sensoren gefunden. Prüfe `entity_prefix` oder `entities`.";
      body.append(empty);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.setProperty("--columns", String(columns));
    grid.style.setProperty("--icon-color", this._config.icon_color);

    sensors.forEach((sensor) => {
      const tile = document.createElement("div");
      tile.className = "sensor";

      const icon = document.createElement("div");
      icon.className = "sensor-icon";
      icon.innerHTML = `<ha-icon icon="${sensor.icon}"></ha-icon>`;

      const content = document.createElement("div");

      const unitLine = document.createElement("div");
      unitLine.className = "sensor-unit";
      unitLine.textContent = sensor.topUnit || "";

      const valueLine = document.createElement("div");
      valueLine.className = "sensor-value";
      valueLine.innerHTML = `<strong>${sensor.value}</strong>${sensor.inlineUnit ? `<span class="inline-unit">${sensor.inlineUnit}</span>` : ""}`;

      const labelLine = document.createElement("div");
      labelLine.className = "sensor-label";
      labelLine.innerHTML = `${sensor.dotColor ? `<span class="dot" style="--dot-color:${sensor.dotColor};"></span>` : ""}<span>${sensor.label}</span>`;

      if (!sensor.topUnit) {
        unitLine.style.visibility = "hidden";
      }

      content.append(unitLine, valueLine, labelLine);
      tile.append(icon, content);
      grid.append(tile);
    });

    body.append(grid);
  }

  _resolveSensors() {
    if (!this._hass || !this._config) return [];

    const explicit = Array.isArray(this._config.entities) ? this._config.entities : null;
    const specs = explicit && explicit.length ? explicit : this._buildSpecsFromPrefix();

    return specs
      .map((spec) => this._resolveSensorSpec(spec))
      .filter(Boolean);
  }

  _buildSpecsFromPrefix() {
    const prefix = this._config.entity_prefix;
    if (!prefix || !this._hass) return [];

    const stateKeys = Object.keys(this._hass.states || {});
    return stateKeys
      .filter((entityId) => entityId.startsWith(prefix))
      .filter((entityId) => !entityId.endsWith("_battery") && !entityId.endsWith("_last_update"))
      .map((entityId) => ({ entity: entityId }))
      .sort((a, b) => (this._sensorOrder(a.entity) - this._sensorOrder(b.entity)) || a.entity.localeCompare(b.entity));
  }

  _resolveSensorSpec(spec) {
    const entityId = typeof spec === "string" ? spec : spec.entity;
    if (!entityId) return null;

    const stateObj = this._getState(entityId);
    if (!stateObj) return null;

    const meta = this._inferSensorMeta(stateObj, spec);
    if (spec.enabled === false) return null;
    if (!this._isSensorVisible(meta.key, entityId)) return null;

    const numeric = this._toNumber(stateObj.state);
    const precision = typeof spec.precision === "number" ? spec.precision : meta.precision;
    const value = Number.isFinite(numeric)
      ? this._formatNumber(numeric, precision)
      : (stateObj.state ?? "-");

    return {
      entityId,
      label: spec.label || meta.label,
      icon: spec.icon || meta.icon,
      value,
      sensorKey: meta.key,
      topUnit: spec.top_unit ?? meta.topUnit,
      inlineUnit: spec.unit ?? meta.inlineUnit,
      dotColor: spec.dot_color || meta.dotColor,
    };
  }

  _inferSensorMeta(stateObj, spec) {
    const entityId = stateObj.entity_id || "";
    const attrs = stateObj.attributes || {};
    const deviceClass = attrs.device_class || "";
    const unit = attrs.unit_of_measurement || "";
    const key = entityId.split(".")[1] || entityId;
    const normalized = key.toLowerCase();

    const map = [
      { key: "radon", match: ["radon"], label: "Radon", icon: "mdi:radioactive", topUnit: "Bq/m3", inlineUnit: "", dotColor: "#d94141", precision: 0 },
      { key: "pm25", match: ["pm25", "pm_2_5", "pm2_5"], label: "PM 2.5", icon: "mdi:dots-hexagon", topUnit: "µg/m3", inlineUnit: "", dotColor: "#f4b400", precision: 0 },
      { key: "co2", match: ["co2"], label: "CO2", icon: "mdi:cloud-outline", topUnit: "ppm", inlineUnit: "", dotColor: "", precision: 0 },
      { key: "humidity", match: ["humidity"], label: "Feuchte", icon: "mdi:water-percent", topUnit: "", inlineUnit: "%", dotColor: "", precision: 0 },
      { key: "temperature", match: ["temperature", "temp"], label: "Temp", icon: "mdi:thermometer", topUnit: "", inlineUnit: "°", dotColor: "", precision: 0 },
      { key: "voc", match: ["voc"], label: "VOC", icon: "mdi:weather-windy", topUnit: "ppb", inlineUnit: "", dotColor: "#f4b400", precision: 0 },
      { key: "pressure", match: ["pressure"], label: "Druck", icon: "mdi:gauge", topUnit: unit, inlineUnit: "", dotColor: "", precision: 0 },
      { key: "illuminance", match: ["illuminance", "light"], label: "Licht", icon: "mdi:brightness-6", topUnit: unit, inlineUnit: "", dotColor: "", precision: 0 },
    ];

    const byName = map.find((item) => item.match.some((m) => normalized.includes(m)));
    if (byName) {
      return byName;
    }

    if (deviceClass === "temperature") {
      return { key: "temperature", label: "Temp", icon: "mdi:thermometer", topUnit: "", inlineUnit: unit || "°", dotColor: "", precision: 0 };
    }
    if (deviceClass === "humidity") {
      return { key: "humidity", label: "Feuchte", icon: "mdi:water-percent", topUnit: "", inlineUnit: unit || "%", dotColor: "", precision: 0 };
    }
    if (deviceClass === "carbon_dioxide") {
      return { key: "co2", label: "CO2", icon: "mdi:molecule-co2", topUnit: unit || "ppm", inlineUnit: "", dotColor: "", precision: 0 };
    }

    const fallbackLabel = this._sanitizeSensorLabel(
      spec.label || attrs.friendly_name || key.replaceAll("_", " ")
    );

    return {
      key: this._guessSensorKey(entityId, deviceClass),
      label: fallbackLabel,
      icon: spec.icon || attrs.icon || "mdi:chart-line",
      topUnit: unit && unit !== "%" && unit !== "°C" ? unit : "",
      inlineUnit: unit === "%" ? "%" : (unit === "°C" ? "°" : ""),
      dotColor: "",
      precision: Number.isFinite(this._toNumber(stateObj.state)) ? 0 : undefined,
    };
  }

  _sensorOrder(entityId) {
    const value = String(entityId || "").toLowerCase();
    const order = [
      ["radon", 10],
      ["pm25", 20],
      ["pm_2_5", 20],
      ["co2", 30],
      ["humidity", 40],
      ["temperature", 50],
      ["temp", 50],
      ["voc", 60],
    ];
    const found = order.find(([needle]) => value.includes(needle));
    return found ? found[1] : 999;
  }

  _isSensorVisible(sensorKey, entityId) {
    const show = this._config?.show;
    if (!show || typeof show !== "object") return true;

    if (sensorKey && Object.prototype.hasOwnProperty.call(show, sensorKey)) {
      return show[sensorKey] !== false;
    }

    if (entityId && Object.prototype.hasOwnProperty.call(show, entityId)) {
      return show[entityId] !== false;
    }

    return true;
  }

  _guessSensorKey(entityId, deviceClass) {
    const value = String(entityId || "").toLowerCase();
    if (value.includes("radon")) return "radon";
    if (value.includes("pm25") || value.includes("pm_2_5") || value.includes("pm2_5")) return "pm25";
    if (value.includes("co2") || deviceClass === "carbon_dioxide") return "co2";
    if (value.includes("humidity") || deviceClass === "humidity") return "humidity";
    if (value.includes("temperature") || value.includes("temp") || deviceClass === "temperature") return "temperature";
    if (value.includes("voc")) return "voc";
    if (value.includes("pressure")) return "pressure";
    if (value.includes("illuminance") || value.includes("light")) return "illuminance";
    return "";
  }

  _sanitizeSensorLabel(label) {
    let value = String(label || "").trim();
    if (!value) return value;

    const removalParts = [
      this._config?.title,
      this._config?.subtitle,
      this._config?.device_name,
    ]
      .filter(Boolean)
      .map((part) => String(part).trim())
      .filter((part) => part.length >= 2);

    removalParts.forEach((part) => {
      const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      value = value
        .replace(new RegExp(`^${escaped}[\\s:_-]*`, "i"), "")
        .replace(new RegExp(`[\\s:_-]*${escaped}$`, "i"), "");
    });

    return value.trim() || String(label || "").trim();
  }

  _formatNumber(value, precision) {
    const p = Number.isFinite(precision) ? precision : (Number.isInteger(value) ? 0 : 1);
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: p,
      maximumFractionDigits: p,
    }).format(value);
  }

  _formatRelative(stateObj) {
    const raw = stateObj.state || stateObj.last_changed;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return String(raw);

    const diffMs = Date.now() - dt.getTime();
    const diffMin = Math.round(diffMs / 60000);

    if (diffMin <= 1) return "gerade eben";
    if (diffMin < 60) return `vor ${diffMin} Minuten`;

    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `vor ${diffH} Stunden`;

    return dt.toLocaleString();
  }

  _batteryColor(percent) {
    if (!Number.isFinite(percent)) return "var(--success-color, #2db84d)";
    if (percent <= 15) return "var(--error-color, #d94141)";
    if (percent <= 35) return "var(--warning-color, #f4b400)";
    return "var(--success-color, #2db84d)";
  }

  _toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }

  _getState(entityId) {
    if (!entityId || !this._hass) return null;
    return this._hass.states?.[entityId] || null;
  }
}

customElements.define("athings-card", AthingsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "athings-card",
  name: "Athings Card",
  description: "A styled Airthings device overview card for Home Assistant",
});
