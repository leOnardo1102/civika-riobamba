/* CÃ­vika â€“ Service Worker: guarda la app en el equipo para que funcione sin internet */
const CACHE = "civika-v2026-11-21c";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./css/fonts/inter-latin-wght-normal.woff2",
  "./css/fonts/inter-latin-ext-wght-normal.woff2",
  "./js/db.js",
  "./js/knowledge_base.js",
  "./js/institutions.js",
  "./js/assistant.js",
  "./js/app.js",
  "./js/backoffice.js",
  "./js/citizen_tools.js",
  "./js/features.js",
  "./js/ai_bridge.js",
  "./js/pdf.js",
  "./js/map.js",
  "./js/vendor/leaflet/leaflet.js",
  "./js/vendor/leaflet/leaflet.css",
  "./js/vendor/leaflet/images/layers.png",
  "./js/vendor/leaflet/images/layers-2x.png",
  "./data/capas/capas.json",
  "./js/vendor/jspdf.umd.min.js",
  "./js/vendor/tailwindcss.js",
  "./js/vendor/lucide.min.js",
  "./js/vendor/qrcode.min.js",
  "./js/vendor/jsQR.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Archivos propios: primero la red (para ver cambios), si no hay internet, la copia guardada.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // mapas, WhatsApp y portales oficiales van directo a internet
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html")))
  );
});
