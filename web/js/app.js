/**
 * CIVIKA - Controlador Principal GovTech (Estándares GOV.UK, LifeSG y Bürokratt)
 * Hackathon INNOVAiLAB UNACH 2026 - Riobamba, Ecuador
 * Módulos integrados:
 * 1. Todos los emprendimientos y los 6 servicios con Los 4 Pilares + Ruta Encadenada
 * 2. Auditor Pre-Ventanilla de Documentos (Simulador Local Client-Side con FileReader + Semáforo)
 * 3. Formulario Borrador No Sensible GOV.UK ("una cosa a la vez") + Algoritmo Módulo 10/11 Ecuador + Pasaporte QR (qrcodejs)
 * 4. Accesibilidad Inclusiva: Modo Lectura Fácil (Alto Contraste / Fuente Mayor) + Text-to-Speech en pasos clave
 * 5. Conector asíncrono con db.js (IndexedDB/LocalStorage + Supabase Fallback) y Modal de Métricas Ciudadanas en Vivo
 */

class CivikaApp {
  constructor() {
    this.currentScreen = "screen-home";
    this.assistant = null;
    this.deviceMode = "frame";
    this.easyReadMode = false;

    // Negocio activo seleccionado
    this.selectedBusinessId = "tienda_ropa";

    // Estado del perfil y diagnóstico del emprendedor
    this.userProfile = {
      tipoActividad: "tienda_ropa",
      nombreNegocio: "Tienda de Ropa y Calzado",
      categoria: "Comercio Minorista",
      costoAprox: "RUC $0 + Tasas según capital y m²",
      esNuevo: true,
      tenenciaLocal: "arrendado",
      regimenSRI: "rimpe_popular",
      parroquiaRiobamba: "Maldonado"
    };

    // Estado de los 6 pasos obligatorios de la carpeta
    this.stepsState = {
      req_ruc: true,
      req_bomberos: false,
      req_uso_suelo: false,
      req_solvencia: false,
      req_formulario_patente: false,
      req_luf_final: false
    };

    // Estado de los 4 Pilares interactivos (Pilar 1: Diagnóstico, Pilar 2: Sub-checklists, Pestaña activa por paso)
    this.diagnosticAnswers = {};
    this.checklistChecks = {};
    this.activePillarTab = {};
    this.stageProgress = {};
    this.officerUnlocked = false;
    this.officerReturnOpenId = null;
    try { this.officerUnlocked = sessionStorage.getItem("civika_officer_pin_ok") === "1"; } catch (e) { /* nada */ }

    // Estado del Auditor Pre-Ventanilla (Client-Side)
    this.auditedDocuments = [];

    // Estado del Formulario Borrador GOV.UK ("Una cosa a la vez")
    this.govukWizardStep = 1;
    this.draftForm = {
      nombreComercial: "Comercial Riobamba Styles",
      actividadId: "tienda_ropa",
      parroquia: "Maldonado",
      tenenciaLocal: "arrendado",
      areaMetros: "35",
      regimenEstimado: "RIMPE Negocio Popular",
      identificacionInput: "",
      identificacionMascarada: "",
      esIdentificacionValida: false,
      tipoIdentificacion: "",
      detalleValidacionId: ""
    };

    this.activeViewerStep = null;
    this.modalViewMode = "justification";
    this.init();
  }

