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
      "screen-unified-forms": "Trámites y formularios",
      "screen-assistant": "Copiloto IA",
      "screen-renewals": "Renovaciones",
      "screen-institutions": "Oficinas y mapa",
      "screen-officer": "Modo Ventanilla"
    };
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.textContent = titles[screenId] || "Cívika";
    document.title = `${titles[screenId] || "Inicio"} • Cívika Riobamba`;

    if (window.civikaUI) window.civikaUI.closeDrawer();
    if (window.civikaFeatures) window.civikaFeatures.onScreenChange(screenId, previous);

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
   * Lectura por Voz (Text-to-Speech) para cualquier paso o guía de la app
   */
  speakStepGuide(stepId, btnEl = null) {
    const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === stepId);
    if (!step || !this.assistant) return;

    const speechText = `Paso ${step.paso}: ${step.nombre}. ¿Qué debes hacer? ${step.queHacer}. ` +
      `Previene rechazo en ventanilla: ${step.pilares?.pasosConPrevencion?.[0]?.alertaCritica || step.queRevisar[0]}. ` +
      `Costo oficial: ${step.costo}.`;
    this.assistant.speakText(speechText, btnEl);
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
        <button type="button" onclick="civikaApp.selectBusiness('${biz.id}'); if (window.civikaUI) civikaUI.afterBusinessPick();"
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

          <div class="hidden sm:block text-slate-400 group-hover:text-blue-600 transition pl-2 shrink-0">
            <i data-lucide="chevron-right" class="w-5 h-5"></i>
          </div>
        </button>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  selectBusiness(bizId) {
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
  }

  renderSelectedBusinessDocumentation() {
    const container = document.getElementById("selectedBusinessDocSection");
    if (!container) return;

    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === this.selectedBusinessId)
      || CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes[0];

    container.innerHTML = `
      <div class="card card-pad space-y-5 animate-fade-in">
        <div class="flex items-start gap-3">
          <span class="feature-icon"><i data-lucide="${biz.icono}"></i></span>
          <div class="min-w-0">
            <p class="eyebrow">Expediente personalizado · CIIU ${biz.ciiuReferencia ? biz.ciiuReferencia.split(' ')[0] : ''}</p>
            <h4 class="text-lg font-semibold text-slate-900 leading-snug mt-0.5">${biz.nombre}</h4>
            <p class="text-sm text-slate-500">${biz.categoria}</p>
          </div>
        </div>

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
          <h5 class="text-sm font-semibold text-slate-900 mb-2">Requisitos para tu carpeta</h5>
          <ul class="space-y-2">
            ${biz.documentacionRequerida.map(doc => `
              <li class="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0 mt-1"></i>
                <span>${doc}</span>
              </li>
            `).join('')}
          </ul>
        </div>

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

  selectDiagnosticOption(stepId, questionId, optionValue) {
    const key = `${stepId}__${questionId}`;
    this.diagnosticAnswers[key] = optionValue;
    this.saveStateToStorage();
    this.renderUnifiedFormsAndProcedures();
  }

  toggleSubChecklist(checkId) {
    this.checklistChecks[checkId] = !this.checklistChecks[checkId];
    this.saveStateToStorage();
    this.renderUnifiedFormsAndProcedures();
  }

  renderFourPillarsWidget(step) {
    if (!step.pilares) return "";
    const currentTab = this.activePillarTab[step.id] || "pilar1";
    const p = step.pilares;

    // Contar checks del Pilar 2
    const totalChecks = (p.checklistPersonalizado || []).length;
    const doneChecks = (p.checklistPersonalizado || []).filter(c => this.checklistChecks[c.id]).length;

    let tabContentHtml = "";

    if (currentTab === "pilar1") {
      // PILAR 1: Diagnóstico Rápido (2-3 preguntas filtro)
      tabContentHtml = `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Pilar 1: Diagnóstico Rápido (Define tu ruta exacta)</span>
            </span>
          </div>
          ${(p.diagnosticoRapido || []).map(q => {
            const answerKey = `${step.id}__${q.id}`;
            const selectedVal = this.diagnosticAnswers[answerKey] || q.opciones[0]?.valor;
            const selectedOpt = q.opciones.find(o => o.valor === selectedVal) || q.opciones[0];

            return `
              <div class="bg-white rounded-xl p-2.5 border border-slate-200/90 space-y-1.5">
                <p class="font-bold text-slate-800 text-[11px]">${q.pregunta}</p>
                <div class="flex flex-wrap gap-1.5">
                  ${q.opciones.map(opt => {
                    const isActive = opt.valor === selectedVal;
                    return `
                      <button type="button"
                              onclick="civikaApp.selectDiagnosticOption('${step.id}', '${q.id}', '${opt.valor}')"
                              class="text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }">
                        ${opt.texto}
                      </button>
                    `;
                  }).join('')}
                </div>
                ${selectedOpt ? `
                  <div class="mt-1.5 p-2 bg-indigo-50/90 border border-indigo-200 rounded-lg text-[11px] text-indigo-950 flex items-start gap-1.5">
                    <i data-lucide="arrow-right-circle" class="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5"></i>
                    <span><strong>Tu Ruta Verificada:</strong> ${selectedOpt.resultadoRuta}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (currentTab === "pilar2") {
      // PILAR 2: Checklist Personalizado Interactivo con enlace oficial
      tabContentHtml = `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
              <i data-lucide="check-square" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Pilar 2: Checklist Personalizado (${doneChecks}/${totalChecks} listos)</span>
            </span>
            <a href="${step.enlaceOficial}" target="_blank" rel="noopener noreferrer"
               class="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
              <span>Fuente Oficial</span>
              <i data-lucide="external-link" class="w-3 h-3"></i>
            </a>
          </div>
          <div class="space-y-1.5">
            ${(p.checklistPersonalizado || []).map(chk => {
              const checked = Boolean(this.checklistChecks[chk.id]);
              return `
                <label class="flex items-start justify-between gap-2 bg-white p-2.5 rounded-xl border cursor-pointer transition ${
                  checked ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-300'
                }">
                  <div class="flex items-start gap-2">
                    <input type="checkbox" ${checked ? 'checked' : ''}
                           onchange="civikaApp.toggleSubChecklist('${chk.id}')"
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
        </div>
      `;
    } else if (currentTab === "pilar3") {
      // PILAR 3: Paso a Paso con Prevención de Errores Críticos
      tabContentHtml = `
        <div class="space-y-2">
          <span class="text-[11px] font-extrabold text-rose-900 flex items-center gap-1">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-rose-600"></i>
            <span>Pilar 3: Paso a Paso y Prevención de Rechazos en Ventanilla</span>
          </span>
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
        </div>
      `;
    } else if (currentTab === "pilar4") {
      // PILAR 4: Plan B Accionable
      tabContentHtml = `
        <div class="space-y-2">
          <span class="text-[11px] font-extrabold text-amber-950 flex items-center gap-1">
            <i data-lucide="life-buoy" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Pilar 4: Plan B Accionable (Contingencia real en Riobamba)</span>
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
        </div>
      `;
    }

    return `
      <div class="mt-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2.5 space-y-2.5">
        <!-- Pestañas de los 4 Pilares -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-extrabold">
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar1')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition ${
                    currentTab === 'pilar1' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="compass" class="w-3 h-3"></i>
            <span>1. Diagnóstico</span>
          </button>
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar2')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition ${
                    currentTab === 'pilar2' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="check-square" class="w-3 h-3"></i>
            <span>2. Checklist (${doneChecks}/${totalChecks})</span>
          </button>
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar3')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition ${
                    currentTab === 'pilar3' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="shield-alert" class="w-3 h-3"></i>
            <span>3. Anti-Rechazo</span>
          </button>
          <button type="button" onclick="civikaApp.setPillarTab('${step.id}', 'pilar4')"
                  class="py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition ${
                    currentTab === 'pilar4' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }">
            <i data-lucide="life-buoy" class="w-3 h-3"></i>
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
                      onclick="civikaApp.speakStepGuide('${step.id}', this)"
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

          <!-- CONEXIÓN ENTRE TRÁMITES (RUTA ENCADENADA DEL EMPRENDEDOR) -->
          ${(isDone && step.conexionSiguienteTramite) ? `
            <div class="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs shadow-sm animate-fade-in space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  🔗 Ruta Encadenada Activa
                </span>
                <span class="text-[10px] font-bold text-emerald-100">Coherencia CIIU y Dirección</span>
              </div>
              <p class="text-[11px] text-emerald-50 leading-relaxed">${step.conexionSiguienteTramite.mensajeEncadenado}</p>
              ${step.conexionSiguienteTramite.siguienteId !== "pasaporte_qr" ? `
                <button type="button"
                        onclick="document.getElementById('step-card-${step.conexionSiguienteTramite.siguienteId}')?.scrollIntoView({behavior:'smooth', block:'center'})"
                        class="mt-1 inline-flex items-center gap-1 bg-white text-emerald-800 font-extrabold text-[11px] px-3 py-1 rounded-lg shadow-2xs hover:bg-emerald-50 transition">
                  <span>Ir al Paso 0${step.conexionSiguienteTramite.siguientePasoNumero}: ${step.conexionSiguienteTramite.siguienteTitulo}</span>
                  <i data-lucide="arrow-down-right" class="w-3.5 h-3.5"></i>
                </button>
              ` : `
                <button type="button"
                        onclick="civikaApp.scrollToSection('govukPassportSection')"
                        class="mt-1 inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-extrabold text-[11px] px-3 py-1 rounded-lg shadow-2xs hover:bg-amber-300 transition">
                  <span>🪪 Generar mi Pasaporte de Trámite con Código QR</span>
                  <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
                </button>
              `}
            </div>
          ` : ''}

          <!-- Botones de Acción del Servicio -->
          <div class="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            <button type="button"
                    onclick="civikaApp.openDocumentViewer('${step.id}', 'sheet')"
                    class="flex-1 min-w-[155px] py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>Ver Documento Oficial</span>
            </button>

            <button type="button"
                    onclick="civikaApp.openDocumentViewer('${step.id}', 'justification')"
                    class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200">
              <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Ficha Completa</span>
            </button>

            <button type="button"
                    onclick="civikaApp.downloadOrPrintDocument('${step.id}')"
                    class="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-200">
              <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>PDF</span>
            </button>

            <a href="${step.enlaceOficial}" target="_blank" rel="noopener noreferrer"
               class="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs transition border border-slate-200 flex items-center justify-center shrink-0"
               title="Abrir portal oficial de ${step.entidad}">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');

    if (window.civikaFeatures) window.civikaFeatures.afterStepsRender(container);

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
  // 8. VISUALIZADOR MODAL DE DOCUMENTO OFICIAL Y LOS 4 PILARES
  // ==============================================================
  openDocumentViewer(stepId, mode = "justification") {
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
              <button type="button" onclick="civikaApp.speakStepGuide('${step.id}', this)"
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

  downloadOrPrintDocument(stepId) {
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
        <script src="js/vendor/tailwindcss.js"></script>
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

  async saveStateToStorage() {
    try {
      if (window.civikaDB) {
        await window.civikaDB.saveStepsProgress(this.stepsState, this.selectedBusinessId);
        await window.civikaDB.saveChecklistChecks(this.checklistChecks);
        await window.civikaDB.saveDiagnosticAnswers(this.diagnosticAnswers);
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

document.addEventListener("DOMContentLoaded", () => {
  window.civikaApp = new CivikaApp();

  // Accesibilidad: cerrar ventanas emergentes con la tecla Esc o tocando el fondo oscuro
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
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
