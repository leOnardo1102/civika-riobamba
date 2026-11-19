/**
 * CÍVIKA · Puente con la IA (vía Streamlit)
 *
 * Cuando la app corre dentro de Streamlit, esta página es un "componente":
 * envía la pregunta del ciudadano a Python (que consulta a Groq/Gemini con la
 * clave guardada en los Secrets) y recibe la respuesta. La clave nunca llega aquí.
 *
 * Si la app se abre sola (doble clic en index.html) o no hay clave configurada,
 * civikaAI.enabled queda en false y el Copiloto usa sus respuestas guiadas.
 */
(function () {
  "use strict";

  const embedded = window.parent && window.parent !== window;
  const pending = new Map();
  let seq = 0;

  function send(type, data) {
    if (!embedded) return;
    window.parent.postMessage(Object.assign({ isStreamlitMessage: true, type }, data || {}), "*");
  }

  const civikaAI = {
    embedded,
    ready: false,
    enabled: false,
    label: "",
    history: [],

    onStatusChange: null,

    // Contexto que acompaña a la pregunta: negocio, avance y pasos relevantes
    buildContext(question) {
      const kb = typeof CIVIKA_KNOWLEDGE_BASE !== "undefined" ? CIVIKA_KNOWLEDGE_BASE : null;
      const app = window.civikaApp;
      if (!kb || !app) return "";
      const clip = (t, n) => String(t || "").replace(/\s+/g, " ").trim().slice(0, n);
      const biz = kb.emprendimientosComunes.find(b => b.id === app.selectedBusinessId) || kb.emprendimientosComunes[0];
      const pasos = kb.pasosSecuenciales;
      const lines = [];

      lines.push(`NEGOCIO: ${biz.nombre} (${biz.categoria}; ${biz.ciiuReferencia || ""})`);
      lines.push(`Costo aproximado: ${clip(biz.costoAproxTotal, 200)}`);
      lines.push(`Régimen SRI: ${clip(biz.regimenRecomendado, 260)}`);
      lines.push(`ARCSA: ${clip(biz.requiereArcsa, 420)}`);
      lines.push(`Bomberos: ${clip(biz.riesgoBomberos, 200)}`);
      lines.push("Requisitos del giro:");
      (biz.documentacionRequerida || []).forEach(d => lines.push(`- ${clip(d, 220)}`));
      lines.push(`Advertencia: ${clip(biz.advertenciaSector, 260)}`);

      const f = app.draftForm || {};
      lines.push(`\nCIUDADANO: parroquia ${f.parroquia || "sin indicar"}, local ${f.tenenciaLocal || "sin indicar"}${f.areaMetros ? `, ${f.areaMetros} m²` : ""}.`);
      lines.push("AVANCE DE LA CARPETA:");
      let nextStep = null;
      pasos.forEach(p => {
        const done = !!(app.stepsState && app.stepsState[p.id]);
        if (!done && !nextStep) nextStep = p;
        lines.push(`- Paso ${p.paso} ${p.nombre}: ${done ? "listo" : "pendiente"}`);
      });
      if (nextStep) lines.push(`Siguiente paso sugerido: Paso ${nextStep.paso} (${nextStep.nombre}).`);

      // Pasos más relacionados con la pregunta (por palabras clave) + el siguiente paso
      const words = String(question || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9ñ]+/).filter(w => w.length > 3);
      const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const scored = pasos.map(p => {
        const hay = norm([p.nombre, p.entidad, p.queHacer, p.queEs, p.costo].join(" "));
        return { p, score: words.reduce((acc, w) => acc + (hay.includes(w) ? 1 : 0), 0) };
      }).sort((a, b) => b.score - a.score);
      const chosen = [];
      scored.filter(s => s.score > 0).slice(0, 2).forEach(s => chosen.push(s.p));
      const activeId = window.civikaApp?.assistant?.contextMemory?.activeServiceId;
      const active = pasos.find(p => p.id === activeId);
      [active, nextStep].forEach(p => { if (p && !chosen.includes(p) && chosen.length < 3) chosen.push(p); });

      chosen.forEach(p => {
        const pil = p.pilares || {};
        lines.push(`\nDETALLE PASO ${p.paso}: ${p.nombre} — ${clip(p.entidad, 120)}`);
        lines.push(`Qué hacer: ${clip(p.queHacer, 400)}`);
        lines.push(`Costo: ${clip(p.costo, 260)}`);
        lines.push(`Dónde: ${clip(p.dondeObtenerlo, 300)}`);
        lines.push(`Documento para la carpeta: ${clip(p.documentoParaCarpeta, 220)}`);
        (p.queRevisar || []).slice(0, 3).forEach(q => lines.push(`- Revisar: ${clip(q, 200)}`));
        (pil.checklistPersonalizado || []).slice(0, 5).forEach(c => lines.push(`- Requisito: ${clip(c.item, 180)}`));
        (pil.pasosConPrevencion || []).slice(0, 2).forEach(c => lines.push(`- Error frecuente: ${clip(c.alertaCritica, 220)}`));
        (pil.planBAccionable || []).slice(0, 2).forEach(c => lines.push(`- Plan B: ${clip(c.escenario, 140)} → ${clip(c.solucion, 220)}`));
        if (p.enlaceOficial) lines.push(`Portal oficial: ${p.enlaceOficial}`);
      });

      return lines.join("\n").slice(0, 6800);
    },

    ask(question) {
      return new Promise((resolve, reject) => {
        if (!this.enabled) { reject(new Error("ia_no_disponible")); return; }
        const id = `${Date.now()}-${++seq}`;
        const timer = setTimeout(() => {
          if (pending.has(id)) { pending.delete(id); reject(new Error("tiempo_agotado")); }
        }, 35000);
        pending.set(id, { resolve, reject, timer });
        send("streamlit:setComponentValue", {
          value: { id, question, context: this.buildContext(question), history: this.history.slice(-6) },
          dataType: "json"
        });
      });
    },

    remember(role, text) {
      this.history.push({ role, text: String(text || "").slice(0, 800) });
      if (this.history.length > 12) this.history = this.history.slice(-12);
    }
  };

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "streamlit:render") return;
    const args = data.args || {};
    const wasEnabled = civikaAI.enabled;
    civikaAI.ready = true;
    civikaAI.enabled = !!args.ai_enabled;
    civikaAI.label = args.ai_label || "";
    if (wasEnabled !== civikaAI.enabled && typeof civikaAI.onStatusChange === "function") civikaAI.onStatusChange();

    const reply = args.reply;
    if (reply && reply.id && pending.has(reply.id)) {
      const p = pending.get(reply.id);
      pending.delete(reply.id);
      clearTimeout(p.timer);
      p.resolve(reply);
    }
  });

  if (embedded) {
    // Streamlit crea el marco con scrolling="no": se reactiva para poder desplazarse por la app
    const enableFrameScroll = () => {
      try {
        const fe = window.frameElement;
        if (fe && fe.getAttribute("scrolling") !== "yes") fe.setAttribute("scrolling", "yes");
      } catch (e) { /* marco de otro dominio: no aplica */ }
    };
    enableFrameScroll();
    window.addEventListener("load", enableFrameScroll);

    send("streamlit:componentReady", { apiVersion: 1 });
    const setHeight = () => send("streamlit:setFrameHeight", { height: window.innerHeight || 800 });
    window.addEventListener("load", setHeight);
    window.addEventListener("resize", setHeight);
    setHeight();
  }

  window.civikaAI = civikaAI;
})();
