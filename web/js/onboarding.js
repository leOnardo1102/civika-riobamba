/**
 * CÍVIKA - Bienvenida y orientación
 * -----------------------------------------------------------------
 * Pantalla de bienvenida (primera visita) con 3 caminos y una guía corta
 * "Cómo funciona". Módulo independiente: no modifica el resto de la app.
 */
(function () {
  "use strict";

  const SEEN_KEY = "civika_welcome_seen_v1";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };
  const icons = () => { if (window.lucide) window.lucide.createIcons(); };

  const PATHS = [
    {
      id: "abrir", icon: "store", title: "Quiero abrir mi negocio",
      text: "Te armamos la ruta de permisos según tu negocio: qué trámite va primero y qué llevar.",
      screen: "screen-unified-forms"
    },
    {
      id: "mantener", icon: "shield-check", title: "Ya tengo un negocio",
      text: "Te avisamos qué permisos vencen y revisamos que tus documentos estén al día.",
      screen: "screen-renewals"
    },
    {
      id: "funcionario", icon: "landmark", title: "Soy funcionario",
      text: "Escanea el Pasaporte QR del ciudadano y revisa expedientes en ventanilla.",
      screen: "screen-officer"
    }
  ];

  const onboarding = {
    lastFocus: null,

    build() {
      if (document.getElementById("civikaWelcome")) return document.getElementById("civikaWelcome");
      const el = document.createElement("div");
      el.id = "civikaWelcome";
      el.className = "welcome hidden";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-labelledby", "welcomeTitle");
      el.innerHTML = `
        <div class="welcome-inner">
          <div class="welcome-brand">
            <span class="welcome-logo">C</span>
            <span class="welcome-brand-text"><b>Cívika</b><small>Riobamba</small></span>
          </div>

          <h1 id="welcomeTitle" class="welcome-title">¿Vas a abrir tu negocio en Riobamba?</h1>
          <p class="welcome-lead">Te decimos qué trámites hacer, en qué orden y qué llevar, para que llegues a ventanilla sin errores y sin tramitadores.</p>

          <p class="welcome-ask">¿Qué quieres hacer hoy?</p>
          <div class="welcome-paths">
            ${PATHS.map(p => `
              <button type="button" class="welcome-path" data-path="${p.id}">
                <span class="welcome-path-icon"><i data-lucide="${p.icon}"></i></span>
                <span class="welcome-path-body">
                  <span class="welcome-path-title">${p.title}</span>
                  <span class="welcome-path-text">${p.text}</span>
                </span>
                <i data-lucide="arrow-right" class="welcome-path-arrow"></i>
              </button>`).join("")}
          </div>

          <div class="welcome-foot">
            <p class="welcome-trust"><i data-lucide="lock"></i>Gratis · Sin contraseñas · Tus datos se quedan en tu dispositivo</p>
            <div class="welcome-links">
              <button type="button" class="welcome-link" data-action="guide"><i data-lucide="circle-help"></i>Ver cómo funciona</button>
              <button type="button" class="welcome-link welcome-skip" data-action="skip">Ir al inicio</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(el);

      el.querySelectorAll(".welcome-path").forEach(btn => btn.addEventListener("click", () => {
        const p = PATHS.find(x => x.id === btn.dataset.path);
        this.close();
        if (p && window.civikaApp) window.civikaApp.goToScreen(p.screen);
        if (window.civikaDB) window.civikaDB.recordAnonymousMetric({ evento: `bienvenida_${p.id}` }).catch(() => {});
      }));
      el.querySelector('[data-action="skip"]').addEventListener("click", () => {
        this.close();
        if (window.civikaApp) window.civikaApp.goToScreen("screen-home");
      });
      el.querySelector('[data-action="guide"]').addEventListener("click", () => {
        if (typeof this.openGuide === "function") { this.close(false); this.openGuide(); }
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); this.close(); }
        if (e.key === "Tab") this.trapFocus(e, el);
      });
      icons();
      return el;
    },

    trapFocus(e, root) {
      const f = Array.from(root.querySelectorAll("button, a[href], input, select")).filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    },

    open() {
      const el = this.build();
      this.lastFocus = document.activeElement;
      el.classList.remove("hidden");
      document.body.classList.add("welcome-open");
      requestAnimationFrame(() => el.classList.add("is-visible"));
      setTimeout(() => el.querySelector(".welcome-path")?.focus({ preventScroll: true }), 60);
    },

    close(markSeen = true) {
      const el = document.getElementById("civikaWelcome");
      if (!el) return;
      el.classList.remove("is-visible");
      el.classList.add("hidden");
      document.body.classList.remove("welcome-open");
      if (markSeen) store.set(SEEN_KEY, "1");
      if (this.lastFocus && this.lastFocus.isConnected && markSeen) {
        try { this.lastFocus.focus({ preventScroll: true }); } catch (e) { /* nada */ }
      }
    },

    shouldShow() {
      // ?bienvenida=1 en la URL la fuerza (útil para presentar)
      const q = (() => { let t = window.location.search; try { t += "&" + window.top.location.search; } catch (e) { /* iframe */ } return t; })();
      if (/[?&]bienvenida=1\b/.test(q)) return true;
      if (/[?&]bienvenida=0\b/.test(q)) return false;
      return store.get(SEEN_KEY) !== "1";
    }
  };

  // ==============================================================
  // Guía corta "Cómo funciona" (3 tarjetas, una a la vez)
  // ==============================================================
  const GUIDE = [
    {
      icon: "store", title: "Elige tu negocio",
      text: "Toca tu tipo de negocio o descríbelo con tus palabras, por ejemplo \"vendo empanadas en mi casa\".",
      hint: "Cívika arma tu ruta: qué trámites te tocan y en qué orden."
    },
    {
      icon: "list-checks", title: "Sigue tu ruta, un paso a la vez",
      text: "En cada trámite verás qué llevar, los errores que causan rechazo y qué hacer si algo sale mal.",
      hint: "Marca lo que ya tienes y Cívika te avisa si algo no cuadra."
    },
    {
      icon: "qr-code", title: "Llega a ventanilla sin errores",
      text: "Descarga tus fichas en PDF y tu Pasaporte QR, y agenda tus pasos en el calendario.",
      hint: "El funcionario escanea el QR y ve tu avance al instante."
    }
  ];

  onboarding.guideIndex = 0;

  onboarding.buildGuide = function () {
    let el = document.getElementById("civikaGuide");
    if (el) return el;
    el = document.createElement("div");
    el.id = "civikaGuide";
    el.className = "guide hidden";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "guideTitle");
    el.innerHTML = `
      <div class="guide-card">
        <div class="guide-head">
          <p class="guide-eyebrow">Cómo funciona Cívika</p>
          <button type="button" class="guide-close" data-action="close" aria-label="Cerrar guía"><i data-lucide="x"></i></button>
        </div>
        <div class="guide-body" aria-live="polite"></div>
        <div class="guide-nav">
          <div class="guide-dots" role="tablist" aria-label="Pasos de la guía">
            ${GUIDE.map((_, i) => `<button type="button" class="guide-dot" data-i="${i}" role="tab" aria-label="Paso ${i + 1}"></button>`).join("")}
          </div>
          <button type="button" class="guide-welcome-link" data-action="welcome">Ver la bienvenida</button>
          <div class="guide-buttons">
            <button type="button" class="btn-secondary btn-sm" data-action="prev">Atrás</button>
            <button type="button" class="btn-primary btn-sm" data-action="next">Siguiente</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target === el) return this.closeGuide();
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.action === "close") this.closeGuide();
      if (btn.dataset.action === "welcome") { this.closeGuide(); this.open(); return; }
      if (btn.dataset.action === "prev") this.showGuideStep(this.guideIndex - 1);
      if (btn.dataset.action === "next") {
        if (this.guideIndex < GUIDE.length - 1) this.showGuideStep(this.guideIndex + 1);
        else { this.closeGuide(); store.set(SEEN_KEY, "1"); if (window.civikaApp) window.civikaApp.goToScreen("screen-unified-forms"); }
      }
      if (btn.classList.contains("guide-dot")) this.showGuideStep(Number(btn.dataset.i));
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); this.closeGuide(); }
      if (e.key === "ArrowRight") this.showGuideStep(this.guideIndex + 1);
      if (e.key === "ArrowLeft") this.showGuideStep(this.guideIndex - 1);
      if (e.key === "Tab") this.trapFocus(e, el);
    });
    return el;
  };

  onboarding.showGuideStep = function (i) {
    const el = this.buildGuide();
    this.guideIndex = Math.max(0, Math.min(GUIDE.length - 1, i));
    const g = GUIDE[this.guideIndex];
    el.querySelector(".guide-body").innerHTML = `
      <div class="guide-step">
        <span class="guide-icon"><i data-lucide="${g.icon}"></i><b>${this.guideIndex + 1}</b></span>
        <h2 id="guideTitle" class="guide-title">${g.title}</h2>
        <p class="guide-text">${g.text}</p>
        <p class="guide-hint"><i data-lucide="sparkles"></i>${g.hint}</p>
      </div>`;
    el.querySelectorAll(".guide-dot").forEach((d, k) => {
      d.classList.toggle("is-on", k === this.guideIndex);
      d.setAttribute("aria-selected", k === this.guideIndex ? "true" : "false");
    });
    const prev = el.querySelector('[data-action="prev"]');
    const next = el.querySelector('[data-action="next"]');
    prev.disabled = this.guideIndex === 0;
    next.textContent = this.guideIndex === GUIDE.length - 1 ? "Empezar mi ruta" : "Siguiente";
    icons();
  };

  onboarding.openGuide = function () {
    const el = this.buildGuide();
    this.guideReturnFocus = document.activeElement;
    this.showGuideStep(0);
    el.classList.remove("hidden");
    document.body.classList.add("welcome-open");
    requestAnimationFrame(() => el.classList.add("is-visible"));
    setTimeout(() => el.querySelector('[data-action="next"]')?.focus({ preventScroll: true }), 60);
  };

  onboarding.closeGuide = function () {
    const el = document.getElementById("civikaGuide");
    if (!el) return;
    el.classList.remove("is-visible");
    el.classList.add("hidden");
    document.body.classList.remove("welcome-open");
    store.set(SEEN_KEY, "1");
    const back = this.guideReturnFocus;
    if (back && back.isConnected && !back.closest("#civikaWelcome")) { try { back.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  };

  // ==============================================================
  // Vista según el rol: ciudadano o funcionario
  // ==============================================================
  const ROLE_KEY = "civika_role_v1";
  const CITIZEN_SCREENS = ["screen-home", "screen-unified-forms", "screen-renewals", "screen-assistant"];
  const roles = {
    get() { return store.get(ROLE_KEY) === "funcionario" ? "funcionario" : "ciudadano"; },
    set(role) {
      const r = role === "funcionario" ? "funcionario" : "ciudadano";
      store.set(ROLE_KEY, r);
      document.body.dataset.role = r;
    },
    openPanel() {
      if (!window.civikaApp) return;
      window.civikaApp.goToScreen("screen-officer");
      setTimeout(() => {
        const target = document.getElementById("officerBackoffice");
        const visible = target && !target.classList.contains("hidden") && target.offsetParent !== null;
        (visible ? target : document.getElementById("officerPinGate"))?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    }
  };
  window.civikaRoles = roles;

  window.civikaOnboarding = onboarding;

  const boot = () => {
    const app = window.civikaApp;
    if (!app) { setTimeout(boot, 60); return; }
    // El rol sigue a la pantalla: Ventanilla → funcionario; pantallas del ciudadano → ciudadano
    if (!app.__rolesInstalled) {
      app.__rolesInstalled = true;
      const orig = app.goToScreen;
      app.goToScreen = function (screenId, ...rest) {
        if (screenId === "screen-officer") roles.set("funcionario");
        else if (CITIZEN_SCREENS.includes(screenId)) roles.set("ciudadano");
        return orig.call(this, screenId, ...rest);
      };
      const cur = app.currentScreen;
      if (cur === "screen-officer") roles.set("funcionario");
      else if (CITIZEN_SCREENS.includes(cur)) roles.set("ciudadano");
      else roles.set(roles.get());
    }
    if (onboarding.shouldShow()) onboarding.open();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
