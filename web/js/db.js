/**
 * CIVIKA - Arquitectura de Base de Datos Híbrida (Repository Pattern)
 * 1. Almacenamiento Local Privado (IndexedDB + LocalStorage Fallback)
 * 2. Conector Cloud-Ready (Supabase REST API)
 * 3. Modo Offline Automático (Fallback transparente a Local y Knowledge Base)
 * 4. Telemetría Anónima por Parroquia y Monitor de Estado de Servicios en Vivo
 */

const CIVIKA_DB_CONFIG = {
  dbName: "CivikaGovTechDB",
  dbVersion: 1,
  // Configuración Cloud-Ready para Supabase (Dejar vacío para forzar Modo Local Seguro en Demo)
  SUPABASE_URL: window.CIVIKA_ENV?.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: window.CIVIKA_ENV?.SUPABASE_ANON_KEY || "",
  storageKeys: {
    stepsState: "civika_steps_state",
    selectedBiz: "civika_selected_biz",
    checklistItems: "civika_checklist_items_v2",
    diagnosticAnswers: "civika_diagnostic_answers_v2",
    draftForm: "civika_govuk_draft_v2",
    passportsHistory: "civika_qr_passports_v2",
    anonymousMetrics: "civika_anon_metrics_v2",
    easyReadMode: "civika_easy_read_mode",
    stageProgress: "civika_stage_progress_v1",
    prevalidationInbox: "civika_prevalidation_inbox_v2"
  }
};

class CivikaRepository {
  constructor(config = CIVIKA_DB_CONFIG) {
    this.config = config;
    this.idb = null;
    this.isCloudConnected = false;
    this.syncStatusText = "Tus datos se guardan solo en este navegador";
    this.listeners = [];
  }

  /**
   * Inicializa IndexedDB, verifica conectividad Supabase y prepara métricas semilla
   */
  async init() {
    try {
      await this.initIndexedDB();
    } catch (err) {
      console.warn("[CivikaDB] IndexedDB no disponible, operando con LocalStorage:", err);
    }

    await this.checkCloudConnection();
    await this.ensureSeedMetrics();
    await this.ensureSeedPrevalidationInbox();
    this.updateFooterBadge();
    return this;
  }

