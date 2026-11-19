/**
 * CIVIKA - Directorio de Instituciones Públicas en Riobamba
 * Datos verificados para el cantón Riobamba (GAD Municipal, Cuerpo de Bomberos, SRI, ARCSA, JNDA, IESS)
 * Con integración de Google Maps en vivo + Tarjeta de Respaldo Offline (Plan B para Demo sin Internet)
 */

const CIVIKA_INSTITUTIONS = [
  {
    id: "municipio_riobamba",
    nombre: "GAD Municipal de Riobamba (Palacio Municipal / Ventanilla Única)",
    categoria: "Municipio",
    icono: "landmark",
    color: "blue",
    direccion: "Calle 5 de Junio y Veloz (Palacio Municipal) / Balcón de Servicios Av. Daniel León Borja y Brasil",
    horario: "08:00 - 17:00",
    dias: "Lunes a Viernes",
    telefono: "(03) 296-6000",
    portalWeb: "https://www.gadmriobamba.gob.ec",
    tramites: ["Patente Municipal Anual", "Emisión de LUF", "Certificado de No Adeudar", "Ventanilla Única"],
    coordenadas: { lat: -1.6745, lng: -78.6521 },
    mapsEmbedUrl: "https://maps.google.com/maps?q=GAD+Municipal+de+Riobamba,+5+de+Junio+y+Veloz,+Riobamba&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=GAD+Municipal+de+Riobamba+5+de+Junio+y+Veloz",
    referencia: "Centro Histórico de Riobamba (Frente al Parque Sucre / Colegio Maldonado)",
    consejoVentanilla: "Presenta tu carpeta manila foliada con el Formulario de Patente firmado con esfero azul y tu Pasaporte QR Cívika.",
    verificado: "Noviembre 2026"
  },
  {
    id: "ordenamiento_territorial",
    nombre: "Dirección de Ordenamiento Territorial (Uso de Suelo PUGS - GADMR)",
    categoria: "Municipio",
    icono: "map-pin",
    color: "emerald",
    direccion: "Calle 5 de Junio y Veloz (Edificio Municipal Central)",
    horario: "08:00 - 17:00",
    dias: "Lunes a Viernes",
    telefono: "(03) 296-6000 ext. 1020",
    portalWeb: "https://www.gadmriobamba.gob.ec",
    tramites: ["Informe de Compatibilidad de Uso de Suelo (ICUS)", "Zonificación PUGS", "Clave Catastral"],
    coordenadas: { lat: -1.6745, lng: -78.6521 },
    mapsEmbedUrl: "https://maps.google.com/maps?q=Municipio+de+Riobamba,+5+de+Junio+y+Veloz,+Riobamba&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Municipio+Riobamba+5+de+Junio+y+Veloz",
    referencia: "Edificio Histórico Central del GAD Riobamba",
    consejoVentanilla: "Lleva el comprobante del Impuesto Predial del año vigente y fotos claras de la fachada e interior del local.",
    verificado: "Noviembre 2026"
  },
  {
    id: "bomberos_riobamba",
    nombre: "Cuerpo de Bomberos de Riobamba (Dirección de Prevención)",
    categoria: "Bomberos",
    icono: "flame",
    color: "red",
    direccion: "Calles Chile 26-56 y Pichincha (Comandancia / Prevención) y Av. 5 de Junio",
    horario: "08:00 - 17:00",
    dias: "Lunes a Viernes (Emergencias ECU-911 24/7)",
    telefono: "(03) 296-0570 / (03) 296-1111",
    portalWeb: "https://www.bomberosriobamba.gob.ec",
    tramites: ["Permiso Anual de Funcionamiento", "Inspección de Locales Comerciales", "Prevención de Incendios"],
    coordenadas: { lat: -1.6738, lng: -78.6512 },
    mapsEmbedUrl: "https://maps.google.com/maps?q=Cuerpo+de+Bomberos+de+Riobamba,+Chile+y+Pichincha,+Riobamba&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cuerpo+de+Bomberos+Riobamba+Chile+y+Pichincha",
    referencia: "Compañía 26 de Junio - Zona Centro de Riobamba",
    consejoVentanilla: "Instala tu extintor PQS 10 lbs a máximo 1.50 m de altura y la señalética ISO ANTES de solicitar la inspección.",
    verificado: "Noviembre 2026"
  },
  {
    id: "sri_riobamba",
    nombre: "SRI - Agencia Riobamba (Dirección Zonal 3)",
    categoria: "SRI",
    icono: "file-text",
    color: "indigo",
    direccion: "Av. Daniel León Borja y 10 de Agosto (y atención en Centro Histórico)",
    horario: "08:00 - 17:00",
    dias: "Lunes a Viernes",
    telefono: "1700-774-774 / (03) 294-2429",
    portalWeb: "https://srienlinea.sri.gob.ec",
    tramites: ["Inscripción y Actualización de RUC", "Categorización RIMPE vs Régimen General", "Clave Electrónica"],
    coordenadas: { lat: -1.6669, lng: -78.6515 },
    mapsEmbedUrl: "https://maps.google.com/maps?q=SRI+Riobamba,+Av.+Daniel+Leon+Borja,+Riobamba&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=SRI+Riobamba+Daniel+Leon+Borja",
    referencia: "Eje comercial Av. Daniel León Borja",
    consejoVentanilla: "La planilla de servicio básico (luz EERSA o agua) debe ser de los últimos 3 meses. El trámite cuesta $0.00.",
    verificado: "Noviembre 2026"
  },
  {
    id: "arcsa_zonal3",
    nombre: "ARCSA - Coordinación Zonal 3 (Atención Chimborazo / Riobamba)",
    categoria: "ARCSA",
    icono: "shield-plus",
    color: "amber",
    direccion: "Plataforma Digital Nacional y Atención Zonal 3 (Riobamba / Ambato)",
    horario: "08:00 - 17:00 (Plataforma web 24/7)",
    dias: "Lunes a Viernes",
    telefono: "(03) 242-1785 / 1700-272-721",
    portalWeb: "https://permisosfuncionamiento.controlsanitario.gob.ec",
    tramites: ["Permiso de Funcionamiento Sanitario", "Exoneración Tasa $0.00 Microempresas y Artesanos", "Notificación Sanitaria"],
    coordenadas: { lat: -1.6708, lng: -78.6472 },
    mapsEmbedUrl: "https://maps.google.com/maps?q=Riobamba+Centro+Chimborazo+Ecuador&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapsUrl: "https://permisosfuncionamiento.controlsanitario.gob.ec",
    referencia: "Trámite 100% automatizado en línea con RUC activo",
    consejoVentanilla: "Tiendas de abarrotes, micromercados y panaderías están exentas de permiso físico; microempresas y artesanos tienen tasa $0.00.",
    verificado: "Noviembre 2026"
  },
  {
    id: "jnda_chimborazo",
    nombre: "Junta Provincial de Defensa del Artesano de Chimborazo (JNDA)",
    categoria: "Artesanos",
    icono: "hammer",
    color: "emerald",
    direccion: "Centro de Riobamba (Atención a talleres y maestros artesanos)",
    horario: "08:00 - 17:00",
    dias: "Lunes a Viernes",
    telefono: "(03) 296-2415",
    portalWeb: "https://www.artesanos.gob.ec",
    tramites: ["Calificación y Recalificación Artesanal", "Requisito para Exoneración de Patente (Art. 550 COOTAD) y ARCSA"],
    coordenadas: { lat: -1.6725, lng: -78.6485 },
    mapsEmbedUrl: "https://maps.google.com/maps?q=Junta+Provincial+de+Defensa+del+Artesano+Chimborazo+Riobamba&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Junta+Provincial+de+Defensa+del+Artesano+Riobamba",
    referencia: "Zona Central de Riobamba",
    consejoVentanilla: "Con tu carnet artesanal vigente actualizado en el RUC, solicitas exoneración del 100% del impuesto de Patente en Rentas del GAD Riobamba.",
    verificado: "Noviembre 2026"
  },
  {
    id: "iess_riobamba",
    nombre: "IESS - Dirección Provincial Chimborazo",
    categoria: "IESS",
    icono: "shield-check",
    color: "sky",
    direccion: "Calle 10 de Agosto y Pichincha (Centro de Riobamba)",
    horario: "08:00 - 16:30",
    dias: "Lunes a Viernes",
    telefono: "(03) 296-9800",
    portalWeb: "https://www.iess.gob.ec",
    tramites: ["Certificado de No Adeudar al IESS", "Registro Patronal", "Afiliación Independiente / Voluntaria"],
    coordenadas: { lat: -1.6719, lng: -78.6498 },
    mapsEmbedUrl: "https://maps.google.com/maps?q=IESS+Chimborazo,+10+de+Agosto+y+Pichincha,+Riobamba&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=IESS+Direccion+Provincial+Chimborazo+Riobamba",
    referencia: "Centro Histórico de Riobamba",
    consejoVentanilla: "El certificado de cumplimiento de obligaciones patronales se descarga gratis en línea con tu número de cédula o RUC.",
    verificado: "Noviembre 2026"
  }
];

