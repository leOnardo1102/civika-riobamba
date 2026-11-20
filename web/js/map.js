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

      this.map = L.map("civikaMap", { zoomControl: true, scrollWheelZoom: true, tap: true, attributionControl: true });
      this.map.attributionControl.setPrefix(false);

      const base = {
        "Calles (OpenStreetMap)": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19, attribution: "© colaboradores de OpenStreetMap"
        }),
        "Claro (CARTO)": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 20, subdomains: "abcd", attribution: "© OpenStreetMap · © CARTO"
        }),
        "Satélite (Esri)": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 19, attribution: "Imágenes © Esri y colaboradores"
        })
      };
      base["Calles (OpenStreetMap)"].addTo(this.map);
      base["Calles (OpenStreetMap)"].on("tileerror", () => this.showOfflineNote());
      this.layerControl = L.control.layers(base, {}, { position: "topright", collapsed: true }).addTo(this.map);
      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(this.map);

      insts().forEach(inst => {
        if (!inst.coordenadas) return;
        const color = COLORS[inst.color] || COLORS.blue;
        const letter = (inst.categoria || "?").charAt(0).toUpperCase();
        const icon = L.divIcon({
          className: "civika-pin-wrap",
          html: `<span class="civika-pin" style="--pin:${color}"><span>${esc(letter)}</span></span>`,
          iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -36]
        });
        const m = L.marker([inst.coordenadas.lat, inst.coordenadas.lng], { icon, title: inst.nombre, riseOnHover: true });
        m.bindPopup(() => this.popupHtml(inst), { maxWidth: 280 });
        m.on("click", () => { if (typeof window.selectInstitutionMap === "function") window.selectInstitutionMap(inst.id, { fromMap: true }); });
        this.markers[inst.id] = m;
      });

      this.applyFilter(false);
      this.fitVisible();
      this.loadCustomLayers();
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
      else if (pts.length) this.map.fitBounds(window.L.latLngBounds(pts).pad(0.25), { maxZoom: 17 });
      else this.map.setView([-1.671, -78.648], 15);
    },

    focus(instId) {
      this.ensure();
      const m = this.markers[instId];
      if (!this.map || !m) return;
      if (!this.map.hasLayer(m)) m.addTo(this.map);
      this.map.flyTo(m.getLatLng(), Math.max(this.map.getZoom(), 17), { duration: 0.6 });
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
