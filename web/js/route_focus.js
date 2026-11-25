/**
 * CÍVIKA - Ruta "una cosa a la vez"
 * -----------------------------------------------------------------
 * Muestra abierto solo el paso en curso; los demás quedan como una fila
 * compacta con su estado. No cambia el contenido de los pasos: solo
 * esconde lo que todavía no toca. Se puede ver todo con un interruptor.
 */
(function () {
  "use strict";

  const PREF_KEY = "civika_route_focus_v1";
  const KB = () => (typeof CIVIKA_KNOWLEDGE_BASE !== "undefined" ? CIVIKA_KNOWLEDGE_BASE : null);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const focus = {
    expanded: new Set(),
    enabled: (() => { try { return localStorage.getItem(PREF_KEY) !== "off"; } catch (e) { return true; } })(),

    model() {
      const app = window.civikaApp, kb = KB();
      const biz = kb.emprendimientosComunes.find(b => b.id === app.selectedBusinessId) || kb.emprendimientosComunes[0];
      const noAplica = biz.pasosNoAplicanSinLocal || [];
      let current = null;
      const steps = kb.pasosSecuenciales.map(s => {
        const aplica = !noAplica.includes(s.id);
        const done = aplica && !!app.stepsState[s.id];
        let state = !aplica ? "na" : done ? "done" : "pending";
        if (state === "pending" && !current) { current = s.id; state = "current"; }
        return { step: s, state };
      });
      return { biz, steps, current };
    },

    setEnabled(on) {
      this.enabled = on;
      try { localStorage.setItem(PREF_KEY, on ? "on" : "off"); } catch (e) { /* nada */ }
      this.apply();
    },

    expand(stepId) {
      if (!stepId) return;
      this.expanded.add(stepId);
      const card = document.getElementById(`step-card-${stepId}`);
      if (card) this.setCollapsed(card, false);
    },

    toggle(stepId) {
      const card = document.getElementById(`step-card-${stepId}`);
      if (!card) return;
      const willOpen = card.classList.contains("route-collapsed");
      if (willOpen) this.expanded.add(stepId); else this.expanded.delete(stepId);
      this.setCollapsed(card, !willOpen);
      if (willOpen) requestAnimationFrame(() => card.scrollIntoView({ behavior: "smooth", block: "start" }));
    },

    setCollapsed(card, collapsed) {
      card.classList.toggle("route-collapsed", collapsed);
      const btn = card.querySelector(".route-toggle");
      if (btn) {
        btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        btn.title = collapsed ? "Ver detalle de este paso" : "Ocultar detalle";
        const label = btn.querySelector(".route-toggle-label");
        if (label) label.textContent = collapsed ? "Ver" : "Ocultar";
      }
    },

    apply() {
      const container = document.getElementById("unifiedStepsContainer");
      if (!container || !window.civikaApp || !KB()) return;
      const { steps, current } = this.model();

      // Tarjetas: estado + botón para abrir/cerrar
      steps.forEach(({ step, state }) => {
        const card = document.getElementById(`step-card-${step.id}`);
        if (!card) return;
        card.dataset.routeState = state;
        const header = card.firstElementChild;
        const actions = header && header.lastElementChild;
        if (actions && !actions.querySelector(".route-toggle")) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "route-toggle";
          btn.innerHTML = `<span class="route-toggle-label">Ver</span><i data-lucide="chevron-down"></i>`;
          btn.addEventListener("click", () => this.toggle(step.id));
          actions.insertBefore(btn, actions.firstChild);
        }
        if (header && !header.querySelector(".route-chip")) {
          const title = header.querySelector("h3");
          if (title) {
            const chip = document.createElement("span");
            chip.className = "route-chip";
            title.insertAdjacentElement("afterend", chip);
          }
        }
        const chip = header && header.querySelector(".route-chip");
        if (chip) {
          chip.textContent = state === "current" ? "Estás aquí" : state === "na" ? "No aplica a tu negocio" : "";
          chip.dataset.state = state;
        }
        const open = !this.enabled || state === "current" || this.expanded.has(step.id);
        this.setCollapsed(card, !open);
        card.classList.toggle("route-focus-on", this.enabled);
      });

      this.renderBar(container, steps, current);
      if (window.lucide) window.lucide.createIcons();
    },

    renderBar(container, steps, current) {
      let bar = document.getElementById("routeFocusBar");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "routeFocusBar";
        bar.className = "route-bar";
        container.insertAdjacentElement("beforebegin", bar);
      }
      const applicable = steps.filter(s => s.state !== "na");
      const done = applicable.filter(s => s.state === "done").length;
      const idx = current ? applicable.findIndex(s => s.step.id === current) + 1 : applicable.length;
      const cur = steps.find(s => s.step.id === current);
      bar.innerHTML = `
        <div class="route-bar-top">
          <div class="min-w-0">
            <p class="route-bar-eyebrow">Tu ruta · ${done} de ${applicable.length} pasos listos</p>
            <p class="route-bar-title">${cur ? `Vas en el paso ${idx} de ${applicable.length}: <b>${esc(cur.step.nombre)}</b>` : "<b>¡Ruta completa!</b> Ya puedes generar tu Pasaporte QR."}</p>
          </div>
          <label class="route-switch" title="Mostrar todos los pasos abiertos">
            <input type="checkbox" id="routeShowAll" ${this.enabled ? "" : "checked"}>
            <span class="route-switch-ui" aria-hidden="true"></span>
            <span>Ver todos</span>
          </label>
        </div>
        <ol class="route-segments" aria-label="Pasos de tu ruta">
          ${steps.map(({ step, state }) => `
            <li>
              <button type="button" class="route-seg" data-step="${esc(step.id)}" data-state="${state}"
                      title="Paso ${step.paso}: ${esc(step.nombre)}${state === "na" ? " (no aplica)" : ""}"
                      aria-label="Paso ${step.paso}: ${esc(step.nombre)} · ${state === "done" ? "listo" : state === "current" ? "en curso" : state === "na" ? "no aplica" : "pendiente"}">
                <span class="route-seg-bar"></span>
                <span class="route-seg-label">${state === "done" ? "✓" : step.paso}</span>
              </button>
            </li>`).join("")}
        </ol>`;
      bar.querySelector("#routeShowAll").addEventListener("change", (e) => this.setEnabled(!e.target.checked));
      bar.querySelectorAll(".route-seg").forEach(b => b.addEventListener("click", () => {
        const id = b.dataset.step;
        this.expand(id);
        document.getElementById(`step-card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    }
  };

  function install() {
    const app = window.civikaApp;
    if (!app || !KB()) return false;
    if (app.__routeFocusInstalled) return true;
    app.__routeFocusInstalled = true;

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
    wrap("renderUnifiedFormsAndProcedures", null, () => focus.apply());
    // Abrir el paso al que el usuario navega a propósito (pestañas, aviso de preparación)
    wrap("setPillarTab", (stepId) => focus.expanded.add(stepId), null);
    // Al marcar un paso como listo, se mantiene abierto para ver "Siguiente paso recomendado"
    wrap("toggleStepStatus", (stepId) => focus.expanded.add(stepId), null);
    // Al cambiar de negocio se vuelve a la vista enfocada
    wrap("selectBusiness", () => focus.expanded.clear(), null);

    // Botones "Ir al Paso 0X" que hacen scroll a una tarjeta: abrirla antes
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[onclick]");
      if (!el) return;
      const m = /getElementById\('step-card-([a-z_]+)'\)/.exec(el.getAttribute("onclick") || "");
      if (m) focus.expand(m[1]);
    }, true);

    focus.apply();
    return true;
  }

  window.civikaRouteFocus = focus;
  const boot = () => { if (!install()) setTimeout(boot, 60); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
