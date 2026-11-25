/**
 * CÍVIKA - Herramientas del ciudadano
 * -----------------------------------------------------------------
 * 1. Buscador de giro en lenguaje natural ("vendo empanadas en mi casa")
 * 2. "Mi expediente": seguimiento de la ruta y del estado institucional (simulación)
 * 3. Agenda de la ruta: archivo .ics y enlace a Google Calendar
 *
 * Módulo independiente: no modifica app.js; se engancha a los métodos de
 * renderizado existentes para dibujarse después de ellos.
 * Todo se guarda en este navegador. No se piden ni guardan datos personales.
 */
(function () {
  "use strict";

  const KB = () => (typeof CIVIKA_KNOWLEDGE_BASE !== "undefined" ? CIVIKA_KNOWLEDGE_BASE : null);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m) => { if (typeof window.civikaToast === "function") window.civikaToast(m); };
  const icons = () => { if (window.lucide) window.lucide.createIcons(); };
  const norm = (s) => String(s || "").toLowerCase().replace(/ñ/g, "nn").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  // ==============================================================
  // 1. BUSCADOR DE GIRO
  // ==============================================================
  // Palabras frecuentes por giro (orientativas). [término, peso]
  const LEXICON = {
    tienda_ropa: [["ropa", 3], ["prenda", 2], ["vestir", 2], ["calzado", 2], ["zapato", 2], ["zapatilla", 2], ["boutique", 3], ["camiseta", 2], ["jean", 2], ["pantalon", 2], ["vestido", 2], ["accesorio", 1], ["bisuteria", 2], ["cartera", 1], ["mochila", 1], ["uniforme", 2], ["lenceria", 2], ["ropa usada", 3], ["americana", 1]],
    cafeteria: [["cafe", 3], ["cafeteria", 3], ["jugo", 2], ["batido", 2], ["postre", 2], ["pastel", 2], ["torta", 2], ["dulce", 1], ["helado", 2], ["heladeria", 2], ["snack", 2], ["sanduche", 2], ["sandwich", 2], ["empanada", 2], ["humita", 2], ["tamal", 2], ["pan", 1], ["panaderia", 1], ["fuente de soda", 3], ["cupcake", 2], ["galleta", 1], ["bocadito", 1]],
    restaurante: [["restaurante", 3], ["comedor", 3], ["almuerzo", 3], ["menu", 1], ["comida", 2], ["cocina", 1], ["ceviche", 2], ["cevicheria", 3], ["pollo", 2], ["asadero", 3], ["parrillada", 3], ["picanteria", 3], ["hornado", 3], ["fritada", 3], ["chifa", 3], ["pizza", 2], ["pizzeria", 3], ["hamburguesa", 2], ["salchipapa", 2], ["comida rapida", 3], ["encebollado", 3], ["food truck", 3], ["catering", 2], ["mariscos", 2], ["caldo", 2], ["seco", 1]],
    micromercado: [["tienda de barrio", 3], ["tienda", 1], ["abarrotes", 3], ["viveres", 3], ["minimarket", 3], ["micromercado", 3], ["despensa", 3], ["fruta", 2], ["verdura", 2], ["legumbre", 2], ["lacteo", 2], ["huevo", 1], ["bazar", 1], ["comisariato", 3], ["tercena", 1]],
    profesional: [["abogado", 3], ["abogada", 3], ["contador", 3], ["contadora", 3], ["contabilidad", 3], ["arquitecto", 3], ["arquitecta", 3], ["ingeniero", 2], ["ingeniera", 2], ["medico", 3], ["medica", 3], ["doctor", 2], ["odontologo", 3], ["dentista", 3], ["psicologo", 3], ["psicologa", 3], ["consultorio", 3], ["consultoria", 2], ["asesoria", 2], ["asesor", 2], ["oficina", 1], ["estudio juridico", 3], ["nutricionista", 3], ["auditor", 2], ["topografo", 2]],
    taller: [["mecanica", 3], ["mecanico", 3], ["taller", 2], ["lubricadora", 3], ["cambio de aceite", 3], ["aceite", 1], ["vulcanizadora", 3], ["llanta", 2], ["electrico automotriz", 3], ["enderezada", 3], ["pintura automotriz", 3], ["lavadora de autos", 3], ["lavado de autos", 3], ["moto", 2], ["carro", 2], ["auto", 1], ["vehiculo", 2], ["frenos", 2], ["electromecanica", 2]],
    artesanal: [["artesano", 3], ["artesana", 3], ["artesania", 3], ["artesanal", 3], ["carpinteria", 3], ["carpintero", 3], ["mueble", 2], ["sastreria", 3], ["sastre", 3], ["costura", 3], ["confeccion", 3], ["modista", 3], ["zapateria", 2], ["tejido", 2], ["bordado", 2], ["ceramica", 2], ["joyeria", 1], ["cuero", 2], ["talabarteria", 3], ["tallado", 2], ["macrame", 2], ["calificacion artesanal", 3]],
    peluqueria: [["peluqueria", 3], ["peluquero", 3], ["barberia", 3], ["barbero", 3], ["corte de cabello", 3], ["cabello", 2], ["pelo", 1], ["salon de belleza", 3], ["belleza", 2], ["uña", 3], ["manicure", 3], ["pedicure", 3], ["maquillaje", 2], ["ceja", 2], ["pestaña", 2], ["spa", 2], ["estetica", 2], ["tinte", 2], ["peinado", 2], ["depilacion", 2]],
    farmacia: [["farmacia", 3], ["botica", 3], ["botiquin", 3], ["medicamento", 3], ["medicina", 2], ["drogueria", 3], ["farmaceutico", 3]],
    venta_redes: [["redes", 3], ["red social", 3], ["redes sociales", 3], ["instagram", 3], ["facebook", 3], ["tiktok", 3], ["whatsapp", 2], ["online", 3], ["en linea", 2], ["internet", 3], ["tienda virtual", 3], ["catalogo", 2], ["delivery", 2], ["a domicilio", 2], ["desde mi casa", 2], ["desde casa", 2], ["marketplace", 3], ["envio", 1], ["por pedido", 2]]
  };
  const ONLINE_HINTS = ["redes", "instagram", "facebook", "tiktok", "whatsapp", "online", "internet", "tienda virtual", "marketplace", "en linea", "catalogo"];
  const FOOD_GIROS = ["cafeteria", "restaurante", "micromercado"];
  const STOP = new Set(["de", "del", "la", "el", "los", "las", "y", "o", "en", "un", "una", "unos", "unas", "mi", "mis", "por", "para", "con", "a", "al", "que", "yo", "vendo", "vender", "venta", "ventas", "hago", "hacer", "tengo", "quiero", "poner", "abrir", "negocio", "emprendimiento", "local", "casa", "me", "se", "es", "soy", "trabajo"]);

  // Plural simple: "empanadas" → "empanada", "llantas" → "llanta", "uñas" → "una"
  const stem = (w) => (w.length > 4 && w.endsWith("es") && !w.endsWith("ies") ? w.slice(0, -2) : (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));

  function matchGiros(query) {
    const q = norm(query);
    if (q.length < 3) return { q, results: [] };
    const words = q.split(" ").filter(Boolean);
    const stems = words.map(stem);
    const content = words.filter(w => !STOP.has(w)).map(stem);
    const qStem = stems.join(" ");
    const kb = KB();
    const list = kb ? kb.emprendimientosComunes : [];

    const results = list.map(biz => {
      let score = 0;
      const hits = [];
      (LEXICON[biz.id] || []).forEach(([term, w]) => {
        const t = norm(term);
        const tStem = t.split(" ").map(stem).join(" ");
        let ok = false;
        if (t.includes(" ")) ok = q.includes(t) || qStem.includes(tStem);
        else ok = content.includes(tStem) || content.some(c => c.length >= 5 && tStem.length >= 5 && (c.startsWith(tStem) || tStem.startsWith(c)));
        if (ok) { score += w; hits.push(term); }
      });
      // Coincidencia con el nombre visible del giro
      norm(biz.nombre).split(" ").map(stem).forEach(nw => {
        if (nw.length >= 4 && content.includes(nw) && !hits.some(h => stem(norm(h)) === nw)) { score += 1; hits.push(nw); }
      });
      return { biz, score, hits };
    }).filter(r => r.score > 0);

    // Venta por redes + producto: se sugiere primero "redes" y luego el giro del producto
    const online = ONLINE_HINTS.some(h => q.includes(h));
    results.forEach(r => { if (online && r.biz.id === "venta_redes") r.score += 2; });
    results.sort((a, b) => b.score - a.score);
    const foodTerms = results.some(r => FOOD_GIROS.includes(r.biz.id) && r.score >= 2);
    return { q, results: results.slice(0, 3), online, foodTerms };
  }

  const giroSearch = {
    timer: null,

    mount() {
      const grid = document.getElementById("commonBusinessesContainer");
      if (!grid || document.getElementById("giroSearchBox")) return;
      const box = document.createElement("div");
      box.id = "giroSearchBox";
      box.className = "mb-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs space-y-2";
      box.innerHTML = `
        <label for="giroSearchInput" class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <i data-lucide="search" class="w-4 h-4 text-blue-600"></i>
          ¿No encuentras tu negocio? Descríbelo con tus palabras
        </label>
        <div class="flex gap-2">
          <input id="giroSearchInput" type="search" autocomplete="off" maxlength="120"
                 placeholder="Ej.: vendo empanadas en mi casa"
                 class="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <button type="button" id="giroSearchBtn" class="btn-primary btn-sm shrink-0">Buscar</button>
        </div>
        <div class="flex flex-wrap gap-1.5" aria-label="Ejemplos">
          ${["vendo empanadas", "corto cabello", "vendo ropa por Instagram", "taller de motos", "soy contadora"].map(ex =>
            `<button type="button" class="giro-example text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer">${esc(ex)}</button>`).join("")}
        </div>
        <div id="giroSearchResults" aria-live="polite"></div>
      `;
      grid.insertAdjacentElement("beforebegin", box);
      const input = box.querySelector("#giroSearchInput");
      input.addEventListener("input", () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.run(input.value, false), 250);
      });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this.run(input.value, true); } });
      box.querySelector("#giroSearchBtn").addEventListener("click", () => this.run(input.value, true));
      box.querySelectorAll(".giro-example").forEach(btn => btn.addEventListener("click", () => { input.value = btn.textContent; this.run(input.value, true); }));
      icons();
    },

    run(text, explicit) {
      const out = document.getElementById("giroSearchResults");
      if (!out) return;
      const { q, results, online, foodTerms } = matchGiros(text);
      if (q.length < 3) {
        out.innerHTML = explicit ? `<p class="text-[11px] text-slate-500">Escribe al menos 3 letras.</p>` : "";
        return;
      }
      if (!results.length) {
        out.innerHTML = `
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
            <p><b>No encontramos un giro parecido</b> entre los 10 tipos de negocio de Cívika.</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" id="giroAskCopilot" class="btn-primary btn-sm">Preguntar al Copiloto IA</button>
              <button type="button" id="giroSeeAll" class="btn-secondary btn-sm">Ver todos los tipos</button>
            </div>
            <p class="text-[11px]">El código de actividad (CIIU) definitivo lo confirma el SRI al registrar o actualizar tu RUC.</p>
          </div>`;
        out.querySelector("#giroAskCopilot").addEventListener("click", () => this.askCopilot(text));
        out.querySelector("#giroSeeAll").addEventListener("click", () => document.getElementById("commonBusinessesContainer")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        return;
      }
      const best = results[0].score;
      const selected = window.civikaApp ? window.civikaApp.selectedBusinessId : "";
      out.innerHTML = `
        <ul class="space-y-1.5">
          ${results.map((r, i) => {
            const level = r.score >= Math.max(3, best) && i === 0 ? "Más parecido" : (r.score >= 3 ? "Parecido" : "Posible");
            const ciiu = String(r.biz.ciiuReferencia || "").split(" - ")[0];
            const isSel = r.biz.id === selected;
            return `
            <li class="flex items-center justify-between gap-2 rounded-xl border ${i === 0 ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-white"} p-2.5">
              <div class="min-w-0">
                <p class="text-xs font-extrabold text-slate-900">${esc(r.biz.nombre)}
                  <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}">${level}</span></p>
                <p class="text-[11px] text-slate-600">CIIU referencial ${esc(ciiu)} · coincide con: ${esc(r.hits.slice(0, 3).join(", "))}</p>
              </div>
              <button type="button" data-giro="${esc(r.biz.id)}" class="giro-pick shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${isSel ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}">
                ${isSel ? "Elegido" : "Elegir"}
              </button>
            </li>`;
          }).join("")}
        </ul>
        ${online ? `<p class="text-[11px] text-slate-600">Si vendes solo por internet y no atiendes público, elige "Venta por Redes Sociales". Si además tienes un local o bodega abierta, elige el giro del producto.</p>` : ""}
        ${foodTerms ? `<p class="text-[11px] text-slate-600">Si preparas o vendes alimentos, revisa también el paso de control sanitario (ARCSA).</p>` : ""}
        <p class="text-[10px] text-slate-500">Sugerencia orientativa: el código CIIU definitivo lo confirma el SRI al registrar o actualizar tu RUC.</p>
      `;
      out.querySelectorAll(".giro-pick").forEach(btn => btn.addEventListener("click", () => {
        if (!window.civikaApp) return;
        window.civikaApp.selectBusiness(btn.dataset.giro, true);
        toast(`Giro elegido: ${KB().emprendimientosComunes.find(b => b.id === btn.dataset.giro)?.nombre || ""}`);
        this.run(document.getElementById("giroSearchInput")?.value || text, false);
      }));
      if (window.civikaDB && explicit) {
        window.civikaDB.recordAnonymousMetric({ actividad: results[0].biz.nombre, evento: "busqueda_giro" }).catch(() => {});
      }
    },

    askCopilot(text) {
      const app = window.civikaApp;
      if (!app || !app.assistant) return;
      app.goToScreen("screen-assistant");
      setTimeout(() => app.assistant.processUserMessage(`Mi negocio es: "${String(text).slice(0, 120)}". ¿Qué tipo de negocio de Cívika se parece más y qué trámites me corresponden en Riobamba?`), 150);
    }
  };

  // ==============================================================
  // 3. AGENDA (.ics + Google Calendar)
  // ==============================================================
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = String(s).split("-").map(Number); return (y && m && d) ? new Date(y, m - 1, d) : null; };
  const nextBusinessDay = (d) => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; };
  const addBusinessDays = (d, n) => { const x = new Date(d); let left = n; while (left > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) left--; } return x; };
  const fmtDay = (d) => d.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" });

  const icsEsc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  // Plegado de líneas a 75 octetos (RFC 5545), seguro con tildes y ñ
  function foldLine(line) {
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;
    const parts = [];
    let cur = "", bytes = 0, limit = 75;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (bytes + b > limit) { parts.push(cur); cur = ""; bytes = 0; limit = 74; }
      cur += ch; bytes += b;
    }
    if (cur) parts.push(cur);
    return parts.join("\r\n ");
  }

  const agenda = {
    settings() {
      const s = store.get("civika_route_agenda_v1", {});
      const start = parseISO(s.inicio);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return {
        inicio: start && start >= today ? start : nextBusinessDay(new Date(today.getTime() + 86400000)),
        espacio: [1, 2, 3, 5, 7].includes(Number(s.espacio)) ? Number(s.espacio) : 2
      };
    },
    save(partial) {
      const cur = store.get("civika_route_agenda_v1", {});
      store.set("civika_route_agenda_v1", Object.assign(cur, partial));
    },

    /** Pasos pendientes con su fecha sugerida (días hábiles) */
    plan(route) {
      const { inicio, espacio } = this.settings();
      let day = nextBusinessDay(inicio);
      return route.filter(r => r.aplica && !r.hecho).map((r, i) => {
        if (i > 0) day = addBusinessDays(day, espacio);
        return { ...r, fecha: new Date(day) };
      });
    },

    description(step, biz) {
      const lista = (step.pilares?.checklistPersonalizado || []).map(c => `- ${c.item}`).join("\n");
      return [
        `${step.nombre} (${step.entidad}).`,
        `Negocio: ${biz.nombre}.`,
        step.tiempoPresencial ? `Tiempo referencial presencial: ${step.tiempoPresencial}.` : "",
        lista ? `Lleva:\n${lista}` : "",
        step.enlaceOficial ? `Canal oficial: ${step.enlaceOficial}` : "",
        "Fecha elegida por ti para organizarte; no es un plazo oficial. Verifica horarios y requisitos en el canal oficial.",
        "Creado con Cívika Riobamba."
      ].filter(Boolean).join("\n");
    },

    downloadIcs(route, biz) {
      const items = this.plan(route);
      if (!items.length) { toast("No tienes pasos pendientes para agendar"); return; }
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Civika Riobamba//Ruta del emprendedor//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Cívika · Mi ruta"];
      items.forEach(it => {
        const d = ymd(it.fecha);
        const next = new Date(it.fecha); next.setDate(next.getDate() + 1);
        lines.push(
          "BEGIN:VEVENT",
          `UID:civika-ruta-${it.step.id}-${d}-${biz.id}@civika.riobamba`,
          `DTSTAMP:${stamp}`,
          `DTSTART;VALUE=DATE:${d}`,
          `DTEND;VALUE=DATE:${ymd(next)}`,
          `SUMMARY:${icsEsc(`Cívika · Paso ${it.step.paso}: ${it.step.nombre}`)}`,
          `DESCRIPTION:${icsEsc(this.description(it.step, biz))}`,
          `LOCATION:${icsEsc(it.step.entidad + ", Riobamba")}`,
          "TRANSP:TRANSPARENT",
          "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc("Mañana: " + it.step.nombre)}`, "TRIGGER:-PT15H", "END:VALARM",
          "END:VEVENT"
        );
      });
      lines.push("END:VCALENDAR");
      const ics = lines.map(foldLine).join("\r\n") + "\r\n";
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `civika-mi-ruta-${biz.id}.ics`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      toast(`Agenda descargada: ${items.length} paso${items.length === 1 ? "" : "s"}. Ábrela para agregarla a tu calendario`);
    },

    googleUrl(item, biz) {
      const next = new Date(item.fecha); next.setDate(next.getDate() + 1);
      const details = this.description(item.step, biz).slice(0, 900);
      const p = new URLSearchParams({
        action: "TEMPLATE",
        text: `Cívika · Paso ${item.step.paso}: ${item.step.nombre}`,
        dates: `${ymd(item.fecha)}/${ymd(next)}`,
        details,
        location: `${item.step.entidad}, Riobamba`
      });
      return `https://calendar.google.com/calendar/render?${p.toString()}`;
    }
  };

  // ==============================================================
  // 2. MI EXPEDIENTE
  // ==============================================================
  const STEP_TO_TRAMITES = {
    req_ruc: ["ruc"], req_bomberos: ["bomberos"], req_uso_suelo: ["uso_suelo"],
    req_solvencia: ["solvencia"], req_formulario_patente: ["patente"], req_luf_final: ["luf", "arcsa"]
  };
  const TIPS = [
    [/planilla/i, "Pide una planilla de luz, agua o teléfono emitida hace menos de 90 días, con la dirección del local."],
    [/extintor/i, "Recarga el extintor con un proveedor autorizado y conserva la factura o etiqueta vigente para la reinspección."],
    [/señal/i, "Coloca la señalética de evacuación y salida visible antes de la reinspección."],
    [/gas|glp/i, "Revisa la instalación de gas (mangueras, válvula, ubicación del cilindro) antes de la inspección."],
    [/zona|icus|compatib/i, "Verifica la compatibilidad de uso de suelo de la dirección antes de firmar o renovar el arriendo."],
    [/catastral|direcci/i, "Confirma la dirección exacta y la clave catastral del predio en el GAD."],
    [/no adeudar|vencido o no emitido/i, "Solicita un nuevo certificado de No Adeudar y entrégalo dentro de su vigencia."],
    [/formulario/i, "Completa todos los campos del formulario de patente y fírmalo."],
    [/actividad|ruc/i, "Actualiza la actividad económica de tu RUC en el SRI para que coincida con tu negocio."],
    [/sanitaria|arcsa/i, "Revisa en ARCSA la categoría sanitaria que corresponde a tu establecimiento."],
    [/habilitante|previo|coinciden/i, "Revisa que los permisos previos tengan la misma dirección y actividad."]
  ];
  const tipFor = (motivo) => (TIPS.find(([re]) => re.test(motivo || "")) || [null, "Lee la observación, corrige el documento y vuelve a presentarlo en la institución."])[1];

  const STATE_UI = {
    "Completado": { cls: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: "circle-check", label: "Aprobado" },
    "En revisión": { cls: "bg-amber-50 text-amber-800 border-amber-200", icon: "clock", label: "En revisión" },
    "Observado": { cls: "bg-rose-50 text-rose-800 border-rose-200", icon: "triangle-alert", label: "Observado" },
    "Por iniciar": { cls: "bg-slate-50 text-slate-500 border-slate-200", icon: "lock", label: "Por iniciar" },
    "No aplica": { cls: "bg-white text-slate-400 border-slate-200 border-dashed", icon: "minus", label: "No aplica" }
  };
  const pill = (estado) => {
    const s = STATE_UI[estado] || STATE_UI["Por iniciar"];
    return `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.cls}"><i data-lucide="${s.icon}" class="w-3 h-3"></i>${esc(s.label)}</span>`;
  };

  const tracker = {
    queued: false,
    lookupResult: null,

    schedule() {
      if (this.queued) return;
      this.queued = true;
      setTimeout(() => { this.queued = false; this.render().catch(err => console.warn("Mi expediente:", err)); }, 0);
    },

    route(app, biz) {
      const kb = KB();
      const noAplica = biz.pasosNoAplicanSinLocal || [];
      let nextMarked = false;
      return kb.pasosSecuenciales.map(step => {
        const aplica = !noAplica.includes(step.id);
        const hecho = aplica && !!app.stepsState[step.id];
        let estado = !aplica ? "no_aplica" : (hecho ? "hecho" : (nextMarked ? "pendiente" : "siguiente"));
        if (estado === "siguiente") nextMarked = true;
        return { step, aplica, hecho, estado };
      });
    },

    async findMyExpediente(biz) {
      if (!window.civikaDB || typeof window.civikaDB.getPrevalidationInbox !== "function") return { inbox: null, exp: null };
      const inbox = (await window.civikaDB.getPrevalidationInbox()).filter(i => i.origen === "ciudadano" && i.giroId === biz.id);
      const mine = inbox[0] || null; // el más reciente
      let exp = null;
      if (mine && window.civikaBackoffice) {
        await window.civikaBackoffice.load();
        await window.civikaBackoffice.syncCitizenSubmissions();
        exp = window.civikaBackoffice.findExp(mine.id) || null;
      }
      return { inbox: mine, exp };
    },

    notify(inbox, exp) {
      const seen = new Set(store.get("civika_tracker_seen_v1", []));
      const fresh = [];
      if (inbox && inbox.estado === "Pre-Aprobado") fresh.push([`pre-${inbox.id}`, `Tu expediente ${inbox.id} fue pre-aprobado. Código de pase rápido: ${inbox.codigoPase}`]);
      if (exp) {
        exp.eventos.forEach(ev => {
          if (ev.accion !== "Observado" && ev.accion !== "Aprobado") return;
          const key = `${exp.id}-${ev.tramite}-${ev.accion}-${ev.fecha}`;
          const nombre = window.civikaBackoffice?.tram(ev.tramite)?.nombre || ev.tramite;
          fresh.push([key, ev.accion === "Observado" ? `${nombre}: observado. Revisa qué corregir en "Mi expediente".` : `${nombre}: aprobado.`]);
        });
      }
      const nuevos = fresh.filter(([k]) => !seen.has(k));
      if (!nuevos.length) return;
      // Solo se muestra el aviso más reciente para no saturar
      toast(nuevos[nuevos.length - 1][1]);
      nuevos.forEach(([k]) => seen.add(k));
      store.set("civika_tracker_seen_v1", Array.from(seen).slice(-200));
    },

    mountBox() {
      const steps = document.getElementById("unifiedStepsContainer");
      if (!steps || !steps.parentElement) return null;
      let box = document.getElementById("citizenTrackerBox");
      if (!box) {
        box = document.createElement("div");
        box.id = "citizenTrackerBox";
        box.className = "mt-4";
      }
      const anchor = document.getElementById("prevalidationCitizenBox") || steps;
      if (anchor.nextElementSibling !== box) anchor.insertAdjacentElement("afterend", box);
      return box;
    },

    async render() {
      const app = window.civikaApp;
      const kb = KB();
      if (!app || !kb) return;
      const box = this.mountBox();
      if (!box) return;
      const biz = kb.emprendimientosComunes.find(b => b.id === app.selectedBusinessId) || kb.emprendimientosComunes[0];
      const route = this.route(app, biz);
      const aplicables = route.filter(r => r.aplica);
      const hechos = aplicables.filter(r => r.hecho).length;
      const pct = aplicables.length ? Math.round((hechos / aplicables.length) * 100) : 0;
      const { inbox, exp } = await this.findMyExpediente(biz);
      this.notify(inbox, exp);

      const plan = agenda.plan(route);
      const planById = Object.fromEntries(plan.map(p => [p.step.id, p]));
      const { inicio, espacio } = agenda.settings();
      const observados = [];

      const rows = route.map(r => {
        const keys = STEP_TO_TRAMITES[r.step.id] || [];
        const inst = exp ? keys.filter(k => exp.tramites[k] && exp.tramites[k].estado !== "No aplica").map(k => ({ k, t: exp.tramites[k] })) : [];
        inst.forEach(({ k, t }) => { if (t.estado === "Observado") observados.push({ k, t, step: r.step }); });
        const dot = r.estado === "hecho" ? "bg-emerald-500 border-emerald-500" : r.estado === "siguiente" ? "bg-blue-600 border-blue-600 ring-4 ring-blue-100" : r.estado === "no_aplica" ? "bg-white border-slate-300 border-dashed" : "bg-white border-slate-300";
        const label = r.estado === "hecho" ? "Hecho" : r.estado === "siguiente" ? "Siguiente" : r.estado === "no_aplica" ? "No aplica" : "Pendiente";
        const fecha = planById[r.step.id] ? `<span class="text-[10px] text-slate-500">· sugerido ${esc(fmtDay(planById[r.step.id].fecha))}</span>` : "";
        return `
          <li class="relative pl-6 pb-3 last:pb-0">
            <span class="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 ${dot}"></span>
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div class="min-w-0">
                <p class="text-xs font-bold ${r.estado === "no_aplica" ? "text-slate-400" : "text-slate-900"}">Paso ${r.step.paso} · ${esc(r.step.nombre)}</p>
                <p class="text-[11px] text-slate-500">${esc(String(r.step.entidad).split(" (")[0])} · <b class="${r.estado === "siguiente" ? "text-blue-700" : ""}">${label}</b> ${fecha}</p>
              </div>
              ${inst.length ? `<div class="flex flex-wrap gap-1">${inst.map(({ k, t }) => `<span class="inline-flex items-center gap-1 text-[10px] text-slate-500">${keys.length > 1 ? esc(k.toUpperCase()) + ":" : ""}${pill(t.estado)}</span>`).join("")}</div>` : ""}
            </div>
          </li>`;
      }).join("");

      const nextStep = route.find(r => r.estado === "siguiente");
      const nextPlan = nextStep ? planById[nextStep.step.id] : null;

      box.innerHTML = `
        <section class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3" aria-labelledby="trackerTitle">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div class="min-w-0">
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Seguimiento</p>
              <h4 id="trackerTitle" class="text-sm font-extrabold text-slate-900">Mi expediente · ${esc(biz.nombre)}</h4>
              <p class="text-[11px] text-slate-600">${hechos}/${aplicables.length} pasos completados${nextStep ? ` · siguiente: <b>${esc(nextStep.step.nombre)}</b>` : " · ¡ruta completa!"}</p>
            </div>
            ${inbox ? `<span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">${esc(inbox.id)}</span>` : ""}
          </div>
          <div class="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Avance de la ruta">
            <div class="h-full bg-blue-600 rounded-full transition-all" style="width:${pct}%"></div>
          </div>

          ${inbox && inbox.estado === "Pre-Aprobado" ? `
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <p class="font-extrabold">Pre-aprobado · Código de pase rápido: <span class="font-mono tracking-wider">${esc(inbox.codigoPase)}</span></p>
              <p class="text-[11px]">Preséntalo en ventanilla con tus documentos originales. La emisión oficial la realiza la institución.</p>
            </div>` : ""}

          ${observados.length ? `
            <div class="space-y-2">
              ${observados.map(({ k, t, step }) => `
                <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5" data-obs="${esc(k)}">
                  <p class="font-extrabold flex items-center gap-1"><i data-lucide="triangle-alert" class="w-3.5 h-3.5"></i>${esc(window.civikaBackoffice?.tram(k)?.nombre || step.nombre)}: observado</p>
                  <p>Motivo: <b>${esc(t.motivo)}</b></p>
                  <p><b>Qué hacer:</b> ${esc(tipFor(t.motivo))}</p>
                  <button type="button" class="tracker-corrected px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 text-[11px] font-bold hover:bg-rose-100 cursor-pointer" data-exp="${esc(exp.id)}" data-k="${esc(k)}">
                    Ya corregí: enviar a revisión otra vez
                  </button>
                </div>`).join("")}
            </div>` : ""}

          <ol class="pt-1 border-l-2 border-slate-100 ml-1.5 pl-0" aria-label="Mi ruta">${rows}</ol>

          ${!inbox ? `<p class="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">Cuando envíes tu resumen a Pre-Validación, aquí verás el estado de cada institución (simulación de convenio).</p>` : `<p class="text-[10px] text-slate-500">Estado institucional: simulación de demostración guardada en este navegador; no es una respuesta oficial.</p>`}

          ${exp ? `
            <details class="text-xs">
              <summary class="cursor-pointer font-bold text-slate-700">Historial de mi expediente</summary>
              <ol class="mt-2 space-y-1.5">
                ${exp.eventos.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8).map(ev => `
                  <li class="text-[11px]"><b>${esc(ev.accion)}</b>${ev.tramite ? ` · ${esc(window.civikaBackoffice?.tram(ev.tramite)?.nombre || ev.tramite)}` : ""}
                    <span class="text-slate-500">· ${esc(new Date(ev.fecha).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }))}</span>
                    ${ev.motivo ? `<br><span class="text-rose-700">${esc(ev.motivo)}</span>` : ""}</li>`).join("")}
              </ol>
            </details>` : ""}

          <div class="pt-2 border-t border-slate-100 space-y-2">
            <p class="text-xs font-extrabold text-slate-800 flex items-center gap-1.5"><i data-lucide="calendar-plus" class="w-4 h-4 text-blue-600"></i>Agenda de mi ruta</p>
            ${plan.length ? `
              <div class="flex flex-wrap items-end gap-2">
                <div>
                  <label for="agendaStart" class="text-[10px] font-bold text-slate-600 block">Empiezo el</label>
                  <input id="agendaStart" type="date" value="${isoDate(inicio)}" min="${isoDate(new Date())}" class="px-2 py-1.5 rounded-lg border border-slate-300 text-xs">
                </div>
                <div>
                  <label for="agendaGap" class="text-[10px] font-bold text-slate-600 block">Días hábiles entre pasos</label>
                  <select id="agendaGap" class="px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white">
                    ${[1, 2, 3, 5, 7].map(n => `<option value="${n}" ${n === espacio ? "selected" : ""}>${n}</option>`).join("")}
                  </select>
                </div>
                <button type="button" id="agendaIcsBtn" class="btn-primary btn-sm"><i data-lucide="download" class="w-4 h-4"></i> Descargar agenda (.ics)</button>
                ${nextPlan ? `<a id="agendaGoogleBtn" href="${esc(agenda.googleUrl(nextPlan, biz))}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-sm"><i data-lucide="calendar" class="w-4 h-4"></i> Siguiente paso en Google Calendar</a>` : ""}
              </div>
              <p class="text-[10px] text-slate-500">${plan.length} paso${plan.length === 1 ? "" : "s"} pendiente${plan.length === 1 ? "" : "s"}, sin fines de semana y con aviso el día anterior. El archivo .ics funciona en Google Calendar, Outlook, iPhone y Android. Son fechas para organizarte, no plazos oficiales.</p>
            ` : `<p class="text-[11px] text-slate-600">No tienes pasos pendientes. Para los vencimientos anuales usa <button type="button" id="agendaGoRenewals" class="underline font-semibold text-blue-700 cursor-pointer">Mantener mi negocio</button>.</p>`}
          </div>

          <div class="pt-2 border-t border-slate-100 space-y-2">
            <label for="trackerLookup" class="text-xs font-extrabold text-slate-800 block">Consultar un expediente</label>
            <div class="flex gap-2">
              <input id="trackerLookup" type="search" maxlength="40" placeholder="EXP-RIO-2026-041 o PR-041-XXXXXX" class="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono">
              <button type="button" id="trackerLookupBtn" class="btn-secondary btn-sm shrink-0">Consultar</button>
            </div>
            <div id="trackerLookupResult" aria-live="polite">${this.lookupResult || ""}</div>
            <p class="text-[10px] text-slate-500">En esta demostración la consulta busca expedientes guardados en este navegador.</p>
          </div>
        </section>
      `;

      // Eventos
      box.querySelectorAll(".tracker-corrected").forEach(btn => btn.addEventListener("click", async () => {
        if (!window.civikaBackoffice) return;
        await window.civikaBackoffice.load();
        await window.civikaBackoffice.markCorrected(btn.dataset.exp, btn.dataset.k);
        toast("Corrección enviada: el trámite volvió a revisión");
        this.schedule();
      }));
      const start = box.querySelector("#agendaStart");
      const gap = box.querySelector("#agendaGap");
      if (start) start.addEventListener("change", () => { if (start.value) { agenda.save({ inicio: start.value }); this.schedule(); } });
      if (gap) gap.addEventListener("change", () => { agenda.save({ espacio: Number(gap.value) }); this.schedule(); });
      const icsBtn = box.querySelector("#agendaIcsBtn");
      if (icsBtn) icsBtn.addEventListener("click", () => agenda.downloadIcs(route, biz));
      const goRen = box.querySelector("#agendaGoRenewals");
      if (goRen) goRen.addEventListener("click", () => app.goToScreen("screen-renewals"));
      const look = box.querySelector("#trackerLookup");
      const lookBtn = box.querySelector("#trackerLookupBtn");
      if (look && lookBtn) {
        const go = () => this.lookup(look.value);
        lookBtn.addEventListener("click", go);
        look.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
      }
      icons();
    },

    async lookup(raw) {
      const code = String(raw || "").trim().toUpperCase();
      const out = document.getElementById("trackerLookupResult");
      if (!out) return;
      if (code.length < 5) { out.innerHTML = `<p class="text-[11px] text-slate-500">Escribe el número de expediente o el código de pase rápido.</p>`; return; }
      let inbox = null, exp = null;
      if (window.civikaDB) {
        const all = await window.civikaDB.getPrevalidationInbox();
        inbox = all.find(i => String(i.id).toUpperCase() === code || String(i.codigoPase || "").toUpperCase() === code) || null;
      }
      if (window.civikaBackoffice) {
        await window.civikaBackoffice.load();
        exp = window.civikaBackoffice.findExp(inbox ? inbox.id : code) || null;
      }
      if (!inbox && !exp) {
        this.lookupResult = `<p class="text-[11px] text-rose-700">No encontramos ese expediente en este dispositivo.</p>`;
      } else {
        const bo = window.civikaBackoffice;
        const id = (inbox || exp).id;
        const giro = (inbox || exp).giroNombre;
        this.lookupResult = `
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <p class="font-extrabold text-slate-900">${esc(id)} · ${esc(giro)}</p>
            ${inbox ? `<p class="text-[11px] text-slate-600">Pre-validación: <b>${esc(inbox.estado)}</b>${inbox.codigoPase ? ` · pase ${esc(inbox.codigoPase)}` : ""}${inbox.motivo ? ` · ${esc(inbox.motivo)}` : ""}</p>` : ""}
            ${exp && bo ? `<div class="flex flex-wrap gap-1.5">${bo.TRAMITES.filter(t => exp.tramites[t.key]?.estado !== "No aplica").map(t => `<span class="inline-flex items-center gap-1 text-[10px] text-slate-600">${esc(t.corto)}: ${pill(exp.tramites[t.key].estado)}</span>`).join("")}</div>` : ""}
          </div>`;
      }
      out.innerHTML = this.lookupResult;
      icons();
    }
  };

  // ==============================================================
  // Enganche con la app (sin modificar app.js)
  // ==============================================================
  function install() {
    const app = window.civikaApp;
    if (!app || app.__citizenToolsInstalled) return !!app;
    app.__citizenToolsInstalled = true;

    const wrap = (name, after) => {
      const orig = app[name];
      if (typeof orig !== "function") return;
      app[name] = function (...args) {
        const res = orig.apply(this, args);
        if (res && typeof res.then === "function") res.then(() => after(...args)).catch(() => after(...args));
        else after(...args);
        return res;
      };
    };
    wrap("renderPrevalidationCitizenBox", () => tracker.schedule());
    wrap("renderCommonBusinesses", () => giroSearch.mount());
    wrap("goToScreen", (id) => { if (id === "screen-unified-forms") tracker.schedule(); });

    giroSearch.mount();
    tracker.schedule();
    return true;
  }

  window.civikaCitizenTools = { giroSearch, tracker, agenda, matchGiros, foldLine };

  const boot = () => { if (!install()) setTimeout(boot, 50); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
