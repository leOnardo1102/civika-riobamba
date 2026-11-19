/**
 * CIVIKA - Funciones nuevas (Noviembre 2026)
 * 1. civikaUI        → Menú adaptable: barra lateral en laptop, menú deslizable + navegación inferior en celular
 * 2. civikaRenewals  → Recordatorios de renovación (patente, Bomberos, LUF, ARCSA…) con avisos y archivo .ics
 * 3. civikaOfficer   → Modo Ventanilla: el funcionario escanea el Pasaporte QR (cámara, foto o texto) y ve el checklist
 * 4. civikaShare     → Compartir requisitos por WhatsApp / menú compartir del celular / copiar
 * 5. civikaPWA       → App instalable (manifest + service worker) cuando se sirve por http(s)
 *
 * Todo funciona sin internet y sin servidores: los datos quedan en el navegador del usuario.
 */

(function () {
  "use strict";

  // ------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (id) => document.getElementById(id);
  const icons = () => { if (window.lucide) window.lucide.createIcons(); };
  const store = {
    get(key, fallback) {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* almacenamiento no disponible */ }
    }
  };
  const kb = () => window.CIVIKA_KNOWLEDGE_BASE || (typeof CIVIKA_KNOWLEDGE_BASE !== "undefined" ? CIVIKA_KNOWLEDGE_BASE : null);
  const app = () => window.civikaApp;
  const currentBiz = () => {
    const base = kb();
    const id = app() ? app().selectedBusinessId : "tienda_ropa";
    return base.emprendimientosComunes.find(b => b.id === id) || base.emprendimientosComunes[0];
  };
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const addDaysISO = (days, from) => {
    const d = from ? new Date(from + "T00:00:00") : new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const addYearISO = (iso) => {
    const d = new Date(iso + "T00:00:00");
    d.setFullYear(d.getFullYear() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const daysUntil = (iso) => {
    const start = new Date(todayISO() + "T00:00:00");
    const end = new Date(iso + "T00:00:00");
    return Math.round((end - start) / 86400000);
  };
  const formatDate = (iso) => {
    try {
      return new Date(iso + "T00:00:00").toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return iso; }
  };
  const toast = (msg) => {
    let el = $("civikaToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "civikaToast";
      el.setAttribute("role", "status");
      el.className = "fixed left-1/2 -translate-x-1/2 bottom-36 lg:bottom-6 z-[80] bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl transition-opacity duration-300 opacity-0 pointer-events-none max-w-[90vw] text-center";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = "0"; }, 2600);
  };

  // ============================================================
  // 1. MENÚ ADAPTABLE (celular / laptop)
  // ============================================================
  const HASH_TO_SCREEN = {
    inicio: "screen-home",
    tramites: "screen-unified-forms",
    copiloto: "screen-assistant",
    renovaciones: "screen-renewals",
    oficinas: "screen-institutions",
    ventanilla: "screen-officer"
  };
  const SCREEN_TO_HASH = Object.fromEntries(Object.entries(HASH_TO_SCREEN).map(([k, v]) => [v, k]));

  const civikaUI = {
    _fromPopState: false,

    openDrawer() {
      $("appSidebar")?.classList.add("is-open");
      $("drawerBackdrop")?.classList.remove("hidden");
      document.body.classList.add("drawer-open");
    },
    closeDrawer() {
      $("appSidebar")?.classList.remove("is-open");
      $("drawerBackdrop")?.classList.add("hidden");
      document.body.classList.remove("drawer-open");
    },
    // En celular/tablet, al elegir un negocio bajamos a sus requisitos para no perderse en la lista
    afterBusinessPick() {
      if (window.matchMedia("(min-width: 1280px)").matches) return;
      setTimeout(() => $("selectedBusinessDocSection")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    },
    screenFromHash() {
      const key = (location.hash || "").replace("#", "");
      return HASH_TO_SCREEN[key] || "screen-home";
    },
    syncHistory(screenId) {
      const hash = SCREEN_TO_HASH[screenId];
      if (!hash) return;
      try {
        if (this._fromPopState) { this._fromPopState = false; return; }
        if (location.hash === "#" + hash) return;
        history.pushState({ screen: screenId }, "", "#" + hash);
      } catch (e) { /* algunos navegadores bloquean history en file:// */ }
    },
    // En laptop ancha el progreso y el pasaporte van en la columna lateral; en celular, dentro del flujo
    placeResponsiveBlocks() {
      const wide = window.matchMedia("(min-width: 1280px)").matches;
      const passport = $("govukPassportSection");
      const side = $("formsSideColumn");
      const slot = $("passportMobileSlot");
      if (!passport || !side || !slot) return;
      if (wide && passport.parentElement !== side) side.appendChild(passport);
      if (!wide && passport.parentElement !== slot) slot.appendChild(passport);
    },
    // Menú compacto "Escenarios de demo"
    toggleDemoMenu(e) {
      if (e) e.stopPropagation();
      const panel = document.querySelector("#demoMenu .demo-menu-panel");
      const trigger = document.querySelector("#demoMenu .demo-menu-trigger");
      if (!panel) return;
      const open = panel.classList.contains("hidden");
      panel.classList.toggle("hidden", !open);
      trigger?.setAttribute("aria-expanded", open ? "true" : "false");
    },
    closeDemoMenu() {
      document.querySelector("#demoMenu .demo-menu-panel")?.classList.add("hidden");
      document.querySelector("#demoMenu .demo-menu-trigger")?.setAttribute("aria-expanded", "false");
    },
    init() {
      this.placeResponsiveBlocks();
      const mq = window.matchMedia("(min-width: 1280px)");
      if (mq.addEventListener) mq.addEventListener("change", () => this.placeResponsiveBlocks());
      window.matchMedia("(min-width: 1024px)").addEventListener?.("change", (e) => { if (e.matches) this.closeDrawer(); });
      window.addEventListener("popstate", () => {
        this._fromPopState = true;
        app()?.goToScreen(this.screenFromHash());
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") { this.closeDrawer(); this.closeDemoMenu(); } });
      document.addEventListener("click", (e) => {
        if (!e.target.closest("#demoMenu")) this.closeDemoMenu();
        else if (e.target.closest(".demo-item")) this.closeDemoMenu();
      });
    }
  };

  // ============================================================
  // 2. RECORDATORIOS DE RENOVACIÓN
  // ============================================================
  const RENEWAL_KEY = "civika_renewals_v1";
  const RENEWAL_ITEMS = [
    { id: "patente", nombre: "Patente Municipal", entidad: "GAD Municipal de Riobamba (Rentas)", icono: "clipboard-list", nota: "Se declara cada año en Rentas del GAD, aunque estés exonerado." },
    { id: "bomberos", nombre: "Permiso de Bomberos", entidad: "Cuerpo de Bomberos de Riobamba", icono: "flame", nota: "Permiso anual. Antes de renovarlo revisa que tus extintores tengan la recarga vigente." },
    { id: "luf", nombre: "Licencia Única de Funcionamiento (LUF)", entidad: "GAD Municipal de Riobamba", icono: "award", nota: "Se exhibe en el local. Se renueva junto con la patente." },
    { id: "arcsa", nombre: "Permiso de Funcionamiento ARCSA", entidad: "ARCSA (si tu negocio lo requiere)", icono: "shield-check", nota: "Vigencia de 1 año calendario desde su emisión.", calcFromIssue: true },
    { id: "extintores", nombre: "Recarga de extintores", entidad: "Proveedor autorizado", icono: "flame", nota: "La inspección de Bomberos revisa que la recarga anual esté vigente." }
  ];

  const civikaRenewals = {
    state: { dates: {}, custom: [] },

    load() {
      const saved = store.get(RENEWAL_KEY, null);
      if (saved && typeof saved === "object") {
        this.state = { dates: saved.dates || {}, custom: Array.isArray(saved.custom) ? saved.custom : [] };
      }
    },
    save() {
      store.set(RENEWAL_KEY, this.state);
      this.refreshIndicators();
    },

    allItems() {
      const base = RENEWAL_ITEMS.map(it => ({ ...it, fecha: this.state.dates[it.id] || "" , custom: false }));
      const custom = this.state.custom.map(c => ({ id: c.id, nombre: c.nombre, entidad: "Agregado por ti", icono: "calendar-days", nota: "", fecha: c.fecha, custom: true }));
      return base.concat(custom);
    },

    status(fecha) {
      if (!fecha) return { key: "none", label: "Sin fecha", cls: "bg-slate-100 text-slate-600 border-slate-200", ring: "border-slate-200", days: null };
      const d = daysUntil(fecha);
      if (d < 0) return { key: "expired", label: `Vencido hace ${Math.abs(d)} ${Math.abs(d) === 1 ? "día" : "días"}`, cls: "bg-rose-100 text-rose-800 border-rose-300", ring: "border-rose-300 bg-rose-50/40", days: d };
      if (d === 0) return { key: "urgent", label: "Vence HOY", cls: "bg-rose-100 text-rose-800 border-rose-300", ring: "border-rose-300 bg-rose-50/40", days: d };
      if (d <= 30) return { key: "urgent", label: `Vence en ${d} ${d === 1 ? "día" : "días"}`, cls: "bg-amber-100 text-amber-900 border-amber-300", ring: "border-amber-300 bg-amber-50/40", days: d };
      if (d <= 90) return { key: "soon", label: `Vence en ${d} días`, cls: "bg-sky-100 text-sky-800 border-sky-200", ring: "border-sky-200", days: d };
      return { key: "ok", label: `Al día (${d} días)`, cls: "bg-emerald-100 text-emerald-800 border-emerald-200", ring: "border-emerald-200", days: d };
    },

    urgentItems() {
      return this.allItems()
        .filter(it => it.fecha && daysUntil(it.fecha) <= 30)
        .sort((a, b) => daysUntil(a.fecha) - daysUntil(b.fecha));
    },

    setDate(id, value) {
      if (value) this.state.dates[id] = value; else delete this.state.dates[id];
      this.save();
      this.render();
    },
    setIssueDate(id, issue) {
      if (!issue) return;
      this.setDate(id, addYearISO(issue));
      toast("Vencimiento calculado: 1 año desde la emisión");
    },
    setCustomDate(id, value) {
      const item = this.state.custom.find(c => c.id === id);
      if (item && value) { item.fecha = value; this.save(); this.render(); }
    },
    addCustom() {
      const nameEl = $("renewalCustomName");
      const dateEl = $("renewalCustomDate");
      const nombre = (nameEl?.value || "").trim().slice(0, 60);
      const fecha = dateEl?.value || "";
      if (!nombre || !fecha) return;
      this.state.custom.push({ id: "c" + Date.now(), nombre, fecha });
      nameEl.value = ""; dateEl.value = "";
      this.save();
      this.render();
      toast("Recordatorio agregado");
    },
    removeCustom(id) {
      this.state.custom = this.state.custom.filter(c => c.id !== id);
      this.save();
      this.render();
    },

    render() {
      const list = $("renewalsList");
      const summary = $("renewalsSummary");
      if (!list || !summary) return;
      const items = this.allItems();

      const counts = { expired: 0, urgent: 0, soon: 0, ok: 0, none: 0 };
      items.forEach(it => { counts[this.status(it.fecha).key]++; });
      const chip = (n, label, cls) => `
        <div class="rounded-2xl border p-3 ${cls}">
          <div class="text-2xl font-black leading-none">${n}</div>
          <div class="text-xs font-bold mt-1">${label}</div>
        </div>`;
      summary.innerHTML =
        chip(counts.expired, "Vencidos", "bg-rose-50 border-rose-200 text-rose-800") +
        chip(counts.urgent, "Vencen en 30 días", "bg-amber-50 border-amber-200 text-amber-900") +
        chip(counts.soon, "Próximos 90 días", "bg-sky-50 border-sky-200 text-sky-800") +
        chip(counts.ok + counts.none, "Al día / sin fecha", "bg-white border-slate-200 text-slate-700");

      list.innerHTML = items.map(it => {
        const st = this.status(it.fecha);
        const dateId = `renewal-date-${esc(it.id)}`;
        const onChange = it.custom
          ? `civikaRenewals.setCustomDate('${esc(it.id)}', this.value)`
          : `civikaRenewals.setDate('${esc(it.id)}', this.value)`;
        return `
          <article class="bg-white rounded-2xl p-4 border-2 ${st.ring} shadow-xs space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <i data-lucide="${esc(it.icono)}" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0">
                  <h3 class="font-extrabold text-slate-900 text-sm leading-tight">${esc(it.nombre)}</h3>
                  <p class="text-xs text-slate-500">${esc(it.entidad)}</p>
                </div>
              </div>
              <span class="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full border ${st.cls}">${esc(st.label)}</span>
            </div>
            ${it.nota ? `<p class="text-xs text-slate-600">${esc(it.nota)}</p>` : ""}
            <div class="grid gap-2 ${it.calcFromIssue ? "sm:grid-cols-2" : ""}">
              <label for="${dateId}" class="text-xs font-bold text-slate-700 grid gap-1">Vence el
                <input id="${dateId}" type="date" value="${esc(it.fecha)}" onchange="${onChange}" class="input-base">
              </label>
              ${it.calcFromIssue ? `
              <label class="text-xs font-bold text-slate-700 grid gap-1">o fecha de emisión (+1 año)
                <input type="date" onchange="civikaRenewals.setIssueDate('${esc(it.id)}', this.value)" class="input-base">
              </label>` : ""}
            </div>
            <div class="flex flex-wrap gap-2">
              ${it.fecha ? `<button type="button" class="btn-ghost text-xs" onclick="civikaRenewals.downloadIcs('${esc(it.id)}')"><i data-lucide="calendar-plus" class="w-4 h-4"></i> Al calendario</button>` : ""}
              ${it.fecha && !it.custom ? `<button type="button" class="btn-ghost text-xs" onclick="civikaRenewals.setDate('${esc(it.id)}', '')"><i data-lucide="rotate-ccw" class="w-4 h-4"></i> Borrar fecha</button>` : ""}
              ${it.custom ? `<button type="button" class="btn-ghost text-xs text-rose-700" onclick="civikaRenewals.removeCustom('${esc(it.id)}')"><i data-lucide="trash-2" class="w-4 h-4"></i> Quitar</button>` : ""}
            </div>
          </article>`;
      }).join("");

      const notifyBtn = $("renewalsNotifyBtn");
      if (notifyBtn) {
        const canNotify = "Notification" in window && window.isSecureContext && Notification.permission !== "granted";
        notifyBtn.classList.toggle("hidden", !canNotify);
      }
      icons();
    },

    refreshIndicators() {
      const urgent = this.urgentItems();
      document.querySelectorAll(".renewals-nav-badge").forEach(b => {
        b.textContent = urgent.length;
        b.classList.toggle("hidden", urgent.length === 0);
      });
      const home = $("homeRenewalAlert");
      if (!home) return;
      if (!urgent.length) { home.innerHTML = ""; return; }
      const first = urgent[0];
      const st = this.status(first.fecha);
      const expired = st.days < 0;
      home.innerHTML = `
        <button type="button" onclick="civikaApp.goToScreen('screen-renewals')"
                class="w-full text-left rounded-2xl p-3.5 border-2 flex items-center gap-3 transition ${expired ? "bg-rose-50 border-rose-300 hover:border-rose-500" : "bg-amber-50 border-amber-300 hover:border-amber-500"}">
          <div class="w-10 h-10 rounded-xl ${expired ? "bg-rose-600" : "bg-amber-500"} text-white flex items-center justify-center shrink-0">
            <i data-lucide="bell-ring" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-extrabold text-sm ${expired ? "text-rose-900" : "text-amber-950"}">${esc(first.nombre)}: ${esc(st.label.toLowerCase())}</p>
            <p class="text-xs ${expired ? "text-rose-800" : "text-amber-900"}">${urgent.length > 1 ? `Y ${urgent.length - 1} más por renovar. ` : ""}Toca para ver tus vencimientos.</p>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 ${expired ? "text-rose-700" : "text-amber-700"}"></i>
        </button>`;
      icons();
    },

    // Archivo de calendario (.ics) con alarmas a 30 y 7 días: funciona en Android, iPhone, Outlook y Google Calendar
    downloadIcs(onlyId) {
      const items = this.allItems().filter(it => it.fecha && (!onlyId || it.id === onlyId));
      if (!items.length) { toast("Primero escribe al menos una fecha de vencimiento"); return; }
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
      const events = items.map(it => {
        const d = it.fecha.replace(/-/g, "");
        const next = addDaysISO(1, it.fecha).replace(/-/g, "");
        return [
          "BEGIN:VEVENT",
          `UID:civika-${it.id}-${d}@civika.riobamba`,
          `DTSTAMP:${stamp}`,
          `DTSTART;VALUE=DATE:${d}`,
          `DTEND;VALUE=DATE:${next}`,
          `SUMMARY:${icsEsc("Vence: " + it.nombre)}`,
          `DESCRIPTION:${icsEsc(`${it.entidad}. ${it.nota || ""} Recordatorio creado con Cívika Riobamba.`)}`,
          "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(it.nombre + " vence en 30 días")}`, "TRIGGER:-P30D", "END:VALARM",
          "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(it.nombre + " vence en 7 días")}`, "TRIGGER:-P7D", "END:VALARM",
          "END:VEVENT"
        ].join("\r\n");
      });
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Civika Riobamba//Renovaciones//ES", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = onlyId ? `civika-${onlyId}.ics` : "civika-renovaciones.ics";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast("Archivo de calendario descargado: ábrelo para agregar los avisos");
    },

    async enableNotifications() {
      if (!("Notification" in window)) return;
      const perm = await Notification.requestPermission();
      if (perm === "granted") { this.notifyIfDue(true); toast("Avisos activados"); }
      this.render();
    },
    notifyIfDue(force) {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const urgent = this.urgentItems();
      if (!urgent.length) return;
      const last = store.get("civika_renewals_notified", "");
      if (!force && last === todayISO()) return;
      store.set("civika_renewals_notified", todayISO());
      const first = urgent[0];
      try {
        new Notification("Cívika: tienes permisos por renovar", {
          body: `${first.nombre}: ${this.status(first.fecha).label.toLowerCase()}${urgent.length > 1 ? ` (y ${urgent.length - 1} más)` : ""}`,
          icon: "icons/icon-192.png"
        });
      } catch (e) { /* algunos navegadores solo permiten avisos desde el service worker */ }
    },

    loadDemo() {
      this.state.dates = {
        patente: addDaysISO(21),
        bomberos: addDaysISO(-3),
        luf: addDaysISO(200),
        arcsa: addDaysISO(45),
        extintores: addDaysISO(12)
      };
      this.save();
      this.render();
    },
    reset() {
      this.state = { dates: {}, custom: [] };
      this.save();
      this.render();
    }
  };

  // ============================================================
  // 3. PASAPORTE QR: formato compacto + MODO VENTANILLA
  // ============================================================
  const PAYLOAD_PREFIX = "CIVIKA1";
  // Solo ASCII: la librería qrcode.js falla con tildes/ñ y además así cualquier escáner lo lee igual
  const clean = (v, max) => String(v == null ? "" : v)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n").replace(/Ñ/g, "N")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\|/g, " ").trim().slice(0, max || 40);

  function buildPassportPayload() {
    const a = app();
    const base = kb();
    const biz = currentBiz();
    const pasos = base.pasosSecuenciales;
    const bits = pasos.map(p => (a.stepsState[p.id] ? "1" : "0")).join("");
    const completed = Object.keys(a.stepsState).filter(k => a.stepsState[k]).length;
    const passportId = `CIV-RIO-2026-${a.selectedBusinessId.slice(0, 3).toUpperCase()}-${completed}6`;
    const f = a.draftForm || {};
    return [
      PAYLOAD_PREFIX,
      clean(passportId, 24),
      clean(biz.id, 20),
      clean(f.nombreComercial || biz.nombre, 40),
      clean(f.parroquia, 24),
      f.esIdentificacionValida ? "1" : "0",
      clean(f.identificacionMascarada, 16),
      bits,
      todayISO(),
      clean(f.tenenciaLocal, 12),
      clean(f.areaMetros, 6)
    ].join("|");
  }

  function parsePassportPayload(text) {
    const raw = String(text || "").trim();
    if (!raw.startsWith(PAYLOAD_PREFIX + "|")) return null;
    const p = raw.split("|");
    if (p.length < 9) return null;
    return {
      passportId: p[1], bizId: p[2], nombre: p[3], parroquia: p[4],
      idOk: p[5] === "1", idMask: p[6], bits: (p[7] || "").replace(/[^01]/g, ""),
      fecha: p[8], tenencia: p[9] || "", m2: p[10] || ""
    };
  }

  const civikaOfficer = {
    stream: null,
    rafId: null,
    lastResult: null,
    docChecks: {},

    setStatus(msg) { const el = $("officerScanStatus"); if (el) el.textContent = msg; },

    async startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast("Este navegador no permite usar la cámara aquí. Usa 'Subir foto del QR'.");
        return;
      }
      if (typeof window.jsQR !== "function") { toast("No se cargó el lector de QR"); return; }
      try {
        this.stopCamera();
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        const video = $("officerVideo");
        video.srcObject = this.stream;
        await video.play();
        $("officerScanner")?.classList.remove("hidden");
        $("officerCameraBtn")?.classList.add("hidden");
        this.setStatus("Apunta la cámara al código QR…");
        this.scanLoop();
      } catch (err) {
        const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
        toast(denied ? "Permiso de cámara denegado. Puedes subir una foto del QR." : "No se pudo abrir la cámara. Prueba con 'Subir foto del QR'.");
        this.stopCamera();
      }
    },

    scanLoop() {
      const video = $("officerVideo");
      const canvas = $("officerCanvas");
      if (!this.stream || !video || !canvas) return;
      if (video.readyState >= 2 && video.videoWidth) {
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (code && code.data) {
          if (parsePassportPayload(code.data)) {
            if (navigator.vibrate) navigator.vibrate(80);
            this.stopCamera();
            this.handlePayload(code.data);
            return;
          }
          this.setStatus("Se detectó un QR, pero no es un Pasaporte Cívika.");
        }
      }
      this.rafId = requestAnimationFrame(() => this.scanLoop());
    },

    stopCamera() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = null;
      if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
      const video = $("officerVideo");
      if (video) video.srcObject = null;
      $("officerScanner")?.classList.add("hidden");
      $("officerCameraBtn")?.classList.remove("hidden");
    },

    scanFile(file) {
      if (!file) return;
      if (typeof window.jsQR !== "function") { toast("No se cargó el lector de QR"); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = $("officerCanvas");
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
        URL.revokeObjectURL(url);
        if (code && code.data) this.handlePayload(code.data);
        else toast("No se encontró un QR en la imagen. Prueba con una foto más cercana y nítida.");
      };
      img.onerror = () => { URL.revokeObjectURL(url); toast("No se pudo abrir la imagen"); };
      img.src = url;
    },

    useLocalPassport() {
      this.handlePayload(buildPassportPayload());
    },

    handlePayload(text) {
      const data = parsePassportPayload(text);
      if (!data) {
        toast("El código no es un Pasaporte de Trámite de Cívika");
        return;
      }
      this.lastResult = data;
      this.docChecks = {};
      this.render();
      $("officerResult")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    print() {
      document.body.classList.add("print-officer");
      const cleanup = () => { document.body.classList.remove("print-officer"); window.removeEventListener("afterprint", cleanup); };
      window.addEventListener("afterprint", cleanup);
      window.print();
      setTimeout(cleanup, 1500);
    },

    toggleDoc(i) {
      this.docChecks[i] = !this.docChecks[i];
      this.render();
    },

    decide(kind) {
      if (!this.lastResult) return;
      this.lastResult.decision = kind;
      this.lastResult.decisionTime = new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
      this.render();
    },

    render() {
      const box = $("officerResult");
      const d = this.lastResult;
      if (!box || !d) return;
      const base = kb();
      const biz = base.emprendimientosComunes.find(b => b.id === d.bizId);
      const pasos = base.pasosSecuenciales;
      const done = pasos.filter((p, i) => d.bits[i] === "1").length;
      const pct = Math.round((done / pasos.length) * 100);
      const docs = biz ? biz.documentacionRequerida : [];
      const checked = docs.filter((_, i) => this.docChecks[i]).length;
      const noAplica = (biz && biz.pasosNoAplicanSinLocal) || [];

      const decisionBanner = d.decision === "recibida"
        ? `<div class="rounded-2xl p-3 bg-emerald-600 text-white font-bold text-sm flex items-center gap-2"><i data-lucide="badge-check" class="w-5 h-5"></i> Carpeta recibida a las ${esc(d.decisionTime)}</div>`
        : d.decision === "devuelta"
          ? `<div class="rounded-2xl p-3 bg-amber-500 text-white font-bold text-sm flex items-center gap-2"><i data-lucide="undo-2" class="w-5 h-5"></i> Devuelta con observaciones a las ${esc(d.decisionTime)}</div>`
          : "";

      box.innerHTML = `
        <div class="space-y-3 animate-fade-in">
          ${decisionBanner}
          <div class="rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-lg">
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="min-w-0">
                <p class="text-[11px] font-bold uppercase tracking-wider text-amber-300">Pasaporte de Trámite • GAD Riobamba</p>
                <h3 class="text-lg font-black leading-tight mt-0.5 break-words">${esc(d.nombre)}</h3>
                <p class="text-sm text-blue-200">${esc(biz ? biz.nombre : d.bizId)}</p>
              </div>
              <span class="font-mono text-xs font-bold bg-white/10 border border-white/20 px-2 py-1 rounded">${esc(d.passportId)}</span>
            </div>
            <dl class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              <div class="bg-white/5 rounded-xl p-2"><dt class="text-blue-200">Parroquia</dt><dd class="font-bold">${esc(d.parroquia || "—")}</dd></div>
              <div class="bg-white/5 rounded-xl p-2"><dt class="text-blue-200">Local</dt><dd class="font-bold">${esc(d.tenencia || "—")}${d.m2 ? `, ${esc(d.m2)} m²` : ""}</dd></div>
              <div class="bg-white/5 rounded-xl p-2"><dt class="text-blue-200">Cédula/RUC</dt><dd class="font-bold ${d.idOk ? "text-emerald-300" : "text-amber-300"}">${d.idOk ? `✓ ${esc(d.idMask)}` : "No validada"}</dd></div>
              <div class="bg-white/5 rounded-xl p-2"><dt class="text-blue-200">Generado</dt><dd class="font-bold">${esc(d.fecha)}</dd></div>
            </dl>
            <div class="mt-3">
              <div class="flex justify-between text-xs font-bold"><span>Trámites declarados listos</span><span>${done} de ${pasos.length} (${pct}%)</span></div>
              <div class="mt-1.5 h-2 rounded-full bg-white/15 overflow-hidden"><div class="h-2 rounded-full ${pct === 100 ? "bg-emerald-400" : "bg-amber-400"}" style="width:${pct}%"></div></div>
            </div>
          </div>

          <div class="grid gap-3 xl:grid-cols-2">
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <h4 class="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-2"><i data-lucide="list-checks" class="w-4 h-4 text-blue-600"></i> Ruta de trámites</h4>
              <ol class="space-y-2">
                ${pasos.map((p, i) => {
                  const ok = d.bits[i] === "1";
                  const na = noAplica.includes(p.id);
                  return `
                  <li class="flex items-start gap-2.5 text-sm">
                    <span class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${ok ? "bg-emerald-600 text-white" : na ? "bg-slate-200 text-slate-600" : "bg-rose-100 text-rose-700"}">${ok ? "✓" : na ? "–" : "!"}</span>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-800 leading-tight">${p.paso}. ${esc(p.nombre)}</p>
                      <p class="text-xs ${ok ? "text-slate-500" : na ? "text-slate-500" : "text-rose-700 font-semibold"}">${ok ? `Revisar original: ${esc(p.documentoParaCarpeta || "")}` : na ? "Normalmente no aplica sin local abierto al público." : "Pendiente: el ciudadano no lo marcó como listo."}</p>
                    </div>
                  </li>`;
                }).join("")}
              </ol>
            </div>

            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div class="flex items-center justify-between gap-2 mb-2">
                <h4 class="font-extrabold text-sm text-slate-900 flex items-center gap-2"><i data-lucide="clipboard-check" class="w-4 h-4 text-blue-600"></i> Documentos del giro</h4>
                <span class="text-xs font-bold text-slate-500">${checked}/${docs.length} revisados</span>
              </div>
              ${docs.length ? `<ul class="space-y-1.5">
                ${docs.map((doc, i) => `
                  <li>
                    <label class="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer rounded-lg p-1.5 hover:bg-slate-50">
                      <input type="checkbox" class="mt-0.5 w-4 h-4 accent-blue-600 shrink-0" ${this.docChecks[i] ? "checked" : ""} onchange="civikaOfficer.toggleDoc(${i})">
                      <span class="${this.docChecks[i] ? "line-through text-slate-400" : ""}">${esc(doc)}</span>
                    </label>
                  </li>`).join("")}
              </ul>` : `<p class="text-xs text-slate-500">Giro no reconocido en esta versión de Cívika.</p>`}
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-primary bg-emerald-600 hover:bg-emerald-700" onclick="civikaOfficer.decide('recibida')"><i data-lucide="badge-check" class="w-4 h-4"></i> Recibir carpeta</button>
            <button type="button" class="btn-secondary" onclick="civikaOfficer.decide('devuelta')"><i data-lucide="undo-2" class="w-4 h-4"></i> Devolver con observaciones</button>
            <button type="button" class="btn-ghost" onclick="civikaOfficer.print()"><i data-lucide="printer" class="w-4 h-4"></i> Imprimir</button>
          </div>
          <p class="text-[11px] text-slate-500">Datos declarados por el ciudadano. El pasaporte no reemplaza la revisión de los documentos originales ni los sistemas oficiales del GAD.</p>
        </div>`;
      icons();
    }
  };

  // ============================================================
  // 4. COMPARTIR POR WHATSAPP
  // ============================================================
  const civikaShare = {
    buildText(biz) {
      const a = app();
      const pasos = kb().pasosSecuenciales;
      const noAplica = biz.pasosNoAplicanSinLocal || [];
      const lines = [];
      lines.push(`*Cívika Riobamba* – Requisitos para: *${biz.nombre}*`);
      lines.push("");
      lines.push("*Ruta de trámites (en este orden):*");
      pasos.forEach(p => {
        const mark = a && a.stepsState[p.id] ? "✅" : noAplica.includes(p.id) ? "➖" : "⬜";
        lines.push(`${mark} ${p.paso}. ${p.nombre}${noAplica.includes(p.id) ? " (normalmente no aplica sin local)" : ""}`);
      });
      lines.push("");
      lines.push("*Documentos para la carpeta:*");
      biz.documentacionRequerida.forEach(d => lines.push(`• ${d}`));
      lines.push("");
      lines.push(`💵 ${biz.costoAproxTotal}`);
      lines.push("");
      lines.push("⚠️ Información orientativa: confirma siempre en el SRI, GAD Riobamba, Bomberos o ARCSA. ¡No pagues tramitadores!");
      return lines.join("\n");
    },
    whatsapp() {
      const url = "https://wa.me/?text=" + encodeURIComponent(this.buildText(currentBiz()));
      window.open(url, "_blank", "noopener");
    },
    async native() {
      const biz = currentBiz();
      try {
        await navigator.share({ title: `Requisitos: ${biz.nombre}`, text: this.buildText(biz) });
      } catch (e) { /* el usuario canceló */ }
    },
    async copy() {
      const text = this.buildText(currentBiz());
      try {
        await navigator.clipboard.writeText(text);
        toast("Requisitos copiados");
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); toast("Requisitos copiados"); } catch (err) { toast("No se pudo copiar"); }
        ta.remove();
      }
    },
    barHtml(biz) {
      const canShare = typeof navigator.share === "function";
      return `
        <div class="flex flex-wrap items-center gap-2 pt-2.5 border-t border-blue-100">
          <span class="text-xs font-bold text-slate-600 mr-1">Comparte esta lista:</span>
          <button type="button" class="btn-primary btn-whatsapp text-xs" onclick="civikaShare.whatsapp()">
            <i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp
          </button>
          ${canShare ? `<button type="button" class="btn-secondary text-xs" onclick="civikaShare.native()"><i data-lucide="share-2" class="w-4 h-4"></i> Compartir…</button>` : ""}
          <button type="button" class="btn-ghost text-xs" onclick="civikaShare.copy()"><i data-lucide="copy" class="w-4 h-4"></i> Copiar</button>
        </div>
        ${(biz.pasosNoAplicanSinLocal || []).length ? `
        <div class="mt-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
          <i data-lucide="info" class="w-4 h-4 shrink-0 mt-0.5"></i>
          <span>Sin local abierto al público, los pasos de <b>Bomberos</b> y <b>Uso de Suelo</b> normalmente no aplican. Si abres un local o bodega, agrégalos.</span>
        </div>` : ""}`;
    }
  };

  // ============================================================
  // 5. APP INSTALABLE (PWA)
  // ============================================================
  const civikaPWA = {
    deferredPrompt: null,
    init() {
      const isHttp = location.protocol === "http:" || location.protocol === "https:";
      const btn = $("installAppBtn");
      const hint = $("installAppHint");
      const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

      if (window.CIVIKA_EMBEDDED) return; // dentro de Streamlit no se ofrece instalar
      if (!isHttp) {
        if (hint) {
          hint.textContent = "Para instalarla como app, ábrela desde un servidor (ver README: «Instalar en el celular»).";
          hint.classList.remove("hidden");
        }
        return;
      }
      if (!document.querySelector('link[rel="manifest"]')) {
        const link = document.createElement("link");
        link.rel = "manifest";
        link.href = "manifest.json";
        document.head.appendChild(link);
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(() => { /* sin modo offline */ });
      }
      if (standalone) return;

      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        btn?.classList.remove("hidden");
      });
      btn?.addEventListener("click", async () => {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        await this.deferredPrompt.userChoice.catch(() => null);
        this.deferredPrompt = null;
        btn.classList.add("hidden");
      });
      window.addEventListener("appinstalled", () => { btn?.classList.add("hidden"); toast("Cívika quedó instalada"); });

      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIOS && hint) {
        hint.textContent = "En iPhone: toca Compartir y luego «Agregar a pantalla de inicio».";
        hint.classList.remove("hidden");
      }
    }
  };

  // ============================================================
  // ORQUESTADOR: lo que app.js llama
  // ============================================================
  const civikaFeatures = {
    buildPassportPayload,
    parsePassportPayload,

    onAppReady() {
      civikaUI.init();
      civikaRenewals.load();
      civikaRenewals.render();
      civikaRenewals.refreshIndicators();
      civikaRenewals.notifyIfDue(false);
      civikaPWA.init();
    },

    onScreenChange(screenId, previous) {
      civikaUI.syncHistory(screenId);
      if (previous === "screen-officer" && screenId !== "screen-officer") civikaOfficer.stopCamera();
      if (screenId === "screen-renewals") civikaRenewals.render();
      if (screenId === "screen-unified-forms") civikaUI.placeResponsiveBlocks();
    },

    afterBusinessDocRender(biz, container) {
      const card = container && container.firstElementChild;
      if (!card) return;
      const wrap = document.createElement("div");
      wrap.innerHTML = civikaShare.barHtml(biz);
      while (wrap.firstChild) card.appendChild(wrap.firstChild);
    },

    afterStepsRender(container) {
      const biz = currentBiz();
      (biz.pasosNoAplicanSinLocal || []).forEach(stepId => {
        const card = container.querySelector(`#step-card-${stepId}`);
        if (!card || card.querySelector(".na-note")) return;
        const note = document.createElement("div");
        note.className = "na-note mb-2 p-2 rounded-xl bg-sky-50 border border-sky-200 text-[11px] font-semibold text-sky-900 flex items-center gap-1.5";
        note.innerHTML = `<i data-lucide="info" class="w-3.5 h-3.5 shrink-0"></i><span>Vendes sin local: este paso normalmente no aplica. Confírmalo en el GAD.</span>`;
        card.prepend(note);
      });
    },

    refreshAll() {
      civikaRenewals.render();
      civikaRenewals.refreshIndicators();
      if (civikaOfficer.lastResult) civikaOfficer.render();
    },

    runDemo(name) {
      if (name === "renovaciones_demo") {
        civikaRenewals.loadDemo();
        app().goToScreen("screen-renewals");
        toast("Ejemplo cargado: un permiso vencido y dos por vencer");
      } else if (name === "ventanilla_demo") {
        const a = app();
        if (!a.draftForm.esIdentificacionValida && typeof a.fillSampleValidRuc === "function") a.fillSampleValidRuc("0603849209001");
        a.goToScreen("screen-officer");
        civikaOfficer.useLocalPassport();
      }
    },

    resetDemo() {
      civikaRenewals.reset();
      civikaOfficer.lastResult = null;
      const box = $("officerResult");
      if (box) box.innerHTML = `<div class="bg-white rounded-2xl p-6 border border-dashed border-slate-300 text-center text-sm text-slate-500"><i data-lucide="scan-qr-code" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>Aún no se ha escaneado ningún pasaporte.</div>`;
      icons();
    }
  };

  window.civikaUI = civikaUI;
  window.civikaRenewals = civikaRenewals;
  window.civikaOfficer = civikaOfficer;
  window.civikaShare = civikaShare;
  window.civikaPWA = civikaPWA;
  window.civikaFeatures = civikaFeatures;
})();