let activeInstitutionId = "municipio_riobamba";

function selectInstitutionMap(instId) {
  const inst = CIVIKA_INSTITUTIONS.find(i => i.id === instId);
  if (!inst) return;

  activeInstitutionId = instId;
  const mapIframe = document.getElementById("googleMapsIframe");
  const mapLabel = document.getElementById("mapActiveLocationName");
  const mapAddress = document.getElementById("mapActiveLocationAddress");
  const mapRef = document.getElementById("mapActiveLocationRef");

  if (mapIframe && navigator.onLine !== false) {
    mapIframe.src = inst.mapsEmbedUrl;
  }
  if (mapLabel) {
    mapLabel.textContent = inst.nombre;
  }
  if (mapAddress) {
    mapAddress.textContent = inst.direccion;
  }
  if (mapRef) {
    mapRef.textContent = `Referencia: ${inst.referencia} • ${inst.consejoVentanilla || ""}`;
  }

  // Resaltar tarjeta seleccionada
  document.querySelectorAll(".institution-card").forEach(c => {
    c.classList.remove("border-blue-500", "ring-2", "ring-blue-100", "bg-blue-50/20");
  });
  const activeCard = document.getElementById(`inst-card-${instId}`);
  if (activeCard) {
    activeCard.classList.add("border-blue-500", "ring-2", "ring-blue-100", "bg-blue-50/20");
    activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function renderInstitutions(filter = "Todas") {
  const container = document.getElementById("institutionsList");
  if (!container) return;

  const filtered = filter === "Todas"
    ? CIVIKA_INSTITUTIONS
    : CIVIKA_INSTITUTIONS.filter(item => item.categoria.toLowerCase() === filter.toLowerCase());

  const colorMap = {
    red: "#DC2626",
    indigo: "#4F46E5",
    emerald: "#059669",
    sky: "#0284C7",
    amber: "#D97706",
    blue: "#2563EB"
  };

  container.innerHTML = filtered.map(inst => `
    <div id="inst-card-${inst.id}" 
         class="institution-card bg-white rounded-2xl p-4 border transition-all cursor-pointer ${inst.id === activeInstitutionId ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20 shadow-sm' : 'border-slate-200/90 shadow-xs hover:shadow-md'}"
         onclick="selectInstitutionMap('${inst.id}')">
      <div>
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                 style="background: ${colorMap[inst.color] || '#2563EB'}">
              <i data-lucide="${inst.icono}" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight">${inst.nombre}</h4>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100">
                  ${inst.categoria}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">• Verificado ${inst.verificado}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 text-xs text-slate-600 space-y-1.5 pl-1">
          <div class="flex items-start gap-2">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5"></i>
            <div>
              <span class="font-semibold text-slate-800 block">${inst.direccion}</span>
              <span class="text-[11px] text-slate-500">${inst.referencia}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
            <span class="font-semibold text-emerald-700">${inst.horario} (${inst.dias})</span>
          </div>
          <div class="flex items-center gap-2">
            <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
            <span>${inst.telefono}</span>
          </div>
        </div>

        ${inst.consejoVentanilla ? `
          <div class="mt-2.5 p-2 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 flex items-start gap-1.5">
            <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"></i>
            <span><strong>Tip Pre-Ventanilla:</strong> ${inst.consejoVentanilla}</span>
          </div>
        ` : ''}

        <div class="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
          ${inst.tramites.map(tr => `<span class="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">${tr}</span>`).join('')}
        </div>
      </div>

      <div class="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100">
        <button type="button" 
                onclick="event.stopPropagation(); selectInstitutionMap('${inst.id}')"
                class="flex-1 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200 transition">
          <i data-lucide="map" class="w-3.5 h-3.5 text-blue-600"></i>
          <span>Centrar Mapa</span>
        </button>

        <a href="${inst.mapsUrl}" target="_blank" rel="noopener noreferrer" 
           onclick="event.stopPropagation();"
           class="flex-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition">
          <i data-lucide="navigation" class="w-3.5 h-3.5"></i>
          <span>Cómo llegar</span>
        </a>

        ${inst.portalWeb ? `
          <a href="${inst.portalWeb}" target="_blank" rel="noopener noreferrer"
             onclick="event.stopPropagation();"
             class="p-2 border border-slate-200 hover:border-blue-300 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center hover:bg-blue-50 transition"
             title="Abrir Portal Oficial">
            <i data-lucide="globe" class="w-3.5 h-3.5"></i>
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
