/**
 * CIVIKA - Base de Conocimiento Estructurada y Normativa Verídica (GovTech Standard)
 * Hackathon INNOVAiLAB UNACH 2026 - Gobierno Digital y Servicios Ciudadanos
 * Datos verificados bajo reglas reales de Ecuador y el cantón Riobamba (SRI, GAD Municipal de Riobamba, Cuerpo de Bomberos de Riobamba y ARCSA)
 * Cumple con los 4 Pilares Obligatorios por Servicio y Ruta Encadenada del Emprendedor.
 */

const CIVIKA_KNOWLEDGE_BASE = {
  metadata: {
    canton: "Riobamba",
    provincia: "Chimborazo",
    version: "2026.5-GOVTECH",
    fechaVerificacion: "Noviembre 2026",
    principiosSeguridad: [
      "Cero datos sensibles: Cívika jamás solicita ni almacena contraseñas, claves del SRI, claves de correo electrónico ni información bancaria.",
      "Cero información inventada: Cuando una tasa o tributo municipal/nacional depende de un cálculo variable (capital declarado, m² de área, aforo o categoría de riesgo), se indica explícitamente que está sujeto a cálculo oficial según la ordenanza vigente."
    ],
    marcoLegal: [
      "Código Orgánico de Organización Territorial, Autonomía y Descentralización (COOTAD) Arts. 547-553 (Impuesto de Patente Municipal y Exoneración a Artesanos Calificados)",
      "Ley Orgánica para el Desarrollo Económico y Sostenibilidad Fiscal (Régimen Simplificado para Emprendedores y Negocios Populares - RIMPE, SRI)",
      "Ordenanzas vigentes del GAD Municipal del Cantón Riobamba (Plan de Uso y Gestión del Suelo PUGS, Patente Municipal y Licencia Anual de Funcionamiento)",
      "Ley de Defensa contra Incendios y Reglamento de Prevención, Mitigación y Protección contra Incendios (Cuerpo de Bomberos de Riobamba)",
      "Ley Orgánica de Salud y Normativa Técnica Sanitaria de la ARCSA (Permisos de Funcionamiento, Simplificación y Exoneración de tasas para Microempresas y Artesanos)"
    ]
  },

  // ==========================================
  // PARROQUIAS DE RIOBAMBA (Para Formulario Borrador GOV.UK y Diagnóstico)
  // ==========================================
  parroquiasRiobamba: [
    { id: "Maldonado", nombre: "Maldonado (Urbana - Centro / Comercial)", tipo: "Urbana" },
    { id: "Lizarzaburu", nombre: "Lizarzaburu (Urbana - Zona Norte / Av. Daniel León Borja)", tipo: "Urbana" },
    { id: "Veloz", nombre: "Veloz (Urbana - Zona Centro-Sur / Bancaria)", tipo: "Urbana" },
    { id: "Velasco", nombre: "Velasco (Urbana - Zona Mercados / La Condamine)", tipo: "Urbana" },
    { id: "Yaruquies", nombre: "Yaruquíes (Urbana / Periférica)", tipo: "Urbana" },
    { id: "San_Luis", nombre: "San Luis (Rural)", tipo: "Rural" },
    { id: "Licto", nombre: "Licto (Rural)", tipo: "Rural" },
    { id: "Calpi", nombre: "Calpi (Rural)", tipo: "Rural" },
    { id: "San_Juan", nombre: "San Juan (Rural)", tipo: "Rural" },
    { id: "Cacha", nombre: "Cacha (Rural)", tipo: "Rural" },
    { id: "Punin", nombre: "Punín (Rural)", tipo: "Rural" },
    { id: "Quimiag", nombre: "Químiag (Rural)", tipo: "Rural" },
    { id: "Cubijies", nombre: "Cubijíes (Rural)", tipo: "Rural" },
    { id: "Flores", nombre: "Flores (Rural)", tipo: "Rural" },
    { id: "Pungala", nombre: "Pungalá (Rural)", tipo: "Rural" }
  ],

  // ==========================================
  // EMPRENDIMIENTOS COMUNES EN RIOBAMBA (CONSERVANDO TODOS LOS EXISTENTES + RIGOR VERÍDICO)
  // ==========================================
  emprendimientosComunes: [
    {
      id: "tienda_ropa",
      etiquetaPasaporte: "RIMPE · Sin permiso ARCSA",
      nombre: "Tienda de Ropa y Calzado",
      categoria: "Comercio Minorista",
      ciiuReferencia: "G4771 - Venta al por menor de prendas de vestir y calzado",
      icono: "shirt",
      costoAproxTotal: "RUC $0 + Tasas municipales/Bomberos sujetas a cálculo por capital y m²",
      tiempoEstimado: "1 a 2 horas de preparación con Cívika (vs 3-5 días presencial)",
      riesgoBomberos: "Riesgo Bajo (Extintor PQS 10 lbs vigente y señalética)",
      regimenRecomendado: "RIMPE Negocio Popular (si ventas anuales <= $20,000) o RIMPE Emprendedor ($20,001 a $300,000)",
      requiereArcsa: "No requiere permiso sanitario ARCSA (comercio textil).",
      entidadesInvolucradas: ["SRI", "Cuerpo de Bomberos de Riobamba", "GAD Municipal de Riobamba"],
      documentacionRequerida: [
        "Certificado de RUC en estado ACTIVO con actividad CIIU G4771 y dirección exacta de tu boutique o zapatería en Riobamba.",
        "Informe Favorable de Compatibilidad de Uso de Suelo (ICUS - PUGS GAD Riobamba) para comercio minorista textil.",
        "Permiso Anual de Funcionamiento del Cuerpo de Bomberos de Riobamba (extintor PQS 10 lbs y señalética de salida).",
        "Certificado de No Adeudar al GAD Municipal de Riobamba (solvencia tributaria del titular del local).",
        "Formulario Oficial de Declaración de Patente Municipal Anual y solicitud de LUF para venta de vestuario/calzado.",
        "Contrato de arrendamiento del local comercial o comprobante de pago del Impuesto Predial vigente.",
        "Original y copia legible de cédula y certificado de votación para apertura de expediente en Ventanilla Única."
      ],
      alertasAntiRechazo: [
        "Si exhibes mercadería en veredas o portales, Control Municipal puede retener el permiso LUF por ocupación indebida de vía pública.",
        "Los letreros luminosos o rótulos exteriores en el Centro Histórico deben ajustarse a la ordenanza patrimonial antes de instalarse."
      ],
      recomendacionesEspecificas: [
        "Si vendes ropa o calzado importado, conserva las facturas de compra o declaraciones aduaneras para respaldar tu inventario ante el SRI.",
        "Verifica que el manómetro del extintor PQS esté en zona verde y visible junto a los probadores o bodega."
      ],
      advertenciaSector: "Si el local está en el Centro Histórico de Riobamba (parroquias Maldonado/Velasco/Veloz), la rotulación exterior debe respetar la ordenanza de patrimonio cultural."
    },
    {
      id: "cafeteria",
      etiquetaPasaporte: "RIMPE · ARCSA según tipología",
      nombre: "Cafetería o Pequeño Café",
      categoria: "Alimentos y Bebidas",
      ciiuReferencia: "I5610 - Actividades de restaurantes, cafeterías y servicio móvil de comidas",
      icono: "coffee",
      costoAproxTotal: "RUC $0 + ARCSA $0 (exento/microempresa) + Patente/Bomberos según capital y m²",
      tiempoEstimado: "2 a 3 horas de preparación con Cívika (vs 5-8 días presencial)",
      riesgoBomberos: "Riesgo Bajo a Medio (Extintor PQS 10 lbs / CO2, revisión de GLP, detector de humo)",
      regimenRecomendado: "RIMPE Negocio Popular (<= $20,000) o RIMPE Emprendedor ($20,001 a $300,000)",
      requiereArcsa: "Verificación de tipología ARCSA: Fuentes de soda/panaderías tradicionales están exentas de permiso físico por simplificación; restaurantes o procesadores tienen tarifa $0.00 si están categorizados como microempresa o artesano, pero cumplen control higiénico.",
      entidadesInvolucradas: ["SRI", "Cuerpo de Bomberos de Riobamba", "GAD Municipal de Riobamba", "ARCSA Zonal 3"],
      documentacionRequerida: [
        "Certificado de RUC en estado ACTIVO (CIIU I5610: Preparación y servicio de café, postres y bebidas).",
        "Informe de Compatibilidad de Uso de Suelo Favorable para expendio de alimentos (GAD Riobamba).",
        "Permiso Anual del Cuerpo de Bomberos de Riobamba (inspección de cafetera/horno, instalaciones eléctricas y gas GLP).",
        "Cumplimiento Sanitario ARCSA: registro en línea o certificado de exoneración/microempresa según tipología de cafetería.",
        "Certificado de No Adeudar al GAD Municipal de Riobamba para habilitar la tasa de patente alimentaria.",
        "Formulario Oficial de Declaración de Patente Municipal y LUF para establecimientos de bebidas y alimentos.",
        "Contrato de arrendamiento con autorización de uso de cocina o pago del Impuesto Predial.",
        "Cédula y papeleta de votación vigentes del representante de la cafetería."
      ],
      alertasAntiRechazo: [
        "En cafeterías con cocina o plancha, Bomberos rechaza la inspección si el cilindro de GLP está dentro del área cerrada sin ventilación o manguera certificada.",
        "No presentar el comprobante de categorización o exoneración ARCSA retrasa la emisión de la LUF en Ventanilla Única."
      ],
      recomendacionesEspecificas: [
        "Instala una trampa de grasas debajo del lavaplatos antes de la inspección municipal para evitar sanciones en alcantarillado.",
        "Mantén lácteos, cremas y repostería refrigerados con registro visible de temperatura y fecha de elaboración."
      ],
      advertenciaSector: "Es obligatorio contar con trampa de grasas en el área de lavado para evitar obstrucciones y sanciones ambientales en la red de alcantarillado de Riobamba."
    },
    {
      id: "micromercado",
      etiquetaPasaporte: "RIMPE · ARCSA exento (control sanitario)",
      nombre: "Micromercado o Tienda de Barrio",
      categoria: "Comercio de Abarrotes",
      ciiuReferencia: "G4711 - Venta al por menor en comercios no especializados con predominio de alimentos y bebidas",
      icono: "shopping-basket",
      costoAproxTotal: "RUC $0 + ARCSA Exento + Patente/Bomberos según capital declarado y m²",
      tiempoEstimado: "1 a 2 horas de preparación con Cívika (vs 3-6 días presencial)",
      riesgoBomberos: "Riesgo Bajo (Extintor PQS 10 lbs vigente, señalética y botiquín)",
      regimenRecomendado: "RIMPE Negocio Popular (<= $20,000) o RIMPE Emprendedor",
      requiereArcsa: "Exento de permiso de funcionamiento ARCSA para tiendas de abarrotes y micromercados según resoluciones de simplificación, pero obligatorio verificar que todo producto procesado exhibido tenga Notificación Sanitaria vigente y fecha de caducidad al día.",
      entidadesInvolucradas: ["SRI", "Cuerpo de Bomberos de Riobamba", "GAD Municipal de Riobamba", "ARCSA (control en percha)"],
      documentacionRequerida: [
        "Hoja de RUC activo bajo régimen RIMPE (Negocio Popular o Emprendedor, CIIU G4711 para víveres y abarrotes).",
        "Certificado de Compatibilidad de Uso de Suelo PUGS (GAD Riobamba) para comercio de primera necesidad.",
        "Permiso Anual de Funcionamiento del Cuerpo de Bomberos de Riobamba (extintor PQS, pasillos despejados y botiquín).",
        "Control sanitario en perchas: todos los enlatados, lácteos y bebidas deben exhibir Notificación Sanitaria ARCSA vigente.",
        "Certificado de No Adeudar al GAD Municipal de Riobamba correspondiente al contribuyente del micromercado.",
        "Formulario Oficial de Declaración de Patente Municipal con detalle de inventario inicial.",
        "Contrato de arrendamiento del local o comprobante predial actualizado.",
        "Copia legible de cédula y certificado de votación del propietario del micromercado."
      ],
      alertasAntiRechazo: [
        "Exhibir productos sin Notificación Sanitaria o caducados genera decomiso inmediato en operativos conjuntos de ARCSA y Comisaría.",
        "Vender bebidas alcohólicas cerca de escuelas o colegios fuera de distancia permitida provoca negativa directa de LUF."
      ],
      recomendacionesEspecificas: [
        "Separa físicamente los productos de limpieza e insecticidas de los víveres y panadería para aprobar controles sanitarios.",
        "Lleva un registro semanal de fechas de vencimiento en lácteos y embutidos para evitar multas."
      ],
      advertenciaSector: "Si comercializa bebidas alcohólicas para llevar, debe respetar estrictamente los horarios permitidos y las distancias mínimas respecto a unidades educativas."
    },
    {
      id: "profesional",
      etiquetaPasaporte: "Régimen General · Sin permiso ARCSA",
      nombre: "Consultorio u Oficina Profesional",
      categoria: "Servicios Profesionales",
      ciiuReferencia: "M6910 / M7110 / Q8620 - Actividades jurídicas, contables, arquitectura, ingeniería o consulta médica",
      icono: "briefcase",
      costoAproxTotal: "RUC $0 + Patente y Bomberos sujetos a cálculo según ordenanza vigente",
      tiempoEstimado: "1 hora de preparación con Cívika (vs 2-4 días presencial)",
      riesgoBomberos: "Riesgo Bajo (Oficina administrativa o consultorio con extintor y señalética)",
      regimenRecomendado: "RÉGIMEN GENERAL (Por ley tributaria del SRI, los servicios profesionales con título están EXCLUIDOS del régimen RIMPE, incluso si facturan menos de $20,000 al año).",
      requiereArcsa: "No aplica ARCSA para oficinas jurídicas/técnicas (si es consultorio médico/odontológico, requiere permiso de ACESS).",
      entidadesInvolucradas: ["SRI (Régimen General)", "GAD Municipal de Riobamba", "Cuerpo de Bomberos de Riobamba", "ACESS (solo consultorios de salud)"],
      documentacionRequerida: [
        "RUC activo en RÉGIMEN GENERAL con la actividad profesional específica (excluido de RIMPE por normativa SRI).",
        "Registro impreso del Título Profesional en la plataforma de la SENESCYT.",
        "Certificado de Compatibilidad de Uso de Suelo si habilita oficina o consultorio físico con atención presencial.",
        "Permiso del Cuerpo de Bomberos de Riobamba de la oficina o consultorio (extintor y señalética).",
        "Certificado de No Adeudar al GAD Municipal de Riobamba como profesional en libre ejercicio.",
        "Formulario Oficial de Patente Municipal (liquidación sujeta a ordenanza municipal vigente para servicios profesionales).",
        "Cédula de identidad y certificado de votación vigentes del profesional titular."
      ],
      alertasAntiRechazo: [
        "Inscribir el RUC como RIMPE Negocio Popular teniendo título profesional genera inconsistencias tributarias y multas por no declarar IVA.",
        "Abrir un consultorio médico u odontológico sin permiso previo de ACESS expone a clausura inmediata."
      ],
      recomendacionesEspecificas: [
        "Configura tu firma electrónica y facturación electrónica desde el día 1 en el SRI, ya que en Régimen General no aplican notas de venta.",
        "Si trabajas en oficinas compartidas (coworking), confirma con el administrador si el Uso de Suelo del edificio cubre tu actividad."
      ],
      advertenciaSector: "¡Error crítico frecuente! Ningún profesional en libre ejercicio entra en RIMPE Negocio Popular. Debes emitir factura electrónica y declarar IVA en Régimen General."
    },
    {
      id: "taller",
      etiquetaPasaporte: "RIMPE · Sin ARCSA · Gestión ambiental",
      nombre: "Taller Mecánico, Lubricadora o Eléctrico",
      categoria: "Servicios Técnicos / Automotriz",
      ciiuReferencia: "G4520 - Mantenimiento y reparación de vehículos automotores",
      icono: "wrench",
      costoAproxTotal: "RUC $0 + Tasas de Uso de Suelo, Bomberos (Riesgo Medio/Alto) y Patente según m² y capital",
      tiempoEstimado: "3 a 4 horas de preparación con Cívika (vs 7-12 días presencial)",
      riesgoBomberos: "Riesgo Medio a Alto (Manejo de inflamables, aceites, baterías: requiere extintores PQS y CO2, bandeja antiderrames/arena)",
      regimenRecomendado: "RIMPE Negocio Popular, RIMPE Emprendedor o Régimen Artesanal (si posee calificación JNDA/MIPRO)",
      requiereArcsa: "No requiere permiso sanitario ARCSA (requiere control ambiental municipal de aceites usados).",
      entidadesInvolucradas: ["SRI", "GAD Municipal (Uso de Suelo y Patente)", "Cuerpo de Bomberos de Riobamba", "MAE / SUIA (gestión ambiental)"],
      documentacionRequerida: [
        "Certificado de RUC activo (Actividad CIIU G4520: Mantenimiento mecánico, eléctrico o lubricadora).",
        "Informe Favorable de Compatibilidad de Uso de Suelo PUGS (indispensable antes de arrendar; restringido en zonas residenciales).",
        "Permiso del Cuerpo de Bomberos de Riobamba (riesgo medio/alto: extintores PQS y CO2, cableado entubado y arena antiderrames).",
        "Registro ambiental (SUIA) si generas aceites usados y contrato o actas de entrega con gestor ambiental autorizado.",
        "Certificado de No Adeudar al GAD Municipal de Riobamba del titular del taller.",
        "Formulario de Solicitud de Patente Municipal y LUF para taller automotriz.",
        "Contrato de arrendamiento con cláusula para taller mecánico o pago de Impuesto Predial."
      ],
      alertasAntiRechazo: [
        "Firmar contrato de arriendo en zona residencial sin validar antes el ICUS resulta en negativa definitiva de LUF por ruido e impacto.",
        "Verter aceites quemados o filtros en el alcantarillado municipal acarrea multas ambientales severas y cierre del local."
      ],
      recomendacionesEspecificas: [
        "Solicita primero el Uso de Suelo (Paso 3) con la clave catastral antes de adecuar fosas, elevadores o compresores.",
        "Si cuentas con calificación artesanal en mecánica automotriz (JNDA), preséntala para tramitar la exoneración de Patente."
      ],
      advertenciaSector: "Jamás firmes contrato de arriendo para un taller mecánico en Riobamba sin antes pedir el Informe de Compatibilidad de Uso de Suelo (Paso 3) con la clave catastral."
    },
    {
      id: "artesanal",
      etiquetaPasaporte: "Artesano calificado · Patente exonerada",
      nombre: "Taller Artesanal Calificado",
      categoria: "Artesanal (JNDA / MIPRO)",
      ciiuReferencia: "C1410 / C1520 / C3100 - Confección, calzado, carpintería o producción artesanal calificada",
      icono: "hammer",
      costoAproxTotal: "Exonerado 100% del Impuesto de Patente (Art. 550 COOTAD) y Tasa ARCSA $0.00 (solo paga especies administrativas y Bomberos)",
      tiempoEstimado: "1 a 2 horas de preparación con Cívika (vs 4-6 días presencial)",
      riesgoBomberos: "Riesgo Bajo a Medio (según maquinaria o materia prima utilizada)",
      regimenRecomendado: "Régimen con Calificación Artesanal registrada en el RUC (Facturación tarifa 0% IVA en bienes/servicios de su rama artesanal)",
      requiereArcsa: "Si elabora alimentos o cosméticos artesanales: Exoneración del 100% en la tasa del permiso de funcionamiento ARCSA ($0.00) presentando su calificación artesanal de la JNDA o MIPRO.",
      entidadesInvolucradas: ["JNDA / MIPRO", "SRI", "GAD Municipal de Riobamba", "Cuerpo de Bomberos de Riobamba", "ARCSA (si produce alimentos/cosméticos)"],
      documentacionRequerida: [
        "Calificación Artesanal VIGENTE emitida por la Junta Nacional de Defensa del Artesano (JNDA) o el MIPRO.",
        "Hoja de RUC actualizada donde conste explícitamente la condición de Artesano Calificado.",
        "Solicitud y Formulario de Exoneración del Impuesto de Patente Municipal amparado en el Art. 550 del COOTAD.",
        "Informe de Compatibilidad de Uso de Suelo del taller artesanal en Riobamba.",
        "Permiso Anual de Funcionamiento del Cuerpo de Bomberos de Riobamba acorde al tipo de maquinaria.",
        "Permiso o Notificación ARCSA con tasa $0.00 (únicamente si elaboras alimentos procesados o cosméticos artesanales).",
        "Certificado de No Adeudar al GAD Municipal de Riobamba (requerido aunque el impuesto de patente sea exonerado).",
        "Documento de identidad y certificado de votación del maestro de taller calificado."
      ],
      alertasAntiRechazo: [
        "No declarar el formulario de Patente creyendo que la exoneración del Art. 550 COOTAD te exime del trámite genera multas por declaración tardía.",
        "Tener la calificación JNDA caducada anula automáticamente el beneficio de exoneración municipal y en ARCSA."
      ],
      recomendacionesEspecificas: [
        "Verifica que en tu RUC aparezca el texto de Artesano Calificado antes de acercarte a Rentas Municipales.",
        "Conserva una copia de tu carné o resolución JNDA vigente en el Folio 06 de tu carpeta física."
      ],
      advertenciaSector: "El Art. 550 del COOTAD te exonera de pagar el IMPUESTO de Patente Municipal, pero estás obligado a declarar el formulario en Rentas cada año para obtener tu Patente Exonerada y la LUF."
    },
    {
      id: "restaurante",
      etiquetaPasaporte: "RIMPE · Permiso ARCSA obligatorio",
      nombre: "Restaurante o Comedor",
      categoria: "Alimentos y Bebidas",
      ciiuReferencia: "I5610 - Actividades de restaurantes y de servicio móvil de comidas",
      icono: "utensils",
      costoAproxTotal: "RUC $0 + ARCSA según categoría Mintur (microempresa: tasa $0) + Patente/Bomberos según capital y m²",
      tiempoEstimado: "3 a 4 horas de preparación con Cívika (vs 6-10 días presencial)",
      riesgoBomberos: "Riesgo Medio (cocina con GLP: extintores PQS y CO2, revisión de cilindros/tubería de gas, campana y detector de humo)",
      regimenRecomendado: "RIMPE Negocio Popular (<= $20,000), RIMPE Emprendedor ($20,001 a $300,000) o Régimen General",
      requiereArcsa: "SÍ requiere Permiso de Funcionamiento ARCSA para Restaurantes/Cafeterías (vigencia de 1 año desde su emisión). Requisito especial: categorización del Ministerio de Turismo (tenedores). La tasa depende de la categoría; las microempresas que cumplen los criterios pagan $0 (Resolución ARCSA-ARCSA-2026-0007-R).",
      entidadesInvolucradas: ["SRI", "GAD Municipal de Riobamba", "Ministerio de Turismo", "Cuerpo de Bomberos de Riobamba", "ARCSA Zonal 3"],
      documentacionRequerida: [
        "Certificado de RUC ACTIVO con actividad CIIU I5610 y dirección exacta del restaurante o comedor en Riobamba.",
        "Informe Favorable de Compatibilidad de Uso de Suelo (PUGS - GAD Riobamba) apto para gastronomía.",
        "Registro de Turismo / categorización como establecimiento de alimentos y bebidas (requisito previo exigido por ARCSA).",
        "Permiso Anual del Cuerpo de Bomberos de Riobamba (inspección de cocina industrial, campana, GLP y salidas de emergencia).",
        "Permiso de Funcionamiento ARCSA - Restaurantes/Cafeterías emitido en permisosfuncionamiento.controlsanitario.gob.ec.",
        "Certificado de No Adeudar al GAD Municipal de Riobamba del titular del restaurante.",
        "Formulario Oficial de Declaración de Patente Municipal y LUF gastronómica.",
        "Contrato de arrendamiento del local o pago del Impuesto Predial; cédula y certificado de votación del representante."
      ],
      alertasAntiRechazo: [
        "Intentar sacar el permiso ARCSA de restaurante sin haber completado primero el Registro de Turismo en Mintur bloquea el sistema.",
        "Las cocinas sin campana extractora o sin trampa de grasas reciben observación directa en la inspección municipal y sanitaria."
      ],
      recomendacionesEspecificas: [
        "Tramita la categorización de Mintur en línea inmediatamente después de tener el RUC y Uso de Suelo para no frenar el permiso ARCSA.",
        "Si planeas vender cerveza o licores acompañando comidas, verifica las ordenanzas de horarios y permisos complementarios en el GAD."
      ],
      advertenciaSector: "Instala trampa de grasas en el área de lavado y separa los residuos de cocina. Si vas a vender bebidas alcohólicas, consulta en el GAD los permisos y horarios adicionales antes de abrir."
    },
    {
      id: "peluqueria",
      etiquetaPasaporte: "RIMPE · Permiso ARCSA (desde 2026)",
      nombre: "Peluquería, Barbería o Salón de Belleza",
      categoria: "Estética y Belleza",
      ciiuReferencia: "S9602 - Peluquería y otros tratamientos de belleza",
      icono: "scissors",
      costoAproxTotal: "RUC $0 + ARCSA (microempresa: tasa $0) + Patente/Bomberos según capital y m²",
      tiempoEstimado: "2 a 3 horas de preparación con Cívika (vs 4-6 días presencial)",
      riesgoBomberos: "Riesgo Bajo (extintor PQS 10 lbs, instalaciones eléctricas seguras para secadoras/planchas y señalética)",
      regimenRecomendado: "RIMPE Negocio Popular (<= $20,000) o RIMPE Emprendedor ($20,001 a $300,000)",
      requiereArcsa: "NUEVO 2026: ARCSA incorporó a peluquerías, barberías, salones de belleza y spa en la lista de establecimientos que requieren Permiso de Funcionamiento (clasificación difundida en agosto de 2026). Las microempresas están exentas de pago. Ojo: procedimientos médico-estéticos invasivos NO se permiten en una peluquería; esos requieren permiso de ACESS como servicio de salud.",
      entidadesInvolucradas: ["SRI", "GAD Municipal de Riobamba", "Cuerpo de Bomberos de Riobamba", "ARCSA Zonal 3 (Estética y Belleza)"],
      documentacionRequerida: [
        "Certificado de RUC ACTIVO con actividad CIIU S9602 (servicios de peluquería, barbería o tratamientos de belleza).",
        "Informe Favorable de Compatibilidad de Uso de Suelo (PUGS - GAD Riobamba) para servicios personales.",
        "Permiso Anual del Cuerpo de Bomberos de Riobamba (extintor PQS 10 lbs y tomas eléctricas protegidas para secadoras/planchas).",
        "Permiso de Funcionamiento ARCSA (categoría Estética y Belleza; tasa $0.00 si aplica exoneración de microempresa).",
        "Certificado de No Adeudar al GAD Municipal de Riobamba del dueño del salón o barbería.",
        "Formulario Oficial de Declaración de Patente Municipal y LUF para estética y belleza.",
        "Contrato de arrendamiento vigente o comprobante de Impuesto Predial; cédula y certificado de votación."
      ],
      alertasAntiRechazo: [
        "Ofrecer procedimientos invasivos (bótox, rellenos o mesoterapia) en una peluquería con permiso ARCSA genera sanción y derivación a ACESS.",
        "Tener tintes, queratinas o esmaltes sin Notificación Sanitaria en los estantes motiva observaciones inmediatas en inspección."
      ],
      recomendacionesEspecificas: [
        "Implementa un esterilizador UV o autoclave de mesa para tijeras, peines y navajas, y usa cuchillas desechables por cada cliente.",
        "Coloca regletas con supresor de picos para secadoras y planchas de cabello para aprobar sin observaciones la inspección de Bomberos."
      ],
      advertenciaSector: "Usa solo cosméticos y tintes con Notificación Sanitaria vigente (revisa la etiqueta) y esteriliza tijeras, navajas y peines: es lo primero que revisa un control sanitario."
    },
    {
      id: "farmacia",
      etiquetaPasaporte: "Permiso ARCSA + químico farmacéutico",
      nombre: "Farmacia o Botiquín",
      categoria: "Salud / Establecimiento Farmacéutico",
      ciiuReferencia: "G4772 - Venta al por menor de productos farmacéuticos y medicinales",
      icono: "pill",
      costoAproxTotal: "RUC $0 + Permiso ARCSA según categoría (farmacia comunitaria microempresa: exenta según Res. 2026) + Patente/Bomberos según capital y m²",
      tiempoEstimado: "4 a 6 horas de preparación con Cívika (incluye contrato del químico farmacéutico)",
      riesgoBomberos: "Riesgo Bajo (extintor PQS, señalética, almacenamiento ordenado de alcohol y productos inflamables)",
      regimenRecomendado: "RIMPE Emprendedor o Régimen General según ventas (la mayoría de farmacias supera $20,000 anuales)",
      requiereArcsa: "SÍ, OBLIGATORIO antes de abrir: Permiso de Funcionamiento ARCSA para Farmacias (vigencia de 1 año calendario desde su emisión). Requisito clave: contrato con un Químico Farmacéutico o Bioquímico Farmacéutico como responsable técnico (40 horas semanales si es tiempo completo), registrado ante la autoridad competente.",
      entidadesInvolucradas: ["SRI", "ARCSA Zonal 3 (Farmacias)", "GAD Municipal de Riobamba", "Cuerpo de Bomberos de Riobamba", "IESS (contrato responsable técnico)"],
      documentacionRequerida: [
        "Certificado de RUC ACTIVO con actividad CIIU G4772 (comercio al por menor de productos farmacéuticos).",
        "Contrato registrado (IESS/MDT) con Químico o Bioquímico Farmacéutico responsable técnico con título en SENESCYT y MSP.",
        "Solicitud y Permiso de Funcionamiento ARCSA para Farmacia en permisosfuncionamiento.controlsanitario.gob.ec.",
        "Informe Favorable de Compatibilidad de Uso de Suelo (PUGS - GAD Riobamba) verificando distancia entre farmacias si aplica.",
        "Permiso Anual del Cuerpo de Bomberos de Riobamba (almacenamiento seguro de alcohol e insumos).",
        "Certificado de No Adeudar al GAD Municipal de Riobamba del representante de la farmacia.",
        "Formulario Oficial de Declaración de Patente Municipal y LUF farmacéutica.",
        "Contrato de arrendamiento o pago predial del local; cédula y papeleta de votación vigentes."
      ],
      alertasAntiRechazo: [
        "ARCSA rechaza automáticamente la solicitud si el Químico Farmacéutico no tiene su título registrado en SENESCYT y MSP o figura en más establecimientos de los permitidos.",
        "Dispensar medicamentos sujetos a control o antibióticos sin archivo físico de recetas médicas conlleva sanciones sanitarias."
      ],
      recomendacionesEspecificas: [
        "Instala termohigrómetro calibrado para controlar temperatura y humedad del área de medicamentos y cadena de frío si manejas biológicos.",
        "Mantén en carpeta visible el contrato vigente del responsable técnico y notifica a ARCSA de inmediato si hay cambio de profesional."
      ],
      advertenciaSector: "Sin el químico farmacéutico responsable registrado, ARCSA no emite el permiso. Si el profesional renuncia, debes notificar a ARCSA. Los medicamentos de venta bajo receta exigen archivo de recetas."
    },
    {
      id: "venta_redes",
      etiquetaPasaporte: "RIMPE · Sin local · Sin permiso ARCSA",
      nombre: "Venta por Redes Sociales (sin local)",
      categoria: "Comercio Electrónico / Emprendimiento desde Casa",
      ciiuReferencia: "G4791 - Venta al por menor por correo o por Internet",
      icono: "smartphone",
      costoAproxTotal: "RUC $0 + Patente Municipal según capital (sin Bomberos ni Uso de Suelo si no atiendes al público)",
      tiempoEstimado: "30 a 60 minutos de preparación con Cívika",
      riesgoBomberos: "Normalmente no aplica si no tienes local abierto al público (confírmalo en el GAD si guardas mercadería en bodega)",
      regimenRecomendado: "RIMPE Negocio Popular (<= $20,000) o RIMPE Emprendedor ($20,001 a $300,000)",
      requiereArcsa: "Tu actividad de venta no requiere permiso ARCSA, pero si vendes alimentos procesados, cosméticos o suplementos, cada producto debe tener Notificación Sanitaria vigente. Si los elaboras tú, la producción sí puede requerir permiso.",
      entidadesInvolucradas: ["SRI (RUC digital)", "GAD Municipal de Riobamba (solo Patente / Solvencia)", "ARCSA (solo si elaboras alimentos/cosméticos)"],
      pasosNoAplicanSinLocal: ["req_bomberos", "req_uso_suelo"],
      documentacionRequerida: [
        "RUC ACTIVO bajo CIIU G4791 (comercio electrónico / ventas por redes sociales y catálogos digitales desde Riobamba).",
        "Comprobantes de venta autorizados (notas de venta RIMPE Negocio Popular o facturación electrónica RIMPE Emprendedor).",
        "Declaración de Patente Municipal en Rentas del GAD Riobamba (grava la actividad económica habitual en el cantón, sin requerir local comercial abierto — Art. 547 COOTAD).",
        "Certificado de No Adeudar al GAD Municipal de Riobamba vinculado a tu número de cédula o RUC.",
        "Cédula y certificado de votación del emprendedor digital (y comprobante de domicilio si declaras dirección de vivienda en el RUC)."
      ],
      alertasAntiRechazo: [
        "Dejar sin dirección exacta o inconsistente la ficha del RUC con la declaración de Patente Municipal frena la emisión de la solvencia en Rentas.",
        "Publicar y vender alimentos o cosméticos caseros sin Notificación Sanitaria expone a retención de envíos y sanciones de ARCSA."
      ],
      recomendacionesEspecificas: [
        "No pagues permiso de Bomberos ni Uso de Suelo mientras operes 100% desde casa sin atención presencial ni bodega abierta al público.",
        "Publica precios finales, políticas de cambio/devolución y canal de reclamos para cumplir con la Ley Orgánica de Defensa del Consumidor."
      ],
      advertenciaSector: "Publica precios claros, condiciones de cambio/devolución y tus datos de contacto: la Ley Orgánica de Defensa del Consumidor también protege a quien compra por redes. Si luego abres un local físico, debes agregar Uso de Suelo y Bomberos."
    }
  ],

  // ==========================================
  // MÉTRICAS DE MEJORA Y COMPARATIVA DE TIEMPO
  // ==========================================
  metricasTiempo: {
    porcentajeAhorro: 85,
    ahorroHoras: "34 horas ahorradas en promedio",
    diasAhorrados: "4 a 5 días hábiles",
    presencial: {
      tiempoPromedio: "4 a 6 días hábiles",
      horasInvertidas: "36 a 48 horas acumuladas en filas y regresos",
      ventanillasVisitadas: "4 a 6 ventanillas en distintos edificios",
      tasaRechazoCarpetas: "48% devueltas por incoherencia de dirección, falta de uso de suelo o firmas",
      gastoTramitadores: "$40 a $80 USD cobrados por tramitadores informales",
      friccion: "Desconocimiento de requisitos, compra de especies equivocadas y pérdida de viajes por planillas vencidas."
    },
    enLineaCivika: {
      tiempoPromedio: "1 a 2 horas de preparación guiada",
      horasInvertidas: "30 min en diagnóstico + radicación directa sin errores",
      ventanillasVisitadas: "Portales oficiales directos + 1 entrega en Ventanilla Única con Pasaporte QR",
      tasaRechazoCarpetas: "0% (Carpeta pre-auditada con los 4 Pilares y Semáforo Pre-Ventanilla)",
      gastoTramitadores: "$0.00 USD (Orientación ciudadana 100% gratuita y transparente)",
      friccion: "Ruta encadenada que advierte coherencia entre RUC, Uso de Suelo, Bomberos y ARCSA."
    },
    comparativaPorTramite: [
      { tramite: "1. RUC / RIMPE (SRI)", presencial: "1 a 2 días", enLinea: "15 minutos", ahorro: "90% menos tiempo" },
      { tramite: "2. Permiso Bomberos Riobamba", presencial: "2 a 3 días", enLinea: "30 minutos (solicitud)", ahorro: "85% menos tiempo" },
      { tramite: "3. Uso de Suelo PUGS (GADMR)", presencial: "2 a 3 días", enLinea: "20 minutos (solicitud)", ahorro: "80% menos tiempo" },
      { tramite: "4. Certificado No Adeudar", presencial: "1 día hábil", enLinea: "5 minutos", ahorro: "95% menos tiempo" },
      { tramite: "5. Patente Municipal (Rentas)", presencial: "1 a 2 días", enLinea: "15 minutos", ahorro: "85% menos tiempo" },
      { tramite: "6. LUF + Control ARCSA", presencial: "3 a 5 días", enLinea: "20 minutos", ahorro: "85% menos tiempo" }
    ]
  },

  // ==============================================================
  // RUTA CRONOLÓGICA ENUMERADA Y ENCADENADA (PASO 1 AL PASO 7)
  // Conserva los 6 pasos originales por ID + incorpora el Servicio Oficial ARCSA
  // Cada servicio incluye obligatoriamente LOS 4 PILARES + RUTA ENCADENADA
  // ==============================================================
  pasosSecuenciales: [
    // --------------------------------------------------------------
    // PASO 1: SRI - RUC PERSONA NATURAL / RIMPE VS RÉGIMEN GENERAL
    // --------------------------------------------------------------
    {
      paso: 1,
      id: "req_ruc",
      idTramite: "sri_ruc",
      entidadBadge: "SERVICIO DE RENTAS INTERNAS (SRI)",
      titulo: "Registro Único de Contribuyentes (RUC Persona Natural: RIMPE vs. Régimen General)",
      nombre: "Registro Único de Contribuyentes (RUC / RIMPE)",
      entidad: "Servicio de Rentas Internas (SRI - Dirección Zonal 3 Riobamba)",
      icono: "file-text",
      color: "indigo",
      esObligatorioPrimero: true,
      etiquetaOrden: "Paso 01 • HACER PRIMERO (BASE TRIBUTARIA)",
      porQuePrimero: "El RUC es la partida de nacimiento tributaria de tu emprendimiento. Ninguna institución en Riobamba (ni el GAD Municipal, ni el Cuerpo de Bomberos, ni la ARCSA) puede iniciar tu expediente sin tu número de RUC de 13 dígitos activo, tu código de actividad CIIU y la dirección exacta de tu establecimiento en Riobamba.",
      tiempoPresencial: "1 a 2 días en agencia SRI",
      tiempoEnLinea: "15 minutos en portal SRI en Línea",
      ahorroEstimado: "16 horas ahorradas",
      queHacer: "Inscribe o actualiza tu RUC en el SRI registrando la dirección exacta de tu local en Riobamba y el código de actividad económica (CIIU). Verifica si te corresponde RIMPE Negocio Popular, RIMPE Emprendedor o Régimen General.",
      documentoParaCarpeta: "Certificado de RUC en estado ACTIVO impreso desde SRI en Línea con código QR de verificación vigente.",
      comoPresentarEnCarpeta: "Impresión legible (color o blanco y negro) donde se visualice el QR, el estado ACTIVO, el régimen tributario y el establecimiento N° 001 (o siguiente) ubicado en Riobamba. Va en el Folio 02 de tu carpeta municipal.",

      // Ficha Explicativa
      queEs: "Es el registro oficial administrado por el Servicio de Rentas Internas (SRI) que identifica a los ciudadanos que realizan actividades económicas lícitas y define su régimen de tributación en el Ecuador.",
      paraQueSirve: "Habilita la emisión legal de comprobantes de venta (notas de venta o facturas electrónicas) y es el requisito base para obtener el Permiso de Bomberos, la Patente Municipal del GAD Riobamba y el permiso o exoneración de ARCSA.",
      queRevisar: [
        "Que el Estado del RUC diga explícitamente ACTIVO (no suspendido ni cancelado).",
        "Que la dirección del establecimiento (calle principal, numeración, intersección y parroquia de Riobamba) coincida palabra por palabra con la planilla de servicio básico y el contrato de arriendo.",
        "Que el régimen asignado sea coherente: Servicios Profesionales con título van a Régimen General (excluidos de RIMPE por ley); comercios con ventas anuales hasta $20,000 van a RIMPE Negocio Popular; ventas de $20,001 a $300,000 van a RIMPE Emprendedor."
      ],
      costo: "Gratuito ($0.00 USD en el portal web y en ventanillas del SRI). ¡No pagues a tramitadores!",
      dondeObtenerlo: "En línea a través de https://srienlinea.sri.gob.ec (con usuario y clave o firma electrónica) o presencialmente en la Agencia SRI Riobamba (Av. Daniel León Borja y 10 de Agosto / Centro Histórico).",
      enlaceOficial: "https://srienlinea.sri.gob.ec",
      enlaceDescargaDirecta: "https://srienlinea.sri.gob.ec/sri-en-linea/inicio/NAT",
      nombreDescarga: "Descargar Maqueta de Certificado RUC (PDF)",
      codigoFormulario: "SRI-RUC-NAT-2026",

      // ==========================================================
      // LOS 4 PILARES OBLIGATORIOS (SERVICIO 1: SRI RUC)
      // ==========================================================
      pilares: {
        // PILAR 1: Diagnóstico Rápido (2-3 preguntas filtro)
        diagnosticoRapido: [
          {
            id: "ruc_q1",
            pregunta: "1. ¿Cuál es la actividad principal que vas a realizar en Riobamba?",
            opciones: [
              {
                valor: "comercio_servicios",
                texto: "Comercio, tienda, cafetería, taller o manufactura",
                resultadoRuta: "Ruta RIMPE: Ingresas al Régimen Simplificado (Negocio Popular hasta $20,000 USD anuales o Emprendedor hasta $300,000 USD)."
              },
              {
                valor: "profesional",
                texto: "Servicios profesionales con título (Médico, Abogado, Ingeniero, Contador)",
                resultadoRuta: "Ruta Régimen General: Por mandato de la Ley Tributaria, los servicios profesionales están EXCLUIDOS del RIMPE. Debes emitir factura electrónica y declarar IVA."
              },
              {
                valor: "artesano",
                texto: "Taller artesanal con calificación vigente de la JNDA o MIPRO",
                resultadoRuta: "Ruta Artesano Calificado: Registra tu calificación artesanal en el SRI para facturar con tarifa 0% de IVA en tu rama y acceder a la exoneración del impuesto de Patente (Art. 550 COOTAD)."
              }
            ]
          },
          {
            id: "ruc_q2",
            pregunta: "2. ¿Cuáles son tus ingresos brutos anuales estimados?",
            opciones: [
              {
                valor: "hasta_20k",
                texto: "De $0 a $20,000 USD al año",
                resultadoRuta: "Si no eres profesional excluido, calificas como RIMPE Negocio Popular (emites notas de venta y pagas cuota anual progresiva mínima en el SRI)."
              },
              {
                valor: "20k_a_300k",
                texto: "De $20,001 a $300,000 USD al año",
                resultadoRuta: "Calificas como RIMPE Emprendedor: requiere firma electrónica para facturación electrónica y declaración semestral de IVA."
              }
            ]
          },
          {
            id: "ruc_q3",
            pregunta: "3. ¿Ya dispones de clave de acceso a SRI en Línea?",
            opciones: [
              {
                valor: "si_clave",
                texto: "Sí, tengo clave o firma electrónica",
                resultadoRuta: "Trámite 100% digital en 15 minutos desde srienlinea.sri.gob.ec sin ir a la agencia."
              },
              {
                valor: "no_clave",
                texto: "No tengo clave del SRI todavía",
                resultadoRuta: "Puedes solicitar tu clave con firma electrónica en línea o acudir con tu cédula y planilla de luz a las ventanillas del SRI Riobamba."
              }
            ]
          }
        ],

        // PILAR 2: Checklist Personalizado Interactivo
        checklistPersonalizado: [
          {
            id: "chk_ruc_1",
            item: "Cédula de identidad vigente (física o digital en Gob.ec) y certificado de votación.",
            obligatorio: true,
            referenciaUrl: "https://www.gob.ec/sri/tramites/inscripcion-registro-unico-contribuyentes-ruc-persona-natural"
          },
          {
            id: "chk_ruc_2",
            item: "Planilla de servicio básico (luz EERSA, agua EP-EMAPAR o teléfono fijo) de los ÚLTIMOS 3 MESES donde conste la dirección exacta del local en Riobamba.",
            obligatorio: true,
            referenciaUrl: "https://www.sri.gob.ec/ruc-personas-naturales"
          },
          {
            id: "chk_ruc_3",
            item: "Calificación Artesanal emitida por la JNDA o MIPRO (Únicamente si eres artesano calificado).",
            obligatorio: false,
            referenciaUrl: "https://www.artesanos.gob.ec"
          },
          {
            id: "chk_ruc_4",
            item: "Título profesional registrado en SENESCYT (Únicamente para inscripción de actividades profesionales).",
            obligatorio: false,
            referenciaUrl: "https://www.senescyt.gob.ec/consulta-titulos-web"
          }
        ],

        // PILAR 3: Paso a Paso con Prevención de Errores Críticos
        pasosConPrevencion: [
          {
            orden: 1,
            accion: "Verifica la dirección exacta en la planilla de luz (EERSA) de los últimos 3 meses.",
            alertaCritica: "ERROR QUE REBOTA EN VENTANILLA: Presentar una planilla de luz con más de 90 días de antigüedad o registrar en el RUC una calle distinta a la que figura en el medidor del local."
          },
          {
            orden: 2,
            accion: "Selecciona el código CIIU exacto de tu actividad económica en el portal del SRI.",
            alertaCritica: "ERROR QUE REBOTA EN EL MUNICIPIO: Si en el RUC pones 'Venta de ropa' pero en la inspección municipal ven una 'Cafetería', el GAD Riobamba y Bomberos rechazarán tu carpeta hasta que actualices el RUC."
          },
          {
            orden: 3,
            accion: "Descarga el Certificado de RUC con código QR y verifica que el establecimiento en Riobamba figure como ABIERTO / ACTIVO.",
            alertaCritica: "ALERTA ANTI-ESTAFAS: La inscripción y descarga del RUC cuesta $0.00. No entregues tu clave personal del SRI a tramitadores externos."
          }
        ],

        // PILAR 4: Plan B Accionable
        planBAccionable: [
          {
            escenario: "¿Qué hacer si la planilla de luz está a nombre del dueño de casa (local arrendado)?",
            solucion: "Es 100% válido ante el SRI. No necesitas cambiar el medidor a tu nombre: presenta la planilla de luz original del propietario del inmueble (de los últimos 3 meses) acompañada de tu contrato de arriendo o declaración de ubicación."
          },
          {
            escenario: "¿Qué hacer si el portal web del SRI está intermitente o no tienes clave electrónica?",
            solucion: "Acude directamente a las ventanillas de atención del SRI en Riobamba (Av. Daniel León Borja y 10 de Agosto) de 08:00 a 17:00 con tu cédula original, papeleta de votación y la planilla de servicio básico impresa."
          }
        ]
      },

      // CONEXIÓN ENTRE TRÁMITES (RUTA ENCADENADA)
      conexionSiguienteTramite: {
        siguienteId: "req_bomberos",
        siguientePasoNumero: 2,
        siguienteTitulo: "Permiso de Funcionamiento del Cuerpo de Bomberos de Riobamba",
        mensajeEncadenado: "🔗 RUTA ENCADENADA: ¡Excelente! Con tu RUC activo ya tienes el código CIIU y la dirección oficial. Tu siguiente paso lógico es tramitar el Permiso de Bomberos (Paso 02) y el Uso de Suelo (Paso 03). REGLA DE ORO: Copia exactamente la misma dirección e intersección que pusiste en el RUC al llenar la solicitud de Bomberos y Patente."
      },

      datosEjemplo: {
        numero: "0603849209001",
        razonSocial: "PÉREZ EJEMPLO JUAN (FICTICIO)",
        nombreComercial: "COMERCIAL RIOBAMBA STYLES",
        actividadPrincipal: "G4771 - VENTA AL POR MENOR DE PRENDAS DE VESTIR EN ESTABLECIMIENTOS ESPECIALIZADOS",
        regimen: "RIMPE - NEGOCIO POPULAR",
        direccion: "AV. DANIEL LEÓN BORJA 24-18 Y BRASIL, PARROQUIA LIZARZABURU, RIOBAMBA",
        estado: "ACTIVO",
        fechaEmision: "18/11/2026"
      }
    },

    // --------------------------------------------------------------
    // PASO 2: CUERPO DE BOMBEROS DE RIOBAMBA - PERMISO DE FUNCIONAMIENTO
    // --------------------------------------------------------------
    {
      paso: 2,
      id: "req_bomberos",
      idTramite: "bomberos_permiso",
      entidadBadge: "CUERPO DE BOMBEROS DE RIOBAMBA",
      titulo: "Permiso Anual de Funcionamiento del Cuerpo de Bomberos de Riobamba",
      nombre: "Permiso de Funcionamiento del Cuerpo de Bomberos",
      entidad: "Cuerpo de Bomberos del Cantón Riobamba (Dirección de Prevención)",
      icono: "flame",
      color: "red",
      esObligatorioPrimero: false,
      etiquetaOrden: "Paso 02 • SEGURIDAD Y PREVENCIÓN CONTRA INCENDIOS",
      porQuePrimero: "La normativa municipal de Riobamba exige contar con el Permiso de Funcionamiento del Cuerpo de Bomberos vigente como requisito habilitante previo a la declaración de la Patente Municipal y emisión de la LUF.",
      tiempoPresencial: "2 a 3 días hábiles",
      tiempoEnLinea: "30 minutos (registro digital de solicitud)",
      ahorroEstimado: "24 horas ahorradas",
      queHacer: "Instala en tu local el extintor recargado (mínimo PQS 10 lbs para locales pequeños), señalética de evacuación, lámpara de emergencia y botiquín; luego ingresa la solicitud en línea o en las oficinas de Prevención del Cuerpo de Bomberos de Riobamba.",
      documentoParaCarpeta: "Permiso Anual de Funcionamiento emitido por el Cuerpo de Bomberos de Riobamba (Válido del 1 de enero al 31 de diciembre del año fiscal).",
      comoPresentarEnCarpeta: "Certificado impreso con código QR / sello de Prevención del Cuerpo de Bomberos de Riobamba. El original debe exhibirse en un lugar visible del local y una copia legible va en el Folio 03 de tu carpeta municipal.",

      // Ficha Explicativa
      queEs: "Es la autorización técnica anual emitida por el Cuerpo de Bomberos de Riobamba una vez verificado que el establecimiento comercial cumple con las medidas de prevención y protección contra incendios.",
      paraQueSirve: "Protege la vida de tus clientes y tu inversión frente a siniestros eléctricos o de gas, y es un requisito obligatorio exigido por la Dirección Financiera del GAD Riobamba para la Patente y LUF.",
      queRevisar: [
        "Que el extintor (PQS 10 lbs o CO2 según actividad) tenga la etiqueta de recarga vigente del año en curso y la aguja del manómetro esté en la franja VERDE.",
        "Que el extintor esté colgado en la pared a una altura máxima de 1.50 metros del piso al soporte, libre de obstáculos y con su señalética superior.",
        "Que los cables eléctricos estén debidamente canalizados o entubados (sin empates expuestos) y exista señalética de 'Salida de Emergencia' y 'Riesgo Eléctrico' en el tablero."
      ],
      costo: "Sujeto a cálculo oficial según la categoría de riesgo, actividad económica y metraje (m²) del establecimiento conforme a la tabla vigente del Cuerpo de Bomberos en su portal oficial.",
      dondeObtenerlo: "Plataforma oficial https://www.bomberosriobamba.gob.ec o presencialmente en las oficinas del Cuerpo de Bomberos de Riobamba (Calles Chile 26-56 y Pichincha / Av. 5 de Junio).",
      enlaceOficial: "https://www.bomberosriobamba.gob.ec",
      enlaceDescargaDirecta: "https://www.gob.ec/cbr",
      nombreDescarga: "Descargar Lista de Autoverificación Bomberil (PDF)",
      codigoFormulario: "CBR-PREV-2026",

      // ==========================================================
      // LOS 4 PILARES OBLIGATORIOS (SERVICIO 2: BOMBEROS RIOBAMBA)
      // ==========================================================
      pilares: {
        diagnosticoRapido: [
          {
            id: "cbr_q1",
            pregunta: "1. ¿En tu local utilizas cilindros de gas (GLP), hornos, freidoras o suelda?",
            opciones: [
              {
                valor: "no_fuego",
                texto: "No, es comercio, tienda u oficina sin fuego abierto",
                resultadoRuta: "Riesgo Bajo: Requiere 1 extintor PQS de 10 lbs vigente por cada área básica, señalética de salida/extintor, lámpara de emergencia y botiquín."
              },
              {
                valor: "si_glp",
                texto: "Sí, es cafetería, restaurante o panadería con gas GLP",
                resultadoRuta: "Riesgo Medio: Además del extintor PQS/CO2 y señalética, el inspector verificará mangueras de alta presión, regulador industrial, ventilación y detector de humo."
              },
              {
                valor: "si_inflamables",
                texto: "Sí, es taller mecánico, lubricadora o maneja solventes/combustibles",
                resultadoRuta: "Riesgo Medio-Alto: Requiere extintor PQS + extintor CO2 para tablero eléctrico, cajón de arena seca antiderrames y cables 100% entubados."
              }
            ]
          },
          {
            id: "cbr_q2",
            pregunta: "2. ¿Cuál es la superficie aproximada de tu local comercial en Riobamba?",
            opciones: [
              {
                valor: "menor_50",
                texto: "Hasta 50 m² (Local pequeño / estándar)",
                resultadoRuta: "Inspección rápida de equipamiento básico (1 extintor de 10 lbs, botiquín básico, lámpara de emergencia y señalética ISO)."
              },
              {
                valor: "mayor_50",
                texto: "Más de 50 m² o alto aforo de personas",
                resultadoRuta: "Se requiere 1 extintor por cada 50-100 m² o fracción, luces de emergencia en rutas de evacuación y plan de emergencia si supera el aforo normado."
              }
            ]
          }
        ],

        checklistPersonalizado: [
          {
            id: "chk_cbr_1",
            item: "Copia del RUC activo actualizado con la dirección del establecimiento en Riobamba.",
            obligatorio: true,
            referenciaUrl: "https://www.bomberosriobamba.gob.ec"
          },
          {
            id: "chk_cbr_2",
            item: "Copia de cédula de identidad del propietario o representante legal.",
            obligatorio: true,
            referenciaUrl: "https://www.gob.ec/cbr"
          },
          {
            id: "chk_cbr_3",
            item: "Comprobante de pago del Impuesto Predial del año vigente (del inmueble donde funciona el local).",
            obligatorio: true,
            referenciaUrl: "https://www.bomberosriobamba.gob.ec"
          },
          {
            id: "chk_cbr_4",
            item: "Factura o etiqueta de compra/recarga vigente del extintor (PQS 10 lbs mínimo) e instalación física antes de la inspección.",
            obligatorio: true,
            referenciaUrl: "https://www.bomberosriobamba.gob.ec"
          }
        ],

        pasosConPrevencion: [
          {
            orden: 1,
            accion: "Instala físicamente el extintor, la lámpara de emergencia, el botiquín y las señales (Salida, Extintor, Riesgo Eléctrico) ANTES de pedir la inspección.",
            alertaCritica: "ERROR QUE REBOTA LA INSPECCIÓN: Dejar el extintor en el suelo o escondido detrás del mostrador. Debe estar colgado en soporte firme a máximo 1.50 m del suelo y cerca de la puerta."
          },
          {
            orden: 2,
            accion: "Registra tu solicitud en línea en bomberosriobamba.gob.ec o en la ventanilla de Prevención adjuntando RUC, cédula y predial.",
            alertaCritica: "ERROR CRÍTICO EN CAFETERÍAS: Usar manguera plástica doméstica vencida en cilindros de gas comercial. Usa manguera reforzada para GLP con abrazaderas metálicas."
          },
          {
            orden: 3,
            accion: "Una vez aprobada la revisión y cancelada la tasa oficial en recaudación/bancos autorizados, descarga e imprime tu Permiso Anual.",
            alertaCritica: "RECUERDA LA VIGENCIA: El permiso de Bomberos vence el 31 de diciembre de cada año fiscal."
          }
        ],

        planBAccionable: [
          {
            escenario: "¿Qué hacer si el local es arrendado y no tienes la carta del Impuesto Predial del dueño?",
            solucion: "Solicita al arrendador una copia simple o foto del pago predial del año vigente. Si el dueño no se encuentra en Riobamba, con los nombres completos o clave catastral del contrato de arriendo puedes consultar la referencia predial en las ventanillas municipales."
          },
          {
            escenario: "¿Qué hacer si el inspector dejó una hoja de observaciones (notificación preventiva)?",
            solucion: "No te clausuran de inmediato si es una observación subsanable: tienes el plazo indicado en el acta (usualmente 8 a 15 días) para recargar el extintor o colocar la señalética faltante y solicitar la reinspección sin pagar una nueva tasa."
          }
        ]
      },

      conexionSiguienteTramite: {
        siguienteId: "req_uso_suelo",
        siguientePasoNumero: 3,
        siguienteTitulo: "Informe de Compatibilidad de Uso de Suelo (ICUS - GAD Riobamba)",
        mensajeEncadenado: "🔗 RUTA ENCADENADA: Con tu seguridad contra incendios lista, el siguiente paso crítico es el Informe de Compatibilidad de Uso de Suelo (Paso 03) en el GAD Municipal de Riobamba. Ten a mano el comprobante de Impuesto Predial que usaste en Bomberos, porque de ahí tomarás la Clave Catastral."
      },

      datosEjemplo: {
        numeroPermiso: "CBR-2026-008492",
        establecimiento: "COMERCIAL RIOBAMBA STYLES",
        propietario: "PÉREZ EJEMPLO JUAN (FICTICIO)",
        categoriaRiesgo: "RIESGO BAJO - COMERCIO MINORISTA",
        equipamientoInspeccionado: "1 EXTINTOR PQS 10 LBS VIGENTE, LÁMPARA EMERGENCIA, BOTIQUÍN Y SEÑALÉTICA ISO",
        vigencia: "VÁLIDO HASTA EL 31 DE DICIEMBRE DE 2026"
      }
    },

    // --------------------------------------------------------------
    // PASO 3: GAD MUNICIPAL DE RIOBAMBA - INFORME DE COMPATIBILIDAD DE USO DE SUELO
    // --------------------------------------------------------------
    {
      paso: 3,
      id: "req_uso_suelo",
      idTramite: "gad_suelo",
      entidadBadge: "GAD MUNICIPAL DE RIOBAMBA",
      titulo: "Informe de Compatibilidad de Uso de Suelo (ICUS - PUGS Riobamba)",
      nombre: "Informe de Compatibilidad de Uso de Suelo",
      entidad: "GAD Municipal de Riobamba (Dirección de Gestión de Ordenamiento Territorial)",
      icono: "map-pin",
      color: "emerald",
      esObligatorioPrimero: false,
      etiquetaOrden: "Paso 03 • ZONIFICACIÓN URBANÍSTICA (PUGS)",
      porQuePrimero: "Certifica técnicamente si el Plan de Uso y Gestión del Suelo (PUGS) del cantón Riobamba permite abrir tu tipo de negocio en ese predio específico. Sin un Uso de Suelo Compatible/Favorable, Rentas Municipales no puede autorizar la Licencia de Funcionamiento.",
      tiempoPresencial: "2 a 3 días hábiles",
      tiempoEnLinea: "20 minutos de solicitud digital",
      ahorroEstimado: "20 horas ahorradas",
      queHacer: "Con la clave catastral del predio (consta en la carta del Impuesto Predial), solicita el Informe de Compatibilidad de Uso de Suelo (ICUS) indicando el código CIIU o giro exacto de tu negocio.",
      documentoParaCarpeta: "Informe de Compatibilidad de Uso de Suelo (ICUS) con dictamen COMPATIBLE / FAVORABLE emitido por Ordenamiento Territorial del GAD Riobamba.",
      comoPresentarEnCarpeta: "Documento impreso con firma electrónica o sello de Ordenamiento Territorial donde conste la clave catastral del local y el dictamen favorable. Va en el Folio 04 de tu carpeta final.",

      // Ficha Explicativa
      queEs: "Es el acto administrativo técnico emitido por el GAD Municipal de Riobamba que verifica si la actividad económica solicitada es compatible con la zonificación del sector según el Plan de Uso y Gestión del Suelo (PUGS).",
      paraQueSirve: "Garantiza el orden urbano de Riobamba y protege tu inversión: evita que adecúes o pagues arriendo en un local donde la actividad esté prohibida (por ejemplo, talleres de alto impacto o bares en zonas residenciales restringidas o cerca de escuelas).",
      queRevisar: [
        "Que la Clave Catastral ingresada en la solicitud corresponda exactamente al predio y local donde funcionará el establecimiento.",
        "Que el giro de negocio solicitado coincida con la actividad principal de tu RUC.",
        "Si el local está en el Centro Histórico de Riobamba (zonas patrimoniales), verifica las condiciones sobre letreros y no alteración de fachadas."
      ],
      costo: "Sujeto a tasa administrativa municipal vigente por especie valorada / servicio técnico según ordenanza del GAD Municipal de Riobamba.",
      dondeObtenerlo: "Plataforma de servicios en línea del GAD Municipal de Riobamba (https://www.gadmriobamba.gob.ec) o en las ventanillas de Ordenamiento Territorial (Calle 5 de Junio y Veloz).",
      enlaceOficial: "https://www.gadmriobamba.gob.ec",
      enlaceDescargaDirecta: "https://www.gob.ec/gadmr",
      nombreDescarga: "Descargar Guía y Formato de Uso de Suelo (PDF)",
      codigoFormulario: "GADMR-OT-ICUS-2026",

      // ==========================================================
      // LOS 4 PILARES OBLIGATORIOS (SERVICIO 3: USO DE SUELO GAD RIOBAMBA)
      // ==========================================================
      pilares: {
        diagnosticoRapido: [
          {
            id: "suelo_q1",
            pregunta: "1. ¿Qué tipo de impacto urbano tiene tu actividad en Riobamba?",
            opciones: [
              {
                valor: "bajo_impacto",
                texto: "Comercio barrial, tienda de ropa, bazar, cafetería u oficina profesional",
                resultadoRuta: "Alta compatibilidad en la mayoría de zonas residenciales-comerciales y mixtas del PUGS Riobamba."
              },
              {
                valor: "medio_alto_impacto",
                texto: "Taller mecánico, carpintería industrial, lubricadora o centro de diversión nocturna",
                resultadoRuta: "¡PRECAUCIÓN CRÍTICA! Estas actividades tienen zonificación restringida. Solicita el ICUS ANTES de firmar contrato de arrendamiento."
              }
            ]
          },
          {
            id: "suelo_q2",
            pregunta: "2. ¿Tu local se encuentra dentro del perímetro del Centro Histórico de Riobamba?",
            opciones: [
              {
                valor: "si_patrimonio",
                texto: "Sí, está en el Centro Histórico (bien o zona patrimonial)",
                resultadoRuta: "Ten presente que cualquier letrero publicitario exterior o adecuación debe cumplir los lineamientos de Patrimonio Cultural del GAD Riobamba."
              },
              {
                valor: "no_patrimonio",
                texto: "No, está en otra zona urbana o rural de Riobamba",
                resultadoRuta: "Aplica regulación ordinaria del PUGS según el polígono de intervención territorial."
              }
            ]
          }
        ],

        checklistPersonalizado: [
          {
            id: "chk_suelo_1",
            item: "Clave Catastral exacta del predio (tomada del comprobante de pago del Impuesto Predial del año vigente).",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_suelo_2",
            item: "Copia del RUC activo, cédula de identidad y certificado de votación del solicitante.",
            obligatorio: true,
            referenciaUrl: "https://www.gob.ec/gadmr"
          },
          {
            id: "chk_suelo_3",
            item: "Fotografías claras del local comercial (fachada exterior e interior del establecimiento).",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_suelo_4",
            item: "Contrato de arrendamiento o escritura/predial que respalde el uso del inmueble.",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          }
        ],

        pasosConPrevencion: [
          {
            orden: 1,
            accion: "Ubica el número de Clave Catastral en la esquina superior de la carta del Impuesto Predial Urbano o Rural de Riobamba.",
            alertaCritica: "ERROR QUE REBOTA EN VENTANILLA: Poner la clave catastral de la casa donde vives en lugar de la clave catastral del local donde vas a poner el negocio."
          },
          {
            orden: 2,
            accion: "Ingresa la solicitud del Informe de Compatibilidad de Uso de Suelo (ICUS) especificando la actividad económica exacta de tu RUC.",
            alertaCritica: "ERROR FINANCIERO GRAVE: Invertir en remodelación y pagar meses de garantía de arriendo en un taller o bar sin haber obtenido primero el dictamen COMPATIBLE."
          },
          {
            orden: 3,
            accion: "Recibe el certificado con dictamen FAVORABLE / COMPATIBLE y archívalo en el Folio 04 de tu carpeta.",
            alertaCritica: "Verifica que la dirección escrita en el ICUS guarde total coherencia con tu RUC y con el Permiso de Bomberos."
          }
        ],

        planBAccionable: [
          {
            escenario: "¿Qué hacer si el sistema municipal en línea presenta intermitencia al consultar la clave catastral?",
            solucion: "Acude a la Ventanilla de Ordenamiento Territorial / Avalúos y Catastros del GAD Municipal de Riobamba (Calle 5 de Junio y Veloz) llevando una foto del frente del local, las calles exactas y el nombre del dueño del inmueble para que el técnico ubique el predio en el mapa GIS."
          },
          {
            escenario: "¿Qué hacer si el dictamen sale NO COMPATIBLE para la actividad que querías?",
            solucion: "No abras el local bajo esa actividad porque serás clausurado por Comisaría Municipal. Tienes dos opciones legales: 1) Cambiar a un giro comercial permitido en esa zona residencial (ej. comercio minorista sin manufactura ruidosa), o 2) Buscar un local en un polígono comercial/industrial compatible."
          }
        ]
      },

      conexionSiguienteTramite: {
        siguienteId: "req_solvencia",
        siguientePasoNumero: 4,
        siguienteTitulo: "Certificado de No Adeudar al GAD Municipal de Riobamba",
        mensajeEncadenado: "🔗 RUTA ENCADENADA: ¡Ya tienes RUC, Bomberos y Uso de Suelo Favorable! Antes de llenar el Formulario de Patente Municipal, el sistema financiero del GAD Riobamba exige verificar que no tengas deudas pendientes. Avanza al Paso 04: Certificado de No Adeudar (Solvencia Municipal)."
      },

      datosEjemplo: {
        codigoCatastral: "06-01-02-04-0012-000",
        clavePredio: "URB-RIO-48291",
        direccionInmueble: "AV. DANIEL LEÓN BORJA 24-18 Y BRASIL, PARROQUIA LIZARZABURU",
        zonificacionPUGS: "ZONA MIXTA COMERCIAL Y DE SERVICIOS (ZMC)",
        dictamen: "COMPATIBLE / FAVORABLE"
      }
    },

    // --------------------------------------------------------------
    // PASO 4: GAD MUNICIPAL DE RIOBAMBA - CERTIFICADO DE NO ADEUDAR (SOLVENCIA)
    // --------------------------------------------------------------
    {
      paso: 4,
      id: "req_solvencia",
      idTramite: "gad_solvencia",
      entidadBadge: "GAD MUNICIPAL DE RIOBAMBA",
      titulo: "Certificado de No Adeudar al GAD Municipal de Riobamba (Solvencia)",
      nombre: "Certificado de No Adeudar al Municipio (Solvencia)",
      entidad: "GAD Municipal de Riobamba (Dirección Financiera / Tesorería)",
      icono: "check-circle",
      color: "sky",
      esObligatorioPrimero: false,
      etiquetaOrden: "Paso 04 • SOLVENCIA FINANCIERA MUNICIPAL",
      porQuePrimero: "El sistema de Rentas del GAD Municipal de Riobamba bloquea la inscripción o renovación de la Patente Municipal si el titular registra valores vencidos por impuesto predial, contribución especial de mejoras, agua potable o multas administrativas.",
      tiempoPresencial: "1 día hábil en filas de recaudación",
      tiempoEnLinea: "5 minutos en portal municipal",
      ahorroEstimado: "8 horas ahorradas",
      queHacer: "Consulta con tu número de cédula o RUC que no mantengas obligaciones vencidas con el GAD Municipal de Riobamba y genera el Certificado de No Adeudar.",
      documentoParaCarpeta: "Certificado de No Adeudar al GAD Municipal de Riobamba vigente, sin valores pendientes ($0.00 de mora).",
      comoPresentarEnCarpeta: "Certificado impreso con código de verificación o sello de Tesorería Municipal. Tiene vigencia administrativa de 30 días calendario. Va en el Folio 05 de tu carpeta.",

      // Ficha Explicativa
      queEs: "Es la certificación oficial emitida por la Tesorería del GAD Municipal de Riobamba que acredita que el ciudadano o contribuyente se encuentra al día en sus obligaciones tributarias y no tributarias con el Municipio.",
      paraQueSirve: "Es un requisito habilitante obligatorio dentro del expediente de Patente Municipal y Licencia de Funcionamiento (LUF).",
      queRevisar: [
        "Que los nombres y el número de cédula/RUC del titular estén correctamente impresos.",
        "Que la fecha de emisión del certificado no supere los 30 días de antigüedad al momento de ingresar la carpeta en Ventanilla Única.",
        "Que el propietario del local (arrendador) también tenga pagado el Impuesto Predial del año en curso."
      ],
      costo: "Sujeto a tasa administrativa por especie valorada municipal conforme a la ordenanza vigente del GAD Municipal de Riobamba.",
      dondeObtenerlo: "Portal de Servicios en Línea del GAD Municipal de Riobamba (https://www.gadmriobamba.gob.ec) o ventanillas de Recaudación y Tesorería (Calle 5 de Junio y Veloz).",
      enlaceOficial: "https://www.gadmriobamba.gob.ec",
      enlaceDescargaDirecta: "https://www.gadmriobamba.gob.ec",
      nombreDescarga: "Descargar Maqueta de Certificado de Solvencia (PDF)",
      codigoFormulario: "GADMR-TES-SOLV-2026",

      // ==========================================================
      // LOS 4 PILARES OBLIGATORIOS (SERVICIO 4: SOLVENCIA GAD RIOBAMBA)
      // ==========================================================
      pilares: {
        diagnosticoRapido: [
          {
            id: "solv_q1",
            pregunta: "1. ¿Tienes propiedades, patentes anteriores o vehículos registrados en el cantón Riobamba?",
            opciones: [
              {
                valor: "sin_deudas",
                texto: "Soy emprendedor nuevo sin deudas ni patentes anteriores",
                resultadoRuta: "Emisión inmediata: tu certificado saldrá limpio sin valores pendientes."
              },
              {
                valor: "con_historial",
                texto: "Tuve un RUC/Patente hace años o tengo predio en Riobamba",
                resultadoRuta: "Verifica primero en el portal de consultas si cerraste formalmente tu patente anterior; un RUC cerrado en el SRI que no se notificó en el Municipio sigue generando patente anual."
              }
            ]
          },
          {
            id: "solv_q2",
            pregunta: "2. ¿Cuándo piensas entregar tu carpeta física en Ventanilla Única?",
            opciones: [
              {
                valor: "esta_semana",
                texto: "En los próximos 15 días",
                resultadoRuta: "Momento ideal para emitir el certificado (tiene 30 días de vigencia)."
              },
              {
                valor: "mas_de_un_mes",
                texto: "Dentro de más de un mes",
                resultadoRuta: "Espera a tener listos tu RUC, Bomberos y Uso de Suelo antes de comprar el Certificado de No Adeudar para que no caduque."
              }
            ]
          }
        ],

        checklistPersonalizado: [
          {
            id: "chk_solv_1",
            item: "Número de Cédula de Identidad o RUC del titular del emprendimiento.",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_solv_2",
            item: "Estar al día en pagos de Impuesto Predial, tasas o patentes anteriores en el GAD Riobamba.",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          }
        ],

        pasosConPrevencion: [
          {
            orden: 1,
            accion: "Realiza la consulta previa de valores pendientes con tu número de cédula en el portal del GAD Riobamba.",
            alertaCritica: "ERROR QUE REBOTA EN VENTANILLA: Haber cerrado un negocio antiguo en el SRI hace años pero nunca haber presentado la 'Baja de Patente' en el Municipio de Riobamba (genera títulos de crédito pendientes)."
          },
          {
            orden: 2,
            accion: "Cancela la tasa de especie correspondiente y descarga o retira tu Certificado de No Adeudar.",
            alertaCritica: "ERROR DE VIGENCIA: No saques este certificado 2 meses antes de presentar la carpeta, porque caduca a los 30 días."
          }
        ],

        planBAccionable: [
          {
            escenario: "¿Qué hacer si te aparece una deuda antigua por una patente o título que no puedes pagar de contado?",
            solucion: "Acude a la Dirección Financiera / Tesorería del GAD Municipal de Riobamba (5 de Junio y Veloz) y solicita un Convenio de Facilidades de Pago (abonando el porcentaje inicial de ley). Con el convenio suscrito y al día, puedes habilitar tu trámite."
          },
          {
            escenario: "¿Qué hacer si el sistema web de certificados no carga?",
            solucion: "Puedes adquirirlo directamente en cualquiera de las ventanillas de Recaudación del Palacio Municipal (5 de Junio y Veloz) presentando únicamente tu número de cédula."
          }
        ]
      },

      conexionSiguienteTramite: {
        siguienteId: "req_formulario_patente",
        siguientePasoNumero: 5,
        siguienteTitulo: "Declaración de Patente Municipal Anual (GAD Riobamba)",
        mensajeEncadenado: "🔗 RUTA ENCADENADA: Con tu Certificado de No Adeudar vigente, ya tienes los 4 pilares previos (RUC, Bomberos, Uso de Suelo y Solvencia). Ahora estás listo para el Paso 05: Llenar el Formulario Oficial de Patente Municipal en Rentas."
      },

      datosEjemplo: {
        codigoCertificado: "SOLV-GADMR-2026-98124",
        contribuyente: "PÉREZ EJEMPLO JUAN (FICTICIO)",
        cedulaRuc: "0603849209001",
        saldoPendiente: "$0.00 USD (NO REGISTRA OBLIGACIONES VENCIDAS)"
      }
    },

    // --------------------------------------------------------------
    // PASO 5: GAD MUNICIPAL DE RIOBAMBA - PATENTE MUNICIPAL ANUAL
    // --------------------------------------------------------------
    {
      paso: 5,
      id: "req_formulario_patente",
      idTramite: "gad_patente",
      entidadBadge: "GAD MUNICIPAL DE RIOBAMBA",
      titulo: "Inscripción y Declaración de Patente Municipal Anual (Arts. 547-553 COOTAD)",
      nombre: "Formulario de Solicitud de Patente Municipal y LUF",
      entidad: "GAD Municipal de Riobamba (Dirección Financiera / Jefatura de Rentas)",
      icono: "clipboard-list",
      color: "blue",
      esObligatorioPrimero: false,
      etiquetaOrden: "Paso 05 • CARÁTULA Y LIQUIDACIÓN DE PATENTE MUNICIPAL",
      porQuePrimero: "Por mandato de los Arts. 547 al 553 del COOTAD, toda persona natural o jurídica que ejerza permanentemente actividades comerciales, industriales, financieras o profesionales en el cantón Riobamba debe inscribirse en el catastro de Patente Municipal dentro de los 30 días siguientes al inicio de su actividad.",
      tiempoPresencial: "1 a 2 días hábiles en Rentas",
      tiempoEnLinea: "15 minutos con el Borrador No Sensible de Cívika",
      ahorroEstimado: "14 horas ahorradas",
      queHacer: "Completa el Formulario Oficial de Declaración de Patente Municipal con los mismos datos de tu RUC y Uso de Suelo, declara tu capital de operación (o presenta tu calificación artesanal JNDA para exoneración según Art. 550 COOTAD) y fírmalo con esfero azul idéntico a tu cédula.",
      documentoParaCarpeta: "Formulario Oficial de Declaración de Patente Municipal firmado por el contribuyente y comprobante de pago de la patente anual (o resolución de exoneración artesanal).",
      comoPresentarEnCarpeta: "El Formulario de Solicitud/Declaración firmado con esfero azul va como CARÁTULA (Portada) de tu carpeta física municipal, anexando detrás los Folios 01 al 06.",

      // Ficha Explicativa
      queEs: "Es el tributo municipal anual obligatorio establecido en el COOTAD que grava el ejercicio permanente de actividades económicas dentro de la jurisdicción del cantón Riobamba.",
      paraQueSirve: "Inscribe formalmente a tu negocio en el Catastro Tributario del GAD Municipal de Riobamba y habilita la emisión de la Licencia Única Anual de Funcionamiento (LUF).",
      queRevisar: [
        "Que la firma manuscrita del titular en el formulario sea realizada con bolígrafo AZUL y sea idéntica a la firma de la cédula de identidad.",
        "Que la dirección, clave catastral y actividad económica coincidan exactamente con el RUC (Paso 1), Bomberos (Paso 2) y Uso de Suelo (Paso 3).",
        "Si eres Artesano Calificado por la JNDA o MIPRO: adjuntar copia certificada/vigente de tu calificación artesanal para aplicar a la exoneración del impuesto de patente conforme al Art. 550 del COOTAD."
      ],
      costo: "Sujeto a cálculo oficial en la Jefatura de Rentas según el capital propio declarado con el que opera el negocio y la tabla progresiva de la ordenanza vigente del GAD Municipal de Riobamba (Artesanos calificados: Exonerados del impuesto según Art. 550 COOTAD, cancelan únicamente tasas/especies administrativas).",
      dondeObtenerlo: "Jefatura de Rentas del GAD Municipal de Riobamba (Calle 5 de Junio y Veloz) y portal oficial https://www.gadmriobamba.gob.ec.",
      enlaceOficial: "https://www.gadmriobamba.gob.ec",
      enlaceDescargaDirecta: "https://www.gob.ec/gadmr",
      nombreDescarga: "Descargar Formulario Borrador de Patente (PDF)",
      codigoFormulario: "GADMR-RENTAS-PAT-2026",

      // ==========================================================
      // LOS 4 PILARES OBLIGATORIOS (SERVICIO 5: PATENTE MUNICIPAL GAD RIOBAMBA)
      // ==========================================================
      pilares: {
        diagnosticoRapido: [
          {
            id: "pat_q1",
            pregunta: "1. ¿Estás obligado a llevar contabilidad o tienes Calificación Artesanal vigente?",
            opciones: [
              {
                valor: "no_contabilidad",
                texto: "Persona Natural NO obligada a llevar contabilidad (RIMPE / Régimen General)",
                resultadoRuta: "Liquidación directa sobre la base del capital propio declarado (inventario + equipos + mobiliario del local) según la tabla de la ordenanza municipal."
              },
              {
                valor: "artesano_jnda",
                texto: "Soy Artesano Calificado vigente (JNDA o MIPRO)",
                resultadoRuta: "Ruta de Exoneración (Art. 550 COOTAD): Estás exonerado del pago del impuesto de patente municipal, pero debes presentar el formulario y tu carnet artesanal en Rentas para obtener la patente en $0.00."
              },
              {
                valor: "obligado_contabilidad",
                texto: "Persona Natural Obligada a llevar contabilidad o Sociedad",
                resultadoRuta: "Debes adjuntar el balance financiero o declaración del Impuesto a la Renta del ejercicio inmediato anterior firmado por el contador."
              }
            ]
          },
          {
            id: "pat_q2",
            pregunta: "2. ¿Hace cuántos días abriste tu RUC en el SRI?",
            opciones: [
              {
                valor: "menos_30_dias",
                texto: "Hace menos de 30 días",
                resultadoRuta: "Estás dentro del plazo legal del COOTAD (30 días siguientes al inicio de la actividad) sin recargos ni multas por inscripción tardía."
              },
              {
                valor: "mas_30_dias",
                texto: "Hace más de 30 días o años anteriores",
                resultadoRuta: "Acude de inmediato a Rentas Municipales: el sistema liquidará los períodos desde la fecha de inicio de actividades que consta en el RUC."
              }
            ]
          }
        ],

        checklistPersonalizado: [
          {
            id: "chk_pat_1",
            item: "Formulario Oficial de Declaración de Patente Municipal lleno sin tachones y firmado con esfero azul idéntico a la cédula.",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_pat_2",
            item: "Copia a color de cédula de identidad y certificado de votación vigente (Folio 01) + Certificado de RUC activo (Folio 02).",
            obligatorio: true,
            referenciaUrl: "https://www.gob.ec/gadmr"
          },
          {
            id: "chk_pat_3",
            item: "Permiso de Funcionamiento del Cuerpo de Bomberos de Riobamba vigente (Folio 03) + Informe Favorable de Uso de Suelo ICUS (Folio 04).",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_pat_4",
            item: "Certificado de No Adeudar al GAD Municipal de Riobamba vigente (Folio 05) + Contrato de Arrendamiento o Pago de Impuesto Predial (Folio 06).",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_pat_5",
            item: "Carnet de Calificación Artesanal JNDA/MIPRO vigente (Solo si solicitas exoneración Art. 550 COOTAD) o Título SENESCYT (Solo profesionales).",
            obligatorio: false,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          }
        ],

        pasosConPrevencion: [
          {
            orden: 1,
            accion: "Verifica que la fecha de inicio de actividades y la dirección del local en el Formulario de Patente sean exactamente iguales a tu hoja de RUC.",
            alertaCritica: "ERROR QUE REBOTA EN VENTANILLA: Poner en el formulario una firma distinta o rúbrica rápida que no coincide con la firma de la cédula de identidad."
          },
          {
            orden: 2,
            accion: "Declara con honestidad tu capital de operación (valor de mercadería, estanterías y equipos propios del local).",
            alertaCritica: "ADVERTENCIA LEGAL: Si algún día cierras tu negocio, debes tramitar la 'Baja de Patente' en el GAD Riobamba adjuntando la suspensión del RUC; si solo cierras el RUC en el SRI pero no avisas al Municipio, la deuda municipal seguirá corriendo cada año."
          },
          {
            orden: 3,
            accion: "Entrega la carpeta en Rentas / Ventanilla Única y realiza el pago del título de crédito emitido directamente en las ventanillas de Recaudación Municipal o bancos autorizados.",
            alertaCritica: "ALERTA ANTI-ESTAFAS: Jamás entregues dinero en efectivo en la calle a supuestos tramitadores. Todo pago oficial emite un comprobante con sello y numeración del GAD Municipal de Riobamba."
          }
        ],

        planBAccionable: [
          {
            escenario: "¿Qué hacer si tu local es arrendado y no tienes un contrato notariado?",
            solucion: "Presenta el contrato de arrendamiento simple suscrito entre las partes acompañado de la copia de cédula del propietario del inmueble y la copia del comprobante de pago del Impuesto Predial del año vigente."
          },
          {
            escenario: "¿Qué hacer si tienes dudas al llenar los casilleros de capital del formulario?",
            solucion: "Usa nuestro generador 'Pasaporte de Trámite QR' en Cívika para llevar el borrador pre-llenado y pide asistencia gratuita en el Balcón de Servicios / Información de Rentas del GAD Municipal de Riobamba (5 de Junio y Veloz)."
          }
        ]
      },

      conexionSiguienteTramite: {
        siguienteId: "req_luf_final",
        siguientePasoNumero: 6,
        siguienteTitulo: "Licencia Única de Funcionamiento (LUF) y Verificación Sanitaria ARCSA",
        mensajeEncadenado: "🔗 RUTA ENCADENADA: ¡Ya casi terminas! Una vez inscrita y liquidada tu Patente Municipal en Rentas, el expediente pasa al Paso 06 Final: Emisión de la Licencia Única de Funcionamiento (LUF). Además, si tu negocio manipula alimentos, cosméticos o medicamentos, revisa el Paso 07 de ARCSA."
      },

      datosEjemplo: {
        formularioId: "PAT-GADMR-2026-4019",
        nombresApellidos: "PÉREZ EJEMPLO JUAN (FICTICIO)",
        tipoPersona: "PERSONA NATURAL NO OBLIGADA A LLEVAR CONTABILIDAD",
        regimenTributario: "RIMPE - NEGOCIO POPULAR",
        impuestoPatenteLiquidado: "SUJETO A LIQUIDACIÓN OFICIAL EN RENTAS SEGÚN CAPITAL DECLARADO (EXONERADO SI ES ARTESANO ART. 550 COOTAD)"
      }
    },

    // --------------------------------------------------------------
    // PASO 6: GAD MUNICIPAL DE RIOBAMBA + ARCSA - LUF Y CONTROL SANITARIO
    // --------------------------------------------------------------
    {
      paso: 6,
      id: "req_luf_final",
      idTramite: "gad_luf",
      entidadBadge: "GAD MUNICIPAL DE RIOBAMBA / ARCSA",
      titulo: "Licencia Única de Funcionamiento (LUF) + Permiso / Exoneración ARCSA",
      nombre: "Emisión de la Licencia Única de Funcionamiento (LUF) y Control ARCSA",
      entidad: "GAD Municipal de Riobamba (Control Municipal) & ARCSA Zonal 3",
      icono: "award",
      color: "amber",
      esObligatorioPrimero: false,
      esPasoFinal: true,
      etiquetaOrden: "Paso 06 • PASO FINAL: LUF MUNICIPAL + EXONERACIÓN ARCSA",
      porQuePrimero: "Es la culminación de tu formalización en Riobamba. Une la Licencia Única de Funcionamiento (LUF) municipal con el cumplimiento sanitario de la ARCSA (cuando tu giro es de alimentos, salud o cosméticos), dejándote 100% blindado ante operativos de Comisaría Municipal, Intendencia y ARCSA.",
      tiempoPresencial: "3 a 5 días sin guía previa",
      tiempoEnLinea: "20 minutos con carpeta verificada y plataforma ARCSA",
      ahorroEstimado: "Hasta 30 horas y $60-$80 en tramitadores",
      queHacer: "Presenta tu carpeta completa foliada (con tu Pasaporte QR Cívika) en Ventanilla Única del GAD Riobamba para obtener tu LUF, y si tu actividad está sujeta a control sanitario, verifica o descarga tu Permiso/Exoneración en el portal de la ARCSA.",
      documentoParaCarpeta: "Licencia Única Anual de Funcionamiento (LUF) con código QR municipal + Certificado/Exoneración ARCSA (si aplica a tu actividad).",
      comoPresentarEnCarpeta: "Exhibe la LUF y el Permiso de Bomberos en un marco visible en la entrada o caja de tu local comercial en Riobamba.",

      // Ficha Explicativa
      queEs: "La LUF es la autorización municipal anual que habilita la operación comercial del establecimiento en Riobamba; en actividades de alimentos, farmacias o cosméticos se complementa con el Permiso de Funcionamiento o Exoneración de la Agencia Nacional de Regulación, Control y Vigilancia Sanitaria (ARCSA).",
      paraQueSirve: "Acredita ante los inspectores municipales y nacionales que tu establecimiento opera legalmente, evitando multas, sellos de clausura o decomisos.",
      queRevisar: [
        "En tu LUF Municipal: que el año fiscal vigente, la dirección del local en Riobamba y la actividad económica coincidan con tu RUC.",
        "En ARCSA (Normativa de Simplificación y Exoneración): 1) Tiendas de abarrotes, panaderías tradicionales, micromercados y heladerías están EXENTOS de sacar permiso físico ARCSA (OJO: desde la clasificación difundida por ARCSA en agosto de 2026, peluquerías, barberías, salones de belleza y spa SÍ requieren permiso; microempresas exentas de pago) (pero sujetos a control de higiene y fechas de caducidad); 2) Si tu actividad sí requiere permiso ARCSA (ej. restaurante mayor o planta procesadora) y eres MICROEMPRESA o ARTESANO CALIFICADO, la tasa oficial en el sistema de ARCSA es de $0.00 (Exoneración 100% de pago).",
        "En Notificación Sanitaria de alimentos procesados: los microempresarios y artesanos calificados gozan de tarifas diferenciadas y descuentos oficiales en la ARCSA."
      ],
      costo: "LUF Municipal: Sujeta a liquidación administrativa municipal según metraje/categoría en ordenanza vigente. ARCSA: $0.00 USD para establecimientos exentos por tipología y $0.00 USD (exonerado de tasa) para Microempresas y Artesanos Calificados.",
      dondeObtenerlo: "LUF: Ventanilla Única del GAD Municipal de Riobamba (Calle 5 de Junio y Veloz). ARCSA: Sistema Automatizado en https://permisosfuncionamiento.controlsanitario.gob.ec o Coordinación Zonal 3 ARCSA en Riobamba.",
      enlaceOficial: "https://permisosfuncionamiento.controlsanitario.gob.ec",
      enlaceDescargaDirecta: "https://www.controlsanitario.gob.ec",
      nombreDescarga: "Descargar Maqueta de LUF y Guía ARCSA (PDF)",
      codigoFormulario: "LUF-GADMR-ARCSA-2026",

      // ==========================================================
      // LOS 4 PILARES OBLIGATORIOS (SERVICIO 6: LUF + ARCSA)
      // ==========================================================
      pilares: {
        diagnosticoRapido: [
          {
            id: "luf_arcsa_q1",
            pregunta: "1. ¿Tu emprendimiento en Riobamba prepara alimentos, procesa productos o vende abarrotes?",
            opciones: [
              {
                valor: "no_alimentos",
                texto: "No (es tienda de ropa, calzado, ferretería, taller mecánico u oficina)",
                resultadoRuta: "Ruta Solo LUF Municipal: No necesitas realizar ningún trámite en la ARCSA. Con tus Pasos 1 al 5 obtienes directamente la LUF en el GAD Riobamba."
              },
              {
                valor: "tienda_cafeteria_exenta",
                texto: "Sí, es tienda de barrio, micromercado, panadería, heladería o fuente de soda",
                resultadoRuta: "Ruta Simplificación ARCSA ($0.00): Por resolución de la ARCSA, estas tipologías están EXENTAS de tramitar el permiso anual de funcionamiento físico, pero deben cumplir higiene y vender solo productos con Notificación Sanitaria y fecha vigente."
              },
              {
                valor: "restaurante_procesador",
                texto: "Sí, es restaurante de mayor escala, catering, farmacia o elaboro alimentos empacados para vender en tiendas",
                resultadoRuta: "Ruta Permiso / Notificación ARCSA: Debes registrarte en permisosfuncionamiento.controlsanitario.gob.ec. Si eres Artesano Calificado o Microempresa, el sistema aplica EXONERACIÓN automática (Orden de pago en $0.00 USD)."
              }
            ]
          },
          {
            id: "luf_arcsa_q2",
            pregunta: "2. ¿Cuentas con Calificación Artesanal (JNDA/MIPRO) o registro de Microempresa en el RUC?",
            opciones: [
              {
                valor: "si_micro_artesano",
                texto: "Sí, soy Artesano Calificado o Microempresa (ventas <= $300,000)",
                resultadoRuta: "Beneficio Legal Activo: Tienes tasa $0.00 en el Permiso de Funcionamiento de la ARCSA y tarifa reducida para obtener Notificación Sanitaria de tus productos."
              },
              {
                valor: "no_general",
                texto: "Soy mediana/gran empresa",
                resultadoRuta: "El sistema de la ARCSA calculará el coeficiente de tasa según la categoría y riesgo sanitario."
              }
            ]
          }
        ],

        checklistPersonalizado: [
          {
            id: "chk_luf_1",
            item: "Carpeta Manila completa y foliada con los documentos de los Pasos 1, 2, 3, 4 y 5 (RUC, Bomberos, Uso de Suelo, Solvencia y Patente).",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_luf_2",
            item: "Pasaporte de Trámite Cívika con Código QR impreso o en el celular para validación rápida en Ventanilla Única.",
            obligatorio: true,
            referenciaUrl: "https://www.gadmriobamba.gob.ec"
          },
          {
            id: "chk_luf_3",
            item: "Si aplica ARCSA: Registro en permisosfuncionamiento.controlsanitario.gob.ec con número de RUC activo y Calificación Artesanal (si aplica exoneración $0.00).",
            obligatorio: false,
            referenciaUrl: "https://permisosfuncionamiento.controlsanitario.gob.ec"
          },
          {
            id: "chk_luf_4",
            item: "Si manipulas alimentos: Trampa de grasas instalada, basureros con tapa y accionamiento a pedal, y productos en percha con Notificación Sanitaria vigente.",
            obligatorio: false,
            referenciaUrl: "https://www.controlsanitario.gob.ec"
          }
        ],

        pasosConPrevencion: [
          {
            orden: 1,
            accion: "Realiza la auditoría final de tu carpeta verificando que la dirección en el RUC, Bomberos, Uso de Suelo y Patente sea 100% idéntica.",
            alertaCritica: "ERROR QUE REBOTA EN VENTANILLA ÚNICA: Presentar documentos con direcciones contradictorias o sin la firma azul del titular en el formulario de Patente."
          },
          {
            orden: 2,
            accion: "Si tu negocio requiere permiso ARCSA, ingresa a permisosfuncionamiento.controlsanitario.gob.ec, digita tu RUC y selecciona tu tipología exacta.",
            alertaCritica: "ALERTA ANTI-ESTAFAS EN ARCSA: Tramitadores inescrupulosos cobran $50 a $150 por sacar el permiso ARCSA a microempresas o tiendas de barrio, cuando para tiendas está exento y para microempresas/artesanos la tasa oficial es $0.00."
          },
          {
            orden: 3,
            accion: "Coloca tu Licencia Única de Funcionamiento (LUF), tu Permiso de Bomberos y tu Certificado ARCSA (si aplica) en un portadocumentos visible dentro del local.",
            alertaCritica: "PREVENCIÓN DE CLAUSURA EN OPERATIVOS: Aunque una tienda de barrio esté exenta del permiso físico de ARCSA, puede ser sancionada si exhibe en percha productos caducados o de contrabando sin Notificación Sanitaria ecuatoriana."
          }
        ],

        planBAccionable: [
          {
            escenario: "¿Qué hacer si el portal web de la ARCSA no reconoce automáticamente tu calificación artesanal o de microempresa?",
            solucion: "Acude o comunícate con la Coordinación Zonal 3 de la ARCSA en Riobamba llevando tu RUC actualizado y tu carnet de la JNDA o registro del MIPRO para que habiliten tu categoría con orden de pago $0.00."
          },
          {
            escenario: "¿Qué hacer si tienes una inspección municipal mientras tu LUF está en trámite de firma?",
            solucion: "Muestra al inspector municipal el comprobante oficial de ingreso de tu carpeta en Ventanilla Única junto con el recibo de pago de la Patente Municipal y el Permiso de Bomberos vigente."
          }
        ]
      },

      conexionSiguienteTramite: {
        siguienteId: "pasaporte_qr",
        siguientePasoNumero: 7,
        siguienteTitulo: "Generar tu Pasaporte de Trámite con Código QR",
        mensajeEncadenado: "🎉 ¡RUTA COMPLETA! Ya dominas los 6 pasos oficiales entre el SRI, Cuerpo de Bomberos de Riobamba, GAD Municipal de Riobamba y ARCSA. Ahora genera tu 'Pasaporte de Trámite con Código QR' en Cívika para llevar tu resumen verificado a Ventanilla Única."
      },

      datosEjemplo: {
        numeroResolucion: "LUF-2026-RIO-04829",
        nombreLocal: "COMERCIAL RIOBAMBA STYLES",
        titular: "PÉREZ EJEMPLO JUAN (FICTICIO)",
        vigencia: "AÑO FISCAL 2026 (GAD RIOBAMBA + CUMPLIMIENTO ARCSA)"
      }
    }
  ],

  // ==========================================
  // COMPARATIVAS "TRÁMITE OFICIAL VS. ESTAFA DE TRAMITADORES" (Para Rich Cards del Chatbot)
  // ==========================================
  alertasAntitramitadores: [
    {
      tramite: "Inscripción o Actualización de RUC / RIMPE (SRI)",
      costoOficial: "$0.00 USD (100% Gratuito en SRI en Línea o Agencia Riobamba)",
      estafaTramitador: "Cobran de $15 a $30 USD y piden tu clave personal del SRI (poniendo en riesgo tu identidad tributaria).",
      reglaSeguridad: "Nunca entregues tu contraseña del SRI a terceros. El trámite toma 15 minutos."
    },
    {
      tramite: "Permiso de Funcionamiento ARCSA (Microempresas / Artesanos / Tiendas)",
      costoOficial: "$0.00 USD (Exonerado para microempresas y artesanos; tiendas y panaderías exentas de permiso físico)",
      estafaTramitador: "Cobran de $40 a $120 USD engañando al emprendedor con supuestas tasas sanitarias inexistentes.",
      reglaSeguridad: "Verifica siempre tu tipología directamente en permisosfuncionamiento.controlsanitario.gob.ec."
    },
    {
      tramite: "Carpeta de Patente Municipal y Uso de Suelo (GAD Riobamba)",
      costoOficial: "Únicamente especies valoradas oficiales y liquidación directa en Tesorería Municipal según tu capital real.",
      estafaTramitador: "Cobran de $50 a $100 USD solo por llenar el formulario de papel y hacer la fila.",
      reglaSeguridad: "Cívika te entrega el Formulario Borrador No Sensible y el Pasaporte QR gratis."
    }
  ],

  // ==========================================
  // CENTRO DE DESCARGAS RÁPIDAS DE FORMULARIOS
  // ==========================================
  centroDescargas: [
    {
      id: "descarga_patente",
      nombre: "Formulario Oficial de Declaración de Patente Municipal (GAD Riobamba)",
      entidad: "GAD Municipal de Riobamba",
      codigo: "GADMR-RENTAS-PAT-2026",
      tipo: "Formulario Oficial / PDF",
      icono: "clipboard-list",
      color: "blue",
      enlaceOficial: "https://www.gadmriobamba.gob.ec",
      stepId: "req_formulario_patente"
    },
    {
      id: "descarga_bomberos",
      nombre: "Lista de Verificación y Solicitud de Permiso de Bomberos",
      entidad: "Cuerpo de Bomberos de Riobamba",
      codigo: "CBR-PREV-2026",
      tipo: "Guía de Inspección / PDF",
      icono: "flame",
      color: "red",
      enlaceOficial: "https://www.bomberosriobamba.gob.ec",
      stepId: "req_bomberos"
    },
    {
      id: "descarga_suelo",
      nombre: "Solicitud de Informe de Compatibilidad de Uso de Suelo (ICUS - PUGS)",
      entidad: "GADMR Ordenamiento Territorial",
      codigo: "GADMR-OT-ICUS-2026",
      tipo: "Formato Técnico / PDF",
      icono: "map-pin",
      color: "emerald",
      enlaceOficial: "https://www.gadmriobamba.gob.ec",
      stepId: "req_uso_suelo"
    },
    {
      id: "descarga_solvencia",
      nombre: "Certificado de No Adeudar al GAD Municipal de Riobamba",
      entidad: "GADMR Tesorería Municipal",
      codigo: "GADMR-TES-SOLV-2026",
      tipo: "Certificado / PDF",
      icono: "check-circle",
      color: "sky",
      enlaceOficial: "https://www.gadmriobamba.gob.ec",
      stepId: "req_solvencia"
    },
    {
      id: "descarga_ruc",
      nombre: "Certificado de Registro Único de Contribuyentes (RUC / RIMPE)",
      entidad: "Servicio de Rentas Internas (SRI)",
      codigo: "SRI-RUC-NAT-2026",
      tipo: "Certificado Oficial / PDF",
      icono: "file-text",
      color: "indigo",
      enlaceOficial: "https://srienlinea.sri.gob.ec",
      stepId: "req_ruc"
    },
    {
      id: "descarga_luf_arcsa",
      nombre: "Guía Oficial LUF Municipal + Exoneración ARCSA Microempresas/Artesanos",
      entidad: "GAD Riobamba & ARCSA",
      codigo: "LUF-GADMR-ARCSA-2026",
      tipo: "Certificación Final / PDF",
      icono: "award",
      color: "amber",
      enlaceOficial: "https://permisosfuncionamiento.controlsanitario.gob.ec",
      stepId: "req_luf_final"
    }
  ],

  // ==========================================
  // GUÍA DE ARMADO DE LA CARPETA FINAL MUNICIPAL
  // ==========================================
  guiaCarpetaFinal: {
    titulo: "Instrucciones para Armar la Carpeta Final en Ventanilla Única (Riobamba)",
    tipoCarpeta: "Carpeta Manila con vincha metálica o carpeta plástica conPasaporte QR en la portada",
    ordenFolios: [
      { folio: "Portada / Carátula", doc: "Formulario de Declaración de Patente Municipal firmado con esfero azul idéntico a la cédula + Pasaporte QR Cívika." },
      { folio: "Folio 01", doc: "Copia legible de Cédula de Identidad y Certificado de Votación vigente del titular." },
      { folio: "Folio 02", doc: "Certificado de RUC en estado ACTIVO impreso del SRI con código QR y establecimiento en Riobamba." },
      { folio: "Folio 03", doc: "Permiso Anual de Funcionamiento del Cuerpo de Bomberos de Riobamba." },
      { folio: "Folio 04", doc: "Informe Favorable de Compatibilidad de Uso de Suelo (ICUS - PUGS GAD Riobamba)." },
      { folio: "Folio 05", doc: "Certificado de No Adeudar al GAD Municipal de Riobamba (vigencia 30 días)." },
      { folio: "Folio 06", doc: "Contrato de Arrendamiento o Comprobante de Pago del Impuesto Predial del año en curso (y Carnet Artesanal JNDA si aplica exoneración Art. 550 COOTAD)." }
    ],
    consejosRechazoCero: [
      "Firma con bolígrafo azul idéntico a tu cédula de identidad en el Formulario de Patente.",
      "Verifica que la dirección (calle principal, número e intersección en Riobamba) sea EXACTAMENTE igual en el RUC, en Bomberos, en Uso de Suelo y en la planilla de servicio básico.",
      "Usa el Auditor Pre-Ventanilla de Cívika para validar tus archivos en tu navegador antes de salir de casa."
    ]
  },

  requisitosComplementarios: [
    {
      id: "req_arriendo_predio",
      nombre: "Contrato de Arrendamiento o Pago de Impuesto Predial Vigente",
      entidad: "Propietario del Inmueble / GAD Riobamba",
      icono: "home",
      descripcion: "Si el local es arrendado: contrato de arriendo y copia del pago predial del propietario. Si es propio: comprobante del impuesto predial del año en curso.",
      costo: "Sin costo adicional en ventanilla"
    },
    {
      id: "req_cedula_papeleta",
      nombre: "Copia de Cédula de Identidad y Certificado de Votación",
      entidad: "Registro Civil / CNE",
      icono: "user-check",
      descripcion: "Documentos de identidad vigentes del titular para contrastar la firma manuscrita del formulario.",
      costo: "Gratuito ($0.00)"
    },
    {
      id: "req_artesano_jnda",
      nombre: "Calificación Artesanal Vigente JNDA / MIPRO (Opcional - Solo Artesanos)",
      entidad: "Junta Nacional de Defensa del Artesano / MIPRO",
      icono: "hammer",
      descripcion: "Requisito indispensable para solicitar la exoneración del 100% del Impuesto de Patente Municipal (Art. 550 COOTAD) y tasa $0.00 en ARCSA.",
      costo: "Exoneración legal de tributos"
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CIVIKA_KNOWLEDGE_BASE;
}