  async init() {
    // 1. Inicializar repositorio híbrido db.js
    if (window.civikaDB) {
      await window.civikaDB.init();
    }

    await this.loadStateFromStorage();

    // 2. Inicializar Copiloto IA
    this.assistant = new CivikaAssistant();

    // 3. Configurar eventos y renderizar módulos
    this.setupEventListeners();
    this.applyEasyReadModeClass();
    this.renderCommonBusinesses();
    this.renderSelectedBusinessDocumentation();
    this.renderUnifiedFormsAndProcedures();
    this.renderPreWindowAuditorSection();
    this.renderGovukPassportWizardSection();
    this.renderTimeComparisonWidget();
    this.renderOfficialDownloadsSection();
    this.renderFolderAssemblyGuide();
    if (typeof renderInstitutions === "function") {
      renderInstitutions("Todas");
    }
    this.assistant.init();
    this.updateFolderProgress();

    if (window.civikaDB) {
      window.civikaDB.updateFooterBadge();
    }

    // 4. Funciones nuevas (renovaciones, Modo Ventanilla, WhatsApp, PWA) y pantalla inicial
    if (window.civikaFeatures) window.civikaFeatures.onAppReady();
    const initialScreen = window.civikaUI ? window.civikaUI.screenFromHash() : "screen-home";
    this.goToScreen(initialScreen);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  setupEventListeners() {
    // Bottom navigation buttons
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const screenId = btn.getAttribute("data-target-screen");
        if (screenId) {
          this.goToScreen(screenId);
        }
      });
    });

    // Device Frame toggle button
    const deviceToggleBtn = document.getElementById("deviceToggleBtn");
    if (deviceToggleBtn) {
      deviceToggleBtn.addEventListener("click", () => {
        this.toggleDeviceMode();
      });
    }

    // Easy Read Mode toggle button
    const easyReadBtn = document.getElementById("easyReadToggleBtn");
    if (easyReadBtn) {
      easyReadBtn.addEventListener("click", () => {
        this.toggleEasyReadMode();
      });
    }

    // Live Metrics Modal button
    const liveMetricsBtn = document.getElementById("liveMetricsHeaderBtn");
    if (liveMetricsBtn) {
      liveMetricsBtn.addEventListener("click", () => {
        this.openLiveMetricsModal();
      });
    }

    // Chat submit form
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    if (chatForm && chatInput) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = chatInput.value;
        if (text && text.trim()) {
          this.assistant.processUserMessage(text);
          chatInput.value = "";
        }
      });
    }

    // Voice Microphone button in chat
    const chatMicBtn = document.getElementById("chatMicBtn");
    if (chatMicBtn) {
      chatMicBtn.addEventListener("click", () => {
        this.assistant.toggleVoiceInput();
      });
    }

    // Institutions filter tabs
    document.querySelectorAll(".inst-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".inst-filter-btn").forEach(b => {
          b.classList.remove("bg-blue-600", "text-white", "shadow-sm");
          b.classList.add("bg-white", "text-slate-600", "border-slate-200");
        });
        btn.classList.add("bg-blue-600", "text-white", "shadow-sm");
        btn.classList.remove("bg-white", "text-slate-600", "border-slate-200");
        const category = btn.getAttribute("data-category");
        if (typeof renderInstitutions === "function") {
          renderInstitutions(category);
        }
      });
    });

    // Hackathon Scenario Quick Presets
    document.querySelectorAll(".scenario-quick-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const scenario = btn.getAttribute("data-scenario");
        this.applyDemoScenario(scenario);
      });
    });
  }

  goToScreen(screenId) {
    const target = document.getElementById(screenId);
    if (!target) return;
    const previous = this.currentScreen;

    document.querySelectorAll(".app-screen").forEach(scr => scr.classList.add("hidden"));
    target.classList.remove("hidden");
    this.currentScreen = screenId;
    document.body.dataset.screen = screenId;

    // Resaltar el botón activo en la barra lateral (laptop) y en el menú inferior (celular)
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      const isTarget = btn.getAttribute("data-target-screen") === screenId;
      btn.classList.toggle("is-active", isTarget);
      if (isTarget) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });

    // Título de la página (laptop) y del documento
    const titles = {
      "screen-home": "Inicio",
      "screen-unified-forms": "Abrir mi negocio",
      "screen-assistant": "Copiloto IA",
      "screen-renewals": "Mantener mi negocio",
      "screen-institutions": "Oficinas y mapa",
      "screen-officer": "Ventanilla del funcionario"
    };
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.textContent = titles[screenId] || "Cívika";
    document.title = `${titles[screenId] || "Inicio"} • Cívika Riobamba`;

    if (window.civikaUI) window.civikaUI.closeDrawer();
    if (window.civikaFeatures) window.civikaFeatures.onScreenChange(screenId, previous);
    if (screenId === "screen-officer") {
      this.renderOfficerGateAndInbox();
    }

    window.scrollTo({ top: 0, behavior: "auto" });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  scrollToSection(elementId) {
    this.goToScreen("screen-unified-forms");
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  }

  toggleDeviceMode() {
    const frame = document.getElementById("phoneMockupContainer");
    const toggleIcon = document.getElementById("deviceToggleIcon");
    const toggleLabel = document.getElementById("deviceToggleLabel");

    if (this.deviceMode === "frame") {
      this.deviceMode = "full";
      frame.classList.remove("max-w-[420px]", "rounded-[46px]", "border-[8px]", "shadow-2xl", "my-1");
      frame.classList.add("max-w-5xl", "rounded-2xl", "border-2", "shadow-xl", "my-0");
      if (toggleLabel) toggleLabel.textContent = "Marco Móvil";
      if (toggleIcon) toggleIcon.setAttribute("data-lucide", "smartphone");
    } else {
      this.deviceMode = "frame";
      frame.classList.add("max-w-[420px]", "rounded-[46px]", "border-[8px]", "shadow-2xl", "my-1");
      frame.classList.remove("max-w-5xl", "rounded-2xl", "border-2", "shadow-xl", "my-0");
      if (toggleLabel) toggleLabel.textContent = "Pantalla Completa";
      if (toggleIcon) toggleIcon.setAttribute("data-lucide", "maximize-2");
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Toggle de Modo Lectura Fácil (Accesibilidad Inclusiva para Adultos Mayores y Baja Visión)
   */
  toggleEasyReadMode() {
    this.easyReadMode = !this.easyReadMode;
    this.applyEasyReadModeClass();
    if (typeof window.civikaToast === "function") {
      window.civikaToast(this.easyReadMode ? "Lectura Fácil activada: letra más grande y más contraste" : "Lectura Fácil desactivada");
    }
    this.saveStateToStorage();
  }

  applyEasyReadModeClass() {
    document.documentElement.classList.toggle("easy-read-mode", this.easyReadMode);
    document.body.classList.toggle("easy-read-mode", this.easyReadMode);
    const btn = document.getElementById("easyReadToggleBtn");
    if (btn) btn.setAttribute("aria-pressed", this.easyReadMode ? "true" : "false");
  }

  /**
   * Lectura por Voz (Text-to-Speech) para cualquier paso o negocio de la app
   */
  speakStepGuide(stepId, btnEl = null) {
    const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
    if (!step || !this.assistant) return;

    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId);
    const checks = (step.pilares?.checklistPersonalizado || []).slice(0, 3).map(c => c.item).join(". ");
    const bizAlert = biz?.alertasAntiRechazo?.[0] || "";
    const speechText = `Paso ${step.paso}: ${step.nombre}, en ${step.entidad}. ` +
      `Qué debes hacer: ${step.queHacer}. ` +
      (checks ? `Requisitos clave: ${checks}. ` : "") +
      `Prevención de rechazo: ${bizAlert || step.pilares?.pasosConPrevencion?.[0]?.alertaCritica || step.queRevisar[0]}. ` +
      `Costo oficial: ${step.costo}.`;
    this.assistant.speakText(speechText, btnEl, `Paso ${step.paso}: ${step.nombre}`);
  }

  speakBusinessGuide(bizId = this.selectedBusinessId, btnEl = null) {
    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === bizId);
    if (!biz || !this.assistant) return;

    const entidades = (biz.entidadesInvolucradas || []).join(", ");
    const reqs = (biz.documentacionRequerida || []).slice(0, 4).join(". ");
    const alerta = (biz.alertasAntiRechazo || [])[0] || biz.advertenciaSector || "";
    const rec = (biz.recomendacionesEspecificas || [])[0] || "";
    const speechText = `Guía para ${biz.nombre}, categoría ${biz.categoria}. ` +
      (entidades ? `Entidades involucradas: ${entidades}. ` : "") +
      `Régimen S R I: ${biz.regimenRecomendado}. ` +
      `Control sanitario: ${biz.requiereArcsa}. ` +
      (reqs ? `Requisitos principales: ${reqs}. ` : "") +
      (alerta ? `Alerta anti-rechazo: ${alerta}. ` : "") +
      (rec ? `Recomendación: ${rec}.` : "");
    this.assistant.speakText(speechText, btnEl, biz.nombre);
  }

  // ==============================================================
  // 1. SELECCIÓN DE EMPRENDIMIENTOS COMUNES EN RIOBAMBA
  // ==============================================================
  renderCommonBusinesses() {
    const container = document.getElementById("commonBusinessesContainer");
    if (!container) return;

    const businesses = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes;

    container.innerHTML = businesses.map(biz => {
      const isSelected = biz.id === this.selectedBusinessId;

      return `
        <button type="button" onclick="civikaApp.selectBusiness('${biz.id}', true);"
             aria-pressed="${isSelected}"
             class="biz-card-item w-full text-left bg-white rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer flex items-center justify-between group ${
               isSelected
                 ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm bg-blue-50/15'
                 : 'border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300'
             }">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition ${
              isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
            }">
              <i data-lucide="${biz.icono}" class="w-5 h-5"></i>
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h4 class="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight group-hover:text-blue-600 transition">
                  ${biz.nombre}
                </h4>
                ${biz.ciiuReferencia ? `<span class="hidden sm:inline text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">${biz.ciiuReferencia.split(' ')[0]}</span>` : ''}
              </div>
              <div class="hidden sm:flex items-center gap-1.5 mt-1 flex-wrap">
                <span class="text-[11px] text-slate-500 font-medium">${biz.categoria}</span>
                <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ${biz.costoAproxTotal}
                </span>
              </div>
            </div>
          </div>

          <span class="text-slate-400 group-hover:text-blue-600 transition pl-2 shrink-0 flex items-center" aria-hidden="true">
            <i data-lucide="chevron-right" class="w-5 h-5"></i>
          </span>
        </button>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  selectBusiness(bizId, scrollToDoc = false) {
    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === bizId);
    if (!biz) return;

    this.selectedBusinessId = bizId;
    this.userProfile.tipoActividad = bizId;
    this.userProfile.nombreNegocio = biz.nombre;
    this.userProfile.categoria = biz.categoria;
    this.userProfile.costoAprox = biz.costoAproxTotal;
    this.draftForm.actividadId = bizId;

    if (this.assistant) {
      this.assistant.setContext({ businessId: bizId });
    }

    this.renderCommonBusinesses();
    this.renderSelectedBusinessDocumentation();
    this.renderUnifiedFormsAndProcedures();
    this.renderGovukPassportWizardSection();
    this.saveStateToStorage();

    if (scrollToDoc) {
      setTimeout(() => {
        const docEl = document.getElementById("selectedBusinessDocSection");
        if (docEl) docEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }

  renderSelectedBusinessDocumentation() {
    const container = document.getElementById("selectedBusinessDocSection");
    if (!container) return;

    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId)
      || CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes[0];
    const entidades = biz.entidadesInvolucradas || [];
    const alertas = biz.alertasAntiRechazo || [];
    const recomendaciones = biz.recomendacionesEspecificas || [];

    container.innerHTML = `
      <div class="card card-pad space-y-5 animate-fade-in">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex items-start gap-3 min-w-0">
            <span class="feature-icon"><i data-lucide="${biz.icono}"></i></span>
            <div class="min-w-0">
              <p class="eyebrow">Expediente personalizado · CIIU ${biz.ciiuReferencia ? biz.ciiuReferencia.split(' ')[0] : ''}</p>
              <h4 class="text-lg font-semibold text-slate-900 leading-snug mt-0.5">${biz.nombre}</h4>
              <p class="text-sm text-slate-500">${biz.categoria}</p>
            </div>
          </div>
          <button type="button"
                  onclick="civikaApp.speakBusinessGuide('${biz.id}', this)" data-audio-title="${biz.nombre}"
                  class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                  title="Escuchar guía completa de este giro">
            <i data-lucide="volume-2" class="w-4 h-4"></i>
            <span>Escuchar guía</span>
          </button>
        </div>

        ${entidades.length ? `
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Entidades involucradas en este giro</p>
            <div class="flex flex-wrap gap-1.5">
              ${entidades.map(ent => `
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  <i data-lucide="building-2" class="w-3 h-3 text-blue-600"></i>
                  <span>${ent}</span>
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <dl class="grid sm:grid-cols-2 gap-3">
          <div class="rounded-lg border border-slate-200 p-3.5">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-500">Régimen SRI</dt>
            <dd class="text-sm text-slate-800 mt-1">${biz.regimenRecomendado || 'RIMPE o Régimen General'}</dd>
          </div>
          <div class="rounded-lg border border-slate-200 p-3.5">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-500">Control sanitario ARCSA</dt>
            <dd class="text-sm text-slate-800 mt-1">${biz.requiereArcsa || 'Verificar según el giro'}</dd>
          </div>
        </dl>

        <div>
          <h5 class="text-sm font-semibold text-slate-900 mb-2">Requisitos específicos para tu carpeta</h5>
          <ul class="space-y-2">
            ${biz.documentacionRequerida.map(doc => `
              <li class="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0 mt-1"></i>
                <span>${doc}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        ${alertas.length ? `
          <div class="rounded-xl bg-rose-50 border border-rose-200 p-3.5 space-y-1.5 text-sm">
            <p class="font-bold text-rose-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <i data-lucide="shield-alert" class="w-4 h-4 text-rose-600"></i>
              <span>Alertas anti-rechazo en ventanilla</span>
            </p>
            <ul class="space-y-1 text-xs text-rose-950 leading-relaxed">
              ${alertas.map(a => `<li class="flex items-start gap-2"><span class="text-rose-600 font-bold">•</span><span>${a}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${recomendaciones.length ? `
          <div class="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 space-y-1.5 text-sm">
            <p class="font-bold text-emerald-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <i data-lucide="lightbulb" class="w-4 h-4 text-emerald-600"></i>
              <span>Recomendaciones específicas</span>
            </p>
            <ul class="space-y-1 text-xs text-emerald-950 leading-relaxed">
              ${recomendaciones.map(r => `<li class="flex items-start gap-2"><span class="text-emerald-600 font-bold">•</span><span>${r}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="rounded-lg bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-sm">
          <i data-lucide="triangle-alert" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
          <div>
            <p class="font-semibold text-amber-900">Bomberos: ${biz.riesgoBomberos}</p>
            <p class="text-amber-900/90 mt-0.5">${biz.advertenciaSector}</p>
          </div>
        </div>
      </div>
    `;

    if (window.civikaFeatures) window.civikaFeatures.afterBusinessDocRender(biz, container);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==============================================================
  // 2. LOS 6 SERVICIOS CON LOS 4 PILARES INTERACTIVOS + RUTA ENCADENADA
  // ==============================================================
  setPillarTab(stepId, pillarKey) {
    this.activePillarTab[stepId] = pillarKey;
    if (this.assistant) {
      this.assistant.setContext({ serviceId: stepId });
    }
    this.renderUnifiedFormsAndProcedures();
  }

  async completeStageAndNext(stepId, currentStageKey, nextPillarTab = null) {
    const stageState = {
      diagnostico: false,
      checklist: false,
      antiRechazo: false,
      planB: false,
      ...(this.stageProgress[stepId] || {})
    };
    stageState[currentStageKey] = true;
    this.stageProgress[stepId] = stageState;

    if (window.civikaDB && typeof window.civikaDB.setStepStageState === "function") {
      await window.civikaDB.setStepStageState(stepId, currentStageKey, true);
    } else {
      this.saveStateToStorage();
    }

    if (nextPillarTab) {
      this.activePillarTab[stepId] = nextPillarTab;
    }
    this.renderUnifiedFormsAndProcedures();

    if (nextPillarTab) {
      const names = { pilar2: "Checklist", pilar3: "Anti-Rechazo", pilar4: "Plan B" };
      const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
      let extra = "";
      if (nextPillarTab === "pilar2" && step) {
        const list = step.pilares?.checklistPersonalizado || [];
        const done = list.filter(c => this.checklistChecks[c.id]).length;
        extra = ` · ${done}/${list.length} requisitos completados`;
      }
      if (typeof window.civikaToast === "function") {
        window.civikaToast(`Etapa completada. Ahora: ${names[nextPillarTab] || "siguiente etapa"}${extra}`);
      }
      requestAnimationFrame(() => {
        const el = document.getElementById(`pillars-${stepId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  selectDiagnosticOption(stepId, questionId, optionValue) {
    const key = `${stepId}__${questionId}`;
    this.diagnosticAnswers[key] = optionValue;
    const stageState = {
      diagnostico: false,
      checklist: false,
      antiRechazo: false,
      planB: false,
      ...(this.stageProgress[stepId] || {})
    };
    const stepDef = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
    const bizDef = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId)
      || CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes[0];
    const ev = stepDef ? this.evaluateStepDiagnostic(stepDef, bizDef) : null;
    stageState.diagnostico = !!(ev && ev.isComplete && !ev.hasInconsistency);
    this.stageProgress[stepId] = stageState;
    if (window.civikaDB && typeof window.civikaDB.setStepStageState === "function") {
      window.civikaDB.setStepStageState(stepId, "diagnostico", stageState.diagnostico);
    }
    this.saveStateToStorage();
    this.renderUnifiedFormsAndProcedures();
  }

  toggleSubChecklist(checkId, stepId = null) {
    this.checklistChecks[checkId] = !this.checklistChecks[checkId];
    if (stepId) {
      const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
      const list = step?.pilares?.checklistPersonalizado || [];
      const done = list.filter(c => this.checklistChecks[c.id]).length;
      const stageState = {
        diagnostico: false,
        checklist: false,
        antiRechazo: false,
        planB: false,
        ...(this.stageProgress[stepId] || {})
      };
      stageState.checklist = list.length > 0 && done >= list.length;
      this.stageProgress[stepId] = stageState;
      if (window.civikaDB && typeof window.civikaDB.setStepStageState === "function") {
        window.civikaDB.setStepStageState(stepId, "checklist", stageState.checklist);
      }
    }
    this.saveStateToStorage();
    this.renderUnifiedFormsAndProcedures();
  }

  /**
   * Evalúa respuestas del diagnóstico + giro de negocio (y respuestas de otros pasos)
   * para detectar inconsistencias reales. Nunca asume respuestas no contestadas.
   * Devuelve: { hasInconsistency, isComplete, answered, total, badge, title, lines[], warnings[], correction }
   */
  evaluateStepDiagnostic(step, biz) {
    const p = step.pilares || {};
    const questions = p.diagnosticoRapido || [];
    const ans = (sid, qid) => this.diagnosticAnswers[`${sid}__${qid}`] || "";
    const answers = {};
    questions.forEach(q => { answers[q.id] = ans(step.id, q.id); });
    const answered = questions.filter(q => answers[q.id]).length;
    const total = questions.length;
    const isComplete = answered >= total;
    const bizId = biz.id;
    const isNoLocalBiz = Array.isArray(biz.pasosNoAplicanSinLocal) && biz.pasosNoAplicanSinLocal.includes(step.id);

    // Paso que no aplica para negocios 100% sin local
    if (isNoLocalBiz) {
      return {
        hasInconsistency: false, isComplete: true, answered, total,
        badge: "Paso condicional (sin local)",
        title: "No aplica mientras operes 100% sin local",
        lines: [`Para "${biz.nombre}", ${step.nombre} normalmente no es exigible si no tienes atención presencial ni bodega abierta al público.`],
        warnings: [],
        correction: "Si almacenas inventario en una bodega física o atiendes clientes en un local, confirma este requisito en el canal oficial del GAD."
      };
    }

    const errors = [];   // bloquean el avance: contradicción entre respuesta y giro
    const warnings = []; // no bloquean: revisar antes de ir a la institución
    const FOOD = ["cafeteria", "restaurante", "micromercado"];
    const NON_FOOD = ["tienda_ropa", "profesional", "taller", "peluqueria"];
    const GLP = ["cafeteria", "restaurante"];
    const LOW_FIRE = ["tienda_ropa", "profesional", "peluqueria", "venta_redes", "farmacia"];
    const LOW_IMPACT = ["tienda_ropa", "cafeteria", "profesional", "micromercado", "peluqueria", "farmacia"];

    if (step.id === "req_ruc") {
      const act = answers.ruc_q1;
      if (act && bizId === "profesional" && act !== "profesional") {
        errors.push("Elegiste un consultorio u oficina profesional, pero respondiste que tu actividad es comercio o taller artesanal. Los servicios profesionales con título no ingresan a RIMPE.");
      }
      if (act === "profesional" && bizId !== "profesional") {
        errors.push(`Respondiste "servicios profesionales con título", pero tu giro seleccionado es "${biz.nombre}". El régimen tributario depende de la actividad real que registres en el RUC.`);
      }
      if (act === "profesional" && answers.ruc_q2 === "hasta_20k") {
        warnings.push("Aunque factures menos de $20,000 al año, la actividad profesional se registra en Régimen General (no RIMPE Negocio Popular).");
      }
      if (act === "artesano" && bizId !== "artesanal") {
        warnings.push("La ruta de artesano solo aplica si ya tienes calificación artesanal vigente (JNDA o MIPRO). Si aún no la tienes, elige la opción de comercio/servicios.");
      }
    }

    if (step.id === "req_bomberos") {
      const fuego = answers.cbr_q1;
      if (fuego === "no_fuego" && GLP.includes(bizId)) {
        warnings.push(`Un/a ${biz.nombre.toLowerCase()} suele usar cocina, cafetera industrial o gas. Si de verdad todo es eléctrico, prepara una declaración de equipos; si usas GLP, cambia tu respuesta: el inspector lo verificará.`);
      }
      if (fuego === "no_fuego" && bizId === "taller") {
        warnings.push("Los talleres y lubricadoras suelen manejar aceites o solventes. Si almacenas inflamables, cambia tu respuesta para conocer el equipamiento exigido.");
      }
      if ((fuego === "si_glp" || fuego === "si_inflamables") && LOW_FIRE.includes(bizId)) {
        warnings.push(`Tu giro "${biz.nombre}" normalmente es de riesgo bajo. Si realmente usas gas o inflamables, confírmalo en la inspección; si no, revisa tu respuesta.`);
      }
    }

    if (step.id === "req_uso_suelo") {
      const imp = answers.suelo_q1;
      if (imp === "bajo_impacto" && bizId === "taller") {
        errors.push("Un taller mecánico, lubricadora o eléctrico es actividad de impacto medio-alto, no de comercio barrial. Declararlo como bajo impacto puede provocar la negativa del ICUS.");
      }
      if (imp === "medio_alto_impacto" && LOW_IMPACT.includes(bizId)) {
        warnings.push(`Marcaste impacto medio-alto para "${biz.nombre}". Si tu local no es taller, carpintería industrial ni centro nocturno, la opción correcta es bajo impacto.`);
      }
    }

    if (step.id === "req_solvencia") {
      if (answers.solv_q2 === "mas_de_un_mes") {
        warnings.push("El certificado tiene vigencia limitada: no lo compres todavía si entregarás la carpeta dentro de más de un mes.");
      }
    }

    if (step.id === "req_formulario_patente") {
      const pat = answers.pat_q1;
      const rucAct = ans("req_ruc", "ruc_q1");
      if (pat === "artesano_jnda" && bizId !== "artesanal" && rucAct && rucAct !== "artesano") {
        errors.push("En el Paso 1 (RUC) no te registraste como artesano calificado, pero aquí indicas calificación artesanal. La exoneración de patente exige que la calificación esté vigente y registrada en el SRI.");
      }
      if (pat === "artesano_jnda" && bizId === "profesional") {
        errors.push("Un consultorio profesional no puede acogerse a la exoneración artesanal de patente.");
      }
    }

    if (step.id === "req_luf_final") {
      const ali = answers.luf_arcsa_q1;
      if (ali === "no_alimentos" && FOOD.includes(bizId)) {
        errors.push(`"${biz.nombre}" prepara o vende alimentos: responder "No" omitiría el control sanitario de la ARCSA.`);
      }
      if (bizId === "farmacia" && ali && ali !== "restaurante_procesador") {
        errors.push("Las farmacias y botiquines siempre requieren permiso de funcionamiento de la ARCSA. Elige la tercera opción.");
      }
      if (ali && ali !== "no_alimentos" && NON_FOOD.includes(bizId)) {
        errors.push(`Tu giro "${biz.nombre}" no es alimentario. Si además venderás alimentos, cambia tu giro o consulta la combinación de actividades en el canal oficial.`);
      }
    }

    const selectedOptions = questions
      .map(q => q.opciones.find(o => o.valor === answers[q.id]))
      .filter(Boolean);
    const lines = selectedOptions.map(o => o.resultadoRuta).filter(Boolean);

    if (!isComplete && !errors.length) {
      return {
        hasInconsistency: false, isComplete: false, answered, total,
        badge: `Diagnóstico ${answered}/${total}`,
        title: answered ? "Responde las preguntas restantes" : `Responde ${total} pregunta${total === 1 ? "" : "s"} sobre tu ${biz.nombre.toLowerCase()}`,
        lines: lines.length ? lines : ["Tu ruta se calcula con tus respuestas y con el giro que elegiste; no se asume ninguna opción por defecto."],
        warnings,
        correction: ""
      };
    }

    if (errors.length) {
      return {
        hasInconsistency: true, isComplete, answered, total,
        badge: "Inconsistencia detectada",
        title: "Tus respuestas no coinciden con tu giro",
        lines: errors,
        warnings,
        correction: "Corrige la respuesta marcada o cambia el tipo de negocio en el inicio. No podrás avanzar al checklist hasta resolverlo."
      };
    }

    const extra = [];
    if (bizId === "taller" && step.id === "req_uso_suelo") {
      extra.push("Obtén el ICUS favorable antes de firmar el contrato de arrendamiento: los talleres tienen restricciones en zonas residenciales.");
    }
    if (FOOD.includes(bizId) && step.id === "req_luf_final" && biz.requiereArcsa) {
      extra.push(biz.requiereArcsa);
    }

    return {
      hasInconsistency: false, isComplete: true, answered, total,
      badge: warnings.length ? "Ruta con observaciones" : "Ruta confirmada",
      title: `Tu ruta para ${biz.nombre}`,
      lines: [...lines, ...extra],
      warnings,
      correction: ""
    };
  }

  renderFourPillarsWidget(step) {
    if (!step.pilares) return "";
    const currentTab = this.activePillarTab[step.id] || "pilar1";
    const p = step.pilares;
    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId)
      || CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes[0];

    // Contar checks del Pilar 2
    const checklistItems = p.checklistPersonalizado || [];
    const totalChecks = checklistItems.length;
    const doneChecks = checklistItems.filter(c => this.checklistChecks[c.id]).length;
    const stageState = this.stageProgress[step.id] || {};
    const diagEval = this.evaluateStepDiagnostic(step, biz);

    let tabContentHtml = "";

    if (currentTab === "pilar1") {
      // ETAPA 1: Diagnóstico con lógica condicional real
      tabContentHtml = `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Etapa 1: Diagnóstico para ${biz.nombre}</span>
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${diagEval.hasInconsistency ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}">
              ${diagEval.badge}
            </span>
          </div>

          ${(p.diagnosticoRapido || []).map(q => {
            const answerKey = `${step.id}__${q.id}`;
            const selectedVal = this.diagnosticAnswers[answerKey] || "";

            return `
              <div class="bg-white rounded-xl p-2.5 border border-slate-200/90 space-y-1.5">
                <p class="font-bold text-slate-800 text-[11px]">${q.pregunta}</p>
                <div class="flex flex-wrap gap-1.5">
                  ${q.opciones.map(opt => {
                    const isActive = opt.valor === selectedVal;
                    return `
                      <button type="button"
                              onclick="civikaApp.selectDiagnosticOption('${step.id}', '${q.id}', '${opt.valor}')"
                              class="text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }">
                        ${opt.texto}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}

          <div class="p-2.5 rounded-xl border text-[11px] space-y-1 ${
            diagEval.hasInconsistency
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-indigo-50/90 border-indigo-200 text-indigo-950'
          }">
            <p class="font-extrabold flex items-center gap-1.5">
              <i data-lucide="${diagEval.hasInconsistency ? 'alert-triangle' : 'check-circle-2'}" class="w-3.5 h-3.5 ${diagEval.hasInconsistency ? 'text-rose-600' : 'text-indigo-600'} shrink-0"></i>
              <span>${diagEval.title}</span>
            </p>
            <ul class="leading-relaxed space-y-1 list-disc pl-4">
              ${diagEval.lines.map(l => `<li>${l}</li>`).join('')}
            </ul>
            ${diagEval.warnings.length ? `
              <div class="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-0.5">
                <p class="font-extrabold flex items-center gap-1"><i data-lucide="alert-circle" class="w-3.5 h-3.5 text-amber-600"></i><span>Revisa antes de ir a la institución</span></p>
                ${diagEval.warnings.map(w => `<p>${w}</p>`).join('')}
              </div>` : ''}
            ${diagEval.correction ? `<p class="font-semibold pt-0.5">Cómo corregir / proceder: ${diagEval.correction}</p>` : ''}
          </div>

          <div class="flex justify-end pt-1">
            <button type="button"
                    onclick="civikaApp.completeStageAndNext('${step.id}', 'diagnostico', 'pilar2')"
                    ${(diagEval.hasInconsistency || !diagEval.isComplete) ? 'disabled' : ''}
                    title="${diagEval.hasInconsistency ? 'Corrige la inconsistencia para continuar' : (!diagEval.isComplete ? 'Responde todas las preguntas del diagnóstico' : 'Ir al checklist')}"
                    class="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition ${
                      (diagEval.hasInconsistency || !diagEval.isComplete)
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer'
                    }">
              <span>Continuar al checklist (${doneChecks}/${totalChecks})</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    } else if (currentTab === "pilar2") {
      // ETAPA 2: Checklist Personalizado Interactivo
      tabContentHtml = `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
              <i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Etapa 2: Checklist (${doneChecks}/${totalChecks} requisitos completados)</span>
            </span>
            <button type="button"
                    onclick="civikaApp.openPrepNoticeModal('${step.id}', 'portal')"
                    class="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
              <span>Fuente Oficial</span>
              <i data-lucide="external-link" class="w-3 h-3"></i>
            </button>
          </div>
          <div class="space-y-1.5">
            ${checklistItems.map(chk => {
              const checked = Boolean(this.checklistChecks[chk.id]);
              return `
                <label class="flex items-start justify-between gap-2 bg-white p-2.5 rounded-xl border cursor-pointer transition ${
                  checked ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-300'
                }">
                  <div class="flex items-start gap-2">
                    <input type="checkbox" ${checked ? 'checked' : ''}
                           onchange="civikaApp.toggleSubChecklist('${chk.id}', '${step.id}')"
                           class="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0">
                    <span class="text-[11px] leading-snug ${checked ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-semibold'}">
                      ${chk.item}
                      ${chk.obligatorio ? '<span class="ml-1 text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Obligatorio</span>' : '<span class="ml-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">Condicional</span>'}
                    </span>
                  </div>
                  <a href="${chk.referenciaUrl}" target="_blank" rel="noopener noreferrer"
                     onclick="event.stopPropagation();"
                     class="text-blue-600 hover:text-blue-800 p-1 shrink-0"
                     title="Ver referencia oficial">
                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  </a>
                </label>
              `;
            }).join('')}
          </div>
          <div class="flex justify-end pt-1">
            <button type="button"
                    onclick="civikaApp.completeStageAndNext('${step.id}', 'checklist', 'pilar3')"
                    class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer">
              <span>Continuar a Anti-Rechazo</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    } else if (currentTab === "pilar3") {
      // ETAPA 3: Paso a Paso + Alertas Anti-Rechazo del negocio y del trámite
      const bizAlerts = biz.alertasAntiRechazo || [];
      tabContentHtml = `
        <div class="space-y-2">
          <span class="text-[11px] font-extrabold text-rose-900 flex items-center gap-1">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-rose-600"></i>
            <span>Etapa 3: Prevención de Rechazos (${biz.nombre})</span>
          </span>
          ${bizAlerts.length ? `
            <div class="p-2 rounded-xl bg-rose-100/70 border border-rose-200 text-[11px] text-rose-950 space-y-1">
              <p class="font-extrabold">Alerta específica para ${biz.nombre}:</p>
              ${bizAlerts.map(a => `<p>• ${a}</p>`).join('')}
            </div>
          ` : ''}
          <div class="space-y-2">
            ${(p.pasosConPrevencion || []).map(pp => `
              <div class="bg-white rounded-xl p-2.5 border border-slate-200 space-y-1.5">
                <div class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ${pp.orden}
                  </span>
                  <p class="text-[11px] font-bold text-slate-800 leading-snug">${pp.accion}</p>
                </div>
                <div class="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-950 flex items-start gap-1.5">
                  <i data-lucide="alert-octagon" class="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5"></i>
                  <span>${pp.alertaCritica}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="flex justify-end pt-1">
            <button type="button"
                    onclick="civikaApp.completeStageAndNext('${step.id}', 'antiRechazo', 'pilar4')"
                    class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer">
              <span>Continuar a Plan B</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    } else if (currentTab === "pilar4") {
      // ETAPA 4: Plan B Accionable
      tabContentHtml = `
        <div class="space-y-2">
          <span class="text-[11px] font-extrabold text-amber-950 flex items-center gap-1">
            <i data-lucide="life-buoy" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Etapa 4: Plan B Accionable (Contingencia real en Riobamba)</span>
          </span>
          <div class="space-y-2">
            ${(p.planBAccionable || []).map(pb => `
              <div class="bg-amber-50/80 rounded-xl p-2.5 border border-amber-200 space-y-1">
                <p class="text-[11px] font-extrabold text-amber-950 flex items-start gap-1.5">
                  <i data-lucide="help-circle" class="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5"></i>
                  <span>${pb.escenario}</span>
                </p>
                <p class="text-[11px] text-amber-900 pl-5 leading-relaxed">
                  <strong>Solución inmediata:</strong> ${pb.solucion}
                </p>
              </div>
            `).join('')}
          </div>
          <div class="flex justify-end pt-1">
            <button type="button"
                    onclick="civikaApp.completeStageAndNext('${step.id}', 'planB', null)"
                    class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>${stageState.planB ? 'Etapas revisadas ✓' : 'Finalizar 4 etapas'}</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div id="pillars-${step.id}" class="mt-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2.5 space-y-2.5 scroll-mt-24">
        <!-- Pestañas de las 4 Etapas -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-extrabold">
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar1')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                    currentTab === 'pilar1' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="${stageState.diagnostico ? 'check-circle-2' : 'compass'}" class="w-3 h-3"></i>
            <span>1. Diagnóstico</span>
          </button>
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar2')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                    currentTab === 'pilar2' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="${stageState.checklist ? 'check-circle-2' : 'check-square'}" class="w-3 h-3"></i>
            <span>2. Checklist (${doneChecks}/${totalChecks})</span>
          </button>
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar3')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                    currentTab === 'pilar3' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="${stageState.antiRechazo ? 'check-circle-2' : 'shield-alert'}" class="w-3 h-3"></i>
            <span>3. Anti-Rechazo</span>
          </button>
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar4')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                    currentTab === 'pilar4' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="${stageState.planB ? 'check-circle-2' : 'life-buoy'}" class="w-3 h-3"></i>
            <span>4. Plan B</span>
          </button>
        </div>

        <!-- Contenido activo del Pilar -->
        <div>${tabContentHtml}</div>
      </div>
    `;
  }

  renderUnifiedFormsAndProcedures() {
    const container = document.getElementById("unifiedStepsContainer");
    if (!container) return;

    const pasos = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales;

    container.innerHTML = pasos.map((step) => {
      const isDone = this.stepsState[step.id] || false;
      const isFirst = step.paso === 1;
      const isFinal = step.esPasoFinal;

      return `
        <div id="step-card-${step.id}" class="relative bg-white rounded-2xl p-4 border transition-all ${
          isDone
            ? 'border-emerald-400 bg-emerald-50/10 shadow-xs'
            : 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300'
        }">
          <!-- Encabezado del Paso + Botón Escuchar Guía (TTS) + Checkbox -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                isDone
                  ? 'bg-emerald-600 text-white'
                  : isFirst
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : isFinal
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                      : 'bg-slate-800 text-white'
              }">
                ${isDone ? '✓' : `0${step.paso}`}
              </div>

              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isFirst
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : isFinal
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }">
                    ${isDone ? '✓ Listo en tu Carpeta' : step.etiquetaOrden || `PASO 0${step.paso} DE 6`}
                  </span>
                </div>

                <h3 class="font-extrabold text-slate-900 text-sm mt-1 leading-snug">
                  ${step.nombre}
                </h3>
                <span class="text-[10px] font-semibold text-slate-500 block mt-0.5">
                  ${step.entidad}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Botón Text-to-Speech (Escuchar Guía) -->
              <button type="button"
                      onclick="civikaApp.speakStepGuide('${step.id}', this)" data-audio-title="Paso ${step.paso}: ${step.nombre}"
                      class="px-2 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1 transition"
                      title="Escuchar guía de este trámite por voz">
                <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Escuchar guía</span>
              </button>

              <!-- Botón Checkbox de Estado -->
              <button type="button"
                      onclick="civikaApp.toggleStepStatus('${step.id}')"
                      class="w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }"
                      title="${isDone ? 'Marcar como pendiente' : 'Marcar como completado'}">
                <i data-lucide="check" class="w-4 h-4 ${isDone ? 'opacity-100' : 'opacity-0'}"></i>
              </button>
            </div>
          </div>

          <!-- Resumen y Costo Verídico -->
          <div class="mt-2.5 text-xs space-y-2">
            <p class="text-slate-700 leading-relaxed">
              <strong class="text-slate-900">¿Qué debes hacer?</strong> ${step.queHacer}
            </p>

            <div class="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-950 space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-blue-950 flex items-center gap-1">
                  <i data-lucide="folder-check" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span>Entregable para tu Carpeta:</span>
                </span>
                <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ${step.tiempoEnLinea}
                </span>
              </div>
              <p class="text-blue-900 font-semibold leading-tight">${step.documentoParaCarpeta}</p>
              <p class="text-[10px] text-slate-600 pt-0.5"><strong>Costo oficial:</strong> ${step.costo}</p>
            </div>
          </div>

          <!-- LOS 4 PILARES INTERACTIVOS -->
          ${this.renderFourPillarsWidget(step)}

          <!-- CONEXIÓN ENTRE TRÁMITES (CONDICIONAL AL GIRO ACTUAL) -->
          ${(() => {
            const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId);
            const noAplica = biz?.pasosNoAplicanSinLocal || [];
            if (!isDone || !step.conexionSiguienteTramite) return "";
            const nextId = step.conexionSiguienteTramite.siguienteId;
            if (noAplica.includes(nextId)) {
              return `
                <div class="mt-3 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs space-y-1.5">
                  <p class="font-bold">Siguiente paso según tu giro sin local (${biz.nombre}):</p>
                  <p class="text-[11px]">Bomberos y Uso de Suelo no aplican sin local físico. Puedes continuar directamente al Certificado de No Adeudar y Patente Municipal.</p>
                  <button type="button"
                          onclick="document.getElementById('step-card-req_solvencia')?.scrollIntoView({behavior:'smooth', block:'center'})"
                          class="mt-1 inline-flex items-center gap-1 bg-sky-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg hover:bg-sky-800 transition cursor-pointer">
                    <span>Ir al Paso 04: Certificado de No Adeudar</span>
                    <i data-lucide="arrow-down-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              `;
            }
            if (noAplica.includes(step.id)) return "";
            return `
              <div class="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs shadow-sm animate-fade-in space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Siguiente paso recomendado
                  </span>
                </div>
                <p class="text-[11px] text-emerald-50 leading-relaxed">${step.conexionSiguienteTramite.mensajeEncadenado}</p>
                ${nextId !== "pasaporte_qr" ? `
                  <button type="button"
                          onclick="document.getElementById('step-card-${nextId}')?.scrollIntoView({behavior:'smooth', block:'center'})"
                          class="mt-1 inline-flex items-center gap-1 bg-white text-emerald-800 font-extrabold text-[11px] px-3 py-1 rounded-lg shadow-2xs hover:bg-emerald-50 transition cursor-pointer">
                    <span>Ir al Paso 0${step.conexionSiguienteTramite.siguientePasoNumero}: ${step.conexionSiguienteTramite.siguienteTitulo}</span>
                    <i data-lucide="arrow-down-right" class="w-3.5 h-3.5"></i>
                  </button>
                ` : `
                  <button type="button"
                          onclick="civikaApp.scrollToSection('govukPassportSection')"
                          class="mt-1 inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-extrabold text-[11px] px-3 py-1 rounded-lg shadow-2xs hover:bg-amber-300 transition cursor-pointer">
                    <span>Generar mi Pasaporte de Trámite con Código QR</span>
                    <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
                  </button>
                `}
              </div>
            `;
          })()}

          <!-- Botones de Acción del Servicio -->
          <div class="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            <button type="button"
                    onclick="civikaApp.openDocumentViewer('${step.id}', 'sheet')"
                    class="flex-1 min-w-[155px] py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>Ver Documento Oficial</span>
            </button>

            <button type="button"
                    onclick="civikaApp.openDocumentViewer('${step.id}', 'justification')"
                    class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer">
              <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Ficha Completa</span>
            </button>

            <button type="button"
                    onclick="civikaApp.downloadOrPrintDocument('${step.id}')"
                    class="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-200 cursor-pointer">
              <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>PDF</span>
            </button>

            <button type="button"
                    onclick="civikaApp.openPrepNoticeModal('${step.id}', 'portal')"
                    class="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs transition border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Abrir portal oficial de ${step.entidad}">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.civikaFeatures) window.civikaFeatures.afterStepsRender(container);
    this.renderPrevalidationCitizenBox();

    const compContainer = document.getElementById("complementaryRequirementsList");
    if (compContainer) {
      compContainer.innerHTML = CIVIKA_KNOWLEDGE_BASE.requisitosComplementarios.map(r => `
        <div class="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <i data-lucide="${r.icono}" class="w-3.5 h-3.5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-800 text-[11px]">${r.nombre}</h4>
              <p class="text-[10px] text-slate-500">${r.descripcion}</p>
            </div>
          </div>
          <span class="text-[10px] font-bold text-blue-700 shrink-0 pl-2">${r.costo}</span>
        </div>
      `).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==============================================================
  // 3. AUDITOR PRE-VENTANILLA DE DOCUMENTOS (100% LOCAL CLIENT-SIDE)
  // ==============================================================
  renderPreWindowAuditorSection() {
    const container = document.getElementById("preWindowAuditorSection");
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-sm space-y-3">
        <!-- Badge de Privacidad Garantizada Obligatorio -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-[11px] font-bold text-emerald-900 flex items-center gap-2">
          <i data-lucide="lock" class="w-4 h-4 text-emerald-600 shrink-0"></i>
          <span>Privacidad: tus archivos se revisan en tu navegador y nunca se suben a servidores</span>
        </div>

        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Simulador Client-Side • FileReader API
            </span>
            <h3 class="font-extrabold text-slate-900 text-sm mt-1">
              Auditor Pre-Ventanilla de Documentos (Semáforo Local)
            </h3>
            <p class="text-xs text-slate-600 mt-0.5">
              Sube tu archivo (imagen o PDF de RUC, planilla de servicio básico EERSA/EMAPAR o predial) o prueba los simuladores para detectar motivos de rechazo antes de ir al Municipio:
            </p>
          </div>
        </div>

        <!-- Selector de Tipo de Documento + Input File Local -->
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2.5 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="font-bold text-slate-700 text-[11px] block mb-1">1. ¿Qué documento vas a auditar?</label>
              <select id="auditorDocTypeSelect" class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800">
                <option value="planilla_luz">Planilla de Servicio Básico (Luz EERSA / Agua - Últimos 3 meses)</option>
                <option value="certificado_ruc">Certificado de RUC / RIMPE (SRI)</option>
                <option value="impuesto_predial">Comprobante de Impuesto Predial / Clave Catastral</option>
                <option value="permiso_bomberos">Permiso Anual del Cuerpo de Bomberos Riobamba</option>
              </select>
            </div>
            <div>
              <label class="font-bold text-slate-700 text-[11px] block mb-1">2. Antigüedad declarada en el documento:</label>
              <select id="auditorDocAgeSelect" class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800">
                <option value="vigente_1mes">Emitido hace menos de 3 meses (Vigente)</option>
                <option value="revisar_direccion">Vigente pero la planilla está a nombre del arrendador</option>
                <option value="vencido_4meses">Planilla mayor a 3 meses (> 90 días) o borrosa</option>
              </select>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 pt-1">
            <label class="flex-1 min-w-[180px] cursor-pointer py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition">
              <i data-lucide="upload-cloud" class="w-4 h-4"></i>
              <span>Subir Imagen o PDF para Auditar (Local)</span>
              <input type="file" id="auditorFileInput" accept=".pdf,image/*" class="hidden">
            </label>

            <!-- Botones rápidos de simulación de los 3 estados del semáforo para el Jurado -->
            <button type="button" onclick="civikaApp.runSimulatedAudit('verde')"
                    class="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold transition">
              🟢 Simular Verde
            </button>
            <button type="button" onclick="civikaApp.runSimulatedAudit('amarillo')"
                    class="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold transition">
              🟡 Simular Amarillo
            </button>
            <button type="button" onclick="civikaApp.runSimulatedAudit('rojo')"
                    class="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-[11px] font-bold transition">
              🔴 Simular Rojo
            </button>
          </div>
        </div>

        <!-- Resultado del Semáforo de Validación -->
        <div id="auditorTrafficLightResult" class="space-y-2">
          ${this.renderAuditedResultsHtml()}
        </div>
      </div>
    `;

    const fileInput = document.getElementById("auditorFileInput");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          this.processLocalFileAudit(file);
        }
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  processLocalFileAudit(file) {
    const docTypeEl = document.getElementById("auditorDocTypeSelect");
    const docAgeEl = document.getElementById("auditorDocAgeSelect");
    const docType = docTypeEl ? docTypeEl.value : "planilla_luz";
    const docAge = docAgeEl ? docAgeEl.value : "vigente_1mes";

    const esc = (v) => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const safeName = esc(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const isImage = file.type.startsWith("image/");
      const sizeKB = Math.round(file.size / 1024);

      let status = "verde";
      let title = "🟢 SEMÁFORO VERDE: Documento Legible y Vigente para Ventanilla";
      let detail = `Archivo "${safeName}" (${sizeKB} KB) revisado en tu navegador (validación preliminar según tamaño, tipo y antigüedad que declaraste). Confirma a simple vista que sea legible y tenga menos de 90 días.`;
      let solution = "Listo para imprimir o anexar en tu carpeta manila del GAD Riobamba.";

      if (sizeKB < 8 || docAge === "vencido_4meses" || file.name.toLowerCase().includes("vencid") || file.name.toLowerCase().includes("borros")) {
        status = "rojo";
        title = "🔴 SEMÁFORO ROJO: Planilla Mayor a 3 Meses o Archivo Ilegible (Riesgo de Rechazo)";
        detail = `El documento "${safeName}" (${sizeKB} KB) presenta antigüedad superior a 90 días o baja resolución.`;
        solution = "SOLUCIÓN INMEDIATA: Descarga sin costo la última planilla electrónica en el portal de la Empresa Eléctrica Riobamba S.A. (EERSA) o EP-EMAPAR de los últimos 3 meses antes de ir al SRI o al Municipio.";
      } else if (docAge === "revisar_direccion" || docType === "planilla_luz") {
        status = "amarillo";
        title = "🟡 SEMÁFORO AMARILLO: Revisar Coincidencia Exacta de Dirección entre RUC y Planilla";
        detail = `Archivo "${safeName}" (${sizeKB} KB) legible. Advertencia preventiva: verifica que la calle principal, numeración e intersección de la planilla coincidan letra por letra con el establecimiento N° 001 de tu RUC y con el contrato de arriendo.`;
        solution = "PLAN B ACCIONABLE: Si la planilla está a nombre del dueño del local (arrendador), adjunta tu contrato de arrendamiento simple y copia de cédula del propietario.";
      }

      this.auditedDocuments.unshift({
        id: `AUD-${Date.now()}`,
        fileName: safeName,
        sizeKB,
        status,
        title,
        detail,
        solution,
        previewUrl: isImage ? dataUrl : null,
        timestamp: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
      });

      this.auditedDocuments = this.auditedDocuments.slice(0, 3);
      const resContainer = document.getElementById("auditorTrafficLightResult");
      if (resContainer) {
        resContainer.innerHTML = this.renderAuditedResultsHtml();
      }
      if (window.lucide) window.lucide.createIcons();
    };

    reader.readAsDataURL(file);
  }

  runSimulatedAudit(color) {
    const presets = {
      verde: {
        fileName: "Certificado_RUC_QR_Riobamba_Activo.pdf",
        sizeKB: 184,
        status: "verde",
        title: "🟢 SEMÁFORO VERDE: Documento Legible, Vigente y con QR Verificable",
        detail: "El Certificado de RUC se encuentra en estado ACTIVO, registra actividad CIIU coherente y domicilio en el cantón Riobamba.",
        solution: "Aprobado por el Auditor Local: archívalo en el Folio 02 de tu carpeta municipal."
      },
      amarillo: {
        fileName: "Planilla_EERSA_Local_Arrendado_Riobamba.pdf",
        sizeKB: 142,
        status: "amarillo",
        title: "🟡 SEMÁFORO AMARILLO: Revisar Coincidencia de Dirección entre RUC, Planilla y Uso de Suelo",
        detail: "La planilla de luz EERSA es vigente (< 3 meses), pero figura a nombre del propietario del inmueble y usa nomenclatura abreviada.",
        solution: "SOLUCIÓN PREVENTIVA: Asegúrate de que la calle y número del RUC sean idénticos a la planilla y anexa el contrato de arrendamiento en el Folio 06."
      },
      rojo: {
        fileName: "Planilla_Servicio_Basico_Hace_5_Meses.jpg",
        sizeKB: 45,
        status: "rojo",
        title: "🔴 SEMÁFORO ROJO: Planilla Mayor a 3 Meses o Ilegible (Rebota en Ventanilla)",
        detail: "Alerta Crítica: El SRI y el GAD Municipal de Riobamba rechazan planillas de servicios básicos con más de 90 días de antigüedad.",
        solution: "SOLUCIÓN INMEDIATA: Descarga el duplicado digital del último mes desde el portal de EERSA (www.eersa.com.ec) o EP-EMAPAR con el código de suministro antes de acudir a ventanilla."
      }
    };

    const chosen = presets[color] || presets.verde;
    this.auditedDocuments = [
      {
        id: `SIM-${Date.now()}`,
        ...chosen,
        previewUrl: null,
        timestamp: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
      }
    ];

    const resContainer = document.getElementById("auditorTrafficLightResult");
    if (resContainer) {
      resContainer.innerHTML = this.renderAuditedResultsHtml();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  renderAuditedResultsHtml() {
    if (!this.auditedDocuments || this.auditedDocuments.length === 0) {
      return `
        <div class="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-[11px] text-slate-500 text-center">
          Aún no has auditado ningún documento en esta sesión. Sube un archivo PDF/imagen o pulsa uno de los botones del Semáforo (🟢 / 🟡 / 🔴) para probar.
        </div>
      `;
    }

    return this.auditedDocuments.map(doc => {
      const cls = doc.status === "verde"
        ? "traffic-light-green border-emerald-300 text-emerald-950"
        : doc.status === "amarillo"
          ? "traffic-light-yellow border-amber-300 text-amber-950"
          : "traffic-light-red border-rose-300 text-rose-950";

      return `
        <div class="p-3.5 rounded-xl border ${cls} text-xs space-y-1.5 animate-fade-in">
          <div class="flex items-center justify-between gap-2">
            <span class="font-extrabold text-xs">${doc.title}</span>
            <span class="text-[10px] font-mono opacity-75">${doc.fileName} (${doc.sizeKB} KB)</span>
          </div>
          <p class="text-[11px] leading-relaxed">${doc.detail}</p>
          <div class="pt-1.5 border-t border-black/10 text-[11px] font-bold flex items-start gap-1.5">
            <i data-lucide="wrench" class="w-3.5 h-3.5 shrink-0 mt-0.5"></i>
            <span>${doc.solution}</span>
          </div>
          ${doc.previewUrl ? `
            <div class="pt-1">
              <img src="${doc.previewUrl}" alt="Vista previa local" class="max-h-24 rounded-lg border border-slate-300 object-contain">
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // ==============================================================
  // 4. ALGORITMO OFICIAL DE VALIDACIÓN DE CÉDULA Y RUC DE ECUADOR (MÓDULO 10 Y MÓDULO 11 EN JS PURO)
  // ==============================================================
  validateEcuadorianIdOrRuc(rawInput) {
    const id = String(rawInput || "").replace(/\D/g, "");

    if (id.length !== 10 && id.length !== 13) {
      return {
        valido: false,
        tipo: "Longitud inválida",
        mensaje: "Debe contener exactamente 10 dígitos (Cédula) o 13 dígitos (RUC)."
      };
    }

    const provincia = parseInt(id.substring(0, 2), 10);
    if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
      return {
        valido: false,
        tipo: "Código provincial inválido",
        mensaje: `Los dos primeros dígitos (${id.substring(0, 2)}) no corresponden a una provincia válida del Ecuador (06 = Chimborazo).`
      };
    }

    const tercerDigito = parseInt(id[2], 10);

    // CASO 1: Persona Natural (Tercer dígito 0..5) -> Algoritmo Oficial Módulo 10
    if (tercerDigito >= 0 && tercerDigito <= 5) {
      const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) {
        let prod = parseInt(id[i], 10) * coef[i];
        if (prod >= 10) prod -= 9;
        suma += prod;
      }
      const digitoVerificadorEsperado = (10 - (suma % 10)) % 10;
      const digitoReal = parseInt(id[9], 10);

      if (digitoVerificadorEsperado !== digitoReal) {
        return {
          valido: false,
          tipo: "Fallo Módulo 10",
          mensaje: `El dígito verificador (${digitoReal}) no cumple el algoritmo matemático Módulo 10 del Registro Civil/SRI.`
        };
      }

      if (id.length === 13) {
        const establecimiento = parseInt(id.substring(10, 13), 10);
        if (establecimiento < 1) {
          return {
            valido: false,
            tipo: "Establecimiento RUC inválido",
            mensaje: "Los últimos 3 dígitos del RUC deben ser 001 o superior."
          };
        }
        return {
          valido: true,
          tipo: "RUC Persona Natural (Módulo 10 Verificado)",
          mensaje: `✓ RUC Persona Natural válido (Provincia ${id.substring(0, 2) === '06' ? '06 Chimborazo' : id.substring(0, 2)}, Establecimiento ${id.substring(10, 13)}).`
        };
      }

      return {
        valido: true,
        tipo: "Cédula de Identidad (Módulo 10 Verificado)",
        mensaje: `✓ Cédula ecuatoriana matemáticamente válida (Provincia ${id.substring(0, 2) === '06' ? '06 Chimborazo' : id.substring(0, 2)}).`
      };
    }

    // CASO 2: Entidad Pública (Tercer dígito == 6) -> Algoritmo Oficial Módulo 11 (9no dígito verificador)
    if (tercerDigito === 6 && id.length === 13) {
      const coefPub = [3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 8; i++) {
        suma += parseInt(id[i], 10) * coefPub[i];
      }
      const residuo = suma % 11;
      const verificador = residuo === 0 ? 0 : 11 - residuo;
      const digitoReal = parseInt(id[8], 10);
      const estab = parseInt(id.substring(9, 13), 10);

      if (verificador === digitoReal && estab >= 1) {
        return {
          valido: true,
          tipo: "RUC Entidad Pública (Módulo 11 Verificado)",
          mensaje: "✓ RUC de institución pública verificado con Módulo 11."
        };
      }
      return {
        valido: false,
        tipo: "Fallo Módulo 11 Público",
        mensaje: "El dígito verificador de sociedad pública no coincide con el Módulo 11."
      };
    }

    // CASO 3: Sociedad Privada (Tercer dígito == 9) -> Algoritmo Oficial Módulo 11 (10mo dígito verificador)
    if (tercerDigito === 9 && id.length === 13) {
      const coefPriv = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) {
        suma += parseInt(id[i], 10) * coefPriv[i];
      }
      const residuo = suma % 11;
      const verificador = residuo === 0 ? 0 : 11 - residuo;
      const digitoReal = parseInt(id[9], 10);
      const estab = parseInt(id.substring(10, 13), 10);

      if (verificador === digitoReal && estab >= 1) {
        return {
          valido: true,
          tipo: "RUC Sociedad Privada (Módulo 11 Verificado)",
          mensaje: "✓ RUC Jurídico / Sociedad Privada verificado con Módulo 11."
        };
      }
      return {
        valido: false,
        tipo: "Fallo Módulo 11 Privado",
        mensaje: "El dígito verificador de sociedad privada no cumple el algoritmo Módulo 11."
      };
    }

    return {
      valido: false,
      tipo: "Tercer dígito no reconocido",
      mensaje: "El tercer dígito no corresponde a Persona Natural (0-5), Entidad Pública (6) ni Sociedad (9)."
    };
  }

  // ==============================================================
  // 5. FORMULARIO BORRADOR NO SENSIBLE ESTILO GOV.UK + PASAPORTE QR
  // ==============================================================
  setGovukWizardStep(stepNum) {
    this.govukWizardStep = stepNum;
    this.renderGovukPassportWizardSection();
    if (stepNum === 4) {
      setTimeout(() => this.generatePassportQRCode(), 80);
    }
  }

  handleIdValidationInput(val) {
    const clean = String(val || "").replace(/\D/g, "").slice(0, 13);
    this.draftForm.identificacionInput = clean;
    const res = this.validateEcuadorianIdOrRuc(clean);
    this.draftForm.esIdentificacionValida = res.valido;
    this.draftForm.tipoIdentificacion = res.tipo;
    this.draftForm.detalleValidacionId = res.mensaje;

    // Enmascarar para no guardar el documento completo en texto plano (Cero Datos Sensibles)
    if (clean.length >= 10) {
      this.draftForm.identificacionMascarada = `${clean.substring(0, 2)}****${clean.substring(clean.length - 4)}`;
    } else {
      this.draftForm.identificacionMascarada = "";
    }

    const feedbackEl = document.getElementById("govukIdValidationFeedback");
    if (feedbackEl) {
      if (!clean) {
        feedbackEl.innerHTML = `<span class="text-slate-500">Ingresa una cédula (10 dígitos) o RUC (13 dígitos) para comprobar el Módulo 10/11 en tiempo real.</span>`;
      } else if (res.valido) {
        feedbackEl.innerHTML = `
          <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold flex items-start gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
            <div>
              <span class="block">${res.tipo}</span>
              <span class="text-[11px] font-medium text-emerald-800">${res.mensaje} (Sólo se conserva máscara ${this.draftForm.identificacionMascarada} en sesión local).</span>
            </div>
          </div>
        `;
      } else {
        feedbackEl.innerHTML = `
          <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 font-bold flex items-start gap-2">
            <i data-lucide="x-circle" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i>
            <div>
              <span class="block">${res.tipo}</span>
              <span class="text-[11px] font-medium text-rose-800">${res.mensaje}</span>
            </div>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  fillSampleValidRuc(sampleRuc = "0603849209001") {
    const input = document.getElementById("govukIdInput");
    if (input) {
      input.value = sampleRuc;
    }
    this.handleIdValidationInput(sampleRuc);
  }

  renderGovukPassportWizardSection() {
    const container = document.getElementById("govukPassportSection");
    if (!container) return;

    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === (this.draftForm.actividadId || this.selectedBusinessId))
      || CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes[0];
    const parroquias = CIVIKA_KNOWLEDGE_BASE.parroquiasRiobamba || [];

    const keys = Object.keys(this.stepsState);
    const completedCount = keys.filter(k => this.stepsState[k]).length;
    const percent = Math.round((completedCount / (keys.length || 1)) * 100);

    let stepBodyHtml = "";

    if (this.govukWizardStep === 1) {
      // PASO 1 GOV.UK: Actividad y Nombre Comercial Público
      stepBodyHtml = `
        <div class="space-y-3 animate-fade-in">
          <div class="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            Paso 1 de 4 • Una cosa a la vez (Estándar GOV.UK)
          </div>
          <h4 class="font-extrabold text-slate-900 text-sm">
            ¿Cuál es el nombre comercial y giro de tu emprendimiento en Riobamba?
          </h4>
          <div>
            <label class="text-xs font-bold text-slate-700 block mb-1">Nombre Comercial Público (Letrero / RUC):</label>
            <input type="text" id="govukBizNameInput"
                   value="${this.draftForm.nombreComercial}"
                   oninput="civikaApp.draftForm.nombreComercial = this.value; civikaApp.saveStateToStorage();"
                   placeholder="Ej: Cafetería El Chimborazo / Boutique Riobamba"
                   class="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none">
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 block mb-1">Giro de Actividad Económica (CIIU):</label>
            <select onchange="civikaApp.selectBusiness(this.value)"
                    class="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none">
              ${CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.map(b => `
                <option value="${b.id}" ${b.id === this.selectedBusinessId ? 'selected' : ''}>
                  ${b.nombre} (${b.ciiuReferencia ? b.ciiuReferencia.split(' ')[0] : b.categoria})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="pt-2 flex justify-end">
            <button type="button" onclick="civikaApp.setGovukWizardStep(2)"
                    class="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition">
              <span>Continuar al Paso 2 (Ubicación)</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    } else if (this.govukWizardStep === 2) {
      // PASO 2 GOV.UK: Parroquia de Riobamba y Tenencia del Local
      stepBodyHtml = `
        <div class="space-y-3 animate-fade-in">
          <div class="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            Paso 2 de 4 • Ubicación Territorial en Riobamba
          </div>
          <h4 class="font-extrabold text-slate-900 text-sm">
            ¿En qué parroquia de Riobamba está tu local y cuál es su tenencia?
          </h4>
          <div>
            <label class="text-xs font-bold text-slate-700 block mb-1">Parroquia del Cantón Riobamba:</label>
            <select onchange="civikaApp.draftForm.parroquia = this.value; civikaApp.userProfile.parroquiaRiobamba = this.value; civikaApp.saveStateToStorage();"
                    class="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none">
              ${parroquias.map(p => `
                <option value="${p.id}" ${p.id === this.draftForm.parroquia ? 'selected' : ''}>
                  ${p.nombre}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-bold text-slate-700 block mb-1">Tenencia del Local:</label>
              <select onchange="civikaApp.draftForm.tenenciaLocal = this.value; civikaApp.saveStateToStorage();"
                      class="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900">
                <option value="arrendado" ${this.draftForm.tenenciaLocal === 'arrendado' ? 'selected' : ''}>Local Arrendado (Con Contrato)</option>
                <option value="propio" ${this.draftForm.tenenciaLocal === 'propio' ? 'selected' : ''}>Local Propio (Con Predial)</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700 block mb-1">Área estimada (m²):</label>
              <input type="number" min="5" max="2000" value="${this.draftForm.areaMetros}"
                     oninput="civikaApp.draftForm.areaMetros = this.value; civikaApp.saveStateToStorage();"
                     class="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900">
            </div>
          </div>
          <div class="pt-2 flex items-center justify-between">
            <button type="button" onclick="civikaApp.setGovukWizardStep(1)"
                    class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition">
              ← Atrás
            </button>
            <button type="button" onclick="civikaApp.setGovukWizardStep(3)"
                    class="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition">
              <span>Continuar al Paso 3 (Validador Módulo 10/11)</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    } else if (this.govukWizardStep === 3) {
      // PASO 3 GOV.UK: Verificador Matemático Oficial Módulo 10 / 11 de Ecuador (Sin guardar datos sensibles)
      stepBodyHtml = `
        <div class="space-y-3 animate-fade-in">
          <div class="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
            Paso 3 de 4 • Verificador Matemático Módulo 10 / Módulo 11 (Sin Guardar Datos)
          </div>
          <h4 class="font-extrabold text-slate-900 text-sm">
            Verifica que tu Cédula o RUC no tenga errores tipográficos antes de generar el Pasaporte QR
          </h4>
          <p class="text-[11px] text-slate-600">
            🔒 <strong>Cero Datos Sensibles:</strong> El algoritmo matemático oficial de Ecuador valida el dígito verificador en memoria RAM sin almacenar tu número completo ni pedir claves del SRI.
          </p>

          <div class="flex flex-wrap gap-2">
            <input type="text" id="govukIdInput"
                   maxlength="13"
                   value="${this.draftForm.identificacionInput}"
                   oninput="civikaApp.handleIdValidationInput(this.value)"
                   placeholder="Ingresa Cédula (10 dígitos) o RUC (13 dígitos)..."
                   class="flex-1 min-w-[200px] bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none">
            <button type="button" onclick="civikaApp.fillSampleValidRuc('0603849209001')"
                    class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-[11px] font-bold transition">
              Probar RUC Válido Chimborazo (06)
            </button>
          </div>

          <div id="govukIdValidationFeedback" class="text-xs">
            <span class="text-slate-500">Ingresa una cédula o RUC o haz clic en "Probar RUC Válido Chimborazo" para validar.</span>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <button type="button" onclick="civikaApp.setGovukWizardStep(2)"
                    class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition">
              ← Atrás
            </button>
            <button type="button" onclick="civikaApp.setGovukWizardStep(4)"
                    class="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition">
              <i data-lucide="qr-code" class="w-4 h-4"></i>
              <span>Generar Pasaporte de Trámite QR</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // PASO 4 GOV.UK: Tarjeta "Pasaporte de Trámite" con Código QR (qrcodejs)
      const passportId = `CIV-RIO-2026-${this.selectedBusinessId.slice(0, 3).toUpperCase()}-${completedCount}6`;
      const maskDisplay = this.draftForm.identificacionMascarada || "Pendiente de validar";

      const regime = this.getPassportRegimeLabel(biz);
      const idValid = this.draftForm.esIdentificacionValida;

      stepBodyHtml = `
        <div class="space-y-3 animate-fade-in">
          <div id="passportPrintCard" class="passport-card space-y-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pasaporte Ciudadano · GAD Riobamba</p>
              <h4 class="text-lg font-semibold leading-snug mt-1 break-words">${this.draftForm.nombreComercial || biz.nombre}</h4>
              <span class="inline-block mt-2 text-[11px] font-mono text-slate-300 border border-white/15 rounded-md px-2 py-0.5">${passportId}</span>
            </div>

            <div class="bg-white rounded-lg p-3 w-fit mx-auto text-center">
              <div id="passportQrCanvas" class="w-[172px] h-[172px] flex items-center justify-center"></div>
              <p class="text-[10px] font-semibold tracking-wider text-slate-500 mt-1.5 uppercase">Escanear en ventanilla</p>
            </div>

            <dl>
              <div class="passport-row"><dt>Giro</dt><dd>${biz.nombre}</dd></div>
              <div class="passport-row"><dt>Parroquia y local</dt><dd>${this.draftForm.parroquia} · ${this.draftForm.tenenciaLocal}, ${this.draftForm.areaMetros} m²</dd></div>
              <div class="passport-row"><dt>Cédula / RUC</dt><dd><span class="passport-tag ${idValid ? 'passport-tag-ok' : 'passport-tag-warn'}">${idValid ? '✓ ' + maskDisplay : 'Pendiente de validar'}</span></dd></div>
              <div class="passport-row"><dt>Régimen y ARCSA</dt><dd><span class="passport-tag passport-tag-info">${regime}</span></dd></div>
              <div class="passport-row"><dt>Carpeta</dt><dd><span class="passport-tag ${percent === 100 ? 'passport-tag-ok' : 'passport-tag-warn'}">${completedCount} de ${keys.length} pasos · ${percent}%</span></dd></div>
            </dl>

            <p class="text-xs text-slate-400 leading-relaxed">Preséntalo en el Balcón de Servicios (5 de Junio y Veloz). No contiene datos sensibles.</p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onclick="civikaApp.setGovukWizardStep(1)" class="btn-ghost btn-sm">Editar datos</button>
            <div class="flex flex-wrap gap-2">
              <button type="button" onclick="civikaApp.printPassportCard()" class="btn-secondary btn-sm">
                <i data-lucide="printer" class="w-4 h-4"></i><span>Imprimir</span>
              </button>
              <button type="button" onclick="window.civikaPDF && civikaPDF.passport()" class="btn-primary btn-sm">
                <i data-lucide="file-down" class="w-4 h-4"></i><span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="card card-pad space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="eyebrow">Paso ${this.govukWizardStep} de 4</p>
            <p class="text-sm text-slate-500 mt-0.5">Datos no sensibles · validación Módulo 10/11</p>
          </div>
          <!-- Indicador de pasos 1..4 -->
          <div class="flex items-center gap-1">
            ${[1, 2, 3, 4].map(n => `
              <button type="button" onclick="civikaApp.setGovukWizardStep(${n})"
                      aria-label="Ir al paso ${n}"
                      class="w-8 h-8 rounded-md text-xs font-semibold transition ${
                        this.govukWizardStep === n
                          ? 'bg-navy text-white'
                          : this.govukWizardStep > n ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }">
                ${n}
              </button>
            `).join('')}
          </div>
        </div>

        ${stepBodyHtml}
      </div>
    `;

    if (this.govukWizardStep === 3 && this.draftForm.identificacionInput) {
      this.handleIdValidationInput(this.draftForm.identificacionInput);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async generatePassportQRCode() {
    const qrContainer = document.getElementById("passportQrCanvas");
    if (!qrContainer) return;
    qrContainer.innerHTML = "";

    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId)
      || CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes[0];
    const keys = Object.keys(this.stepsState);
    const completedCount = keys.filter(k => this.stepsState[k]).length;
    const percent = Math.round((completedCount / (keys.length || 1)) * 100);

    // Formato compacto legible por el Modo Ventanilla (features.js): CIVIKA1|id|giro|nombre|parroquia|cédula|pasos|fecha|tenencia|m2
    const qrPayload = window.civikaFeatures
      ? window.civikaFeatures.buildPassportPayload()
      : JSON.stringify({ app: "CIVIKA-RIOBAMBA", giro: biz.id, carpeta: `${completedCount}/${keys.length}(${percent}%)` });

    if (typeof window.QRCode === "function") {
      new window.QRCode(qrContainer, {
        text: qrPayload,
        width: 168,
        height: 168,
        colorDark: "#0F172A",
        colorLight: "#FFFFFF",
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } else {
      // Fallback SVG QR en caso extremo
      qrContainer.innerHTML = `<div class="text-[10px] font-mono text-slate-800 text-center p-2 border border-slate-300 rounded">QR VERIFICADO<br/>${biz.id.toUpperCase()}</div>`;
    }

    // Guardar en historial local privado de db.js
    if (window.civikaDB) {
      await window.civikaDB.savePassportQR({
        nombreComercial: this.draftForm.nombreComercial || biz.nombre,
        actividadNombre: biz.nombre,
        parroquia: this.draftForm.parroquia,
        tenenciaLocal: this.draftForm.tenenciaLocal,
        identificacionValidada: this.draftForm.identificacionMascarada || "Módulo 10/11 OK",
        progresoCarpeta: percent,
        pasosCompletados: completedCount,
        totalPasos: keys.length,
        qrPayload
      });
    }
  }

  // Muestra el Pasaporte con su QR al instante (con los datos actuales; se pueden editar después)
  openPassport() {
    this.goToScreen("screen-unified-forms");
    this.govukWizardStep = 4;
    this.renderGovukPassportWizardSection();
    setTimeout(() => this.generatePassportQRCode(), 60);
    setTimeout(() => {
      const el = document.getElementById("govukPassportSection");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  }

  // Etiqueta "Régimen y ARCSA" coherente con el giro (definida en knowledge_base.js)
  getPassportRegimeLabel(biz) {
    if (biz && biz.etiquetaPasaporte) return biz.etiquetaPasaporte;
    if (biz && biz.id === "profesional") return "Régimen General · Sin permiso ARCSA";
    return "RIMPE · Verificar ARCSA según giro";
  }

  printPassportCard() {
    document.body.classList.add("print-passport");
    const cleanup = () => {
      document.body.classList.remove("print-passport");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  }

  // ==============================================================
  // 6. MODAL DE MÉTRICAS CIUDADANAS Y ESTADO DE SERVICIOS EN VIVO (db.js)
  // ==============================================================
  async openLiveMetricsModal() {
    const modal = document.getElementById("liveMetricsModal");
    const content = document.getElementById("liveMetricsModalBody");
    if (!modal || !content) return;

    const metrics = window.civikaDB
      ? await window.civikaDB.getLiveMetricsAndStatus()
      : null;

    if (!metrics) return;

    content.innerHTML = `
      <div class="space-y-4 text-xs">
        <!-- KPIs de Impacto para el GAD Riobamba y el SRI -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
            <span class="text-[10px] font-bold text-blue-700 block">Consultas Anónimas</span>
            <span class="text-base font-black text-blue-950">${metrics.totalConsultasAnonimas}</span>
          </div>
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            <span class="text-[10px] font-bold text-emerald-700 block">Pasaportes QR Emitidos</span>
            <span class="text-base font-black text-emerald-950">${metrics.pasaportesEmitidosHoy}</span>
          </div>
          <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
            <span class="text-[10px] font-bold text-indigo-700 block">Éxito en Ventanilla</span>
            <span class="text-base font-black text-indigo-950">${metrics.tasaExitoVentanilla}</span>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            <span class="text-[10px] font-bold text-amber-800 block">Ahorro Ciudadano</span>
            <span class="text-base font-black text-amber-950">${metrics.ahorroEstimadoCiudadaniaUSD}</span>
          </div>
        </div>

        <!-- Estado de Portales Institucionales en Vivo -->
        <div>
          <h4 class="font-extrabold text-slate-900 text-xs mb-2 flex items-center justify-between">
            <span>📡 Estado de Servicios Institucionales (simulado)</span>
            <span class="text-[10px] text-slate-500 font-normal">Actualizado: ${metrics.ultimaActualizacion}</span>
          </h4>
          <div class="space-y-2">
            ${metrics.estadoPortales.map(p => {
              const isOk = p.estado === "operativo";
              return `
                <div class="p-2.5 rounded-xl border ${isOk ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/80 border-amber-300'} flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}"></span>
                      <span class="font-extrabold text-slate-900 text-xs">${p.entidad}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 mt-0.5">${p.mensaje}</p>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-950'}">
                    ${p.etiqueta}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Demanda Anónima por Parroquia de Riobamba -->
        <div>
          <h4 class="font-extrabold text-slate-900 text-xs mb-2">
            🗺️ Demanda de Formalización por Parroquia en Riobamba (Telemetría Anónima)
          </h4>
          <div class="space-y-1.5">
            ${metrics.demandaPorParroquia.map(d => `
              <div class="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div class="flex justify-between text-[11px] font-bold text-slate-800 mb-1">
                  <span>${d.parroquia}</span>
                  <span>${d.consultas} trámites (${d.porcentaje}%)</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${d.porcentaje}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cuellos de Botella Ciudadanos Detectados para el GAD Riobamba y el SRI -->
        <div>
          <h4 class="font-extrabold text-slate-900 text-xs mb-2">
            🔍 Cuellos de Botella Detectados y Resueltos por Cívika
          </h4>
          <div class="space-y-1.5">
            ${metrics.cuellosDeBotellaDetectados.map(c => `
              <div class="p-2.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-2">
                <div>
                  <span class="font-bold text-slate-800 block">${c.problema}</span>
                  <span class="text-[11px] text-emerald-700 font-semibold">✓ ${c.solucionCivika}</span>
                </div>
                <span class="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                  ${c.frecuencia}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  closeLiveMetricsModal() {
    const modal = document.getElementById("liveMetricsModal");
    if (modal) modal.classList.add("hidden");
  }

  // ==============================================================
  // 7. WIDGET COMPARATIVO DE TIEMPOS, DESCARGAS Y GUÍA DE CARPETA
  // ==============================================================
  renderTimeComparisonWidget() {
    const container = document.getElementById("timeComparisonWidget");
    if (!container) return;

    const m = CIVIKA_KNOWLEDGE_BASE.metricasTiempo;

    container.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden border border-slate-800">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="time-comparison-badge text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <i data-lucide="zap" class="w-3 h-3 text-emerald-400"></i>
            <span>${m.porcentajeAhorro}% DE AHORRO DE TIEMPO CON CÍVIKA</span>
          </span>
          <span class="text-[10px] text-blue-200/80 font-semibold">${m.ahorroHoras}</span>
        </div>

        <h3 class="font-extrabold text-sm sm:text-base text-white leading-tight">
          Comparativa: Burocracia Presencial vs. Ruta Guiada Cívika
        </h3>

        <div class="mt-3 space-y-2.5 text-xs">
          <div class="bg-white/5 rounded-xl p-3 border border-white/10">
            <div class="flex justify-between items-center text-[11px] mb-1">
              <span class="text-rose-300 font-semibold">Trámite Presencial Sin Guía</span>
              <span class="font-extrabold text-rose-300">${m.presencial.tiempoPromedio}</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-1.5">
              <div class="bg-rose-500 h-2 rounded-full" style="width: 100%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-300">
              <span>${m.presencial.ventanillasVisitadas}</span>
              <span class="text-rose-300 font-bold">${m.presencial.tasaRechazoCarpetas}</span>
            </div>
          </div>

          <div class="bg-emerald-500/15 rounded-xl p-3 border border-emerald-400/40">
            <div class="flex justify-between items-center text-[11px] mb-1">
              <span class="text-emerald-300 font-bold">Preparación con 4 Pilares + Pasaporte QR Cívika</span>
              <span class="font-black text-emerald-300 text-xs">${m.enLineaCivika.tiempoPromedio}</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-1.5">
              <div class="bg-emerald-400 h-2 rounded-full" style="width: 15%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-emerald-200">
              <span class="font-medium">Pre-auditado • 0% Rechazos</span>
              <span class="font-extrabold text-emerald-300">$0 en tramitadores</span>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderOfficialDownloadsSection() {
    const container = document.getElementById("officialDownloadsContainer");
    if (!container) return;

    const descargas = CIVIKA_KNOWLEDGE_BASE.centroDescargas || [];

    container.innerHTML = `
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Documentos Oficiales en PDF
            </span>
            <h3 class="font-extrabold text-slate-800 text-sm mt-1">
              Centro de Descarga Rápida de Formularios y Guías
            </h3>
          </div>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i data-lucide="download" class="w-4 h-4"></i>
          </div>
        </div>

        <div class="space-y-2">
          ${descargas.map(d => `
            <div class="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                  <i data-lucide="${d.icono}" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-slate-800 text-[11px] truncate">${d.nombre}</h4>
                  <p class="text-[10px] text-slate-500 font-mono">${d.codigo} • ${d.entidad}</p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="civikaApp.downloadOrPrintDocument('${d.stepId}')"
                        class="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-xs">
                  <i data-lucide="download" class="w-3 h-3"></i>
                  <span>PDF</span>
                </button>
                <a href="${d.enlaceOficial}" target="_blank" rel="noopener noreferrer"
                   class="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] transition border border-slate-200">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderFolderAssemblyGuide() {
    const container = document.getElementById("folderAssemblyGuideContainer");
    if (!container) return;

    const guia = CIVIKA_KNOWLEDGE_BASE.guiaCarpetaFinal;
    if (!guia) return;

    container.innerHTML = `
      <div class="bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40 rounded-2xl p-4 border border-blue-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              Entrega en Ventanilla Única (5 de Junio y Veloz)
            </span>
            <h3 class="font-extrabold text-slate-800 text-sm mt-1">${guia.titulo}</h3>
          </div>
          <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <i data-lucide="folder" class="w-4 h-4"></i>
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          ${guia.ordenFolios.map(f => `
            <div class="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-start gap-2.5 shadow-xs">
              <span class="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded shrink-0">
                ${f.folio}
              </span>
              <span class="text-slate-800 text-[11px] leading-tight">${f.doc}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  toggleStepStatus(stepId) {
    this.stepsState[stepId] = !this.stepsState[stepId];
    if (this.assistant) {
      this.assistant.setContext({ serviceId: stepId });
    }
    this.saveStateToStorage();
    this.renderUnifiedFormsAndProcedures();
    this.renderGovukPassportWizardSection();
    this.updateFolderProgress();
  }

  updateFolderProgress() {
    const keys = Object.keys(this.stepsState);
    const total = keys.length;
    const completed = keys.filter(k => this.stepsState[k]).length;
    const percent = Math.round((completed / (total || 1)) * 100);

    const progressPercentEl = document.getElementById("folderProgressPercent");
    const progressCountEl = document.getElementById("folderProgressCount");
    const progressBarEl = document.getElementById("folderProgressBar");
    const readyBanner = document.getElementById("folderReadyCelebrationBanner");

    if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    if (progressCountEl) progressCountEl.textContent = `${completed} de ${total} servicios listos en tu carpeta`;
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;

    if (readyBanner) {
      readyBanner.classList.toggle("hidden", percent < 100);
    }
  }

  // ==============================================================
  // 8. VISUALIZADOR MODAL DE DOCUMENTO OFICIAL, AVISO PREVIO Y LOS 4 PILARES
  // ==============================================================
  openPrepNoticeModal(stepId, actionType = "viewer", mode = "sheet") {
    const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
    if (!step) return;

    const checklist = step.pilares?.checklistPersonalizado || [];
    const doneChecks = checklist.filter(c => this.checklistChecks[c.id]).length;
    const readyItems = checklist.slice(0, 4).map(c => c.item);

    let modal = document.getElementById("civikaPrepNoticeModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "civikaPrepNoticeModal";
      modal.className = "fixed inset-0 z-[9500] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Preparación antes de continuar");
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.closePrepNoticeModal();
      });
      document.body.appendChild(modal);
    }

    const actionLabels = {
      viewer: mode === "sheet" ? "Continuar y ver documento" : "Continuar y ver ficha",
      pdf: "Continuar y descargar PDF",
      portal: "Ir al portal oficial"
    };

    modal.classList.remove("hidden");
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-fade-in">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-2.5">
            <span class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <i data-lucide="info" class="w-5 h-5"></i>
            </span>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Preparación antes de continuar</p>
              <h4 class="text-sm font-extrabold text-slate-900 mt-0.5">${step.nombre}</h4>
            </div>
          </div>
          <button type="button" onclick="civikaApp.closePrepNoticeModal()" class="p-1 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Cerrar aviso">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
          <p class="font-bold">Cívika es orientación ciudadana gratuita</p>
          <p class="leading-relaxed">Esta guía te prepara para evitar rechazos. El trámite oficial, tasas y validación legal se realizan directamente en la entidad competente:</p>
          <p class="font-semibold pt-0.5">Institución: ${step.entidad}</p>
          <p class="leading-relaxed">Tasas y requisitos pueden variar según la ordenanza vigente o tu caso particular: tómalos como referencia y verifícalos en el canal oficial.</p>
          <a href="${step.enlaceOficial}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-700 font-bold underline break-all">
            <span>${step.enlaceOficial}</span>
            <i data-lucide="external-link" class="w-3 h-3 shrink-0"></i>
          </a>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <p class="font-bold text-slate-800">Qué tener listo antes de abrir:</p>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${doneChecks >= checklist.length && checklist.length ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
              Checklist: ${doneChecks}/${checklist.length}
            </span>
          </div>
          <ul class="space-y-1 text-slate-700">
            ${(readyItems.length ? readyItems : step.queRevisar || []).map(item => `
              <li class="flex items-start gap-2">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"></i>
                <span>${item}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button"
                  onclick="civikaApp.closePrepNoticeModal(); civikaApp.setPillarTab('${step.id}', 'pilar2'); document.getElementById('step-card-${step.id}')?.scrollIntoView({behavior:'smooth', block:'center'});"
                  class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer">
            Revisar checklist primero
          </button>
          <button type="button" id="civikaPrepContinueBtn"
                  class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer">
            ${actionLabels[actionType] || "Continuar"}
          </button>
        </div>
      </div>
    `;

    const contBtn = document.getElementById("civikaPrepContinueBtn");
    if (contBtn) {
      contBtn.onclick = () => {
        this.closePrepNoticeModal();
        if (actionType === "viewer") this.openDocumentViewer(stepId, mode, true);
        else if (actionType === "pdf") this.downloadOrPrintDocument(stepId, true);
        else if (actionType === "portal") window.open(step.enlaceOficial, "_blank", "noopener,noreferrer");
      };
      setTimeout(() => contBtn.focus(), 30);
    }
    if (window.lucide) window.lucide.createIcons();
  }

  closePrepNoticeModal() {
    const modal = document.getElementById("civikaPrepNoticeModal");
    if (modal) modal.classList.add("hidden");
  }

  openDocumentViewer(stepId, mode = "justification", skipPrep = false) {
    if (!skipPrep) {
      this.openPrepNoticeModal(stepId, "viewer", mode);
      return;
    }
    const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
    if (!step) return;

    this.activeViewerStep = step;
    this.modalViewMode = mode;

    if (this.assistant) {
      this.assistant.setContext({ serviceId: stepId });
    }

    const modal = document.getElementById("documentViewerModal");
    const entityBadge = document.getElementById("docViewerEntityBadge");
    const titleEl = document.getElementById("docViewerTitle");
    const portalLink = document.getElementById("docViewerPortalLink");
    const markReadyBtn = document.getElementById("docViewerMarkReadyBtn");

    if (entityBadge) entityBadge.textContent = step.entidadBadge || step.entidad;
    if (titleEl) titleEl.textContent = step.titulo || step.nombre;

    this.renderModalContent();

    if (portalLink) {
      portalLink.href = step.enlaceOficial;
      portalLink.textContent = step.enlaceOficial;
    }

    if (markReadyBtn) {
      const isDone = this.stepsState[step.id];
      markReadyBtn.textContent = isDone ? "Marcar como Pendiente" : "✓ Marcar como Listo en mi Carpeta";
      markReadyBtn.className = isDone
        ? "w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        : "w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm";
      markReadyBtn.onclick = () => {
        this.toggleStepStatus(step.id);
        this.closeDocumentViewer();
      };
    }

    if (modal) {
      modal.classList.remove("hidden");
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  toggleModalViewMode() {
    this.modalViewMode = this.modalViewMode === "justification" ? "sheet" : "justification";
    this.renderModalContent();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderModalContent() {
    const step = this.activeViewerStep;
    if (!step) return;

    const contentArea = document.getElementById("docViewerRenderArea");
    const toggleViewBtn = document.getElementById("docViewerToggleViewBtn");

    if (toggleViewBtn) {
      toggleViewBtn.innerHTML = this.modalViewMode === "justification"
        ? `<i data-lucide="eye" class="w-3.5 h-3.5 text-blue-600"></i> <span>Ver maqueta de referencia</span>`
        : `<i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-600"></i> <span>Ver Ficha, Costo Real y 4 Pilares</span>`;
    }

    if (this.modalViewMode === "justification") {
      const planesB = step.pilares?.planBAccionable || [];
      contentArea.innerHTML = `
        <div class="space-y-4 text-xs animate-fade-in">
          <div class="bg-blue-600 text-white rounded-2xl p-3.5 shadow-sm space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                <i data-lucide="folder-check" class="w-3.5 h-3.5"></i>
                <span>Entregable Oficial para la Carpeta</span>
              </span>
              <button type="button" onclick="civikaApp.speakStepGuide('${step.id}', this)" data-audio-title="Paso ${step.paso}: ${step.nombre}"
                      class="text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <i data-lucide="volume-2" class="w-3 h-3"></i>
                <span>Escuchar guía</span>
              </button>
            </div>
            <h4 class="font-bold text-xs sm:text-sm text-white">${step.documentoParaCarpeta}</h4>
            <p class="text-[11px] text-blue-100 pt-0.5">${step.comoPresentarEnCarpeta}</p>
          </div>

          <div>
            <h4 class="font-extrabold text-slate-900 text-sm">¿Qué es este documento?</h4>
            <p class="text-slate-600 mt-1 leading-relaxed">${step.queEs}</p>
          </div>

          <div>
            <h4 class="font-extrabold text-slate-900 text-sm">¿Para qué sirve legalmente en Riobamba?</h4>
            <p class="text-slate-600 mt-1 leading-relaxed">${step.paraQueSirve}</p>
          </div>

          <div class="bg-rose-50/90 border border-rose-200 rounded-2xl p-3.5">
            <h4 class="font-extrabold text-rose-950 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
              <i data-lucide="shield-alert" class="w-4 h-4 text-rose-600"></i>
              <span>Pilar 3: ¿Qué debes revisar para evitar que rechacen tu carpeta?</span>
            </h4>
            <ul class="space-y-1.5 pl-0.5 text-xs text-rose-950">
              ${step.queRevisar.map(item => `
                <li class="flex items-start gap-2">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i>
                  <span class="leading-relaxed">${item}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          ${planesB.length > 0 ? `
            <div class="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
              <h4 class="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                <i data-lucide="life-buoy" class="w-4 h-4 text-amber-600"></i>
                <span>Pilar 4: Plan B Accionable</span>
              </h4>
              ${planesB.map(pb => `
                <div class="text-[11px] text-amber-950 pt-1">
                  <span class="font-bold block">• ${pb.escenario}</span>
                  <span class="text-amber-900">${pb.solucion}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 space-y-2 text-xs">
            <div>
              <span class="text-slate-500 font-bold block">Costo oficial verificado (Cero cifras inventadas):</span>
              <span class="font-extrabold text-blue-800">${step.costo}</span>
            </div>
            <div>
              <span class="font-bold text-slate-800 block mb-0.5">¿Dónde se obtiene en Riobamba?</span>
              <p class="text-slate-600 leading-relaxed">${step.dondeObtenerlo}</p>
            </div>
          </div>

          ${step.conexionSiguienteTramite ? `
            <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px]">
              <span class="font-extrabold block text-emerald-800 mb-0.5">🔗 Siguiente Paso en tu Ruta Encadenada:</span>
              <span>${step.conexionSiguienteTramite.mensajeEncadenado}</span>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      contentArea.innerHTML = `
        <div class="space-y-3 animate-fade-in">
          <div class="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-700 flex items-center justify-between">
            <span class="font-semibold flex items-center gap-1.5 text-slate-800">
              <i data-lucide="file-check" class="w-4 h-4 text-blue-600"></i>
              <span>Maqueta de Referencia para tu Carpeta Municipal</span>
            </span>
            <span class="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Ejemplo ficticio • No válido
            </span>
          </div>

          ${this.generateDocumentPreviewHtml(step)}

          <div class="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
            <span class="font-bold flex items-center gap-1.5 text-blue-900">
              <i data-lucide="folder-check" class="w-4 h-4 text-blue-600"></i>
              <span>Instrucción de archivo en la carpeta final:</span>
            </span>
            <p class="text-blue-800 text-[11px] leading-tight">${step.comoPresentarEnCarpeta}</p>
          </div>
        </div>
      `;
    }
  }

  generateDocumentPreviewHtml(step) {
    const d = step.datosEjemplo || {};

    if (step.id === "req_ruc") {
      return `
        <div id="documentPrintArea" class="official-document-sheet p-5 bg-white text-slate-900 border border-slate-300 rounded-xl relative text-xs">
          <div class="official-watermark">EJEMPLO • SRI ECUADOR</div>
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 bg-indigo-700 text-white rounded-lg flex items-center justify-center font-black text-sm">SRI</div>
              <div>
                <h2 class="font-extrabold text-sm uppercase tracking-tight text-slate-900">SERVICIO DE RENTAS INTERNAS</h2>
                <p class="text-[10px] text-slate-600 font-medium">CERTIFICADO DE REGISTRO ÚNICO DE CONTRIBUYENTES</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[9px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">GRATUITIDAD $0.00</span>
              <p class="text-[10px] font-mono font-bold mt-1">${step.codigoFormulario}</p>
            </div>
          </div>
          <div class="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50 mb-3">
            <div class="flex justify-between border-b border-slate-200 pb-1">
              <span class="text-slate-500 font-medium">NÚMERO DE RUC:</span>
              <span class="font-mono font-black text-indigo-700 text-sm">${d.numero}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-1">
              <span class="text-slate-500 font-medium">APELLIDOS Y NOMBRES:</span>
              <span class="font-bold text-slate-900">${d.razonSocial}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-1">
              <span class="text-slate-500 font-medium">RÉGIMEN TRIBUTARIO:</span>
              <span class="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">${d.regimen}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">ESTADO DEL RUC:</span>
              <span class="font-extrabold text-emerald-600">${d.estado}</span>
            </div>
          </div>
          <div class="border border-slate-200 rounded-lg p-2.5 text-[11px] mb-3">
            <span class="font-bold text-slate-700 block mb-0.5">ACTIVIDAD CIIU Y ESTABLECIMIENTO N° 001 (RIOBAMBA):</span>
            <p class="text-slate-800 font-semibold">${d.actividadPrincipal}</p>
            <p class="text-slate-600 mt-0.5">${d.direccion}</p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <div class="barcode-strip text-slate-700 font-mono">|||||||||| | |||||||||||||| ||||</div>
            <div class="official-stamp text-xs">FOLIO 02 CARPETA GAD</div>
          </div>
        </div>
      `;
    }

    if (step.id === "req_bomberos") {
      return `
        <div id="documentPrintArea" class="official-document-sheet p-5 bg-white text-slate-900 border border-red-200 rounded-xl relative text-xs">
          <div class="official-watermark">EJEMPLO • BOMBEROS RIOBAMBA</div>
          <div class="flex items-center justify-between border-b-2 border-red-600 pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center font-black text-sm">CBR</div>
              <div>
                <h2 class="font-extrabold text-sm uppercase tracking-tight text-red-900">CUERPO DE BOMBEROS DE RIOBAMBA</h2>
                <p class="text-[10px] text-slate-600 font-medium">DIRECCIÓN DE PREVENCIÓN CONTRA INCENDIOS</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[9px] bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded">PERMISO ANUAL</span>
              <p class="text-[10px] font-mono font-bold mt-1 text-red-700">${d.numeroPermiso}</p>
            </div>
          </div>
          <div class="bg-red-50/50 border border-red-100 rounded-lg p-3 space-y-2 mb-3">
            <div class="flex justify-between border-b border-red-100 pb-1">
              <span class="text-slate-500 font-medium">ESTABLECIMIENTO:</span>
              <span class="font-bold text-slate-900">${d.establecimiento}</span>
            </div>
            <div class="flex justify-between border-b border-red-100 pb-1">
              <span class="text-slate-500 font-medium">PROPIETARIO / TITULAR:</span>
              <span class="font-bold text-slate-900">${d.propietario}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">CLASIFICACIÓN INSPECCIÓN:</span>
              <span class="font-bold text-red-700">${d.categoriaRiesgo}</span>
            </div>
          </div>
          <div class="border border-slate-200 rounded-lg p-2.5 text-[11px] mb-3">
            <span class="font-bold text-slate-700 block mb-0.5">EQUIPAMIENTO DE PREVENCIÓN VERIFICADO:</span>
            <p class="text-slate-600">${d.equipamientoInspeccionado}</p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <div class="text-[9px] text-slate-500">Calles Chile 26-56 y Pichincha, Riobamba</div>
            <div class="official-stamp text-xs border-red-600 text-red-600">FOLIO 03 CARPETA GAD</div>
          </div>
        </div>
      `;
    }

    if (step.id === "req_uso_suelo") {
      return `
        <div id="documentPrintArea" class="official-document-sheet p-5 bg-white text-slate-900 border border-emerald-200 rounded-xl relative text-xs">
          <div class="official-watermark">EJEMPLO • GAD RIOBAMBA PUGS</div>
          <div class="flex items-center justify-between border-b-2 border-emerald-700 pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-black text-sm">GAD</div>
              <div>
                <h2 class="font-extrabold text-sm uppercase tracking-tight text-slate-900">GAD MUNICIPAL DE RIOBAMBA</h2>
                <p class="text-[10px] text-slate-600 font-medium">INFORME DE COMPATIBILIDAD DE USO DE SUELO (ICUS)</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">PUGS RIOBAMBA</span>
              <p class="text-[10px] font-mono font-bold mt-1 text-emerald-800">${d.codigoCatastral}</p>
            </div>
          </div>
          <div class="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 space-y-2 mb-3">
            <div class="flex justify-between border-b border-emerald-100 pb-1">
              <span class="text-slate-500 font-medium">CLAVE CATASTRAL:</span>
              <span class="font-mono font-bold text-slate-900">${d.clavePredio}</span>
            </div>
            <div class="flex justify-between border-b border-emerald-100 pb-1">
              <span class="text-slate-500 font-medium">UBICACIÓN DEL PREDIO:</span>
              <span class="font-bold text-slate-900">${d.direccionInmueble}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">DICTAMEN TÉCNICO:</span>
              <span class="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">${d.dictamen}</span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <div class="text-[9px] text-slate-500">Calle 5 de Junio y Veloz</div>
            <div class="official-stamp text-xs border-emerald-700 text-emerald-700">FOLIO 04 CARPETA GAD</div>
          </div>
        </div>
      `;
    }

    if (step.id === "req_solvencia") {
      return `
        <div id="documentPrintArea" class="official-document-sheet p-5 bg-white text-slate-900 border border-sky-200 rounded-xl relative text-xs">
          <div class="official-watermark">EJEMPLO • SOLVENCIA GADMR</div>
          <div class="flex items-center justify-between border-b-2 border-sky-600 pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 bg-sky-600 text-white rounded-lg flex items-center justify-center font-black text-sm">GAD</div>
              <div>
                <h2 class="font-extrabold text-sm uppercase tracking-tight text-slate-900">GAD MUNICIPAL DE RIOBAMBA</h2>
                <p class="text-[10px] text-slate-600 font-medium">CERTIFICADO DE NO ADEUDAR AL MUNICIPIO</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[9px] bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded">VIGENCIA 30 DÍAS</span>
              <p class="text-[10px] font-mono font-bold mt-1 text-sky-800">${d.codigoCertificado}</p>
            </div>
          </div>
          <div class="bg-sky-50/50 border border-sky-100 rounded-lg p-3 space-y-2 mb-3">
            <div class="flex justify-between border-b border-sky-100 pb-1">
              <span class="text-slate-500 font-medium">CONTRIBUYENTE:</span>
              <span class="font-bold text-slate-900">${d.contribuyente}</span>
            </div>
            <div class="flex justify-between border-b border-sky-100 pb-1">
              <span class="text-slate-500 font-medium">IDENTIFICACIÓN:</span>
              <span class="font-mono font-bold text-slate-900">${d.cedulaRuc}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">ESTADO DE OBLIGACIONES:</span>
              <span class="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">${d.saldoPendiente}</span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <div class="barcode-strip text-slate-700 font-mono">|||||||||||||||||||||||||</div>
            <div class="official-stamp text-xs border-sky-700 text-sky-700">FOLIO 05 CARPETA GAD</div>
          </div>
        </div>
      `;
    }

    if (step.id === "req_formulario_patente") {
      return `
        <div id="documentPrintArea" class="official-document-sheet p-5 bg-white text-slate-900 border border-blue-300 rounded-xl relative text-xs">
          <div class="official-watermark">EJEMPLO • PATENTE RIOBAMBA</div>
          <div class="flex items-center justify-between border-b-2 border-blue-700 pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 bg-blue-700 text-white rounded-lg flex items-center justify-center font-black text-sm">GAD</div>
              <div>
                <h2 class="font-extrabold text-sm uppercase tracking-tight text-slate-900">GAD MUNICIPAL DE RIOBAMBA</h2>
                <p class="text-[10px] text-slate-600 font-medium">DECLARACIÓN DEL IMPUESTO DE PATENTE MUNICIPAL (COOTAD ARTS. 547-553)</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[9px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">CARÁTULA CARPETA</span>
              <p class="text-[10px] font-mono font-bold mt-1 text-blue-800">${d.formularioId}</p>
            </div>
          </div>
          <div class="border border-slate-300 rounded-lg p-3 space-y-2 mb-3 bg-slate-50">
            <div class="flex justify-between border-b border-slate-200 pb-1">
              <span class="text-slate-500 font-medium">CONTRIBUYENTE:</span>
              <span class="font-bold text-slate-900">${d.nombresApellidos}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-1">
              <span class="text-slate-500 font-medium">RÉGIMEN SRI:</span>
              <span class="font-bold text-blue-700">${d.regimenTributario}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-500 font-medium shrink-0">LIQUIDACIÓN TRIBUTARIA:</span>
              <span class="font-black text-blue-900 text-right text-[11px]">${d.impuestoPatenteLiquidado}</span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <div class="text-[10px] text-slate-600">
              <p class="font-bold">Firma manuscrita con esfero AZUL (Idéntica a la cédula):</p>
              <div class="w-40 border-b-2 border-blue-600 mt-4"></div>
            </div>
            <div class="official-stamp text-xs border-blue-700 text-blue-700">PORTADA EXPEDIENTE</div>
          </div>
        </div>
      `;
    }

    return `
      <div id="documentPrintArea" class="official-document-sheet p-5 bg-white text-slate-900 border-2 border-amber-400 rounded-xl relative text-xs">
        <div class="official-watermark">EJEMPLO • LUF + ARCSA 2026</div>
        <div class="text-center border-b-2 border-amber-500 pb-3 mb-3">
          <div class="w-12 h-12 bg-amber-500 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-lg shadow-sm mb-1">LUF</div>
          <h2 class="font-black text-sm uppercase tracking-tight text-slate-900">GAD MUNICIPAL DEL CANTÓN RIOBAMBA & ARCSA</h2>
          <p class="text-[10px] font-bold text-amber-800 uppercase tracking-wider">LICENCIA ÚNICA DE FUNCIONAMIENTO + CUMPLIMIENTO SANITARIO</p>
          <span class="text-[10px] font-mono font-bold text-slate-500">${d.numeroResolucion}</span>
        </div>
        <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2 mb-3">
          <div class="flex justify-between border-b border-amber-100 pb-1">
            <span class="text-slate-500 font-medium">ESTABLECIMIENTO:</span>
            <span class="font-black text-slate-900">${d.nombreLocal}</span>
          </div>
          <div class="flex justify-between border-b border-amber-100 pb-1">
            <span class="text-slate-500 font-medium">TITULAR:</span>
            <span class="font-bold text-slate-900">${d.titular}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">VIGENCIA Y EXONERACIÓN ARCSA:</span>
            <span class="font-black text-emerald-700 text-right">${d.vigencia}</span>
          </div>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-200">
          <div class="text-[10px] text-slate-500">Exhibir en lugar visible del local comercial</div>
          <div class="official-stamp text-xs border-amber-600 text-amber-700">LOCAL FORMALIZADO</div>
        </div>
      </div>
    `;
  }

  downloadOrPrintDocument(stepId, skipPrep = false) {
    if (!skipPrep) {
      this.openPrepNoticeModal(stepId, "pdf", "sheet");
      return;
    }
    const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
    if (!step) return;

    // PDF real descargable (js/pdf.js). Si no cargara, se usa la vista para imprimir.
    if (window.civikaPDF && window.jspdf) {
      window.civikaPDF.stepGuide(stepId);
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes en tu navegador para imprimir o guardar el documento en PDF.");
      return;
    }

    const docHtml = this.generateDocumentPreviewHtml(step);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Cívika Riobamba - ${step.nombre}</title>
        <script src="${new URL('js/vendor/tailwindcss.js', location.href).href}"></script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; padding: 24px; }
          .official-document-sheet { max-width: 720px; margin: 0 auto; background: white; padding: 32px; border: 1px solid #cbd5e1; border-radius: 12px; position: relative; }
          .official-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 34px; font-weight: 900; color: rgba(220, 38, 38, 0.10); white-space: nowrap; pointer-events: none; }
          .official-stamp { border: 2px dashed #DC2626; color: #DC2626; font-weight: 800; transform: rotate(-8deg); border-radius: 8px; padding: 4px 8px; display: inline-block; }
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none; }
            .official-document-sheet { border: none; box-shadow: none; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="no-print max-w-[720px] mx-auto mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs">
          <div>
            <h4 class="font-bold text-blue-900">Documento y Checklist Verificado por Cívika GovTech (Riobamba)</h4>
            <p class="text-blue-700">Costo oficial: ${step.costo}</p>
          </div>
          <button onclick="window.print()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer">
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>
        ${docHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  closeDocumentViewer() {
    const modal = document.getElementById("documentViewerModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  applyDemoScenario(scenarioName) {
    if (scenarioName === "tienda_ropa") {
      this.selectBusiness("tienda_ropa");
      this.stepsState = {
        req_ruc: true,
        req_bomberos: false,
        req_uso_suelo: false,
        req_solvencia: false,
        req_formulario_patente: false,
        req_luf_final: false
      };
      this.renderUnifiedFormsAndProcedures();
      this.updateFolderProgress();
      this.goToScreen("screen-unified-forms");
    } else if (scenarioName === "cafeteria_centro") {
      this.selectBusiness("cafeteria");
      this.stepsState = {
        req_ruc: true,
        req_bomberos: true,
        req_uso_suelo: false,
        req_solvencia: false,
        req_formulario_patente: false,
        req_luf_final: false
      };
      this.renderUnifiedFormsAndProcedures();
      this.updateFolderProgress();
      this.goToScreen("screen-unified-forms");
    } else if (scenarioName === "profesional") {
      this.selectBusiness("profesional");
      this.stepsState = {
        req_ruc: true,
        req_bomberos: true,
        req_uso_suelo: true,
        req_solvencia: true,
        req_formulario_patente: false,
        req_luf_final: false
      };
      this.renderUnifiedFormsAndProcedures();
      this.updateFolderProgress();
      this.goToScreen("screen-unified-forms");
    } else if (scenarioName === "completar_todo") {
      Object.keys(this.stepsState).forEach(k => {
        this.stepsState[k] = true;
      });
      this.fillSampleValidRuc("0603849209001");
      this.govukWizardStep = 4;
      this.renderUnifiedFormsAndProcedures();
      this.renderGovukPassportWizardSection();
      setTimeout(() => this.generatePassportQRCode(), 80);
      this.updateFolderProgress();
      this.goToScreen("screen-unified-forms");
      setTimeout(() => {
        const passport = document.getElementById("govukPassportSection");
        if (passport) passport.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    } else if (scenarioName === "renovaciones_demo" || scenarioName === "ventanilla_demo") {
      if (window.civikaFeatures) window.civikaFeatures.runDemo(scenarioName);
    } else if (scenarioName === "reiniciar") {
      try { localStorage.removeItem("civika_steps_state"); } catch (e) { /* sin almacenamiento */ }
      if (window.civikaFeatures) window.civikaFeatures.resetDemo();
      this.selectBusiness("tienda_ropa");
      this.stepsState = {
        req_ruc: true,
        req_bomberos: false,
        req_uso_suelo: false,
        req_solvencia: false,
        req_formulario_patente: false,
        req_luf_final: false
      };
      this.govukWizardStep = 1;
      this.renderUnifiedFormsAndProcedures();
      this.renderGovukPassportWizardSection();
      this.updateFolderProgress();
      this.goToScreen("screen-home");
    }
    this.saveStateToStorage();
  }

  // ==============================================================
  // 9. FLUJO DE CONVENIO (PRE-VALIDACIÓN REMOTA) Y ROL ADMINISTRATIVO (PIN 1110)
  // ==============================================================
  escHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  parroquiaNombre(id) {
    const list = CIVIKA_KNOWLEDGE_BASE.parroquiasRiobamba || [];
    const found = list.find(p => p.id === id);
    return found ? found.nombre.split(" (")[0] : String(id || "No indicada");
  }

  prevalidationBadge(estado) {
    if (estado === "Pre-Aprobado" || estado === "Visto Bueno") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (estado === "Observado") return "bg-rose-100 text-rose-800 border-rose-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  /** Resumen no sensible del expediente actual del ciudadano */
  buildPrevalidationSummary() {
    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId)
      || CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes[0];
    const pasos = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales;
    const noAplica = biz.pasosNoAplicanSinLocal || [];
    const applicableSteps = pasos.filter(p => !noAplica.includes(p.id));
    const doneSteps = applicableSteps.filter(p => this.stepsState[p.id]).length;
    let totalChecks = 0;
    let doneChecks = 0;
    applicableSteps.forEach(p => {
      const list = p.pilares?.checklistPersonalizado || [];
      totalChecks += list.length;
      doneChecks += list.filter(c => this.checklistChecks[c.id]).length;
    });
    const alertasSuperadas = applicableSteps.filter(p => this.stageProgress[p.id]?.antiRechazo).length;
    const ciiu = String(biz.ciiuReferencia || "").split(" - ")[0].trim();
    return {
      biz, applicableSteps, doneSteps, totalChecks, doneChecks, alertasSuperadas, ciiu,
      isReadyToSend: doneSteps >= applicableSteps.length || (totalChecks > 0 && doneChecks >= Math.max(3, Math.ceil(totalChecks * 0.5)))
    };
  }

  async renderPrevalidationCitizenBox() {
    const stepsContainer = document.getElementById("unifiedStepsContainer");
    if (!stepsContainer || !stepsContainer.parentElement) return;

    let box = document.getElementById("prevalidationCitizenBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "prevalidationCitizenBox";
      box.className = "mt-4";
      stepsContainer.insertAdjacentElement("afterend", box);
    }

    const e = (v) => this.escHtml(v);
    const sum = this.buildPrevalidationSummary();
    const inbox = window.civikaDB && typeof window.civikaDB.getPrevalidationInbox === "function"
      ? await window.civikaDB.getPrevalidationInbox()
      : [];
    const mine = inbox.filter(item => item.origen === "ciudadano");

    // Notificación al ciudadano: respuestas del GAD aún no vistas
    const unseen = mine.filter(item => item.estado !== "Pendiente" && !item.vistoPorCiudadano);
    if (unseen.length && window.civikaDB && typeof window.civikaDB.markPrevalidationSeen === "function") {
      unseen.forEach(item => {
        if (typeof window.civikaToast === "function") {
          window.civikaToast(item.estado === "Pre-Aprobado"
            ? `Tu expediente ${item.id} fue Pre-Aprobado. Código de pase rápido: ${item.codigoPase}`
            : `Tu expediente ${item.id} fue devuelto con observación. Revisa el motivo.`);
        }
      });
      await window.civikaDB.markPrevalidationSeen(unseen.map(i => i.id));
    }

    box.innerHTML = `
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Pre-Validación Remota · Propuesta de convenio con el GAD Riobamba</p>
            <h4 class="text-sm font-extrabold text-slate-900 mt-0.5">Enviar tu resumen para una revisión previa</h4>
            <p class="text-xs text-slate-600 mt-1">Solo se envían estos metadatos no sensibles:</p>
            <ul class="mt-1 text-[11px] text-slate-700 grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
              <li>· Giro: <b>${e(sum.biz.nombre)}</b> (CIIU ${e(sum.ciiu)})</li>
              <li>· Parroquia: <b>${e(this.parroquiaNombre(this.draftForm?.parroquia))}</b></li>
              <li>· Checklist: <b>${sum.doneChecks}/${sum.totalChecks}</b> requisitos · ${sum.doneSteps}/${sum.applicableSteps.length} pasos</li>
              <li>· Alertas anti-rechazo superadas: <b>${sum.alertasSuperadas}/${sum.applicableSteps.length}</b></li>
            </ul>
            <p class="text-[10px] text-slate-500 mt-1">No se envían nombres, cédula, RUC, contraseñas ni documentos PDF.</p>
          </div>
          <button type="button" id="btnSubmitPrevalidation"
                  onclick="civikaApp.submitCitizenPrevalidation()"
                  ${sum.isReadyToSend ? '' : 'disabled'}
                  class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                    sum.isReadyToSend
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span>Enviar a Pre-Validación</span>
          </button>
        </div>

        ${!sum.isReadyToSend ? `
          <p class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Marca al menos la mitad de los requisitos de tus checklists (${sum.doneChecks}/${sum.totalChecks}) o completa los pasos aplicables para habilitar el envío.
          </p>
        ` : ''}

        ${mine.length ? `
          <div class="pt-2 border-t border-slate-100 space-y-2">
            <p class="text-[11px] font-bold text-slate-700">Tus envíos (${mine.length}):</p>
            <div class="space-y-1.5">
              ${mine.slice(0, 4).map(item => `
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div class="flex items-start justify-between gap-2 flex-wrap">
                    <p class="font-bold text-slate-900 min-w-0">${e(item.id)} · ${e(item.giroNombre)}</p>
                    <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${this.prevalidationBadge(item.estado)}">${e(item.estado)}</span>
                  </div>
                  <p class="text-[11px] text-slate-600">${e(this.parroquiaNombre(item.parroquia))} · Checklist ${e(item.checklistConteo)} · Alertas superadas ${e(item.alertasSuperadas ?? "—")} · ${e(item.fechaEnvio)}</p>
                  ${item.estado === "Pre-Aprobado" ? `
                    <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <p class="font-extrabold">Código de pase rápido: <span class="font-mono tracking-wider">${e(item.codigoPase)}</span></p>
                      <p class="text-[11px]">Preséntalo en Ventanilla Única junto con tus documentos originales. Es una pre-revisión: la emisión oficial la realiza el GAD.</p>
                    </div>` : ''}
                  ${item.estado === "Observado" ? `
                    <div class="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                      <p class="font-extrabold">Motivo: ${e(item.motivo || "Revisar requisitos")}</p>
                      ${item.observacion ? `<p class="text-[11px]">${e(item.observacion)}</p>` : ''}
                    </div>` : ''}
                  ${item.estado === "Pendiente" ? `<p class="text-[11px] text-slate-600">En espera de revisión del funcionario.</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  async submitCitizenPrevalidation() {
    if (!window.civikaDB || typeof window.civikaDB.submitToPrevalidationInbox !== "function") return;
    const sum = this.buildPrevalidationSummary();
    if (!sum.isReadyToSend) return;
    const record = await window.civikaDB.submitToPrevalidationInbox({
      origen: "ciudadano",
      giroId: sum.biz.id,
      giroNombre: sum.biz.nombre,
      ciiu: sum.ciiu,
      parroquia: this.draftForm?.parroquia || "",
      checklistConteo: `${sum.doneChecks}/${sum.totalChecks}`,
      pasosConteo: `${sum.doneSteps}/${sum.applicableSteps.length}`,
      alertasSuperadas: `${sum.alertasSuperadas}/${sum.applicableSteps.length}`,
      pasosEstado: Object.fromEntries(CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.map(p => [
        p.id,
        sum.applicableSteps.some(a => a.id === p.id) ? (this.stepsState[p.id] ? "completado" : "pendiente") : "no_aplica"
      ])),
      estado: "Pendiente"
    });
    if (typeof window.civikaToast === "function") {
      window.civikaToast(`Resumen ${record.id} enviado a Pre-Validación (Pendiente)`);
    }
    await this.renderPrevalidationCitizenBox();
    if (this.officerUnlocked) this.renderOfficerGateAndInbox();
  }

  async renderOfficerGateAndInbox() {
    const screen = document.getElementById("screen-officer");
    if (!screen) return;

    const protectedChildren = Array.from(screen.children).filter(
      el => el.id !== "officerPinGate" && el.id !== "officerPrevalidationInbox"
    );

    let gate = document.getElementById("officerPinGate");
    if (!gate) {
      gate = document.createElement("div");
      gate.id = "officerPinGate";
      screen.prepend(gate);
    }

    let inboxBox = document.getElementById("officerPrevalidationInbox");
    if (!inboxBox) {
      inboxBox = document.createElement("div");
      inboxBox.id = "officerPrevalidationInbox";
      inboxBox.className = "mt-4";
      screen.appendChild(inboxBox);
    }

    if (!this.officerUnlocked) {
      protectedChildren.forEach(el => el.classList.add("hidden"));
      inboxBox.classList.add("hidden");
      inboxBox.innerHTML = "";
      gate.classList.remove("hidden");
      gate.innerHTML = `
        <div class="max-w-md mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 my-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <i data-lucide="lock" class="w-5 h-5"></i>
            </span>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Rol Administrativo · Revisor GAD</p>
              <h3 class="text-base font-extrabold text-slate-900">Acceso para Funcionario / Revisor</h3>
            </div>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            Acceso exclusivo para revisores autorizados bajo convenio (Demo PIN: 1110)
          </p>
          <div class="space-y-2">
            <label for="officerPinInput" class="text-xs font-bold text-slate-700 block">PIN de funcionario</label>
            <input type="password" id="officerPinInput" maxlength="8" inputmode="numeric" autocomplete="off"
                   placeholder="••••"
                   onkeydown="if(event.key==='Enter'){event.preventDefault(); civikaApp.unlockOfficerPin();}"
                   class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <p id="officerPinError" role="alert" class="text-xs text-rose-600 font-semibold hidden"></p>
          </div>
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <button type="button" id="btnOfficerAutofill"
                    onclick="const inp=document.getElementById('officerPinInput'); if(inp){inp.value='1110'; inp.focus();}"
                    class="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer">
              Autocompletar Demo
            </button>
            <button type="button" id="btnOfficerUnlock" onclick="civikaApp.unlockOfficerPin()"
                    class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer">
              Ingresar a la bandeja
            </button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      if (window.civikaBackoffice) window.civikaBackoffice.mount(screen, false);
      return;
    }

    gate.classList.add("hidden");
    gate.innerHTML = "";
    protectedChildren.forEach(el => el.classList.remove("hidden"));
    inboxBox.classList.remove("hidden");

    const e = (v) => this.escHtml(v);
    const inbox = window.civikaDB && typeof window.civikaDB.getPrevalidationInbox === "function"
      ? await window.civikaDB.getPrevalidationInbox()
      : [];
    const motivos = CivikaApp.RETURN_REASONS;
    const pendientes = inbox.filter(i => i.estado === "Pendiente").length;

    inboxBox.innerHTML = `
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Bandeja de Pre-Validación Remota</p>
            <h4 class="text-sm font-extrabold text-slate-900">Expedientes recibidos (${inbox.length}) · ${pendientes} pendiente${pendientes === 1 ? "" : "s"}</h4>
          </div>
          <button type="button" id="btnOfficerLock"
                  onclick="civikaApp.lockOfficerView()"
                  class="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer">
            Bloquear vista
          </button>
        </div>

        <div class="space-y-2.5">
          ${inbox.map(item => {
            const id = e(item.id);
            const decided = item.estado !== "Pendiente";
            return `
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs" data-exp="${id}">
              <div class="flex items-start justify-between gap-2 flex-wrap">
                <div class="min-w-0">
                  <p class="font-extrabold text-slate-900">${id} · ${e(item.giroNombre)}${item.origen === "ciudadano" ? ' <span class="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 align-middle">Enviado desde Cívika</span>' : ''}</p>
                  <p class="text-[11px] text-slate-600">CIIU ${e(item.ciiu || "—")} · ${e(this.parroquiaNombre(item.parroquia))} · ${e(item.fechaEnvio || "")}</p>
                  <p class="text-[11px] text-slate-600">Checklist ${e(item.checklistConteo)} · Alertas superadas ${e(item.alertasSuperadas ?? "—")}</p>
                </div>
                <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${this.prevalidationBadge(item.estado)}">${e(item.estado)}</span>
              </div>
              ${item.estado === "Pre-Aprobado" ? `<p class="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">Código de pase rápido: <b class="font-mono">${e(item.codigoPase)}</b> · ciudadano notificado</p>` : ''}
              ${item.estado === "Observado" ? `<p class="text-[11px] text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-200">Motivo: <b>${e(item.motivo || "—")}</b>${item.observacion ? ` · ${e(item.observacion)}` : ''}</p>` : ''}
              ${!decided ? `
                <div class="flex flex-wrap gap-2">
                  <button type="button"
                          onclick="civikaApp.officerApprove('${id}')"
                          class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <i data-lucide="badge-check" class="w-3.5 h-3.5"></i>
                    <span>Otorgar Visto Bueno (Listo para emisión virtual)</span>
                  </button>
                  <button type="button"
                          onclick="civikaApp.toggleReturnForm('${id}')"
                          class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <i data-lucide="undo-2" class="w-3.5 h-3.5"></i>
                    <span>Devolver con Observación</span>
                  </button>
                </div>
                <div id="returnForm-${id}" class="${this.officerReturnOpenId === item.id ? '' : 'hidden'} p-2.5 rounded-lg bg-white border border-rose-200 space-y-2">
                  <label for="returnReason-${id}" class="text-[11px] font-bold text-slate-700 block">Motivo específico</label>
                  <select id="returnReason-${id}" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white">
                    ${motivos.map(m => `<option value="${e(m)}">${e(m)}</option>`).join('')}
                  </select>
                  <label for="returnNote-${id}" class="text-[11px] font-bold text-slate-700 block">Nota para el ciudadano (opcional, sin datos personales)</label>
                  <input id="returnNote-${id}" type="text" maxlength="160" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px]" placeholder="Ej.: adjunta la planilla del último mes">
                  <div class="flex gap-2 justify-end">
                    <button type="button" onclick="civikaApp.toggleReturnForm(null)" class="px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold cursor-pointer">Cancelar</button>
                    <button type="button" onclick="civikaApp.officerReturn('${id}')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer">Confirmar devolución</button>
                  </div>
                </div>
              ` : `
                <button type="button" onclick="civikaApp.officerReopen('${id}')" class="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer">Reabrir revisión</button>
              `}
            </div>
          `;}).join('')}
        </div>

        <p class="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
          Nota institucional: esta bandeja es una demostración local. En un convenio real, Cívika podría interoperar con el sistema del GAD mediante API o Webhook,
          enviando solo metadatos no sensibles y con consentimiento del ciudadano, conforme a la Ley Orgánica de Protección de Datos Personales.
          El Visto Bueno es una pre-revisión y no reemplaza la emisión oficial del permiso.
        </p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    if (window.civikaBackoffice) await window.civikaBackoffice.mount(screen, true);
  }

  unlockOfficerPin() {
    const inp = document.getElementById("officerPinInput");
    const err = document.getElementById("officerPinError");
    const val = String(inp ? inp.value : "").trim();
    if (val === "1110") {
      this.officerUnlocked = true;
      try { sessionStorage.setItem("civika_officer_pin_ok", "1"); } catch (e) { /* nada */ }
      this.renderOfficerGateAndInbox();
    } else if (err) {
      err.textContent = val ? "PIN incorrecto. Usa el PIN de demostración 1110." : "Ingresa el PIN de funcionario.";
      err.classList.remove("hidden");
      if (inp) { inp.value = ""; inp.focus(); }
    }
  }

  lockOfficerView() {
    this.officerUnlocked = false;
    this.officerReturnOpenId = null;
    this.officerReturnOpenId = null;
    try { sessionStorage.removeItem("civika_officer_pin_ok"); } catch (e) { /* nada */ }
    if (window.civikaOfficer && typeof window.civikaOfficer.stopCamera === "function") {
      try { window.civikaOfficer.stopCamera(); } catch (e) { /* nada */ }
    }
    this.renderOfficerGateAndInbox();
  }

  toggleReturnForm(expedienteId) {
    this.officerReturnOpenId = this.officerReturnOpenId === expedienteId ? null : expedienteId;
    this.renderOfficerGateAndInbox();
  }

  generateFastPassCode(expedienteId) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(6);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    const rand = Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
    const suffix = String(expedienteId).replace(/\D/g, "").slice(-3).padStart(3, "0");
    return `PR-${suffix}-${rand.slice(0, 3)}${rand.slice(3)}`;
  }

  async officerApprove(expedienteId) {
    if (!window.civikaDB || typeof window.civikaDB.updatePrevalidationStatus !== "function") return;
    const codigoPase = this.generateFastPassCode(expedienteId);
    await window.civikaDB.updatePrevalidationStatus(expedienteId, "Pre-Aprobado", {
      codigoPase,
      motivo: "",
      observacion: "Pre-revisión favorable. Listo para emisión virtual / Ventanilla Única."
    });
    this.officerReturnOpenId = null;
    if (typeof window.civikaToast === "function") {
      window.civikaToast(`${expedienteId} Pre-Aprobado · Pase rápido ${codigoPase} · ciudadano notificado`);
    }
    await this.renderOfficerGateAndInbox();
    await this.renderPrevalidationCitizenBox();
  }

  async officerReturn(expedienteId) {
    if (!window.civikaDB || typeof window.civikaDB.updatePrevalidationStatus !== "function") return;
    const sel = document.getElementById(`returnReason-${expedienteId}`);
    const note = document.getElementById(`returnNote-${expedienteId}`);
    const motivo = sel ? sel.value : CivikaApp.RETURN_REASONS[0];
    await window.civikaDB.updatePrevalidationStatus(expedienteId, "Observado", {
      motivo,
      codigoPase: "",
      observacion: note ? note.value.trim().slice(0, 160) : ""
    });
    this.officerReturnOpenId = null;
    if (typeof window.civikaToast === "function") {
      window.civikaToast(`${expedienteId} devuelto: ${motivo}`);
    }
    await this.renderOfficerGateAndInbox();
    await this.renderPrevalidationCitizenBox();
  }

  async officerReopen(expedienteId) {
    if (!window.civikaDB || typeof window.civikaDB.updatePrevalidationStatus !== "function") return;
    await window.civikaDB.updatePrevalidationStatus(expedienteId, "Pendiente", { motivo: "", codigoPase: "", observacion: "" });
    await this.renderOfficerGateAndInbox();
    await this.renderPrevalidationCitizenBox();
  }

  async saveStateToStorage() {
    try {
      if (window.civikaDB) {
        await window.civikaDB.saveStepsProgress(this.stepsState, this.selectedBusinessId);
        await window.civikaDB.saveChecklistChecks(this.checklistChecks);
        await window.civikaDB.saveDiagnosticAnswers(this.diagnosticAnswers);
        if (typeof window.civikaDB.saveStageProgress === "function") {
          await window.civikaDB.saveStageProgress(this.stageProgress);
        }
        await window.civikaDB.saveDraftForm(this.draftForm);
        await window.civikaDB.setItem("civika_easy_read_mode", this.easyReadMode);
      } else {
        localStorage.setItem("civika_steps_state", JSON.stringify(this.stepsState));
        localStorage.setItem("civika_selected_biz", this.selectedBusinessId);
      }
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  }

  async loadStateFromStorage() {
    try {
      if (window.civikaDB) {
        const { steps, selectedBiz } = await window.civikaDB.loadStepsProgress(this.stepsState);
        this.stepsState = steps;
        this.selectedBusinessId = selectedBiz;
        this.checklistChecks = await window.civikaDB.loadChecklistChecks();
        this.diagnosticAnswers = await window.civikaDB.loadDiagnosticAnswers();
        if (typeof window.civikaDB.loadStageProgress === "function") {
          this.stageProgress = await window.civikaDB.loadStageProgress({});
        }
        const savedDraft = await window.civikaDB.loadDraftForm();
        this.draftForm = { ...this.draftForm, ...savedDraft };
        this.easyReadMode = Boolean(await window.civikaDB.getItem("civika_easy_read_mode", false));
      } else {
        const saved = localStorage.getItem("civika_steps_state");
        const savedBiz = localStorage.getItem("civika_selected_biz");
        if (saved) this.stepsState = { ...this.stepsState, ...JSON.parse(saved) };
        if (savedBiz) this.selectedBusinessId = savedBiz;
      }
    } catch (e) {
      console.warn("Error loading state:", e);
    }
  }
}

CivikaApp.RETURN_REASONS = [
  "Planilla de servicio básico mayor a 90 días",
  "Verificar compatibilidad de Uso de Suelo (ICUS) para la dirección",
  "Contrato de arrendamiento sin firmas o sin vigencia",
  "Actividad registrada en el RUC no coincide con el giro declarado",
  "Extintor sin recarga vigente o sin etiqueta visible",
  "Certificado de No Adeudar vencido o no emitido",
  "Checklist incompleto: faltan requisitos obligatorios",
  "Otro motivo (ver nota del revisor)"
];

document.addEventListener("DOMContentLoaded", () => {
  window.civikaApp = new CivikaApp();

  // Accesibilidad: cerrar ventanas emergentes con la tecla Esc o tocando el fondo oscuro
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    window.civikaApp.closePrepNoticeModal();
    window.civikaApp.closeDocumentViewer();
    window.civikaApp.closeLiveMetricsModal();
  });
  ["documentViewerModal", "liveMetricsModal"].forEach((id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target !== modal) return;
      if (id === "documentViewerModal") window.civikaApp.closeDocumentViewer();
      else window.civikaApp.closeLiveMetricsModal();
    });
  });
});
