/**
 * CÍVIKA - "Abrir mi negocio" en dos momentos
 * -----------------------------------------------------------------
 * 1) Primero solo se elige el negocio.
 * 2) Al elegirlo, las tarjetas se cierran y queda una franja "Tu negocio · Cambiar";
 *    la información complementaria queda en secciones plegables.
 * Módulo independiente: no cambia la lógica de la app, solo qué se muestra.
 */
(function () {
  "use strict";

  const PICKED_KEY = "civika_biz_confirmed_v1";
  const KB = () => (typeof CIVIKA_KNOWLEDGE_BASE !== "undefined" ? CIVIKA_KNOWLEDGE_BASE : null);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* nada */ } }
  };
  const icons = () => { if (window.lucide) window.lucide.createIcons(); };

  // Secciones complementarias que se pliegan (cerradas al inicio)
  const FOLDS = [
    { id: "fold-doc", target: () => document.getElementById("selectedBusinessDocSection"), icon: "file-text",
      title: "Detalle de tu negocio", text: "Instituciones, requisitos y alertas propias de tu giro." },
    { id: "fold-auditor", target: () => document.getElementById("preWindowAuditorSection"), icon: "file-search",
      title: "Revisar mis documentos", text: "Detecta planillas vencidas o ilegibles antes de ir. Tus archivos no se suben." },
    { id: "fold-time", target: () => document.getElementById("timeComparisonWidget"), icon: "timer",
      title: "Cuánto tiempo ahorras", text: "Comparación entre ir sin guía y seguir la ruta de Cívika." },
    { id: "fold-docs", target: () => document.getElementById("complementaryRequirementsList")?.parentElement, icon: "files",
      title: "Documentos complementarios", text: "Lo que también debe ir en tu carpeta física." },
    { id: "fold-assembly", target: () => document.getElementById("folderAssemblyGuideContainer"), icon: "folder-open",
      title: "Cómo armar tu carpeta", text: "El orden de las hojas para la Ventanilla Única." },
    { id: "fold-downloads", target: () => document.getElementById("officialDownloadsContainer"), icon: "download",
      title: "Formularios oficiales", text: "Descarga directa de formularios y guías." }
  ];

  const flow = {
    screen: () => document.getElementById("screen-unified-forms"),
    isPicked: () => store.get(PICKED_KEY) === "1",

    setPicked(on) {
      store.set(PICKED_KEY, on ? "1" : "0");
      this.applyMode();
    },

    applyMode() {
      const scr = this.screen();
      if (!scr) return;
      const picked = this.isPicked();
      scr.classList.toggle("flow-picked", picked);
      scr.classList.toggle("flow-picking", !picked);
      this.renderStrip();
    },

    mount() {
      const scr = this.screen();
      const grid = document.getElementById("commonBusinessesContainer");
      if (!scr || !grid) return false;
      const picker = grid.parentElement;
      picker.dataset.flow = "picker";
      if (!picker.querySelector(".flow-hint")) {
        const hint = document.createElement("p");
        hint.className = "flow-hint";
        hint.textContent = "Elige uno y te mostramos tu ruta de permisos.";
        picker.querySelector("h3")?.insertAdjacentElement("afterend", hint);
      }
      // Franja "Tu negocio" encima del detalle
      const doc = document.getElementById("selectedBusinessDocSection");
      if (doc && !document.getElementById("bizStrip")) {
        const strip = document.createElement("div");
        strip.id = "bizStrip";
        strip.className = "biz-strip";
        doc.parentElement.querySelector("h3")?.insertAdjacentElement("afterend", strip);
        const h3 = doc.parentElement.querySelector("h3");
        if (h3) h3.textContent = "2. Tu negocio";
      }
      FOLDS.forEach(f => this.mountFold(f));
      this.applyMode();
      return true;
    },

    mountFold(f) {
      const target = f.target();
      if (!target || document.getElementById(f.id)) return;
      const head = document.createElement("button");
      head.type = "button";
      head.id = f.id;
      head.className = "fold-head";
      head.setAttribute("aria-expanded", "false");
      if (!target.id) target.id = `${f.id}-body`;
      head.setAttribute("aria-controls", target.id);
      head.innerHTML = `
        <span class="fold-icon"><i data-lucide="${f.icon}"></i></span>
        <span class="fold-text"><span class="fold-title">${esc(f.title)}</span><span class="fold-desc">${esc(f.text)}</span></span>
        <span class="fold-action"><span class="fold-action-label">Ver</span><i data-lucide="chevron-down"></i></span>`;
      head.addEventListener("click", () => this.setFold(f.id, head.getAttribute("aria-expanded") !== "true"));
      if (f.id === "fold-doc") {
        // el detalle del negocio va dentro de la franja, no como fila suelta
        head.classList.add("fold-head-inline");
      }
      target.insertAdjacentElement("beforebegin", head);
      target.classList.add("fold-body", "fold-closed");
      icons();
    },

    setFold(id, open) {
      const head = document.getElementById(id);
      if (!head) return;
      const body = document.getElementById(head.getAttribute("aria-controls"));
      head.setAttribute("aria-expanded", open ? "true" : "false");
      const label = head.querySelector(".fold-action-label");
      if (label) label.textContent = open ? "Ocultar" : "Ver";
      if (body) body.classList.toggle("fold-closed", !open);
      if (id === "fold-doc") this.renderStrip();
    },

    /** "Cambiar negocio": muestra las tarjetas sin esconder la ruta actual */
    setChanging(on) {
      const scr = this.screen();
      if (!scr) return;
      scr.classList.toggle("flow-changing", on);
      const hint = scr.querySelector(".flow-hint");
      if (hint) {
        hint.innerHTML = on
          ? `Elige otro negocio o <button type="button" class="flow-keep">mantener el actual</button>.`
          : "Elige uno y te mostramos tu ruta de permisos.";
        hint.querySelector(".flow-keep")?.addEventListener("click", () => {
          this.setChanging(false);
          requestAnimationFrame(() => document.getElementById("bizStrip")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        });
      }
      if (on) requestAnimationFrame(() => document.querySelector('[data-flow="picker"]')?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },

    /** Abre la sección plegada que contiene un elemento (para enlaces "ir a…") */
    revealFor(elementId) {
      const el = document.getElementById(elementId);
      if (!el) return;
      const body = el.closest(".fold-body");
      if (body) {
        const head = document.querySelector(`.fold-head[aria-controls="${body.id}"]`);
        if (head) this.setFold(head.id, true);
      }
    },

    renderStrip() {
      const strip = document.getElementById("bizStrip");
      const app = window.civikaApp, kb = KB();
      if (!strip || !app || !kb) return;
      const biz = kb.emprendimientosComunes.find(b => b.id === app.selectedBusinessId) || kb.emprendimientosComunes[0];
      const ciiu = String(biz.ciiuReferencia || "").split(" - ")[0];
      const docOpen = document.getElementById("fold-doc")?.getAttribute("aria-expanded") === "true";
      strip.innerHTML = `
        <div class="biz-strip-main">
          <span class="biz-strip-icon"><i data-lucide="store"></i></span>
          <div class="min-w-0">
            <p class="biz-strip-eyebrow">Tu negocio</p>
            <p class="biz-strip-name">${esc(biz.nombre)}</p>
            <p class="biz-strip-meta">CIIU referencial ${esc(ciiu)}${biz.categoria ? ` · ${esc(biz.categoria)}` : ""}</p>
          </div>
        </div>
        <div class="biz-strip-actions">
          <button type="button" class="btn-secondary btn-sm" data-strip="detail" aria-expanded="${docOpen}">
            <i data-lucide="${docOpen ? "chevron-up" : "file-text"}" class="w-4 h-4"></i>${docOpen ? "Ocultar detalle" : "Ver detalle"}
          </button>
          <button type="button" class="btn-ghost btn-sm" data-strip="change">
            <i data-lucide="repeat" class="w-4 h-4"></i>Cambiar negocio
          </button>
        </div>`;
      strip.querySelector('[data-strip="detail"]').addEventListener("click", () => {
        const open = document.getElementById("fold-doc")?.getAttribute("aria-expanded") === "true";
        this.setFold("fold-doc", !open);
      });
      strip.querySelector('[data-strip="change"]').addEventListener("click", () => this.setChanging(true));
      icons();
    }
  };

  function install() {
    const app = window.civikaApp;
    if (!app || !KB() || !document.getElementById("commonBusinessesContainer")) return false;
    if (app.__formsFlowInstalled) return true;
    app.__formsFlowInstalled = true;
    if (!flow.mount()) return false;

    const wrap = (name, before, after) => {
      const orig = app[name];
      if (typeof orig !== "function") return;
      app[name] = function (...args) {
        if (before) before(...args);
        const res = orig.apply(this, args);
        if (after) after(...args);
        return res;
      };
    };
    // Elegir un negocio cierra las tarjetas y lleva a la ruta
    wrap("selectBusiness", null, (bizId, scrollToDoc) => {
      const wasPicking = !flow.isPicked() || flow.screen()?.classList.contains("flow-changing");
      flow.setChanging(false);
      flow.setPicked(true);
      if ((wasPicking || scrollToDoc) && app.currentScreen === "screen-unified-forms") {
        setTimeout(() => document.getElementById("bizStrip")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    });
    // Enlaces que llevan a una sección: mostrar la ruta y abrir esa sección
    wrap("scrollToSection", (id) => { if (!flow.isPicked()) flow.setPicked(true); flow.revealFor(id); }, null);
    wrap("openPassport", () => { if (!flow.isPicked()) flow.setPicked(true); }, null);
    wrap("renderSelectedBusinessDocumentation", null, () => flow.renderStrip());
    return true;
  }

  window.civikaFormsFlow = flow;
  const boot = () => { if (!install()) setTimeout(boot, 60); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