  /**
   * Inicializa IndexedDB con stores para borradores, pasaportes QR y métricas
   */
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error("IndexedDB no soportado en este navegador"));
      }

      const request = window.indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = (event) => {
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.idb = event.target.result;
        resolve(this.idb);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("kv_store")) {
          db.createObjectStore("kv_store", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("passports")) {
          db.createObjectStore("passports", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("telemetry")) {
          db.createObjectStore("telemetry", { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  /**
   * Verifica si hay credenciales de Supabase válidas y conexión activa
   */
  async checkCloudConnection() {
    if (!this.config.SUPABASE_URL || !this.config.SUPABASE_ANON_KEY) {
      this.isCloudConnected = false;
      this.syncStatusText = "Tus datos se guardan solo en este navegador";
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.config.SUPABASE_URL}/rest/v1/service_status?select=*&limit=1`, {
        method: "GET",
        headers: {
          "apikey": this.config.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${this.config.SUPABASE_ANON_KEY}`
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        this.isCloudConnected = true;
        this.syncStatusText = "🟢 Base de Datos Sincronizada (Supabase Cloud + Local)";
        return true;
      }
    } catch (e) {
      console.info("[CivikaDB] Fallback automático a Modo Local Seguro activado.");
    }

    this.isCloudConnected = false;
    this.syncStatusText = "Tus datos se guardan solo en este navegador";
    return false;
  }

  /**
   * Lee y escribe en IndexedDB + LocalStorage de forma redundante y segura
   */
  async setItem(key, value) {
    const serialized = JSON.stringify(value);
    try {
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.warn("[CivikaDB] LocalStorage lleno o restringido:", e);
    }

    if (this.idb) {
      try {
        await new Promise((resolve, reject) => {
          const tx = this.idb.transaction(["kv_store"], "readwrite");
          const store = tx.objectStore("kv_store");
          store.put({ key, value, updatedAt: new Date().toISOString() });
          tx.oncomplete = () => resolve(true);
          tx.onerror = (e) => reject(e.target.error);
        });
      } catch (e) {
        // Fallback silencioso a localStorage ya ejecutado
      }
    }

    this.notifyListeners(key, value);
    return value;
  }

  async getItem(key, defaultValue = null) {
    // Primero intentamos LocalStorage por velocidad síncrona/inmediata
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[CivikaDB] Error leyendo LocalStorage:", e);
    }

    // Si no está en LocalStorage, consultamos IndexedDB
    if (this.idb) {
      try {
        const result = await new Promise((resolve, reject) => {
          const tx = this.idb.transaction(["kv_store"], "readonly");
          const store = tx.objectStore("kv_store");
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
          req.onerror = (e) => reject(e.target.error);
        });
        if (result !== undefined) {
          return result;
        }
      } catch (e) {
        // Fallback
      }
    }

    return defaultValue;
  }

  /**
   * Gestión del Progreso de Pasos (1 al 6 + ARCSA) y Sub-checklists interactivos
   */
  async saveStepsProgress(stepsState, selectedBusinessId) {
    await this.setItem(this.config.storageKeys.stepsState, stepsState);
    if (selectedBusinessId) {
      await this.setItem(this.config.storageKeys.selectedBiz, selectedBusinessId);
    }
  }

  async loadStepsProgress(defaultSteps) {
    const steps = await this.getItem(this.config.storageKeys.stepsState, defaultSteps);
    const selectedBiz = await this.getItem(this.config.storageKeys.selectedBiz, "tienda_ropa");
    return { steps: { ...defaultSteps, ...steps }, selectedBiz };
  }

  /**
   * Gestión de casillas individuales de los Pilares 1 y 2 (Diagnóstico y Checklist Personalizado)
   */
  async saveChecklistChecks(checksMap) {
    return this.setItem(this.config.storageKeys.checklistItems, checksMap);
  }

  async loadChecklistChecks() {
    return this.getItem(this.config.storageKeys.checklistItems, {});
  }

  async saveDiagnosticAnswers(answersMap) {
    return this.setItem(this.config.storageKeys.diagnosticAnswers, answersMap);
  }

  async loadDiagnosticAnswers() {
    return this.getItem(this.config.storageKeys.diagnosticAnswers, {});
  }

  /**
   * Estado de avance por etapas de cada trámite:
   * 1. diagnostico, 2. checklist, 3. antiRechazo, 4. planB
   */
  async saveStageProgress(stageProgressMap) {
    return this.setItem(this.config.storageKeys.stageProgress, stageProgressMap || {});
  }

  async loadStageProgress(defaultMap = {}) {
    const saved = await this.getItem(this.config.storageKeys.stageProgress, {});
    return { ...defaultMap, ...(saved || {}) };
  }

  async setStepStageState(stepId, stageKey, completed) {
    const validStages = ["diagnostico", "checklist", "antiRechazo", "planB"];
    if (!stepId || !validStages.includes(stageKey)) return null;
    const all = await this.loadStageProgress();
    const current = {
      diagnostico: false,
      checklist: false,
      antiRechazo: false,
      planB: false,
      ...(all[stepId] || {})
    };
    current[stageKey] = Boolean(completed);
    current.updatedAt = new Date().toISOString();
    all[stepId] = current;
    await this.saveStageProgress(all);
    return all;
  }

  /**
   * Bandeja simulada de expedientes enviados a Pre-Validación Remota bajo convenio.
   * Regla estricta: solo metadatos no sensibles (ID local, giro, CIIU, parroquia, conteos, estado).
   * Los casos semilla son FICTICIOS para la demostración.
   */
  async ensureSeedPrevalidationInbox() {
    const existing = await this.getItem(this.config.storageKeys.prevalidationInbox, null);
    if (Array.isArray(existing) && existing.length > 0) return existing;

    const seedInbox = [
      {
        id: "EXP-RIO-2026-031", origen: "demo",
        giroId: "micromercado", giroNombre: "Micromercado o Tienda de Barrio", ciiu: "G4711",
        parroquia: "Velasco", checklistConteo: "9/14", alertasSuperadas: "3/6",
        estado: "Pendiente", motivo: "", codigoPase: "", observacion: "",
        fechaEnvio: "20/11/2026, 12:05"
      },
      {
        id: "EXP-RIO-2026-014", origen: "demo",
        giroId: "cafeteria", giroNombre: "Cafetería o Pequeño Café", ciiu: "I5610",
        parroquia: "Maldonado", checklistConteo: "13/14", alertasSuperadas: "6/6",
        estado: "Pre-Aprobado", motivo: "", codigoPase: "PR-014-K7M2QD",
        observacion: "Pre-revisión favorable. Listo para emisión virtual / Ventanilla Única.",
        fechaEnvio: "20/11/2026, 09:15"
      },
      {
        id: "EXP-RIO-2026-021", origen: "demo",
        giroId: "tienda_ropa", giroNombre: "Tienda de Ropa y Calzado", ciiu: "G4771",
        parroquia: "Lizarzaburu", checklistConteo: "8/14", alertasSuperadas: "2/6",
        estado: "Observado", motivo: "Planilla de servicio básico mayor a 90 días", codigoPase: "",
        observacion: "Adjunta una planilla reciente de la dirección del local.",
        fechaEnvio: "20/11/2026, 11:40"
      }
    ];

    await this.setItem(this.config.storageKeys.prevalidationInbox, seedInbox);
    return seedInbox;
  }

  async getPrevalidationInbox() {
    return this.ensureSeedPrevalidationInbox();
  }

  async submitToPrevalidationInbox(metadata) {
    const inbox = await this.ensureSeedPrevalidationInbox();
    const seq = inbox.reduce((max, item) => {
      const n = parseInt(String(item.id).split("-").pop(), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 40) + 1;
    const id = `EXP-RIO-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`;

    // Lista blanca de campos: cualquier otro dato se descarta
    const record = {
      id,
      origen: metadata?.origen === "ciudadano" ? "ciudadano" : "demo",
      giroId: String(metadata?.giroId || ""),
      giroNombre: String(metadata?.giroNombre || "Comercio"),
      ciiu: String(metadata?.ciiu || ""),
      parroquia: String(metadata?.parroquia || ""),
      checklistConteo: String(metadata?.checklistConteo || "0/0"),
      pasosConteo: String(metadata?.pasosConteo || ""),
      alertasSuperadas: String(metadata?.alertasSuperadas || "0/0"),
      estado: "Pendiente",
      motivo: "",
      codigoPase: "",
      observacion: "",
      vistoPorCiudadano: true,
      fechaEnvio: new Date().toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })
    };

    const updated = [record, ...inbox].slice(0, 20);
    await this.setItem(this.config.storageKeys.prevalidationInbox, updated);

    await this.recordAnonymousMetric({
      parroquia: record.parroquia,
      actividad: record.giroNombre,
      evento: "prevalidacion_enviada"
    });

    return record;
  }

  async updatePrevalidationStatus(expedienteId, nuevoEstado, extra = {}) {
    const allowedStates = ["Pendiente", "Pre-Aprobado", "Observado"];
    if (!allowedStates.includes(nuevoEstado)) return null;
    const data = typeof extra === "string" ? { observacion: extra } : (extra || {});
    const inbox = await this.ensureSeedPrevalidationInbox();
    const updated = inbox.map(item => {
      if (item.id !== expedienteId) return item;
      return {
        ...item,
        estado: nuevoEstado,
        motivo: String(data.motivo ?? item.motivo ?? ""),
        codigoPase: String(data.codigoPase ?? item.codigoPase ?? ""),
        observacion: String(data.observacion ?? item.observacion ?? ""),
        vistoPorCiudadano: nuevoEstado === "Pendiente",
        actualizadoEn: new Date().toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })
      };
    });
    await this.setItem(this.config.storageKeys.prevalidationInbox, updated);
    return updated.find(item => item.id === expedienteId) || null;
  }

  async markPrevalidationSeen(ids = []) {
    const inbox = await this.ensureSeedPrevalidationInbox();
    const updated = inbox.map(item => ids.includes(item.id) ? { ...item, vistoPorCiudadano: true } : item);
    await this.setItem(this.config.storageKeys.prevalidationInbox, updated);
  }

  /**
   * Gestión de Borradores del Formulario No Sensible estilo GOV.UK
   */
  async saveDraftForm(draftData) {
    // Regla de seguridad estricta: jamás almacenar claves o contraseñas
    const safeDraft = {
      nombreComercial: draftData.nombreComercial || "",
      actividadId: draftData.actividadId || "tienda_ropa",
      parroquia: draftData.parroquia || "Maldonado",
      tenenciaLocal: draftData.tenenciaLocal || "arrendado",
      areaMetros: draftData.areaMetros || "35",
      regimenEstimado: draftData.regimenEstimado || "RIMPE Negocio Popular",
      identificacionMascarada: draftData.identificacionMascarada || "",
      esIdentificacionValida: Boolean(draftData.esIdentificacionValida),
      tipoIdentificacion: draftData.tipoIdentificacion || "",
      updatedAt: new Date().toISOString()
    };
    return this.setItem(this.config.storageKeys.draftForm, safeDraft);
  }

  async loadDraftForm() {
    return this.getItem(this.config.storageKeys.draftForm, {
      nombreComercial: "",
      actividadId: "tienda_ropa",
      parroquia: "Maldonado",
      tenenciaLocal: "arrendado",
      areaMetros: "35",
      regimenEstimado: "RIMPE Negocio Popular",
      identificacionMascarada: "",
      esIdentificacionValida: false,
      tipoIdentificacion: ""
    });
  }

  /**
   * Historial de "Pasaportes de Trámite QR" generados por el emprendedor
   */
  async savePassportQR(passportRecord) {
    const history = await this.getPassportsHistory();
    const record = {
      id: passportRecord.id || `PAS-RIO-${Date.now().toString().slice(-6)}`,
      fecha: passportRecord.fecha || new Date().toLocaleString("es-EC"),
      nombreComercial: passportRecord.nombreComercial || "Emprendimiento Riobamba",
      actividadNombre: passportRecord.actividadNombre || "Comercio Minorista",
      parroquia: passportRecord.parroquia || "Maldonado",
      tenenciaLocal: passportRecord.tenenciaLocal || "Arrendado",
      regimen: passportRecord.regimen || "RIMPE",
      identificacionValidada: passportRecord.identificacionValidada || "Verificada Módulo 10/11",
      progresoCarpeta: passportRecord.progresoCarpeta || 0,
      pasosCompletados: passportRecord.pasosCompletados || 0,
      totalPasos: passportRecord.totalPasos || 6,
      qrPayload: passportRecord.qrPayload || ""
    };

    const updated = [record, ...history.filter(p => p.id !== record.id)].slice(0, 10);
    await this.setItem(this.config.storageKeys.passportsHistory, updated);

    if (this.idb) {
      try {
        const tx = this.idb.transaction(["passports"], "readwrite");
        tx.objectStore("passports").put(record);
      } catch (e) {
        // Ignorar error menor en IDB
      }
    }

    // Registrar métrica anónima
    await this.recordAnonymousMetric({
      parroquia: record.parroquia,
      actividad: record.actividadNombre,
      evento: "pasaporte_qr_generado"
    });

    return record;
  }

  async getPassportsHistory() {
    return this.getItem(this.config.storageKeys.passportsHistory, []);
  }

  /**
   * Estado en Vivo de Portales Institucionales y Métricas Ciudadanas para el GAD Riobamba / SRI
   */
  async ensureSeedMetrics() {
    const existing = await this.getItem(this.config.storageKeys.anonymousMetrics, null);
    if (existing) return existing;

    const seedMetrics = {
      ultimaActualizacion: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
      totalConsultasAnonimas: 1428,
      pasaportesEmitidosHoy: 84,
      tasaExitoVentanilla: "98.4%",
      ahorroEstimadoCiudadaniaUSD: "$5,040 USD",
      estadoPortales: [
        {
          id: "portal_sri",
          entidad: "SRI en Línea (RUC / RIMPE)",
          url: "https://srienlinea.sri.gob.ec",
          estado: "operativo",
          etiqueta: "Operativo (Tiempo resp: 1.2s)",
          mensaje: "Emisión de certificados RUC con QR funcionando con normalidad."
        },
        {
          id: "portal_gadmr_suelo",
          entidad: "GAD Riobamba - Uso de Suelo (PUGS)",
          url: "https://www.gadmriobamba.gob.ec",
          estado: "intermitente",
          etiqueta: "Alta Demanda (Plan B disponible)",
          mensaje: "Validación catastral con demora en horas pico. Se recomienda usar Plan B en Ventanilla de Ordenamiento Territorial."
        },
        {
          id: "portal_bomberos",
          entidad: "Cuerpo de Bomberos Riobamba",
          url: "https://www.bomberosriobamba.gob.ec",
          estado: "operativo",
          etiqueta: "Operativo (Inspecciones activas)",
          mensaje: "Recepción de solicitudes en línea y en calle Chile 26-56 y Pichincha."
        },
        {
          id: "portal_arcsa",
          entidad: "ARCSA - Permiso / Exoneración",
          url: "https://permisosfuncionamiento.controlsanitario.gob.ec",
          estado: "operativo",
          etiqueta: "Operativo (Consulta de tipologías)",
          mensaje: "Validación automática de exoneración ($0.00) para artesanos calificados y microempresas."
        }
      ],
      demandaPorParroquia: [
        { parroquia: "Maldonado (Centro / Comercial)", porcentaje: 32, consultas: 457 },
        { parroquia: "Lizarzaburu (Zona Norte / Av. Daniel León Borja)", porcentaje: 28, consultas: 400 },
        { parroquia: "Veloz (Zona Bancaria / Sur-Centro)", porcentaje: 21, consultas: 300 },
        { parroquia: "Velasco (Mercados / La Condamine)", porcentaje: 14, consultas: 200 },
        { parroquia: "Yaruquíes y Parroquias Rurales", porcentaje: 5, consultas: 71 }
      ],
      cuellosDeBotellaDetectados: [
        {
          problema: "Inconsistencia de dirección entre RUC y Planilla de Luz",
          frecuencia: "38% de los casos",
          solucionCivika: "Auditor Pre-Ventanilla alerta antes de ir al Municipio."
        },
        {
          problema: "Desconocimiento de clave catastral del local arrendado",
          frecuencia: "29% de los casos",
          solucionCivika: "Plan B accionable indica cómo solicitarla con cédula del arrendador."
        },
        {
          problema: "Extintor con recarga vencida antes de inspección de Bomberos",
          frecuencia: "19% de los casos",
          solucionCivika: "Pilar 3 de Prevención de Errores exige verificar manómetro en verde."
        },
        {
          problema: "Cobros indebidos de tramitadores por formularios gratuitos",
          frecuencia: "14% de los casos",
          solucionCivika: "Rich Cards comparativas 'Trámite Oficial vs. Estafa de Tramitadores'."
        }
      ]
    };

    await this.setItem(this.config.storageKeys.anonymousMetrics, seedMetrics);
    return seedMetrics;
  }

  async getLiveMetricsAndStatus() {
    // Si Supabase está configurado y activo, intenta sincronizar desde la nube
    if (this.isCloudConnected) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL}/rest/v1/citizen_metrics?select=*&limit=1`, {
          headers: {
            "apikey": this.config.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${this.config.SUPABASE_ANON_KEY}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            return data[0];
          }
        }
      } catch (e) {
        // Fallback silencioso a datos locales
      }
    }

    return this.ensureSeedMetrics();
  }

  /**
   * Registra telemetría 100% anónima (parroquia, trámite o paso consultado) sin datos personales
   */
  async recordAnonymousMetric({ parroquia = "Maldonado", actividad = "General", evento = "consulta_tramite" }) {
    const metrics = await this.ensureSeedMetrics();
    metrics.totalConsultasAnonimas = (metrics.totalConsultasAnonimas || 1428) + 1;
    if (evento === "pasaporte_qr_generado") {
      metrics.pasaportesEmitidosHoy = (metrics.pasaportesEmitidosHoy || 84) + 1;
    }
    metrics.ultimaActualizacion = new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });

    // Actualizar conteo por parroquia si coincide
    if (parroquia && Array.isArray(metrics.demandaPorParroquia)) {
      const target = metrics.demandaPorParroquia.find(p =>
        p.parroquia.toLowerCase().includes(parroquia.toLowerCase())
      );
      if (target) {
        target.consultas += 1;
      }
    }

    await this.setItem(this.config.storageKeys.anonymousMetrics, metrics);

    // Si Supabase está conectado, enviar ping anónimo asíncrono
    if (this.isCloudConnected) {
      fetch(`${this.config.SUPABASE_URL}/rest/v1/telemetry_events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": this.config.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${this.config.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          parroquia,
          actividad,
          evento,
          created_at: new Date().toISOString()
        })
      }).catch(() => {});
    }

    return metrics;
  }

  updateFooterBadge() {
    const badges = document.querySelectorAll(".civika-db-status-badge");
    badges.forEach(el => {
      el.textContent = this.syncStatusText;
    });
  }

  onChange(callback) {
    if (typeof callback === "function") {
      this.listeners.push(callback);
    }
  }

  notifyListeners(key, value) {
    this.listeners.forEach(cb => {
      try {
        cb(key, value);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

window.civikaDB = new CivikaRepository();
