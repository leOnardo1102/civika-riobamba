/**
 * CIVIKA - Chatbot Copiloto Inteligente GovTech (Bürokratt / LifeSG / GOV.UK Architecture)
 * Hackathon INNOVAiLAB UNACH 2026 - Riobamba, Ecuador
 * Incluye:
 * - Memoria de Contexto Activa (Negocio seleccionado, Servicio activo, Parroquia, Régimen)
 * - Quick Replies (Chips dinámicos debajo de cada respuesta según el trámite activo)
 * - Rich Cards Visuales (Alertas rojas "Previene rechazo en ventanilla", Comparativas "Trámite Oficial vs. Estafa de Tramitadores", Plan B accionable)
 * - Chat por Voz (Speech-to-Text en es-EC / es-ES) y Botón "Escuchar guía" (Text-to-Speech)
 */

class CivikaAssistant {
  constructor() {
    this.conversationHistory = [];
    this.contextMemory = {
      activeServiceId: "req_ruc",
      activeBusinessId: "tienda_ropa",
      activeBusinessName: "Tienda de Ropa y Calzado",
      parroquia: "Maldonado",
      regimenSRI: "RIMPE Negocio Popular",
      tenenciaLocal: "arrendado",
      esArtesano: false
    };
    this.isTyping = false;
    this.isListening = false;
    this.recognition = null;
    this.activeUtterance = null;
    this.setupSpeechRecognition();
  }

  init() {
    this.syncWithAppState();
    this.updateContextBanner();

    const welcomeCard = {
      type: "anti_scam",
      title: "Escudo Ciudadano Anti-Tramitadores • Riobamba",
      officialText: "Inscripción RUC ($0.00), Exoneración ARCSA Microempresas/Artesanos ($0.00) y Exoneración Impuesto Patente Artesanos JNDA (Art. 550 COOTAD).",
      scamText: "Tramitadores informales cobran entre $40 y $120 USD por formularios gratuitos y piden tu clave personal del SRI.",
      preventionRule: "🔒 Regla de Oro Cívika: Jamás pedimos contraseñas ni claves del SRI."
    };

    this.addBotMessage(
      `¡Hola! Soy **Cívika**, tu Copiloto GovTech para emprendedores de **Riobamba**. 🏛️\n\n` +
      `Recuerdo en todo momento tu negocio activo (**${this.contextMemory.activeBusinessName}**) para darte respuestas exactas sobre **SRI (RUC/RIMPE)**, **Cuerpo de Bomberos**, **GAD Municipal de Riobamba (Uso de Suelo, Patente, LUF)** y **ARCSA**.\n\n` +
      `Puedes escribir, usar los **chips dinámicos** o presionar el **micrófono 🎙️** para hablarme:`,
      [
        { label: "🧭 Abrir los 4 Pilares de mi Trámite", action: () => window.civikaApp?.goToScreen("screen-unified-forms") },
        { label: "🚦 Ir al Auditor Pre-Ventanilla", action: () => window.civikaApp?.scrollToSection("preWindowAuditorSection") },
        { label: "🪪 Generar Pasaporte QR", action: () => window.civikaApp?.scrollToSection("govukPassportSection") }
      ],
      welcomeCard,
      this.getDynamicQuickReplies("req_ruc")
    );
  }

  /**
   * Sincroniza la memoria de contexto del bot con el negocio y paso activo en CivikaApp
   */
  syncWithAppState() {
    if (!window.civikaApp) return;
    const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(
      b => b.id === window.civikaApp.selectedBusinessId
    );
    if (biz) {
      this.contextMemory.activeBusinessId = biz.id;
      this.contextMemory.activeBusinessName = biz.nombre;
      this.contextMemory.esArtesano = biz.id === "artesanal";
      this.contextMemory.regimenSRI = biz.id === "profesional"
        ? "Régimen General (Excluido de RIMPE)"
        : biz.id === "artesanal"
          ? "Régimen Artesanal Calificado (JNDA/MIPRO)"
          : "RIMPE (Negocio Popular / Emprendedor)";
    }
    this.updateContextBanner();
  }

  setContext({ serviceId, businessId, parroquia }) {
    if (serviceId) this.contextMemory.activeServiceId = serviceId;
    if (businessId) {
      this.contextMemory.activeBusinessId = businessId;
      const biz = CIVIKA_KNOWLEDGE_BASE.emprendimientosComunes.find(b => b.id === businessId);
      if (biz) this.contextMemory.activeBusinessName = biz.nombre;
    }
    if (parroquia) this.contextMemory.parroquia = parroquia;
    this.updateContextBanner();
  }

  updateContextBanner() {
    const bannerEl = document.getElementById("chatContextMemoryBadge");
    if (!bannerEl) return;
    const step = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === this.contextMemory.activeServiceId)
      || CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[0];

