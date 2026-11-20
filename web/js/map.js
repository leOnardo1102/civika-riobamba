/**
 * CÍVIKA · Mapa interactivo de oficinas (Leaflet + OpenStreetMap)
 *
 * - Todas las oficinas a la vez, con colores por entidad y filtros.
 * - "Mi ubicación": distancia a cada oficina y la más cercana primero.
 * - Mapas base: Calles (OpenStreetMap), Claro (CARTO) y Satélite (Esri).
 * - Capas propias desde QGIS / OSGeo4W: se listan en web/data/capas/capas.json
 *   y se cargan como GeoJSON (ver GUIA_MAPAS.md).
 *
 * Sin internet: el mapa base no carga, pero las oficinas y el listado siguen funcionando.
 */
(function () {
  "use strict";

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
      const base = {
        "Mapa (CARTO)": tile("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 20, maxNativeZoom: 20, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO"
        }),
        "Calles (OpenStreetMap)": tile("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20, maxNativeZoom: 19, attribution: "© colaboradores de OpenStreetMap"
        }),
        "Satélite (Esri)": tile("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 20, maxNativeZoom: 17, attribution: "Imágenes © Esri y colaboradores"
        })
      };
      // En satélite se añaden nombres de calles y lugares para que se entienda de lejos y de cerca
      const labels = tile("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 16, pane: "overlayPane" });
      const roads = tile("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 16, pane: "overlayPane", opacity: 0.9 });

      let saved = null;
      try { saved = localStorage.getItem("civikaMapBase"); } catch (e) { /* sin almacenamiento */ }
      const first = base[saved] ? saved : "Mapa (CARTO)";
      base[first].addTo(this.map);
      if (first.startsWith("Satélite")) { roads.addTo(this.map); labels.addTo(this.map); }
      Object.values(base).forEach(l => l.on("tileerror", () => this.showOfflineNote()));
      this.map.on("baselayerchange", (e) => {
        try { localStorage.setItem("civikaMapBase", e.name); } catch (err) { /* nada */ }
        if (e.name.startsWith("Satélite")) { roads.addTo(this.map); labels.addTo(this.map); }
        else { this.map.removeLayer(roads); this.map.removeLayer(labels); }
        this.map.getContainer().classList.toggle("on-satellite", e.name.startsWith("Satélite"));
      });
      if (first.startsWith("Satélite")) this.map.getContainer().classList.add("on-satellite");

      this.layerControl = L.control.layers(base, {}, { position: "topright", collapsed: true }).addTo(this.map);
      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(this.map);
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
          html: `<span class="civika-pin-box"><span class="civika-pin" style="--pin:${color}"><span>${esc(letter)}</span></span></span>`,
          iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -36], tooltipAnchor: [18, -20]
        });
        const m = L.marker(displayPos(inst), { icon, title: inst.nombre, riseOnHover: true, keyboard: true, alt: inst.nombre });
        m.bindTooltip(esc(shortName(inst)), { permanent: true, direction: "right", className: "civika-label", opacity: 1 });
        m.bindPopup(() => this.popupHtml(inst), { maxWidth: 300, autoPanPadding: [30, 30] });
        m.on("click", () => { if (typeof window.selectInstitutionMap === "function") window.selectInstitutionMap(inst.id, { fromMap: true }); });
        this.markers[inst.id] = m;
      });
      this.applyFilter(false);
      this.fitVisible();
      this.loadCustomLayers();
    },

    addLegend() {
      const L = window.L;
      const legend = L.control({ position: "bottomright" });
      legend.onAdd = () => {
        const div = L.DomUtil.create("div", "civika-legend");
        const used = {};
        insts().forEach(i => { used[i.categoria] = COLORS[i.color]; });
        div.innerHTML = Object.keys(used).map(c => `<span><i style="background:${used[c]}"></i>${esc(c)}</span>`).join("");
        L.DomEvent.disableClickPropagation(div);
        return div;
      };
      legend.addTo(this.map);
    },

    addFullscreenControl() {
      const L = window.L, self = this;
      const ctl = L.control({ position: "topleft" });
      ctl.onAdd = () => {
        const bar = L.DomUtil.create("div", "leaflet-bar");
        const a = L.DomUtil.create("a", "civika-fs-btn", bar);
        a.href = "#"; a.title = "Pantalla completa"; a.setAttribute("role", "button"); a.setAttribute("aria-label", "Mapa en pantalla completa");
        a.innerHTML = "⛶";
        L.DomEvent.on(a, "click", (e) => { L.DomEvent.preventDefault(e); L.DomEvent.stopPropagation(e); self.toggleFullscreen(); });
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
      if (a) { a.innerHTML = on ? "✕" : "⛶"; a.title = on ? "Salir de pantalla completa (Esc)" : "Pantalla completa"; }
      setTimeout(() => { this.map.invalidateSize(); this.fitVisible(); }, 120);
    },

    popupHtml(inst) {
      const dist = this.userPos && inst.coordenadas ? `<p class="civika-pop-dist">A ${formatKm(haversineKm(this.userPos, inst.coordenadas))} de ti</p>` : "";
      const approx = inst.ubicacionAproximada ? `<p class="civika-pop-warn">Ubicación aproximada: confirma la dirección.</p>` : "";
      return `
        <div class="civika-pop">
          <p class="civika-pop-cat">${esc(inst.categoria)}</p>
          <p class="civika-pop-title">${esc(inst.nombre)}</p>
          <p>${esc(inst.direccion)}</p>
          <p class="civika-pop-muted">${esc(inst.horario)} · ${esc(inst.dias)}</p>
          ${dist}${approx}
          <div class="civika-pop-actions">
            <a href="${esc(this.directionsUrl(inst))}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
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
        L.circle(ll, { radius: Math.min(this.userPos.acc || 50, 400), color: "#1D4ED8", weight: 1, fillOpacity: 0.08 }),
        L.circleMarker(ll, { radius: 7, color: "#fff", weight: 3, fillColor: "#1D4ED8", fillOpacity: 1 }).bindTooltip("Tú estás aquí")
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
