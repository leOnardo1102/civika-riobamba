/**
 * CÍVIKA · Mapa interactivo de oficinas (Leaflet + OpenStreetMap)
 *
 * - Todas las oficinas a la vez, con colores por entidad y filtros.
 * - "Mi ubicación": distancia a cada oficina y la más cercana primero.
 * - Mapas base sin clave: Claro (OSM con filtro neutro), Calles (OpenStreetMap) y Satélite (Esri).
 * - Capas propias desde QGIS / OSGeo4W: se listan en web/data/capas/capas.json
 *   y se cargan como GeoJSON (ver GUIA_MAPAS.md).
 *
 * Sin internet: el mapa base no carga, pero las oficinas y el listado siguen funcionando.
 */
(function () {
  "use strict";

  const svg = (d) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    expand: svg('<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>'),
    collapse: svg('<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>'),
    home: svg('<path d="M3 7V3h4"/><path d="M17 3h4v4"/><path d="M21 17v4h-4"/><path d="M7 21H3v-4"/><circle cx="12" cy="12" r="3"/>'),
    pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    route: svg('<path d="M3 11l19-9-9 19-2-8-8-2z"/>'),
    tag: svg('<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>')
  };
  const COLORS = { red: "#DC2626", indigo: "#4F46E5", emerald: "#059669", sky: "#0284C7", amber: "#D97706", blue: "#1D4ED8" };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LETTERS = { Municipio: "M", SRI: "S", Bomberos: "B", ARCSA: "A", Artesanos: "J", IESS: "I" };
  const shortName = (inst) => String(inst.nombre || "").split(" (")[0].replace(/^SRI - /, "SRI · ");
  const insts = () => (typeof CIVIKA_INSTITUTIONS !== "undefined" ? CIVIKA_INSTITUTIONS : []);

  function haversineKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const formatKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`);

  const civikaMap = {
    map: null,
    markers: {},
    filter: "Todas",
    userPos: null,
    userLayer: null,
    layerControl: null,
    customLayersLoaded: false,

    available() { return typeof window.L !== "undefined" && document.getElementById("civikaMap"); },

    // Se crea al abrir la pantalla de Oficinas (Leaflet necesita un contenedor visible)
    ensure() {
      if (!this.available()) return;
      if (this.map) { setTimeout(() => this.map.invalidateSize(), 60); return; }
      const L = window.L;

      this.map = L.map("civikaMap", {
        zoomControl: true, scrollWheelZoom: true, tap: true, attributionControl: true,
        minZoom: 11, maxZoom: 20, zoomSnap: 0.5, zoomDelta: 0.5, wheelPxPerZoomLevel: 90,
        // Evita que se salga a zonas sin información: encuadre amplio del cantón
        maxBounds: [[-1.80, -78.80], [-1.55, -78.50]], maxBoundsViscosity: 0.7
      });
      this.map.attributionControl.setPrefix(false);

      const tile = (url, o) => L.tileLayer(url, Object.assign({ keepBuffer: 4, updateWhenIdle: false }, o));
      // Mapas base gratuitos SIN clave (CARTO ahora exige API key y mostraba "API KEY REQUIRED").
      // "Claro" usa las mismas teselas de OpenStreetMap con un filtro neutro para que los pines resalten.
      const base = {
        "Claro": tile("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20, maxNativeZoom: 19, className: "civika-tiles-light", attribution: "© colaboradores de OpenStreetMap"
        }),
        "Calles": tile("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20, maxNativeZoom: 19, attribution: "© colaboradores de OpenStreetMap"
        }),
        "Satélite": tile("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          // En Riobamba la imagen nativa llega hasta el nivel 18; el 19 se amplía sin perder demasiada nitidez
          maxZoom: 19, maxNativeZoom: 18, className: "civika-tiles-sat", attribution: "Imágenes © Esri, Maxar, Earthstar Geographics"
        })
      };
      // Capas de referencia para satélite (nativas hasta el nivel 18 → nombres de calles nítidos y a escala)
      const refPane = this.map.createPane("civikaRefPane");
      refPane.style.zIndex = 350;
      refPane.style.pointerEvents = "none";
      const labels = tile("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 18, pane: "civikaRefPane", className: "civika-tiles-ref" });
      const roads = tile("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 18, pane: "civikaRefPane", className: "civika-tiles-ref", opacity: 0.92 });
      let satLabels = true;
      try { satLabels = localStorage.getItem("civikaSatLabels") !== "0"; } catch (e) { /* nada */ }
      const syncRefLayers = () => {
        const show = this.currentBase === "Satélite" && satLabels;
        [roads, labels].forEach(l => { if (show && !this.map.hasLayer(l)) l.addTo(this.map); if (!show && this.map.hasLayer(l)) this.map.removeLayer(l); });
        document.querySelectorAll(".civika-sat-labels").forEach(btn => {
          btn.classList.toggle("is-on", satLabels);
          btn.setAttribute("aria-pressed", satLabels ? "true" : "false");
        });
      };
      this.toggleSatLabels = () => {
        satLabels = !satLabels;
        try { localStorage.setItem("civikaSatLabels", satLabels ? "1" : "0"); } catch (e) { /* nada */ }
        syncRefLayers();
      };

      let saved = null;
      try { saved = localStorage.getItem("civikaMapBase2"); } catch (e) { /* sin almacenamiento */ }
      this.baseLayers = base;
      this.currentBase = null;
      Object.values(base).forEach(l => l.on("tileerror", () => this.showOfflineNote()));
      this.setBase = (name) => {
        if (!base[name] || name === this.currentBase) return;
        if (this.currentBase) this.map.removeLayer(base[this.currentBase]);
        const sat = name === "Satélite";
        // El satélite tiene nitidez real hasta el nivel 18: se limita el acercamiento a 19
        this.map.setMaxZoom(sat ? 19 : 20);
        base[name].addTo(this.map);
        this.map.getContainer().classList.toggle("on-satellite", sat);
        const frame = this.map.getContainer().closest(".map-frame-live");
        if (frame) frame.classList.toggle("is-satellite", sat);
        this.currentBase = name;
        try { localStorage.setItem("civikaMapBase2", name); } catch (err) { /* nada */ }
        document.querySelectorAll(".civika-basemap button[data-base]").forEach(btn => {
          const on = btn.dataset.base === name;
          btn.classList.toggle("is-on", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        syncRefLayers();
      };
      this.addBaseSwitcher();
      this.setBase(base[saved] ? saved : "Claro");

      // Control de capas solo para capas propias (QGIS); se muestra cuando exista alguna
      this.layerControl = L.control.layers(null, {}, { position: "topright", collapsed: true });
      L.control.scale({ imperial: false, position: "bottomleft", maxWidth: 110 }).addTo(this.map);
      this.addCoordsHud();
      this.addLegend();
      this.addFullscreenControl();

      // Tamaño de pines y etiquetas según el zoom (lejos: pines pequeños; cerca: con nombre)
      const applyZoomClass = () => {
        const z = this.map.getZoom(), c = this.map.getContainer().classList;
        c.toggle("zoom-far", z < 14.5); c.toggle("zoom-mid", z >= 14.5 && z < 16.5); c.toggle("zoom-near", z >= 16.5);
      };
      this.map.on("zoomend", applyZoomClass);
      applyZoomClass();
      if (window.ResizeObserver) new ResizeObserver(() => this.map && this.map.invalidateSize()).observe(document.getElementById("civikaMap"));

      // Oficinas con la misma dirección: se separan un poco para que no se tapen
      const groups = {};
      insts().forEach(i => { if (i.coordenadas) (groups[`${i.coordenadas.lat},${i.coordenadas.lng}`] = groups[`${i.coordenadas.lat},${i.coordenadas.lng}`] || []).push(i); });
      const displayPos = (inst) => {
        const g = groups[`${inst.coordenadas.lat},${inst.coordenadas.lng}`];
        if (g.length < 2) return [inst.coordenadas.lat, inst.coordenadas.lng];
        const k = g.indexOf(inst), ang = (2 * Math.PI * k) / g.length + Math.PI / 4, r = 0.00016;
        return [inst.coordenadas.lat + r * Math.sin(ang), inst.coordenadas.lng + r * Math.cos(ang)];
      };

      insts().forEach(inst => {
        if (!inst.coordenadas) return;
        const color = COLORS[inst.color] || COLORS.blue;
        const letter = LETTERS[inst.categoria] || (inst.categoria || "?").charAt(0).toUpperCase();
        const icon = L.divIcon({
          className: "civika-pin-wrap",
          html: `<span class="civika-pin-box" style="--pin:${color}"><span class="civika-pin"><span>${esc(letter)}</span></span><span class="civika-pin-shadow"></span></span>`,
          iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -36], tooltipAnchor: [18, -20]
        });
        const m = L.marker(displayPos(inst), { icon, title: inst.nombre, riseOnHover: true, keyboard: true, alt: inst.nombre });
        m.bindTooltip(`<i style="background:${color}"></i>${esc(shortName(inst))}`, { permanent: true, direction: "right", className: "civika-label", opacity: 1 });
        m.bindPopup(() => this.popupHtml(inst), { maxWidth: 290, minWidth: 230, autoPanPaddingTopLeft: [56, 64], autoPanPaddingBottomRight: [24, 24], className: "civika-popup" });
        m.on("click", () => { if (typeof window.selectInstitutionMap === "function") window.selectInstitutionMap(inst.id, { fromMap: true }); });
        this.markers[inst.id] = m;
      });
      this.applyFilter(false);
      this.fitVisible();
      this.loadCustomLayers();
    },

    addBaseSwitcher() {
      const L = window.L, self = this;
      const ctl = L.control({ position: "topright" });
      ctl.onAdd = () => {
        const div = L.DomUtil.create("div", "civika-basemap");
        div.setAttribute("role", "group");
        div.setAttribute("aria-label", "Tipo de mapa");
        div.innerHTML = ["Claro", "Calles", "Satélite"]
          .map(n => `<button type="button" data-base="${n}" aria-pressed="false">${n}</button>`).join("")
          + `<span class="civika-sat-only civika-basemap-sep" aria-hidden="true"></span>`
          + `<button type="button" class="civika-sat-only civika-sat-labels" aria-pressed="true" title="Mostrar u ocultar nombres de calles">${ICONS.tag}<span>Nombres</span></button>`;
        div.querySelectorAll("button[data-base]").forEach(btn => {
          L.DomEvent.on(btn, "click", (e) => { L.DomEvent.stop(e); self.setBase(btn.dataset.base); });
        });
        L.DomEvent.on(div.querySelector(".civika-sat-labels"), "click", (e) => { L.DomEvent.stop(e); self.toggleSatLabels(); });
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      };
      ctl.addTo(this.map);
    },

    /** Lectura de coordenadas y zoom, como en un visor SIG */
    addCoordsHud() {
      const L = window.L;
      const ctl = L.control({ position: "bottomleft" });
      ctl.onAdd = () => {
        const div = L.DomUtil.create("div", "civika-hud");
        div.setAttribute("aria-hidden", "true");
        let queued = false;
        const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v < 0 ? neg : pos}`;
        const update = () => {
          queued = false;
          if (!this.map || !this.map._loaded) return; // aún sin centro: se actualiza al cargar
          const c = this.map.getCenter();
          div.innerHTML = `<span>${fmt(c.lat, "N", "S")}</span><span>${fmt(c.lng, "E", "O")}</span><b>z${(Math.round(this.map.getZoom() * 10) / 10).toString()}</b>`;
        };
        this.map.on("load move zoom viewreset", () => { if (!queued) { queued = true; requestAnimationFrame(update); } });
        update();
        return div;
      };
      ctl.addTo(this.map);
    },

    addLegend() {
      const L = window.L;
      const legend = L.control({ position: "bottomright" });
      legend.onAdd = () => {
        const div = L.DomUtil.create("div", "civika-legend");
        const used = {};
        insts().forEach(i => { if (!used[i.categoria]) used[i.categoria] = COLORS[i.color] || COLORS.blue; });
        const items = Object.keys(used).map(c => {
          const letter = LETTERS[c] || c.charAt(0).toUpperCase();
          return `<li><span class="civika-legend-dot" style="--pin:${used[c]}">${esc(letter)}</span>${esc(c)}</li>`;
        }).join("");
        div.innerHTML = `
          <button type="button" class="civika-legend-toggle" aria-expanded="false">Leyenda</button>
          <ul class="civika-legend-list">${items}</ul>`;
        const btn = div.querySelector(".civika-legend-toggle");
        L.DomEvent.on(btn, "click", (e) => {
          L.DomEvent.stop(e);
          const open = div.classList.toggle("open");
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      };
      legend.addTo(this.map);
    },

    addFullscreenControl() {
      const L = window.L, self = this;
      const ctl = L.control({ position: "topleft" });
      ctl.onAdd = () => {
        const bar = L.DomUtil.create("div", "leaflet-bar civika-extra-bar");
        const fs = L.DomUtil.create("a", "civika-fs-btn", bar);
        fs.href = "#"; fs.title = "Pantalla completa"; fs.setAttribute("role", "button"); fs.setAttribute("aria-label", "Mapa en pantalla completa");
        fs.innerHTML = ICONS.expand;
        const home = L.DomUtil.create("a", "civika-home-btn", bar);
        home.href = "#"; home.title = "Ver todas las oficinas"; home.setAttribute("role", "button"); home.setAttribute("aria-label", "Ver todas las oficinas");
        home.innerHTML = ICONS.home;
        L.DomEvent.on(fs, "click", (e) => { L.DomEvent.preventDefault(e); L.DomEvent.stopPropagation(e); self.toggleFullscreen(); });
        L.DomEvent.on(home, "click", (e) => { L.DomEvent.preventDefault(e); L.DomEvent.stopPropagation(e); self.fitVisible(); });
        L.DomEvent.disableClickPropagation(bar);
        return bar;
      };
      ctl.addTo(this.map);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && this.isFullscreen()) this.toggleFullscreen(); });
    },
    isFullscreen() { const f = document.querySelector(".map-frame-live"); return !!f && f.classList.contains("map-fullscreen"); },
    toggleFullscreen() {
      const f = document.querySelector(".map-frame-live");
      if (!f) return;
      const on = f.classList.toggle("map-fullscreen");
      document.body.classList.toggle("map-is-fullscreen", on);
      const a = f.querySelector(".civika-fs-btn");
      if (a) { a.innerHTML = on ? ICONS.collapse : ICONS.expand; a.title = on ? "Salir de pantalla completa (Esc)" : "Pantalla completa"; }
      setTimeout(() => { this.map.invalidateSize(); this.fitVisible(); }, 120);
    },

    popupHtml(inst) {
      const color = COLORS[inst.color] || COLORS.blue;
      const km = this.distanceTo(inst);
      const dist = km != null ? `<span class="civika-pop-dist">${formatKm(km)} de ti</span>` : "";
      const approx = inst.ubicacionAproximada ? `<p class="civika-pop-warn">Ubicación aproximada: confirma la dirección antes de ir.</p>` : "";
      return `
        <div class="civika-pop" style="--pin:${color}">
          <div class="civika-pop-head">
            <span class="civika-pop-cat">${esc(inst.categoria)}</span>${dist}
          </div>
          <p class="civika-pop-title">${esc(inst.nombre)}</p>
          <p class="civika-pop-row">${ICONS.pin}<span>${esc(inst.direccion)}</span></p>
          <p class="civika-pop-row civika-pop-muted">${ICONS.clock}<span>${esc(inst.horario)} · ${esc(inst.dias)}</span></p>
          ${approx}
          <div class="civika-pop-actions">
            <a class="is-primary" href="${esc(this.directionsUrl(inst))}" target="_blank" rel="noopener noreferrer">${ICONS.route}<span>Cómo llegar</span></a>
            <a href="https://www.openstreetmap.org/?mlat=${inst.coordenadas.lat}&mlon=${inst.coordenadas.lng}#map=18/${inst.coordenadas.lat}/${inst.coordenadas.lng}" target="_blank" rel="noopener noreferrer">Ver en OSM</a>
          </div>
        </div>`;
    },

    // Ruta en Google Maps (abre la app en el celular). Si sabemos dónde está la persona, sale desde ahí.
    directionsUrl(inst) {
      const dest = inst.coordenadas ? `${inst.coordenadas.lat},${inst.coordenadas.lng}` : encodeURIComponent(inst.direccion + ", Riobamba");
      const origin = this.userPos ? `&origin=${this.userPos.lat},${this.userPos.lng}` : "";
      return `https://www.google.com/maps/dir/?api=1&destination=${dest}${origin}&travelmode=walking`;
    },

    applyFilter(refit = true) {
      if (!this.map) return;
      insts().forEach(inst => {
        const m = this.markers[inst.id];
        if (!m) return;
        const show = this.filter === "Todas" || inst.categoria.toLowerCase() === this.filter.toLowerCase();
        if (show && !this.map.hasLayer(m)) m.addTo(this.map);
        if (!show && this.map.hasLayer(m)) this.map.removeLayer(m);
      });
      if (refit) this.fitVisible();
    },

    setFilter(filter) {
      this.filter = filter || "Todas";
      this.applyFilter(true);
    },

    fitVisible() {
      if (!this.map) return;
      const pts = Object.values(this.markers).filter(m => this.map.hasLayer(m)).map(m => m.getLatLng());
      if (this.userPos) pts.push(window.L.latLng(this.userPos.lat, this.userPos.lng));
      if (pts.length === 1) this.map.setView(pts[0], 17);
      else if (pts.length) this.map.fitBounds(window.L.latLngBounds(pts).pad(0.2), { maxZoom: 17, padding: [24, 24], animate: true });
      else this.map.setView([-1.671, -78.648], 15);
    },

    focus(instId) {
      this.ensure();
      const m = this.markers[instId];
      if (!this.map || !m) return;
      if (!this.map.hasLayer(m)) m.addTo(this.map);
      Object.values(this.markers).forEach(o => { const el = o.getElement && o.getElement(); if (el) el.classList.remove("is-active"); o.setZIndexOffset(0); });
      const el = m.getElement(); if (el) el.classList.add("is-active");
      m.setZIndexOffset(1000);
      this.map.flyTo(m.getLatLng(), Math.max(this.map.getZoom(), 17.5), { duration: 0.6 });
      setTimeout(() => m.openPopup(), 650);
    },

    locate() {
      const btn = document.getElementById("mapLocateBtn");
      if (!navigator.geolocation) { this.toast("Tu navegador no permite obtener la ubicación."); return; }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = "Buscando tu ubicación…"; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
          this.drawUser();
          if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
          const nearest = this.nearest();
          if (nearest) this.toast(`La oficina más cercana es ${nearest.inst.categoria}: a ${formatKm(nearest.km)}`);
          if (typeof window.renderInstitutions === "function") window.renderInstitutions(this.filter);
        },
        (err) => {
          if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
          this.toast(err && err.code === 1 ? "Permiso de ubicación denegado. Puedes activarlo en el candado de la barra de direcciones." : "No se pudo obtener tu ubicación.");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    },

    drawUser() {
      this.ensure();
      if (!this.map || !this.userPos) return;
      const L = window.L;
      if (this.userLayer) this.map.removeLayer(this.userLayer);
      const ll = [this.userPos.lat, this.userPos.lng];
      this.userLayer = L.layerGroup([
        L.circle(ll, { radius: Math.min(this.userPos.acc || 50, 400), color: "#2563EB", weight: 1, opacity: 0.5, fillColor: "#3B82F6", fillOpacity: 0.1, interactive: false }),
        L.marker(ll, {
          icon: L.divIcon({ className: "civika-me-wrap", html: '<span class="civika-me"><span class="civika-me-pulse"></span><span class="civika-me-dot"></span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }),
          zIndexOffset: 2000, keyboard: false, title: "Tu ubicación"
        }).bindTooltip("Tú estás aquí", { direction: "top", offset: [0, -10] })
      ]).addTo(this.map);
      this.fitVisible();
    },

    distanceTo(inst) {
      return this.userPos && inst.coordenadas ? haversineKm(this.userPos, inst.coordenadas) : null;
    },
    nearest() {
      let best = null;
      insts().forEach(inst => {
        const km = this.distanceTo(inst);
        if (km != null && (!best || km < best.km)) best = { inst, km };
      });
      return best;
    },
    formatKm,

    // Capas GeoJSON exportadas desde QGIS (OSGeo4W): web/data/capas/capas.json
    loadCustomLayers() {
      if (this.customLayersLoaded || !this.map || location.protocol === "file:") return;
      this.customLayersLoaded = true;
      fetch("data/capas/capas.json", { cache: "no-cache" })
        .then(r => (r.ok ? r.json() : { capas: [] }))
        .then(cfg => (cfg.capas || []).forEach(capa => this.addGeoJsonLayer(capa)))
        .catch(() => { /* sin capas propias */ });
    },

    addGeoJsonLayer(capa) {
      if (!capa || !capa.archivo) return;
      fetch(`data/capas/${capa.archivo}`, { cache: "no-cache" })
        .then(r => (r.ok ? r.json() : null))
        .then(geo => {
          if (!geo) return;
          const L = window.L;
          const color = capa.color || "#7C3AED";
          const layer = L.geoJSON(geo, {
            style: () => ({ color, weight: 2, fillColor: color, fillOpacity: capa.opacidad ?? 0.15 }),
            pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 6, color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }),
            onEachFeature: (f, lyr) => {
              const props = f.properties || {};
              const campos = capa.campos && capa.campos.length ? capa.campos : Object.keys(props).slice(0, 6);
              const rows = campos.filter(k => props[k] != null && props[k] !== "")
                .map(k => `<tr><th>${esc(k)}</th><td>${esc(props[k])}</td></tr>`).join("");
              lyr.bindPopup(`<div class="civika-pop"><p class="civika-pop-cat">${esc(capa.nombre)}</p>${rows ? `<table class="civika-pop-table">${rows}</table>` : ""}</div>`);
            }
          });
          if (!this._layerCtlAdded) { this.layerControl.addTo(this.map); this._layerCtlAdded = true; }
          this.layerControl.addOverlay(layer, esc(capa.nombre));
          if (capa.visible) layer.addTo(this.map);
        })
        .catch(() => { /* capa no disponible */ });
    },

    showOfflineNote() {
      const note = document.getElementById("mapOfflineNote");
      if (note && navigator.onLine === false) note.classList.remove("hidden");
    },

    toast(msg) { if (typeof window.civikaToast === "function") window.civikaToast(msg); }
  };

  window.civikaMap = civikaMap;
})();
