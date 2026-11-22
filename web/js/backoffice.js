/**
 * CÍVIKA - Panel Interinstitucional (Fase 1: simulación local)
 * -----------------------------------------------------------------
 * Vista administrativa por expediente y por institución (SRI, Bomberos,
 * GAD Riobamba y ARCSA). Todo se guarda en ESTE navegador (civikaDB) y los
 * expedientes semilla son FICTICIOS. No se conecta a ningún sistema del Estado.
 *
 * Minimización de datos (LOPDP): solo metadatos del trámite
 * (ID, giro, CIIU, parroquia, estados y fechas). Nunca nombres, cédulas,
 * RUC, contraseñas ni documentos.
 */
class CivikaBackoffice {
  constructor() {
    this.storageKey = "civika_backoffice_v1";
    this.role = "coordinador";
    this.filters = { q: "", parroquia: "", estado: "" };
    this.detailId = null;
    this.observeOpen = null; // "EXP|tramiteKey"
    this.data = null;

    this.INSTITUCIONES = [
      { id: "sri", nombre: "SRI", full: "Servicio de Rentas Internas · Zonal 3", icon: "landmark" },
      { id: "bomberos", nombre: "Bomberos", full: "Cuerpo de Bomberos de Riobamba · Prevención", icon: "flame" },
      { id: "gad_territorial", nombre: "GAD · Territorio", full: "GAD Riobamba · Ordenamiento Territorial", icon: "building-2" },
      { id: "gad_financiera", nombre: "GAD · Financiera", full: "GAD Riobamba · Tesorería y Rentas", icon: "building-2" },
      { id: "gad_control", nombre: "GAD · Control", full: "GAD Riobamba · Control Municipal (LUF)", icon: "building-2" },
      { id: "arcsa", nombre: "ARCSA", full: "ARCSA · Coordinación Zonal 3", icon: "file-check" }
    ];

    // Orden secuencial de la ruta. LUF y ARCSA se habilitan en paralelo tras la patente.
    this.TRAMITES = [
      { key: "ruc", paso: "req_ruc", inst: "sri", nombre: "RUC / RIMPE", corto: "RUC", previo: [] },
      { key: "bomberos", paso: "req_bomberos", inst: "bomberos", nombre: "Permiso de Bomberos", corto: "Bomberos", previo: ["ruc"] },
      { key: "uso_suelo", paso: "req_uso_suelo", inst: "gad_territorial", nombre: "Uso de Suelo (ICUS)", corto: "Uso suelo", previo: ["bomberos"] },
      { key: "solvencia", paso: "req_solvencia", inst: "gad_financiera", nombre: "No Adeudar", corto: "No adeudar", previo: ["uso_suelo"] },
      { key: "patente", paso: "req_formulario_patente", inst: "gad_financiera", nombre: "Patente Municipal", corto: "Patente", previo: ["solvencia"] },
      { key: "luf", paso: "req_luf_final", inst: "gad_control", nombre: "Licencia Única (LUF)", corto: "LUF", previo: ["patente"] },
      { key: "arcsa", paso: "req_luf_final", inst: "arcsa", nombre: "Permiso ARCSA", corto: "ARCSA", previo: ["patente"] }
    ];

    this.ESTADOS = {
      "Completado": { cls: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: "circle-check" },
      "En revisión": { cls: "bg-amber-50 text-amber-800 border-amber-200", icon: "clock" },
      "Observado": { cls: "bg-rose-50 text-rose-800 border-rose-200", icon: "triangle-alert" },
      "Por iniciar": { cls: "bg-slate-50 text-slate-500 border-slate-200", icon: "lock" },
      "No aplica": { cls: "bg-white text-slate-400 border-dashed border-slate-200", icon: "minus" }
    };

    this.MOTIVOS = {
      sri: ["Actividad económica del RUC no coincide con el giro", "Dirección del establecimiento desactualizada", "Planilla de servicio básico mayor a 90 días"],
      bomberos: ["Extintor sin recarga vigente o sin etiqueta", "Falta señalética de evacuación", "Instalación de gas (GLP) por verificar en inspección"],
      gad_territorial: ["Actividad no compatible con la zona (verificar ICUS)", "Dirección o clave catastral por verificar"],
      gad_financiera: ["Certificado de No Adeudar vencido o no emitido", "Formulario de patente incompleto"],
      gad_control: ["Falta un documento habilitante previo", "Datos del local no coinciden con los permisos previos"],
      arcsa: ["Categoría sanitaria del establecimiento por verificar", "Falta registro del establecimiento en ARCSA"]
    };
    Object.keys(this.MOTIVOS).forEach(k => this.MOTIVOS[k].push("Otro motivo (ver nota del revisor)"));

    // Giros que normalmente requieren control sanitario ARCSA (referencial)
    this.GIROS_ARCSA = ["cafeteria", "restaurante", "micromercado", "farmacia"];

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.detailId) this.closeDetail();
    });
  }

  // ------------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------------
  esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  kb() { return window.CIVIKA_KNOWLEDGE_BASE || (typeof CIVIKA_KNOWLEDGE_BASE !== "undefined" ? CIVIKA_KNOWLEDGE_BASE : null); }

  parroquiaNombre(id) {
    const list = this.kb()?.parroquiasRiobamba || [];
    const p = list.find(x => x.id === id);
    return p ? p.nombre.split(" (")[0] : String(id || "—");
  }

  inst(id) { return this.INSTITUCIONES.find(i => i.id === id); }
  tram(key) { return this.TRAMITES.find(t => t.key === key); }

  isoDaysAgo(days, hour = 9) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, (days * 7) % 60, 0, 0);
    return d.toISOString();
  }

  fmt(iso) {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }); }
    catch (e) { return iso; }
  }

  days(fromIso, toIso) {
    const a = new Date(fromIso).getTime();
    const b = toIso ? new Date(toIso).getTime() : Date.now();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    return Math.max(0, Math.round(((b - a) / 86400000) * 10) / 10);
  }

  applicableKeys(giroId) {
    const biz = (this.kb()?.emprendimientosComunes || []).find(b => b.id === giroId);
    const sinLocal = biz?.pasosNoAplicanSinLocal || [];
    return this.TRAMITES
      .filter(t => !sinLocal.includes(t.paso))
      .filter(t => t.key !== "arcsa" || this.GIROS_ARCSA.includes(giroId))
      .map(t => t.key);
  }

  // ------------------------------------------------------------------
  // Datos (semilla ficticia + persistencia local)
  // ------------------------------------------------------------------
  buildSeed() {
    const plan = [
      // id, giro, parroquia, avance (n° de trámites completados), estado del actual, motivo, días desde el inicio
      ["EXP-RIO-2026-001", "cafeteria", "Maldonado", 7, null, "", 34],
      ["EXP-RIO-2026-002", "tienda_ropa", "Lizarzaburu", 6, null, "", 29],
      ["EXP-RIO-2026-003", "taller", "Yaruquies", 2, "Observado", "Actividad no compatible con la zona (verificar ICUS)", 22],
      ["EXP-RIO-2026-004", "micromercado", "Velasco", 5, "En revisión", "", 25],
      ["EXP-RIO-2026-005", "restaurante", "Veloz", 1, "Observado", "Extintor sin recarga vigente o sin etiqueta", 12],
      ["EXP-RIO-2026-006", "peluqueria", "Maldonado", 4, "En revisión", "", 16],
      ["EXP-RIO-2026-007", "venta_redes", "San_Luis", 3, "En revisión", "", 6],
      ["EXP-RIO-2026-008", "farmacia", "Lizarzaburu", 6, "Observado", "Categoría sanitaria del establecimiento por verificar", 31],
      ["EXP-RIO-2026-009", "profesional", "Veloz", 0, "Observado", "Planilla de servicio básico mayor a 90 días", 4],
      ["EXP-RIO-2026-010", "artesanal", "Licto", 3, "En revisión", "", 14]
    ];
    const baseDur = { ruc: 1, bomberos: 5, uso_suelo: 7, solvencia: 1, patente: 3, luf: 4, arcsa: 9 };
    const bizList = this.kb()?.emprendimientosComunes || [];

    const expedientes = plan.map(([id, giroId, parroquia, avance, actualEstado, motivo, startAgo], idx) => {
      const biz = bizList.find(b => b.id === giroId) || { nombre: giroId, ciiuReferencia: "" };
      const keys = this.applicableKeys(giroId);
      const tramites = {};
      const eventos = [];
      let cursor = startAgo;
      const created = this.isoDaysAgo(startAgo, 8);
      eventos.push({ fecha: created, inst: "civika", tramite: "", accion: "Expediente creado", actor: "Ciudadano (Cívika)", motivo: "" });

      // Orden lineal de los aplicables; LUF y ARCSA comparten inicio
      let completedCount = 0;
      let patenteDone = null;
      keys.forEach((k) => {
        if (!keys.includes(k)) return;
        const parallel = (k === "luf" || k === "arcsa");
        const inicioAgo = parallel && patenteDone !== null ? patenteDone : cursor;
        const dur = Math.max(1, baseDur[k] + ((idx + k.length) % 3) - 1);
        if (completedCount < avance) {
          const finAgo = Math.max(0, inicioAgo - dur);
          tramites[k] = { estado: "Completado", inicio: this.isoDaysAgo(inicioAgo, 9), actualizado: this.isoDaysAgo(finAgo, 15), motivo: "" };
          eventos.push({ fecha: tramites[k].inicio, inst: this.tram(k).inst, tramite: k, accion: "Ingresó a revisión", actor: "Sistema", motivo: "" });
          eventos.push({ fecha: tramites[k].actualizado, inst: this.tram(k).inst, tramite: k, accion: "Aprobado", actor: `Revisor ${this.inst(this.tram(k).inst).nombre} (demo)`, motivo: "" });
          if (k === "patente") patenteDone = finAgo;
          if (!parallel) cursor = finAgo;
          completedCount++;
        } else if (completedCount === avance && actualEstado) {
          const ini = this.isoDaysAgo(Math.min(inicioAgo, Math.max(1, startAgo - 1)), 10);
          tramites[k] = { estado: actualEstado, inicio: ini, actualizado: actualEstado === "Observado" ? this.isoDaysAgo(1, 11) : ini, motivo };
          eventos.push({ fecha: ini, inst: this.tram(k).inst, tramite: k, accion: "Ingresó a revisión", actor: "Sistema", motivo: "" });
          if (actualEstado === "Observado") {
            eventos.push({ fecha: tramites[k].actualizado, inst: this.tram(k).inst, tramite: k, accion: "Observado", actor: `Revisor ${this.inst(this.tram(k).inst).nombre} (demo)`, motivo });
          }
          completedCount++; // ocupa la posición actual
          if (k === "patente") patenteDone = null;
        } else {
          tramites[k] = { estado: "Por iniciar", inicio: "", actualizado: "", motivo: "" };
        }
      });
      // Si la patente está completa y LUF/ARCSA quedaron "Por iniciar", habilitarlos en paralelo
      this.unlockNext(tramites, keys, eventos, true);
      this.TRAMITES.forEach(t => { if (!tramites[t.key]) tramites[t.key] = { estado: "No aplica", inicio: "", actualizado: "", motivo: "" }; });

      return {
        id, origen: "demo", giroId, giroNombre: biz.nombre,
        ciiu: String(biz.ciiuReferencia || "").split(" - ")[0].trim(),
        parroquia, creado: created, tramites,
        eventos: eventos.sort((a, b) => a.fecha.localeCompare(b.fecha))
      };
    });

    return { version: 1, generado: new Date().toISOString(), expedientes };
  }

  /** Habilita los trámites cuyo requisito previo ya está completo */
  unlockNext(tramites, keys, eventos, silent = false) {
    keys.forEach(k => {
      const t = tramites[k];
      if (!t || t.estado !== "Por iniciar") return;
      const prev = this.tram(k).previo.filter(p => keys.includes(p));
      // Si el previo no aplica (p. ej. venta por redes), se usa el previo del previo
      let effectivePrev = prev;
      if (!prev.length && this.tram(k).previo.length) {
        let chain = this.tram(k).previo[0];
        while (chain && !keys.includes(chain)) chain = this.tram(chain)?.previo[0];
        effectivePrev = chain ? [chain] : [];
      }
      const ready = effectivePrev.every(p => tramites[p]?.estado === "Completado");
      if (ready && (effectivePrev.length || k === keys[0])) {
        const fin = effectivePrev.map(p => tramites[p].actualizado).sort().pop() || new Date().toISOString();
        t.estado = "En revisión";
        t.inicio = silent ? fin : new Date().toISOString();
        t.actualizado = t.inicio;
        eventos.push({ fecha: t.inicio, inst: this.tram(k).inst, tramite: k, accion: "Ingresó a revisión", actor: "Sistema", motivo: "" });
      }
    });
  }

  async load() {
    if (this.data) return this.data;
    let stored = null;
    if (window.civikaDB && typeof window.civikaDB.getItem === "function") {
      stored = await window.civikaDB.getItem(this.storageKey, null);
    }
    if (!stored || !Array.isArray(stored.expedientes) || !stored.expedientes.length) {
      stored = this.buildSeed();
      await this.save(stored);
    }
    this.data = stored;
    await this.syncCitizenSubmissions();
    return this.data;
  }

  async save(data = this.data) {
    if (window.civikaDB && typeof window.civikaDB.setItem === "function") {
      await window.civikaDB.setItem(this.storageKey, data);
    }
  }

  /** Incorpora los envíos reales hechos desde "Pre-Validación" en este dispositivo */
  async syncCitizenSubmissions() {
    if (!window.civikaDB || typeof window.civikaDB.getPrevalidationInbox !== "function") return;
    const inbox = await window.civikaDB.getPrevalidationInbox();
    let changed = false;
    inbox.filter(i => i.origen === "ciudadano").forEach(item => {
      if (this.data.expedientes.some(e => e.id === item.id)) return;
      const keys = this.applicableKeys(item.giroId);
      const pasos = item.pasosEstado || {};
      const now = new Date().toISOString();
      const tramites = {};
      const eventos = [{ fecha: now, inst: "civika", tramite: "", accion: "Expediente recibido desde Pre-Validación", actor: "Ciudadano (Cívika)", motivo: "" }];
      let firstOpenSet = false;
      this.TRAMITES.forEach(t => {
        if (!keys.includes(t.key)) { tramites[t.key] = { estado: "No aplica", inicio: "", actualizado: "", motivo: "" }; return; }
        if (pasos[t.paso] === "completado") {
          tramites[t.key] = { estado: "Completado", inicio: now, actualizado: now, motivo: "", declarado: true };
        } else if (!firstOpenSet || (t.key === "arcsa" && tramites.luf?.estado === "En revisión")) {
          tramites[t.key] = { estado: "En revisión", inicio: now, actualizado: now, motivo: "" };
          eventos.push({ fecha: now, inst: t.inst, tramite: t.key, accion: "Ingresó a revisión", actor: "Sistema", motivo: "" });
          firstOpenSet = true;
        } else {
          tramites[t.key] = { estado: "Por iniciar", inicio: "", actualizado: "", motivo: "" };
        }
      });
      this.data.expedientes.unshift({
        id: item.id, origen: "ciudadano", giroId: item.giroId, giroNombre: item.giroNombre,
        ciiu: item.ciiu || "", parroquia: item.parroquia || "", creado: now, tramites, eventos
      });
      changed = true;
    });
    if (changed) await this.save();
  }

  async resetDemo() {
    this.data = this.buildSeed();
    await this.save();
    await this.syncCitizenSubmissions();
    this.detailId = null;
    this.observeOpen = null;
    if (typeof window.civikaToast === "function") window.civikaToast("Datos de demostración restablecidos");
    this.render();
  }

  // ------------------------------------------------------------------
  // Acciones de institución
  // ------------------------------------------------------------------
  findExp(id) { return this.data.expedientes.find(e => e.id === id); }

  async approve(expId, key) {
    const exp = this.findExp(expId);
    if (!exp || !exp.tramites[key]) return;
    const t = exp.tramites[key];
    if (t.estado !== "En revisión" && t.estado !== "Observado") return;
    const now = new Date().toISOString();
    t.estado = "Completado";
    t.actualizado = now;
    t.motivo = "";
    exp.eventos.push({ fecha: now, inst: this.tram(key).inst, tramite: key, accion: "Aprobado", actor: `Revisor ${this.inst(this.tram(key).inst).nombre} (demo)`, motivo: "" });
    this.unlockNext(exp.tramites, this.applicableKeys(exp.giroId), exp.eventos);
    await this.save();
    if (typeof window.civikaToast === "function") window.civikaToast(`${expId}: ${this.tram(key).nombre} aprobado`);
    this.render();
  }

  toggleObserve(expId, key) {
    const tag = `${expId}|${key}`;
    this.observeOpen = this.observeOpen === tag ? null : tag;
    this.render();
  }

  async observe(expId, key) {
    const exp = this.findExp(expId);
    if (!exp || !exp.tramites[key]) return;
    const sel = document.getElementById(`bo-motivo-${expId}-${key}`);
    const note = document.getElementById(`bo-nota-${expId}-${key}`);
    const motivo = sel ? sel.value : "Otro motivo (ver nota del revisor)";
    const nota = note ? note.value.trim().slice(0, 160) : "";
    const now = new Date().toISOString();
    const t = exp.tramites[key];
    t.estado = "Observado";
    t.actualizado = now;
    t.motivo = motivo;
    exp.eventos.push({ fecha: now, inst: this.tram(key).inst, tramite: key, accion: "Observado", actor: `Revisor ${this.inst(this.tram(key).inst).nombre} (demo)`, motivo: nota ? `${motivo} · ${nota}` : motivo });
    this.observeOpen = null;
    await this.save();
    if (typeof window.civikaToast === "function") window.civikaToast(`${expId}: ${this.tram(key).nombre} observado`);
    this.render();
  }

  async markCorrected(expId, key) {
    const exp = this.findExp(expId);
    if (!exp || exp.tramites[key]?.estado !== "Observado") return;
    const now = new Date().toISOString();
    exp.tramites[key].estado = "En revisión";
    exp.tramites[key].actualizado = now;
    exp.eventos.push({ fecha: now, inst: this.tram(key).inst, tramite: key, accion: "Ciudadano presentó la corrección", actor: "Ciudadano (demo)", motivo: exp.tramites[key].motivo });
    await this.save();
    this.render();
  }

  // ------------------------------------------------------------------
  // Métricas
  // ------------------------------------------------------------------
  metrics(list) {
    const m = { total: list.length, enRevision: 0, observados: 0, completos: 0, porInst: {}, diasPorTramite: {}, motivos: {}, parroquias: {} };
    this.INSTITUCIONES.forEach(i => { m.porInst[i.id] = 0; });
    const durs = {};
    list.forEach(exp => {
      const keys = this.applicableKeys(exp.giroId);
      if (keys.every(k => exp.tramites[k]?.estado === "Completado")) m.completos++;
      m.parroquias[exp.parroquia] = (m.parroquias[exp.parroquia] || 0) + 1;
      keys.forEach(k => {
        const t = exp.tramites[k];
        if (!t) return;
        if (t.estado === "En revisión") { m.enRevision++; m.porInst[this.tram(k).inst]++; }
        if (t.estado === "Observado") { m.observados++; m.porInst[this.tram(k).inst]++; }
        if (t.estado === "Completado" && t.inicio && t.actualizado && !t.declarado) {
          (durs[k] = durs[k] || []).push(this.days(t.inicio, t.actualizado));
        }
      });
      exp.eventos.filter(ev => ev.accion === "Observado").forEach(ev => {
        const key = String(ev.motivo || "").split(" · ")[0];
        if (key) m.motivos[key] = (m.motivos[key] || 0) + 1;
      });
    });
    Object.entries(durs).forEach(([k, arr]) => {
      m.diasPorTramite[k] = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
    });
    return m;
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  /** Llamado desde la vista de funcionario (después del PIN) */
  async mount(screen, unlocked) {
    if (!screen) return;
    let box = document.getElementById("officerBackoffice");
    if (!box) {
      box = document.createElement("div");
      box.id = "officerBackoffice";
      box.className = "mt-4";
      screen.appendChild(box);
    }
    if (!unlocked) {
      box.classList.add("hidden");
      box.innerHTML = "";
      this.closeDetail(true);
      return;
    }
    box.classList.remove("hidden");
    await this.load();
    await this.syncCitizenSubmissions(); // envíos nuevos desde Pre-Validación
    this.render();
  }

  pill(estado, label = null) {
    const s = this.ESTADOS[estado] || this.ESTADOS["Por iniciar"];
    return `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.cls}">
      <i data-lucide="${s.icon}" class="w-3 h-3"></i><span>${this.esc(label ?? estado)}</span></span>`;
  }

  bars(title, rows, unit = "", emptyText = "Sin datos todavía") {
    const max = Math.max(1, ...rows.map(r => r.value));
    return `
      <div class="bg-white rounded-xl border border-slate-200 p-3">
        <p class="text-[11px] font-extrabold text-slate-800 mb-2">${this.esc(title)}</p>
        ${rows.length ? `<ul class="space-y-1.5">
          ${rows.map(r => `
            <li class="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-2 text-[11px]" title="${this.esc(r.label)}: ${r.value}${unit}">
              <span class="truncate text-slate-600">${this.esc(r.label)}</span>
              <span class="h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                <span class="block h-full bg-blue-600 rounded-r-[4px]" style="width:${Math.max(r.value > 0 ? 4 : 0, Math.round((r.value / max) * 100))}%"></span>
              </span>
              <span class="font-bold text-slate-800 tabular-nums">${r.value}${unit}</span>
            </li>`).join("")}
        </ul>` : `<p class="text-[11px] text-slate-500">${this.esc(emptyText)}</p>`}
      </div>`;
  }

  filtered() {
    const q = this.filters.q.trim().toLowerCase();
    return this.data.expedientes.filter(exp => {
      if (q && !(`${exp.id} ${exp.giroNombre} ${exp.ciiu}`.toLowerCase().includes(q))) return false;
      if (this.filters.parroquia && exp.parroquia !== this.filters.parroquia) return false;
      if (this.filters.estado) {
        const keys = this.applicableKeys(exp.giroId);
        const states = keys.map(k => exp.tramites[k]?.estado);
        if (this.filters.estado === "Licencia completa") return states.every(s => s === "Completado");
        if (!states.includes(this.filters.estado)) return false;
      }
      return true;
    });
  }

  setRole(role) { this.role = role; this.observeOpen = null; this.render(); }
  setFilter(name, value) { this.filters[name] = value; this.render(true); }

  render(keepFocus = false) {
    const box = document.getElementById("officerBackoffice");
    if (!box || !this.data) return;
    const active = document.activeElement;
    const focusId = keepFocus && active && active.id ? active.id : null;
    const caret = focusId && typeof active.selectionStart === "number" ? active.selectionStart : null;

    const e = (v) => this.esc(v);
    const roleOpts = [{ id: "coordinador", nombre: "Coordinación del convenio (vista general)" }, ...this.INSTITUCIONES.map(i => ({ id: i.id, nombre: i.full }))];

    box.innerHTML = `
      <section class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3" aria-labelledby="boTitle">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="min-w-0">
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Panel interinstitucional · Fase 1</p>
            <h4 id="boTitle" class="text-sm font-extrabold text-slate-900">Seguimiento de trámites por expediente e institución</h4>
          </div>
          <div class="w-full sm:w-auto min-w-0">
            <label for="boRole" class="text-[10px] font-bold text-slate-600 block">Ver como</label>
            <select id="boRole" onchange="civikaBackoffice.setRole(this.value)"
                    class="w-full sm:w-auto px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white">
              ${roleOpts.map(r => `<option value="${r.id}" ${r.id === this.role ? "selected" : ""}>${e(r.nombre)}</option>`).join("")}
            </select>
          </div>
        </div>

        <p class="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <i data-lucide="triangle-alert" class="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600"></i>
          <span><b>Simulación de demostración.</b> Expedientes ficticios guardados solo en este navegador. No está conectado al SRI, Bomberos, GAD Riobamba ni ARCSA, y no representa decisiones reales de esas instituciones.</span>
        </p>

        ${this.role === "coordinador" ? this.renderCoordinator() : this.renderInstitution(this.role)}

        <p class="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
          Minimización de datos (LOPDP): cada institución ve solo sus trámites y la coordinación ve el estado general. Se registran solo metadatos (ID, giro, CIIU, parroquia, estados y fechas); nunca nombres, cédulas, RUC, contraseñas ni documentos.
          Los tiempos son referenciales de la simulación; plazos y tasas reales se verifican en el canal oficial de cada institución.
        </p>
      </section>
    `;

    this.renderDetail();
    if (window.lucide) window.lucide.createIcons();
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus(); if (caret !== null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch (err) { /* nada */ } }
    }
  }

  renderCoordinator() {
    const e = (v) => this.esc(v);
    const list = this.filtered();
    const m = this.metrics(this.data.expedientes);
    const parroquias = [...new Set(this.data.expedientes.map(x => x.parroquia))];

    const tiles = [
      { label: "Expedientes", value: m.total, icon: "store" },
      { label: "Trámites en revisión", value: m.enRevision, icon: "clock" },
      { label: "Trámites observados", value: m.observados, icon: "triangle-alert" },
      { label: "Licencia completa", value: m.completos, icon: "circle-check" }
    ];

    const instRows = this.INSTITUCIONES.map(i => ({ label: i.nombre, value: m.porInst[i.id] || 0 }));
    const durRows = this.TRAMITES.filter(t => m.diasPorTramite[t.key] !== undefined).map(t => ({ label: t.nombre, value: m.diasPorTramite[t.key] }));
    const motRows = Object.entries(m.motivos).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
    const parRows = Object.entries(m.parroquias).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, value]) => ({ label: this.parroquiaNombre(id), value }));

    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
        ${tiles.map(t => `
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-[10px] font-bold text-slate-500 flex items-center gap-1"><i data-lucide="${t.icon}" class="w-3.5 h-3.5"></i>${e(t.label)}</p>
            <p class="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">${t.value}</p>
          </div>`).join("")}
      </div>

      <div class="grid md:grid-cols-2 gap-2">
        ${this.bars("Carga actual por institución (en revisión + observados)", instRows)}
        ${this.bars("Días promedio de resolución por trámite", durRows, " d")}
        ${this.bars("Motivos de observación más frecuentes", motRows, "", "Aún no hay observaciones")}
        ${this.bars("Expedientes por parroquia", parRows)}
      </div>

      <div class="flex flex-wrap items-end gap-2 pt-1">
        <div class="flex-1 min-w-[10rem]">
          <label for="boSearch" class="text-[10px] font-bold text-slate-600 block">Buscar (ID, giro o CIIU)</label>
          <input id="boSearch" type="search" value="${e(this.filters.q)}" oninput="civikaBackoffice.setFilter('q', this.value)"
                 class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs" placeholder="Ej.: EXP-RIO-2026-003 o cafetería">
        </div>
        <div>
          <label for="boParroquia" class="text-[10px] font-bold text-slate-600 block">Parroquia</label>
          <select id="boParroquia" onchange="civikaBackoffice.setFilter('parroquia', this.value)" class="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white">
            <option value="">Todas</option>
            ${parroquias.map(p => `<option value="${e(p)}" ${p === this.filters.parroquia ? "selected" : ""}>${e(this.parroquiaNombre(p))}</option>`).join("")}
          </select>
        </div>
        <div>
          <label for="boEstado" class="text-[10px] font-bold text-slate-600 block">Estado</label>
          <select id="boEstado" onchange="civikaBackoffice.setFilter('estado', this.value)" class="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white">
            <option value="">Todos</option>
            ${["En revisión", "Observado", "Licencia completa"].map(s => `<option ${s === this.filters.estado ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <button type="button" onclick="civikaBackoffice.exportCsv()" class="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>CSV
        </button>
        <button type="button" onclick="civikaBackoffice.resetDemo()" class="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer" title="Restablecer datos de demostración">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>Restablecer
        </button>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="min-w-[760px] w-full text-[11px]">
          <caption class="sr-only">Estado de cada trámite por expediente</caption>
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" class="text-left font-bold px-2.5 py-2 sticky left-0 z-10 bg-slate-50 min-w-[10rem]">Expediente</th>
              ${this.TRAMITES.map(t => `<th scope="col" class="text-left font-bold px-1.5 py-2" title="${e(this.inst(t.inst).full)}">${e(t.corto)}<span class="block text-[9px] font-semibold text-slate-400">${e(this.inst(t.inst).nombre)}</span></th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${list.length ? list.map(exp => `
              <tr class="border-t border-slate-100 hover:bg-blue-50/40">
                <th scope="row" class="text-left font-normal px-2.5 py-2 align-top sticky left-0 z-10 bg-white min-w-[10rem] shadow-[1px_0_0_#e2e8f0]">
                  <button type="button" onclick="civikaBackoffice.openDetail('${e(exp.id)}')" class="text-left cursor-pointer group">
                    <span class="font-bold text-blue-700 group-hover:underline">${e(exp.id)}</span>
                    ${exp.origen === "ciudadano" ? '<span class="ml-1 text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-800">Cívika</span>' : ""}
                    <span class="block text-slate-600">${e(exp.giroNombre)}</span>
                    <span class="block text-[10px] text-slate-400">${e(exp.ciiu)} · ${e(this.parroquiaNombre(exp.parroquia))}</span>
                  </button>
                </th>
                ${this.TRAMITES.map(t => `<td class="px-1.5 py-2 align-top">${this.pill(exp.tramites[t.key]?.estado || "No aplica", this.shortState(exp.tramites[t.key]?.estado))}</td>`).join("")}
              </tr>`).join("") : `<tr><td colspan="${this.TRAMITES.length + 1}" class="px-3 py-4 text-center text-slate-500">No hay expedientes con esos filtros.</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="text-[10px] text-slate-500">Toca un expediente para ver su línea de tiempo y el historial de cambios.</p>
    `;
  }

  shortState(estado) {
    return { "Completado": "Listo", "En revisión": "Revisión", "Observado": "Observado", "Por iniciar": "Por iniciar", "No aplica": "N/A" }[estado] || estado || "N/A";
  }

  renderInstitution(instId) {
    const e = (v) => this.esc(v);
    const inst = this.inst(instId);
    const keys = this.TRAMITES.filter(t => t.inst === instId).map(t => t.key);
    const rows = [];
    let completados = 0;
    this.data.expedientes.forEach(exp => {
      keys.forEach(k => {
        const t = exp.tramites[k];
        if (!t) return;
        if (t.estado === "Completado") completados++;
        if (t.estado === "En revisión" || t.estado === "Observado") rows.push({ exp, k, t });
      });
    });
    rows.sort((a, b) => (a.t.inicio || "").localeCompare(b.t.inicio || ""));
    const enCola = rows.filter(r => r.t.estado === "En revisión").length;
    const obs = rows.filter(r => r.t.estado === "Observado").length;

    return `
      <div class="flex items-center gap-2">
        <span class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><i data-lucide="${inst.icon}" class="w-4.5 h-4.5"></i></span>
        <div class="min-w-0">
          <p class="text-xs font-extrabold text-slate-900">${e(inst.full)}</p>
          <p class="text-[11px] text-slate-600">${enCola} en revisión · ${obs} observado${obs === 1 ? "" : "s"} · ${completados} aprobado${completados === 1 ? "" : "s"}</p>
        </div>
      </div>

      ${rows.length ? `<div class="space-y-2">
        ${rows.map(({ exp, k, t }) => {
          const tag = `${exp.id}|${k}`;
          const open = this.observeOpen === tag;
          const motivos = this.MOTIVOS[instId] || [];
          return `
          <div class="p-3 rounded-xl border ${t.estado === "Observado" ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-slate-50"} space-y-2 text-xs" data-bo="${e(exp.id)}-${k}">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div class="min-w-0">
                <p class="font-extrabold text-slate-900">${e(exp.id)} · ${e(this.tram(k).nombre)}</p>
                <p class="text-[11px] text-slate-600">${e(exp.giroNombre)} · CIIU ${e(exp.ciiu)} · ${e(this.parroquiaNombre(exp.parroquia))}</p>
                <p class="text-[11px] text-slate-500">En cola desde ${e(this.fmt(t.inicio))} · ${this.days(t.inicio)} días${this.tram(k).previo.length ? " · requisito previo aprobado" : ""}</p>
              </div>
              ${this.pill(t.estado)}
            </div>
            ${t.estado === "Observado" ? `<p class="text-[11px] text-rose-900">Motivo: <b>${e(t.motivo)}</b></p>` : ""}
            <div class="flex flex-wrap gap-2">
              <button type="button" onclick="civikaBackoffice.approve('${e(exp.id)}','${k}')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                <i data-lucide="circle-check" class="w-3.5 h-3.5"></i><span>Aprobar</span>
              </button>
              ${t.estado === "En revisión" ? `
                <button type="button" onclick="civikaBackoffice.toggleObserve('${e(exp.id)}','${k}')" class="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                  <i data-lucide="triangle-alert" class="w-3.5 h-3.5"></i><span>Observar</span>
                </button>` : `
                <button type="button" onclick="civikaBackoffice.markCorrected('${e(exp.id)}','${k}')" class="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-bold cursor-pointer">
                  Corrección presentada → volver a revisión
                </button>`}
              <button type="button" onclick="civikaBackoffice.openDetail('${e(exp.id)}')" class="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-[11px] font-semibold underline cursor-pointer">Historial</button>
            </div>
            ${open ? `
              <div class="p-2.5 rounded-lg bg-white border border-rose-200 space-y-2">
                <label for="bo-motivo-${e(exp.id)}-${k}" class="text-[11px] font-bold text-slate-700 block">Motivo específico</label>
                <select id="bo-motivo-${e(exp.id)}-${k}" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white">
                  ${motivos.map(mo => `<option value="${e(mo)}">${e(mo)}</option>`).join("")}
                </select>
                <label for="bo-nota-${e(exp.id)}-${k}" class="text-[11px] font-bold text-slate-700 block">Nota (opcional, sin datos personales)</label>
                <input id="bo-nota-${e(exp.id)}-${k}" type="text" maxlength="160" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px]" placeholder="Ej.: reinspección el jueves">
                <div class="flex gap-2 justify-end">
                  <button type="button" onclick="civikaBackoffice.toggleObserve('${e(exp.id)}','${k}')" class="px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold cursor-pointer">Cancelar</button>
                  <button type="button" onclick="civikaBackoffice.observe('${e(exp.id)}','${k}')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer">Confirmar observación</button>
                </div>
              </div>` : ""}
          </div>`;
        }).join("")}
      </div>` : `<p class="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">No hay trámites pendientes para ${e(inst.nombre)}. Los expedientes aparecen aquí cuando el paso anterior queda aprobado.</p>`}
    `;
  }

  // ------------------------------------------------------------------
  // Detalle / línea de tiempo
  // ------------------------------------------------------------------
  openDetail(id) {
    this.detailId = id;
    this._lastFocus = document.activeElement;
    this.renderDetail();
    if (window.lucide) window.lucide.createIcons();
    const btn = document.getElementById("boDetailClose");
    if (btn) btn.focus();
  }

  closeDetail(silent = false) {
    this.detailId = null;
    const m = document.getElementById("boDetailModal");
    if (m) { m.classList.add("hidden"); m.innerHTML = ""; }
    if (!silent && this._lastFocus && this._lastFocus.isConnected) this._lastFocus.focus();
  }

  renderDetail() {
    let modal = document.getElementById("boDetailModal");
    if (!this.detailId) { if (modal) modal.classList.add("hidden"); return; }
    const exp = this.findExp(this.detailId);
    if (!exp) { this.detailId = null; return; }
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "boDetailModal";
      modal.className = "fixed inset-0 z-[9400] bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.addEventListener("click", (ev) => { if (ev.target === modal) this.closeDetail(); });
      document.body.appendChild(modal);
    }
    const e = (v) => this.esc(v);
    // La institución solo ve el historial de sus propios trámites (minimización)
    const visibleEvents = (this.role === "coordinador" ? exp.eventos : exp.eventos.filter(ev => ev.inst === this.role || ev.inst === "civika"))
      .slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    const visibleTramites = this.role === "coordinador" ? this.TRAMITES : this.TRAMITES.filter(t => t.inst === this.role);

    modal.setAttribute("aria-label", `Historial del expediente ${exp.id}`);
    modal.classList.remove("hidden");
    modal.innerHTML = `
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl p-4 space-y-3 my-auto">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Expediente (simulación)</p>
            <h3 class="text-base font-extrabold text-slate-900">${e(exp.id)}</h3>
            <p class="text-xs text-slate-600">${e(exp.giroNombre)} · CIIU ${e(exp.ciiu)} · ${e(this.parroquiaNombre(exp.parroquia))}</p>
          </div>
          <button type="button" id="boDetailClose" onclick="civikaBackoffice.closeDetail()" class="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Cerrar">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${visibleTramites.map(t => `<span class="inline-flex items-center gap-1 text-[10px] text-slate-600">${e(t.corto)}: ${this.pill(exp.tramites[t.key]?.estado || "No aplica")}</span>`).join("")}
        </div>
        <div>
          <p class="text-[11px] font-extrabold text-slate-800 mb-1.5 flex items-center gap-1"><i data-lucide="history" class="w-3.5 h-3.5"></i>Historial de cambios (auditoría)</p>
          <ol class="relative border-l-2 border-slate-200 ml-1.5 space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            ${visibleEvents.map(ev => `
              <li class="ml-3">
                <span class="absolute -left-[5px] mt-1 w-2 h-2 rounded-full ${ev.accion === "Observado" ? "bg-rose-500" : ev.accion === "Aprobado" ? "bg-emerald-500" : "bg-slate-400"}"></span>
                <p class="text-[11px] font-bold text-slate-800">${e(ev.accion)}${ev.tramite ? ` · ${e(this.tram(ev.tramite)?.nombre || ev.tramite)}` : ""}</p>
                <p class="text-[10px] text-slate-500">${e(this.fmt(ev.fecha))} · ${e(ev.actor)}</p>
                ${ev.motivo ? `<p class="text-[11px] text-rose-800">Motivo: ${e(ev.motivo)}</p>` : ""}
              </li>`).join("")}
          </ol>
        </div>
      </div>`;
  }

  // ------------------------------------------------------------------
  // Exportación (solo metadatos)
  // ------------------------------------------------------------------
  exportCsv() {
    const header = ["expediente", "giro", "ciiu", "parroquia", ...this.TRAMITES.map(t => t.key)];
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")].concat(this.filtered().map(exp =>
      [exp.id, exp.giroNombre, exp.ciiu, this.parroquiaNombre(exp.parroquia), ...this.TRAMITES.map(t => exp.tramites[t.key]?.estado || "No aplica")].map(q).join(",")
    ));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "civika_panel_interinstitucional_demo.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

window.civikaBackoffice = new CivikaBackoffice();