    bannerEl.innerHTML = `
      <span class="inline-flex items-center gap-1 font-bold text-blue-800">
        <i data-lucide="cpu" class="w-3 h-3 text-blue-600"></i>
        <span>Memoria Activa:</span>
      </span>
      <span class="bg-white px-2 py-0.5 rounded-md border border-blue-200 font-semibold text-slate-700">${this.contextMemory.activeBusinessName}</span>
      <span class="text-slate-400">•</span>
      <span class="bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded-md font-semibold">Paso 0${step.paso}: ${step.nombre.split('(')[0].trim()}</span>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Genera Quick Replies (Chips dinámicos) según el servicio/trámite activo en memoria
   */
  getDynamicQuickReplies(serviceId = this.contextMemory.activeServiceId) {
    const commonChips = [
      "¿Qué régimen RIMPE me toca?",
      "Error común a evitar",
      "Activar Plan B",
      "¿Cuánto cuesta realmente?"
    ];

    const specificByService = {
      req_ruc: [
        "¿Qué régimen RIMPE me toca?",
        "Error común a evitar en RUC",
        "Activar Plan B (Planilla a nombre del arrendador)",
        "¿Cuánto cuesta realmente el RUC?"
      ],
      req_bomberos: [
        "¿Qué extintor exige Bomberos Riobamba?",
        "Error común a evitar en inspección",
        "Activar Plan B (No tengo el predial del dueño)",
        "¿Cuánto cuesta realmente Bomberos?"
      ],
      req_uso_suelo: [
        "¿Cómo saco el Uso de Suelo (ICUS) en Riobamba?",
        "Error común a evitar con la Clave Catastral",
        "Activar Plan B (Sistema municipal lento)",
        "¿Cuánto cuesta realmente el Uso de Suelo?"
      ],
      req_solvencia: [
        "¿Cómo descargo el Certificado de No Adeudar?",
        "Error común a evitar (Vigencia 30 días)",
        "Activar Plan B (Convenio de pago)",
        "¿Cuánto cuesta realmente la solvencia?"
      ],
      req_formulario_patente: [
        "¿Cómo funciona la exoneración artesanal Art. 550 COOTAD?",
        "Error común a evitar en Patente Municipal",
        "Activar Plan B (Contrato de arriendo simple)",
        "¿Cuánto cuesta realmente la Patente?"
      ],
      req_luf_final: [
        "¿Mi negocio necesita permiso ARCSA o está exento?",
        "Exoneración ARCSA $0.00 Microempresas y Artesanos",
        "Error común a evitar en Ventanilla Única",
        "Generar mi Pasaporte QR"
      ]
    };

    return specificByService[serviceId] || commonChips;
  }

  processUserMessage(text) {
    if (!text || text.trim() === "") return;
    const cleanText = text.trim();
    this.syncWithAppState();
    this.addUserMessage(cleanText);
    this.showTypingIndicator();

    // Registrar telemetría anónima en db.js
    if (window.civikaDB) {
      window.civikaDB.recordAnonymousMetric({
        parroquia: this.contextMemory.parroquia,
        actividad: this.contextMemory.activeBusinessName,
        evento: "consulta_copiloto_ia"
      });
    }

    // Respuesta guiada (siempre se calcula: actualiza el contexto y sirve de respaldo)
    const guided = this.analyzeIntentAndRespond(cleanText);
    const quick = guided.quickReplies || this.getDynamicQuickReplies(this.contextMemory.activeServiceId);
    const ai = window.civikaAI;

    if (ai && ai.enabled) {
      ai.remember("user", cleanText);
      ai.ask(cleanText)
        .then((res) => {
          this.hideTypingIndicator();
          if (res && res.ok && res.text) {
            ai.remember("assistant", res.text);
            this.addBotMessage(this.prepareAiText(res.text), guided.actions, null, quick, { ai: true, label: ai.label });
          } else {
            this.addBotMessage(this.aiFallbackNote(res && res.error) + guided.text, guided.actions, guided.richCard, quick);
          }
        })
        .catch(() => {
          this.hideTypingIndicator();
          this.addBotMessage(guided.text, guided.actions, guided.richCard, quick);
        });
      return;
    }

    setTimeout(() => {
      this.hideTypingIndicator();
      this.addBotMessage(guided.text, guided.actions, guided.richCard, quick);
    }, 450);
  }

  // Texto de la IA: se escapa todo el HTML y se convierten las viñetas "- " al formato del chat
  prepareAiText(text) {
    return this.escapeHtml(String(text || ""))
      .replace(/^\s*[-*]\s+/gm, "• ")
      .replace(/^#{1,6}\s*/gm, "");
  }

  aiFallbackNote(error) {
    const notes = {
      limite: "La IA alcanzó su límite gratuito por ahora. Te respondo con la guía de Cívika:\n\n",
      limite_sesion: "Llegaste al máximo de preguntas a la IA en esta sesión. Te respondo con la guía de Cívika:\n\n",
      clave_invalida: "La IA no está bien configurada (clave). Te respondo con la guía de Cívika:\n\n",
      sin_conexion: "No pude conectar con la IA. Te respondo con la guía de Cívika:\n\n"
    };
    return notes[error] || "";
  }

  analyzeIntentAndRespond(input) {
    const text = input.toLowerCase().trim();

    // Actualizar memoria si el usuario menciona un negocio específico
    if (text.includes("ropa") || text.includes("calzado") || text.includes("boutique")) {
      window.civikaApp?.selectBusiness("tienda_ropa");
      this.setContext({ businessId: "tienda_ropa" });
    } else if (text.includes("restaurante") || text.includes("comedor") || text.includes("almuerzos")) {
      window.civikaApp?.selectBusiness("restaurante");
      this.setContext({ businessId: "restaurante" });
    } else if (text.includes("cafeter") || text.includes("cafe") || text.includes("café")) {
      window.civikaApp?.selectBusiness("cafeteria");
      this.setContext({ businessId: "cafeteria" });
    } else if (text.includes("peluquer") || text.includes("barber") || text.includes("salón de belleza") || text.includes("salon de belleza") || /\bspa\b/.test(text)) {
      window.civikaApp?.selectBusiness("peluqueria");
      this.setContext({ businessId: "peluqueria" });
    } else if (text.includes("farmacia") || text.includes("botiquín") || text.includes("botiquin") || text.includes("medicamento")) {
      window.civikaApp?.selectBusiness("farmacia");
      this.setContext({ businessId: "farmacia" });
    } else if (text.includes("redes") || text.includes("instagram") || text.includes("facebook") || text.includes("tiktok") || text.includes("en línea") || text.includes("online") || text.includes("desde casa")) {
      window.civikaApp?.selectBusiness("venta_redes");
      this.setContext({ businessId: "venta_redes" });
    } else if (text.includes("tienda de barrio") || text.includes("micromercado") || text.includes("abarrotes")) {
      window.civikaApp?.selectBusiness("micromercado");
      this.setContext({ businessId: "micromercado" });
    } else if (text.includes("profesional") || text.includes("consultorio") || text.includes("abogado") || text.includes("médico") || text.includes("medico") || text.includes("ingeniero")) {
      window.civikaApp?.selectBusiness("profesional");
      this.setContext({ businessId: "profesional" });
    } else if (text.includes("mecánic") || text.includes("mecanic") || text.includes("lubricadora")) {
      window.civikaApp?.selectBusiness("taller");
      this.setContext({ businessId: "taller" });
    } else if (text.includes("artesan")) {
      window.civikaApp?.selectBusiness("artesanal");
      this.setContext({ businessId: "artesanal" });
    }

    // 1. INTENT: ¿Qué régimen RIMPE me toca? / RUC / SRI
    if (text.includes("rimpe") || text.includes("regimen") || text.includes("régimen") || text.includes("ruc") || text.includes("sri")) {
      this.setContext({ serviceId: "req_ruc" });
      const stepRuc = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[0];

      return {
        text: `📑 **Diagnóstico Tributario SRI para tu ${this.contextMemory.activeBusinessName}:**\n\n` +
              `Según la normativa vigente del **Servicio de Rentas Internas (SRI)** en Ecuador:\n\n` +
              `1️⃣ **RIMPE - Negocio Popular:** Para personas naturales con ingresos brutos anuales de **$0 a $20,000 USD**. Emites notas de venta y no declaras IVA mensual/semestral.\n` +
              `2️⃣ **RIMPE - Emprendedor:** Para ingresos brutos anuales de **$20,001 a $300,000 USD**. Requiere facturación electrónica y declaración semestral de IVA.\n` +
              `3️⃣ **RÉGIMEN GENERAL (Exclusión Legal):** Si tu actividad es de **Servicios Profesionales con título SENESCYT** (médico, abogado, ingeniero, contador), la ley **te excluye del RIMPE** aunque factures menos de $20,000.\n` +
              `4️⃣ **Artesano Calificado (JNDA/MIPRO):** Facturas con tarifa 0% de IVA en productos/servicios de tu taller artesanal.\n\n` +
              `🔗 **Ruta Encadenada:** ${stepRuc.conexionSiguienteTramite.mensajeEncadenado}`,
        richCard: {
          type: "error_prevention",
          badge: "PREVIENE RECHAZO EN VENTANILLA • PASO 01 (SRI)",
          title: "Coherencia obligatoria entre Planilla de Luz y RUC",
          alertText: "El SRI exige una planilla de servicio básico (luz EERSA o agua) de los ÚLTIMOS 3 MESES. Si la calle o intersección que registras en el RUC difiere de las que pondrás en Bomberos o en Uso de Suelo del GAD Riobamba, tu carpeta municipal rebotará.",
          solutionText: "Usa nuestro Auditor Pre-Ventanilla en Cívika para verificar tu planilla antes de ir."
        },
        actions: [
          { label: "📄 Ver los 4 Pilares del RUC (Paso 1)", action: () => window.civikaApp?.openDocumentViewer("req_ruc", "justification") },
          { label: "🚦 Auditar mi Planilla / RUC", action: () => window.civikaApp?.scrollToSection("preWindowAuditorSection") }
        ],
        quickReplies: this.getDynamicQuickReplies("req_ruc")
      };
    }

    // 2. INTENT: ARCSA / Permiso Sanitario / Exoneración Microempresas y Artesanos
    if (text.includes("arcsa") || text.includes("sanitari") || text.includes("alimento") || text.includes("microempresa")) {
      this.setContext({ serviceId: "req_luf_final" });
      return {
        text: `🛡️ **Normativa Real de la ARCSA para Emprendedores de Riobamba:**\n\n` +
              `Analizando tu perfil (**${this.contextMemory.activeBusinessName}**), aplica esta regla oficial:\n\n` +
              `• **1. Establecimientos EXENTOS de sacar Permiso Físico ARCSA:** Por resoluciones de simplificación de trámites, las **tiendas de abarrotes, micromercados, panaderías tradicionales, fuentes de soda y heladerías** no requieren tramitar el permiso anual de funcionamiento (pero sí están sujetas a control posterior de higiene y fechas de caducidad). ⚠️ **Cambio 2026:** ARCSA ahora sí exige permiso a **peluquerías, barberías, salones de belleza y spa** (microempresas exentas de pago).\n` +
              `• **Restaurantes y farmacias:** requieren Permiso de Funcionamiento ARCSA con vigencia de 1 año. Las farmacias necesitan además un químico farmacéutico responsable técnico.\n` +
              `• **2. Exoneración de Pago (Tasa $0.00 USD):** Si tu giro sí requiere permiso (ej. restaurante de mayor escala o planta procesadora de alimentos) y estás registrado como **Microempresa** o **Artesano Calificado (JNDA/MIPRO)**, el sistema automatizado de la ARCSA emite la orden de pago en **$0.00 USD**.\n` +
              `• **3. Comercio no alimentario (ej. Tienda de Ropa o Taller Mecánico):** No requiere permiso sanitario ARCSA.`,
        richCard: {
          type: "anti_scam",
          title: "Trámite Oficial ARCSA vs. Estafa de Tramitadores",
          officialText: "Tasa oficial en permisosfuncionamiento.controlsanitario.gob.ec: $0.00 USD para Microempresas, Artesanos Calificados y negocios exentos por simplificación.",
          scamText: "Tramitadores cobran entre $50 y $150 USD inventando tasas sanitarias para tiendas de barrio o microempresas.",
          preventionRule: "Ingresa directamente con tu RUC activo al portal oficial de la ARCSA."
        },
        actions: [
          { label: "🏆 Ver Ficha LUF + ARCSA (Paso 6)", action: () => window.civikaApp?.openDocumentViewer("req_luf_final", "justification") },
          { label: "🌐 Abrir Portal Oficial ARCSA", action: () => window.open("https://permisosfuncionamiento.controlsanitario.gob.ec", "_blank") }
        ],
        quickReplies: this.getDynamicQuickReplies("req_luf_final")
      };
    }

    // 3. INTENT: Error común a evitar (Pilar 3: Prevención de Errores Críticos)
    if (text.includes("error") || text.includes("evitar") || text.includes("rebota") || text.includes("rechaz")) {
      const activeStep = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === this.contextMemory.activeServiceId)
        || CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[0];
      const errores = activeStep.pilares?.pasosConPrevencion || [];

      return {
        text: `🚨 **Pilar 3: Prevención de Errores Críticos en ${activeStep.nombre}**\n\n` +
              `Para tu **${this.contextMemory.activeBusinessName}**, estos son los motivos reales por los que una carpeta rebota en las ventanillas de Riobamba:\n\n` +
              errores.map(e => `• **Paso ${e.orden}:** ${e.accion}\n  ⚠️ *${e.alertaCritica}*`).join("\n\n"),
        richCard: {
          type: "error_prevention",
          badge: `ALERTA PREVENTIVA • PASO 0${activeStep.paso}`,
          title: `Qué hace rebotar el trámite de ${activeStep.nombre.split('(')[0]}`,
          alertText: errores[0]?.alertaCritica || "Inconsistencia entre la dirección del RUC y la clave catastral del predio.",
          solutionText: "Completa el Checklist Personalizado (Pilar 2) y pasa tus archivos por el Auditor Pre-Ventanilla."
        },
        actions: [
          { label: `👁️ Abrir Ficha del Paso 0${activeStep.paso}`, action: () => window.civikaApp?.openDocumentViewer(activeStep.id, "justification") },
          { label: "🚦 Validar Archivos en el Auditor", action: () => window.civikaApp?.scrollToSection("preWindowAuditorSection") }
        ],
        quickReplies: this.getDynamicQuickReplies(activeStep.id)
      };
    }

    // 4. INTENT: Activar Plan B (Pilar 4: Plan B Accionable)
    if (text.includes("plan b") || text.includes("arrendad") || text.includes("dueño") || text.includes("sistema") || text.includes("caido") || text.includes("caído") || text.includes("intermitente")) {
      const activeStep = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === this.contextMemory.activeServiceId)
        || CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[0];
      const planesB = activeStep.pilares?.planBAccionable || [];

      return {
        text: `🛠️ **Pilar 4: Plan B Accionable activado para ${activeStep.nombre}**\n\n` +
              `Si tienes un bloqueo con tu **${this.contextMemory.activeBusinessName}**, aplica estas soluciones legales inmediatas en Riobamba:\n\n` +
              planesB.map(p => `🔹 **${p.escenario}**\n✅ *Solución:* ${p.solucion}`).join("\n\n"),
        richCard: {
          type: "plan_b",
          badge: `PLAN B ACCIONABLE • PASO 0${activeStep.paso}`,
          title: "Ruta de contingencia verificada en Riobamba",
          scenario: planesB[0]?.escenario || "¿Local arrendado o portal web intermitente?",
          solution: planesB[0]?.solucion || "Presenta la planilla o pago predial a nombre del arrendador junto con tu contrato de arriendo."
        },
        actions: [
          { label: "📊 Ver Estado en Vivo de Portales (SRI/GAD)", action: () => window.civikaApp?.openLiveMetricsModal() },
          { label: "📍 Ver Dirección y Horario de Ventanilla", action: () => window.civikaApp?.goToScreen("screen-institutions") }
        ],
        quickReplies: this.getDynamicQuickReplies(activeStep.id)
      };
    }

    // 5. INTENT: ¿Cuánto cuesta realmente? / Costos / Tramitadores
    if (text.includes("cuesta") || text.includes("costo") || text.includes("valor") || text.includes("precio") || text.includes("tasa") || text.includes("tramitador")) {
      return {
        text: `💰 **Transparencia Normativa de Costos en Riobamba (Cero Cifras Inventadas):**\n\n` +
              `Cumpliendo con nuestra regla estricta de veracidad institucional:\n\n` +
              `1. **RUC / RIMPE (SRI):** **$0.00 USD** (100% gratuito en línea o en agencia).\n` +
              `2. **ARCSA (Permiso / Exoneración):** **$0.00 USD** para tiendas/panaderías exentas y **$0.00 USD** (exonerado de tasa) para Microempresas y Artesanos Calificados.\n` +
              `3. **Permiso Cuerpo de Bomberos de Riobamba:** *Sujeto a cálculo oficial según la categoría de riesgo, actividad y metraje (m²) del local en el portal de Bomberos.*\n` +
              `4. **Uso de Suelo (ICUS) y Certificado de No Adeudar (GAD Riobamba):** *Sujeto a tasa administrativa municipal vigente por especie valorada.*\n` +
              `5. **Impuesto de Patente Municipal Anual (GAD Riobamba):** *Sujeto a cálculo en la Jefatura de Rentas según el capital propio declarado y la ordenanza vigente* (**Artesanos Calificados JNDA/MIPRO: Exonerados 100% del impuesto de patente según el Art. 550 del COOTAD**).`,
        richCard: {
          type: "anti_scam",
          title: "Trámite Oficial vs. Estafa de Tramitadores en Riobamba",
          officialText: "Pagas únicamente las especies o tasas liquidadas oficialmente en las cajas de Recaudación del GAD Riobamba o Bomberos con comprobante a tu nombre.",
          scamText: "Tramitadores cobran entre $50 y $120 USD adicionales en efectivo por trámites cuyo formulario y guía obtienes gratis aquí.",
          preventionRule: "Genera tu Formulario Borrador No Sensible y tu Pasaporte QR gratis en Cívika."
        },
        actions: [
          { label: "🪪 Crear Borrador y Pasaporte QR Gratis", action: () => window.civikaApp?.scrollToSection("govukPassportSection") },
          { label: "📋 Ver los 6 Pasos Oficiales", action: () => window.civikaApp?.goToScreen("screen-unified-forms") }
        ],
        quickReplies: this.getDynamicQuickReplies(this.contextMemory.activeServiceId)
      };
    }

    // 6. INTENT: Bomberos Riobamba / Extintor
    if (text.includes("bombero") || text.includes("extintor") || text.includes("inspecci")) {
      this.setContext({ serviceId: "req_bomberos" });
      const stepBomberos = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[1];
      return {
        text: `🚒 **Paso 02: Permiso Anual del Cuerpo de Bomberos de Riobamba**\n\n` +
              `Para tu **${this.contextMemory.activeBusinessName}**:\n` +
              `• **Equipamiento mínimo verificado en inspección:** Extintor PQS de mínimo 10 lbs (o CO2 según riesgo) con recarga anual vigente y manómetro en verde, instalado a máximo 1.50 m del suelo; lámpara de luz de emergencia conectada; botiquín básico y señalética ISO (Salida, Extintor, Riesgo Eléctrico).\n` +
              `• **Requisitos:** RUC activo, copia de cédula y comprobante del Impuesto Predial del año vigente.\n` +
              `• **Ubicación:** Plataforma web \`bomberosriobamba.gob.ec\` o Calles Chile 26-56 y Pichincha.\n\n` +
              `🔗 **Ruta Encadenada:** ${stepBomberos.conexionSiguienteTramite.mensajeEncadenado}`,
        richCard: {
          type: "error_prevention",
          badge: "PREVIENE RECHAZO EN INSPECCIÓN • PASO 02",
          title: "No solicites la inspección sin antes colgar el extintor",
          alertText: "Si el inspector visita tu local y el extintor está en el piso, descargado o los cables eléctricos están sueltos sin canaleta, dejará un acta de observación y no podrás sacar la Patente.",
          solutionText: "Revisa las 4 casillas del Checklist de Bomberos en la Pestaña de Trámites."
        },
        actions: [
          { label: "🚒 Ver 4 Pilares de Bomberos", action: () => window.civikaApp?.openDocumentViewer("req_bomberos", "justification") },
          { label: "📍 Ver Bomberos en el Mapa", action: () => { window.civikaApp?.goToScreen("screen-institutions"); window.selectInstitutionMap?.("bomberos_riobamba"); } }
        ],
        quickReplies: this.getDynamicQuickReplies("req_bomberos")
      };
    }

    // 7. INTENT: Uso de Suelo (ICUS - PUGS)
    if (text.includes("suelo") || text.includes("icus") || text.includes("pugs") || text.includes("catastral") || text.includes("zonificaci")) {
      this.setContext({ serviceId: "req_uso_suelo" });
      const stepSuelo = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[2];
      return {
        text: `🗺️ **Paso 03: Informe de Compatibilidad de Uso de Suelo (ICUS - PUGS Riobamba)**\n\n` +
              `Certifica si el Plan de Uso y Gestión del Suelo del **GAD Municipal de Riobamba** autoriza tu **${this.contextMemory.activeBusinessName}** en ese predio.\n\n` +
              `• **Requisito clave:** La **Clave Catastral** del inmueble (la encuentras en el comprobante de pago del Impuesto Predial del año en curso) y fotografías de la fachada e interior del local.\n\n` +
              `🔗 **Ruta Encadenada:** ${stepSuelo.conexionSiguienteTramite.mensajeEncadenado}`,
        richCard: {
          type: "error_prevention",
          badge: "ALERTA FINANCIERA • PASO 03 (PUGS)",
          title: "Verifica el Uso de Suelo antes de firmar arriendo en giros críticos",
          alertText: "En talleres mecánicos, lubricadoras o locales nocturnos, jamás pagues garantía de arriendo sin tener antes el ICUS con dictamen COMPATIBLE.",
          solutionText: "Consulta con la clave catastral del dueño del local en Ordenamiento Territorial (5 de Junio y Veloz)."
        },
        actions: [
          { label: "🗺️ Ver 4 Pilares de Uso de Suelo", action: () => window.civikaApp?.openDocumentViewer("req_uso_suelo", "justification") }
        ],
        quickReplies: this.getDynamicQuickReplies("req_uso_suelo")
      };
    }

    // 8. INTENT: Patente Municipal / Artesanos Art. 550 COOTAD / LUF
    if (text.includes("patente") || text.includes("cootad") || text.includes("550") || text.includes("luf") || text.includes("carpeta") || text.includes("pasaporte")) {
      this.setContext({ serviceId: "req_formulario_patente" });
      const stepPatente = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[4];
      return {
        text: `🏛️ **Paso 05 y 06: Patente Municipal Anual y LUF (GAD Municipal de Riobamba)**\n\n` +
              `• **Plazo legal (COOTAD):** Dentro de los 30 días siguientes al inicio de tu actividad económica.\n` +
              `• **Exoneración Artesanal (Art. 550 COOTAD):** Si eres **Artesano Calificado (JNDA/MIPRO)**, estás **exonerado del 100% del impuesto de Patente Municipal**, pero tienes la obligación formal de presentar el formulario y tu carnet artesanal en Rentas para registrar tu patente exonerada y obtener la LUF.\n` +
              `• **Firma obligatoria:** Firma el formulario con **bolígrafo azul** idéntico a tu cédula de identidad.\n\n` +
              `🔗 **Ruta Encadenada:** ${stepPatente.conexionSiguienteTramite.mensajeEncadenado}`,
        richCard: {
          type: "error_prevention",
          badge: "CARPETA CERO RECHAZOS • VENTANILLA ÚNICA",
          title: "Foliado oficial de tu carpeta manila para el GAD Riobamba",
          alertText: "El 48% de los rechazos ocurren por firmas que no coinciden con la cédula o por olvidar el Certificado de No Adeudar (vigencia 30 días).",
          solutionText: "Genera tu Pasaporte de Trámite con Código QR en Cívika y pégalo en la portada de tu carpeta."
        },
        actions: [
          { label: "📋 Ver 4 Pilares de Patente Municipal", action: () => window.civikaApp?.openDocumentViewer("req_formulario_patente", "justification") },
          { label: "🪪 Ir al Generador de Pasaporte QR", action: () => window.civikaApp?.scrollToSection("govukPassportSection") }
        ],
        quickReplies: this.getDynamicQuickReplies("req_formulario_patente")
      };
    }

    // Respuesta contextual guiada por defecto usando la Memoria de Contexto
    const currentStep = CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales.find(s => s.id === this.contextMemory.activeServiceId)
      || CIVIKA_KNOWLEDGE_BASE.pasosSecuenciales[0];

    return {
      text: `He procesado tu consulta: *"${input}"* teniendo en cuenta tu perfil activo (**${this.contextMemory.activeBusinessName}** en Riobamba).\n\n` +
            `En este momento te encuentras en el **Paso 0${currentStep.paso}: ${currentStep.nombre}**.\n\n` +
            `¿Qué deseas revisar sobre este trámite o tu carpeta municipal?`,
      richCard: {
        type: "plan_b",
        badge: "COPILOTO CONTEXTUAL CÍVIKA",
        title: `Ruta activa para ${this.contextMemory.activeBusinessName}`,
        scenario: `Régimen sugerido: ${this.contextMemory.regimenSRI}`,
        solution: currentStep.conexionSiguienteTramite?.mensajeEncadenado || "Sigue los 6 pasos en orden y valida tus archivos en el Auditor Pre-Ventanilla."
      },
      actions: [
        { label: `📂 Ver 4 Pilares del Paso 0${currentStep.paso}`, action: () => window.civikaApp?.openDocumentViewer(currentStep.id, "justification") },
        { label: "🚦 Auditar Documentos (Semáforo Local)", action: () => window.civikaApp?.scrollToSection("preWindowAuditorSection") },
        { label: "🪪 Generar Pasaporte de Trámite QR", action: () => window.civikaApp?.scrollToSection("govukPassportSection") }
      ],
      quickReplies: this.getDynamicQuickReplies(currentStep.id)
    };
  }

  /**
   * Renderiza Rich Cards dentro del chat (Prevención de Rechazo, Oficial vs Estafa, Plan B)
   */
  renderRichCardHtml(card) {
    if (!card) return "";

    if (card.type === "error_prevention") {
      return `
        <div class="mt-2.5 rounded-xl border-2 border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-950 shadow-xs">
          <div class="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider text-rose-700 mb-1">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-rose-600 shrink-0"></i>
            <span>${card.badge || "PREVIENE RECHAZO EN VENTANILLA"}</span>
          </div>
          <h5 class="font-extrabold text-rose-900 text-xs">${card.title}</h5>
          <p class="mt-1 text-[11px] text-rose-800 leading-relaxed">${card.alertText}</p>
          <div class="mt-2 pt-1.5 border-t border-rose-200/80 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
            <span>${card.solutionText}</span>
          </div>
        </div>
      `;
    }

    if (card.type === "anti_scam") {
      return `
        <div class="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
              ⚖️ Comparativa de Transparencia
            </span>
          </div>
          <h5 class="font-extrabold text-slate-800 text-xs">${card.title}</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-950">
              <span class="font-extrabold text-emerald-800 block mb-0.5">✅ Trámite Oficial:</span>
              <span>${card.officialText}</span>
            </div>
            <div class="bg-rose-50 border border-rose-200 rounded-lg p-2 text-rose-950">
              <span class="font-extrabold text-rose-800 block mb-0.5">🚫 Estafa Tramitadores:</span>
              <span>${card.scamText}</span>
            </div>
          </div>
          <p class="text-[10px] font-bold text-slate-600 pt-0.5">${card.preventionRule}</p>
        </div>
      `;
    }

    if (card.type === "plan_b") {
      return `
        <div class="mt-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 shadow-xs">
          <div class="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider text-amber-800 mb-1">
            <i data-lucide="life-buoy" class="w-3.5 h-3.5 text-amber-600 shrink-0"></i>
            <span>${card.badge || "PLAN B ACCIONABLE"}</span>
          </div>
          <h5 class="font-extrabold text-amber-950 text-xs">${card.title}</h5>
          <p class="mt-1 text-[11px] font-semibold text-amber-900">${card.scenario}</p>
          <p class="mt-1 text-[11px] text-amber-800 leading-relaxed">${card.solution}</p>
        </div>
      `;
    }

    return "";
  }

  addUserMessage(text) {
    const chatContainer = document.getElementById("chatMessages");
    if (!chatContainer) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "flex justify-end mb-3 animate-fade-in";
    msgDiv.innerHTML = `
      <div class="max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-xs sm:text-sm shadow-sm leading-relaxed">
        ${this.escapeHtml(text)}
      </div>
    `;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  addBotMessage(markdownText, actions = null, richCard = null, quickReplies = null, opts = {}) {
    const chatContainer = document.getElementById("chatMessages");
    if (!chatContainer) return;

    const htmlContent = this.formatMarkdown(markdownText);
    const plainTextForSpeech = markdownText.replace(/[*#_`~]/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    const headerLabel = opts.ai ? `Copiloto Cívika · IA${opts.label ? " (" + this.escapeHtml(opts.label) + ")" : ""}` : "Copiloto Cívika • Riobamba";
    const aiNote = opts.ai
      ? `<p class="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">Respuesta generada con IA a partir de la guía de Cívika. Confirma costos y plazos en la entidad oficial.</p>`
      : "";
    const msgDiv = document.createElement("div");
    msgDiv.className = "flex items-start gap-2.5 mb-3.5 animate-fade-in";

    const richCardHtml = this.renderRichCardHtml(richCard);

    let actionsHtml = "";
    if (actions && actions.length > 0) {
      actionsHtml = `
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
          ${actions.map((act, idx) => `
            <button type="button" class="chat-action-btn bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-2xs transition text-left"
                    data-action-index="${idx}">
              ${act.label}
            </button>
          `).join('')}
        </div>
      `;
    }

    let quickRepliesHtml = "";
    if (quickReplies && quickReplies.length > 0) {
      quickRepliesHtml = `
        <div class="mt-2.5 pt-2 border-t border-slate-100">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Sugerencias contextuales (Quick Replies):
          </span>
          <div class="flex flex-wrap gap-1.5">
            ${quickReplies.map(chip => `
              <button type="button" class="chat-quick-chip bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 text-[11px] font-semibold transition">
                ${this.escapeHtml(chip)}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    msgDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <i data-lucide="sparkles" class="w-4 h-4"></i>
      </div>
      <div class="max-w-[88%] bg-white text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs sm:text-sm shadow-sm border border-slate-200/80 leading-relaxed">
        <div class="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">${headerLabel}</span>
          <button type="button" class="tts-listen-btn inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 transition"
                  title="Escuchar respuesta en voz alta">
            <i data-lucide="volume-2" class="w-3 h-3"></i>
            <span>Escuchar guía</span>
          </button>
        </div>
        <div>${htmlContent}</div>
        ${aiNote}
        ${richCardHtml}
        ${actionsHtml}
        ${quickRepliesHtml}
      </div>
    `;

    chatContainer.appendChild(msgDiv);

    // Bind TTS button
    const ttsBtn = msgDiv.querySelector(".tts-listen-btn");
    if (ttsBtn) {
      ttsBtn.addEventListener("click", () => {
        this.speakText(plainTextForSpeech, ttsBtn);
      });
    }

    // Bind action buttons
    if (actions && actions.length > 0) {
      msgDiv.querySelectorAll(".chat-action-btn").forEach(btn => {
        const index = parseInt(btn.getAttribute("data-action-index"), 10);
        btn.addEventListener("click", () => {
          if (actions[index] && typeof actions[index].action === "function") {
            actions[index].action();
          }
        });
      });
    }

    // Bind dynamic quick replies
    msgDiv.querySelectorAll(".chat-quick-chip").forEach(chipBtn => {
      chipBtn.addEventListener("click", () => {
        this.processUserMessage(chipBtn.textContent.trim());
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  /**
   * Dictado por voz (Web Speech API, español). Muestra lo que escuchas mientras hablas,
   * envía la pregunta al terminar y explica con claridad cualquier problema (permisos, navegador, red).
   */
  speakText(text, btnEl = null, title = "Guía Cívika") {
    if (window.civikaAudio) window.civikaAudio.toggle(text, btnEl, title);
  }

  setupSpeechRecognition() {
    this.SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    this.recognition = null;
    this.isListening = false;
    // Si el navegador no lo soporta (p. ej. Firefox), el botón se muestra atenuado y avisa al tocarlo
    const micBtn = document.getElementById("chatMicBtn");
    if (micBtn && !this.SpeechRecognitionAPI) micBtn.classList.add("mic-unsupported");
  }

  voiceNotice(msg) {
    if (typeof window.civikaToast === "function") window.civikaToast(msg);
    else alert(msg);
  }

  toggleVoiceInput() {
    if (this.isListening) {
      if (this.recorder) this.stopRecordedDictation();
      else { try { this.recognition.stop(); } catch (e) { /* ya detenido */ } }
      return;
    }
    if (this.isTranscribing) return;
    if (!window.isSecureContext) {
      this.voiceNotice("El dictado por voz necesita una conexión segura (https).");
      return;
    }
    // Dentro de Streamlit (con IA) se graba el audio y el servidor lo convierte en texto:
    // es más confiable que el reconocimiento del navegador, que falla dentro de marcos incrustados.
    if (window.civikaAI && window.civikaAI.enabled && window.MediaRecorder && navigator.mediaDevices) {
      this.startRecordedDictation();
      return;
    }
    if (!this.SpeechRecognitionAPI) {
      this.voiceNotice("Tu navegador no permite dictar por voz. Usa Google Chrome o Edge, o escribe tu pregunta.");
      return;
    }
    // Primero se pide el micrófono de forma explícita: así el navegador muestra el permiso y sabemos la causa exacta si falla
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => { stream.getTracks().forEach(t => t.stop()); this.startVoiceInput(); })
        .catch((err) => {
          const n = err && err.name;
          if (n === "NotFoundError" || n === "DevicesNotFoundError") this.voiceNotice("No se detectó ningún micrófono en este equipo.");
          else if (n === "NotReadableError") this.voiceNotice("El micrófono está siendo usado por otra aplicación. Ciérrala e inténtalo de nuevo.");
          else this.voiceNotice("El navegador no dio acceso al micrófono (" + (n || "error") + "). Permite el micrófono en el candado de la barra de direcciones. Si abriste la app dentro de otra página, ábrela en su propia pestaña.");
        });
    } else {
      this.startVoiceInput();
    }
  }
  // ---- Dictado por grabación + transcripción en el servidor (Streamlit) ----
  async startRecordedDictation() {
    try { if (window.civikaAudio) window.civikaAudio.stop(); else if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* nada */ }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      const n = err && err.name;
      this.voiceNotice(n === "NotFoundError" ? "No se detectó ningún micrófono en este equipo."
        : n === "NotReadableError" ? "El micrófono está siendo usado por otra aplicación."
        : "El navegador no dio acceso al micrófono. Permítelo en el candado de la barra de direcciones.");
      return;
    }

    const mimes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    const mime = mimes.find(m => window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(m)) || "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    this.recorder = rec;
    this.recStream = stream;

    // Detector de silencio: se detiene solo cuando terminas de hablar
    let ctx = null, analyser = null, timer = null;
    let spoke = false, silentSince = Date.now();
    const startedAt = Date.now();
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      timer = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
        const now = Date.now();
        if (peak > 14) { spoke = true; silentSince = now; }
        if (spoke && now - silentSince > 1400) this.stopRecordedDictation();
        else if (!spoke && now - startedAt > 7000) this.stopRecordedDictation();
        else if (now - startedAt > 20000) this.stopRecordedDictation();
      }, 120);
    } catch (e) { /* sin detector: se detiene con un toque o a los 20 s */ setTimeout(() => this.stopRecordedDictation(), 20000); }

    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      clearInterval(timer);
      try { if (ctx) ctx.close(); } catch (e) { /* nada */ }
      stream.getTracks().forEach(t => t.stop());
      this.recorder = null; this.recStream = null;
      this.isListening = false;
      this.updateMicButtonUI(false);
      if (!spoke || !chunks.length) { this.voiceNotice("No te escuché. Toca el micrófono y habla cerca del equipo."); return; }
      const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
      await this.transcribeBlob(blob);
    };

    rec.start(250);
    this.isListening = true;
    this.updateMicButtonUI(true);
  }

  stopRecordedDictation() {
    const rec = this.recorder;
    if (rec && rec.state !== "inactive") { try { rec.stop(); } catch (e) { /* ya detenido */ } }
  }

  async transcribeBlob(blob) {
    const chatInput = document.getElementById("chatInput");
    const micBtn = document.getElementById("chatMicBtn");
    this.isTranscribing = true;
    if (micBtn) micBtn.disabled = true;
    const prevPh = chatInput ? chatInput.placeholder : "";
    if (chatInput) chatInput.placeholder = "✍️ Escribiendo lo que dijiste…";
    try {
      const b64 = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      const res = await window.civikaAI.transcribe(b64, blob.type || "audio/webm");
      if (res && res.ok && res.text) {
        this.processUserMessage(res.text.trim());
      } else {
        const e = res && res.error;
        this.voiceNotice(e === "limite" ? "Se acabó la cuota gratuita de voz por ahora. Escribe tu pregunta."
          : e === "limite_sesion" ? "Llegaste al límite de preguntas de esta sesión."
          : e === "clave_invalida" ? "La clave de la IA no es válida (revisa los Secrets de Streamlit)."
          : e === "audio_vacio" || e === "respuesta_vacia" ? "No te entendí. Intenta de nuevo hablando más despacio."
          : "No se pudo convertir tu voz en texto. Escribe tu pregunta.");
      }
    } catch (err) {
      this.voiceNotice("No se pudo convertir tu voz en texto. Escribe tu pregunta.");
    } finally {
      this.isTranscribing = false;
      if (micBtn) micBtn.disabled = false;
      if (chatInput) chatInput.placeholder = prevPh || "Escribe tu pregunta sobre RUC, patente, Bomberos o ARCSA…";
    }
  }

  startVoiceInput() {
    // Se calla la lectura en voz alta para que el micrófono no la escuche
    try { if (window.civikaAudio) window.civikaAudio.stop(); else if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* nada */ }

    const rec = new this.SpeechRecognitionAPI();   // instancia nueva en cada uso: más estable en Chrome/Android
    this.recognition = rec;
    rec.lang = "es-EC";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    const chatInput = document.getElementById("chatInput");
    let finalText = "";
    let sent = false;
    let failed = false;
    let gotAudio = false;

    const send = (text) => {
      const t = String(text || "").trim();
      if (!t || sent) return;
      sent = true;
      if (chatInput) chatInput.value = "";
      this.processUserMessage(t);
    };

    rec.onstart = () => { this.isListening = true; this.updateMicButtonUI(true); };
    rec.onaudiostart = () => { gotAudio = true; };

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (chatInput) chatInput.value = (finalText + interim).trim();
    };

    rec.onerror = (event) => {
      failed = true;
      const code = event && event.error;
      const msgs = {
        "not-allowed": "No hay permiso para usar el micrófono. Toca el candado de la barra de direcciones y permite el micrófono.",
        "service-not-allowed": "El navegador bloqueó el dictado por voz. Revisa los permisos del micrófono.",
        "audio-capture": "No se detectó ningún micrófono. Conéctalo y vuelve a intentar.",
        "network": "El dictado necesita internet. Revisa tu conexión.",
        "language-not-supported": "Este navegador no soporta dictado en español.",
        "no-speech": "No te escuché. Toca el micrófono y habla de nuevo, cerca del equipo."
      };
      if (code !== "aborted") this.voiceNotice(msgs[code] || "No se pudo usar el dictado por voz. Escribe tu pregunta.");
    };

    rec.onend = () => {
      this.isListening = false;
      this.updateMicButtonUI(false);
      const text = (finalText || (chatInput ? chatInput.value : "")).trim();
      if (!failed && text) send(text);
      else if (!failed && !text && gotAudio) this.voiceNotice("No te entendí. Intenta de nuevo hablando más despacio.");
      else if (chatInput && failed) chatInput.value = text;
    };

    try {
      rec.start();
    } catch (e) {
      this.isListening = false;
      this.updateMicButtonUI(false);
      this.voiceNotice("No se pudo iniciar el micrófono. Espera un momento e inténtalo otra vez.");
    }
  }

  updateMicButtonUI(listening) {
    const micBtn = document.getElementById("chatMicBtn");
    const chatInput = document.getElementById("chatInput");
    if (!micBtn) return;
    micBtn.classList.toggle("is-listening", listening);
    micBtn.setAttribute("aria-pressed", listening ? "true" : "false");
    micBtn.title = listening ? "Detener dictado" : "Dictar por voz";
    if (chatInput) {
      if (listening) { chatInput.dataset.ph = chatInput.placeholder; chatInput.placeholder = "🎙️ Te escucho… habla ahora"; }
      else chatInput.placeholder = chatInput.dataset.ph || "Escribe tu pregunta sobre RUC, patente, Bomberos o ARCSA…";
    }
  }
  showTypingIndicator() {
    const chatContainer = document.getElementById("chatMessages");
    if (!chatContainer) return;

    let indicator = document.getElementById("chatTypingIndicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "chatTypingIndicator";
      indicator.className = "flex items-center gap-2 mb-3 text-xs text-slate-400 pl-10";
      indicator.innerHTML = `
        <span class="inline-flex gap-1 items-center bg-slate-100 px-3 py-1.5 rounded-full">
          <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
          <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          <span class="text-[11px] text-slate-500 font-medium ml-1">Cívika está verificando la normativa de Riobamba...</span>
        </span>
      `;
      chatContainer.appendChild(indicator);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("chatTypingIndicator");
    if (indicator) indicator.remove();
  }

  formatMarkdown(text) {
    if (!text) return "";
    let str = text;
    str = str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    str = str.replace(/\*(.*?)\*/g, "<em>$1</em>");
    str = str.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-blue-800 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>');
    str = str.replace(/^[•]\s*(.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    str = str.replace(/\n\n/g, "<br/><br/>");
    str = str.replace(/\n/g, "<br/>");
    return str;
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

/**
 * Controlador Singleton de Audio Guía (Text-to-Speech en es-EC / es-ES)
 * Cancela cualquier audio previo antes de iniciar uno nuevo, soporta reproducir,
 * pausar, reanudar y detener, y sincroniza el estado visual de los botones.
 */
class CivikaAudioController {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.utterance = null;
    this.activeBtn = null;
    this.activeTitle = "";
    this.state = "idle"; // "idle" | "playing" | "paused"
    this._playToken = 0;

    if (this.synth && typeof this.synth.onvoiceschanged !== "undefined") {
      this.synth.onvoiceschanged = () => { this._cachedVoice = this._pickSpanishVoice(); };
    }
    // Al salir o recargar la página, detener la lectura (Chrome la continúa si no se cancela)
    window.addEventListener("pagehide", () => { try { this.synth && this.synth.cancel(); } catch (e) { /* nada */ } });
    // Si la interfaz se re-dibuja mientras suena el audio, re-vincular el botón activo
    const watch = () => {
      if (!document.body || typeof MutationObserver === "undefined") return;
      let queued = false;
      new MutationObserver(() => {
        if (this.state === "idle" || queued) return;
        if (this.activeBtn && this.activeBtn.isConnected) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; this.refresh(); });
      }).observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
    else watch();
  }

  _pickSpanishVoice() {
    if (!this.synth || typeof this.synth.getVoices !== "function") return null;
    const voices = this.synth.getVoices() || [];
    return (
      voices.find(v => /^es[-_]?EC/i.test(v.lang)) ||
      voices.find(v => /^es[-_]?ES/i.test(v.lang)) ||
      voices.find(v => /^es/i.test(v.lang)) ||
      null
    );
  }

  _cleanText(text) {
    return String(text || "")
      .replace(/\*\*|\*|`/g, "")
      .replace(/[•✓✔🔗🎉🎙️🪪🚦📍]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  _saveButtonOriginal(btn) {
    if (!btn || btn.dataset.audioOrigHtml) return;
    btn.dataset.audioOrigHtml = btn.innerHTML;
    btn.dataset.audioOrigClass = btn.className;
  }

  _syncButtons() {
    document.querySelectorAll("[data-audio-state]").forEach(b => {
      if (b !== this.activeBtn || this.state === "idle") {
        if (b.dataset.audioOrigHtml) b.innerHTML = b.dataset.audioOrigHtml;
        if (b.dataset.audioOrigClass) b.className = b.dataset.audioOrigClass;
        b.removeAttribute("data-audio-state");
        b.setAttribute("aria-pressed", "false");
      }
    });

    if (this.activeBtn && this.state !== "idle") {
      this._saveButtonOriginal(this.activeBtn);
      this.activeBtn.setAttribute("data-audio-state", this.state);
      this.activeBtn.setAttribute("aria-pressed", this.state === "playing" ? "true" : "false");
      const label = this.state === "playing" ? "Pausar audio" : "Reanudar audio";
      const icon = this.state === "playing" ? "pause" : "play";
      this.activeBtn.classList.add("ring-2", "ring-blue-400", "bg-blue-600", "text-white");
      this.activeBtn.classList.remove("bg-blue-50", "text-blue-700", "bg-white/20");
      this.activeBtn.innerHTML = `<i data-lucide="${icon}" class="w-3.5 h-3.5"></i><span>${label}</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    const setDis = (id, dis) => { const el = document.getElementById(id); if (el) el.disabled = dis; };
    setDis("audioGlobalPause", this.state !== "playing");
    setDis("audioGlobalResume", this.state !== "paused");
    setDis("audioGlobalStop", this.state === "idle");

    this._renderFloatingBar();
  }

  _renderFloatingBar() {
    let bar = document.getElementById("civikaAudioBar");
    if (this.state === "idle") {
      if (bar) bar.classList.add("hidden");
      return;
    }

    if (!bar) {
      bar = document.createElement("div");
      bar.id = "civikaAudioBar";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", "Controles de Audio Guía");
      bar.className = "fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-[9000] bg-slate-900 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs max-w-[92vw]";
      document.body.appendChild(bar);
    }

    const isPlaying = this.state === "playing";
    const safeTitle = String(this.activeTitle || "Audio Guía Cívika").replace(/[<>&"]/g, "");
    bar.classList.remove("hidden");
    bar.innerHTML = `
      <span class="w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"} shrink-0"></span>
      <span class="font-semibold truncate max-w-[160px] sm:max-w-[240px]">${isPlaying ? "Leyendo:" : "Pausado:"} ${safeTitle}</span>
      <button type="button" onclick="window.civikaAudio.togglePause()"
              class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer">
        <i data-lucide="${isPlaying ? "pause" : "play"}" class="w-3.5 h-3.5"></i>
        <span>${isPlaying ? "Pausar" : "Reanudar"}</span>
      </button>
      <button type="button" onclick="window.civikaAudio.stop()"
              class="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-rose-600 text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              title="Detener audio">
        <i data-lucide="square" class="w-3.5 h-3.5"></i>
        <span>Detener</span>
      </button>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  toggle(text, btnEl = null, title = "Guía Cívika") {
    // El mismo contenido (aunque el botón se haya re-renderizado) alterna pausa/reanudar
    const activeGone = !this.activeBtn || !this.activeBtn.isConnected;
    const sameContent = this.state !== "idle" && (
      (btnEl && this.activeBtn === btnEl) || (activeGone && title && this.activeTitle === title)
    );
    if (sameContent) {
      if (btnEl) this.activeBtn = btnEl;
      this.togglePause();
      return;
    }
    this.play(text, btnEl, title);
  }

  /** Divide en frases cortas: evita el corte a ~15 s de Chrome y permite reanudar donde quedó */
  _chunk(text) {
    const parts = text.match(/[^.!?;:]+[.!?;:]*/g) || [text];
    const chunks = [];
    let cur = "";
    parts.forEach(p => {
      const piece = p.trim();
      if (!piece) return;
      if ((cur + " " + piece).trim().length > 220 && cur) { chunks.push(cur.trim()); cur = piece; }
      else cur = (cur + " " + piece).trim();
    });
    if (cur) chunks.push(cur.trim());
    return chunks;
  }

  _speakFrom(index) {
    const token = ++this._playToken;
    if (index >= this.chunks.length) { this._finish(); return; }
    this.chunkIndex = index;
    const utt = new SpeechSynthesisUtterance(this.chunks[index]);
    const voice = this._cachedVoice || this._pickSpanishVoice();
    if (voice) { utt.voice = voice; utt.lang = voice.lang; } else { utt.lang = "es-EC"; }
    utt.rate = 0.98;
    utt.pitch = 1.0;
    utt.onend = () => {
      if (token !== this._playToken || this.state !== "playing") return;
      this._speakFrom(index + 1);
    };
    utt.onerror = (ev) => {
      if (token !== this._playToken) return;
      if (ev && (ev.error === "interrupted" || ev.error === "canceled")) return;
      this._finish();
    };
    this.utterance = utt;
    try { this.synth.speak(utt); } catch (e) { this._finish(); }
  }

  _finish() {
    this._playToken++;
    this.utterance = null;
    this.chunks = [];
    this.chunkIndex = 0;
    this.state = "idle";
    this.activeBtn = null;
    this.activeTitle = "";
    this._syncButtons();
  }

  play(text, btnEl = null, title = "Guía Cívika") {
    if (!this.synth || typeof window.SpeechSynthesisUtterance === "undefined") {
      if (typeof window.civikaToast === "function") {
        window.civikaToast("Tu navegador no soporta lectura en voz alta.");
      }
      return;
    }
    const clean = this._cleanText(text);
    if (!clean) return;

    this.stop();
    this.chunks = this._chunk(clean);
    this.activeBtn = btnEl || null;
    this.activeTitle = title || "Guía Cívika";
    this.state = "playing";
    this._syncButtons();
    this._speakFrom(0);
  }

  pause() {
    if (!this.synth || this.state !== "playing") return;
    // Se cancela y se recuerda la frase actual: funciona igual en Chrome, Safari y Android
    this.state = "paused";
    this._playToken++;
    try { this.synth.cancel(); } catch (e) { /* ignorar */ }
    this._syncButtons();
  }

  resume() {
    if (!this.synth || this.state !== "paused") return;
    this.state = "playing";
    this._syncButtons();
    this._speakFrom(this.chunkIndex || 0);
  }

  togglePause() {
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  }

  stop() {
    this._playToken++;
    if (this.synth) {
      try { this.synth.cancel(); } catch (e) { /* ignorar */ }
    }
    this.utterance = null;
    this.chunks = [];
    this.chunkIndex = 0;
    this.state = "idle";
    this.activeBtn = null;
    this.activeTitle = "";
    this._syncButtons();
  }

  /** Re-vincula el botón activo después de que la interfaz se vuelva a dibujar */
  refresh() {
    if (this.state === "idle") return;
    if (this.activeBtn && this.activeBtn.isConnected) return;
    const sel = `[data-audio-title="${(window.CSS && CSS.escape) ? CSS.escape(this.activeTitle) : this.activeTitle}"]`;
    const found = document.querySelector(sel);
    if (!found) return; // nada que re-vincular (evita ciclos con la barra flotante)
    this.activeBtn = found;
    this._syncButtons();
  }
}

window.civikaAudio = new CivikaAudioController();
window.CivikaAssistant = CivikaAssistant;
