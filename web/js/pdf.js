/**
 * CÍVIKA · Documentos PDF reales (jsPDF, local y sin internet)
 *
 * civikaPDF.stepGuide(stepId) → Ficha del trámite (qué es, requisitos, costo, dónde, errores, Plan B)
 * civikaPDF.passport()        → Pasaporte Ciudadano con código QR para la ventanilla
 * civikaPDF.folder()          → "Mi carpeta": requisitos del negocio + 6 pasos con casillas para marcar
 *
 * Los PDF se descargan directamente (funciona en celular, laptop y dentro de Streamlit).
 */
(function () {
  "use strict";

  // ---------------- Paleta y medidas (mm, A4) ----------------
  const C = {
    navy: [15, 41, 66], primary: [29, 78, 216], text: [15, 23, 42], muted: [100, 116, 139],
    border: [226, 232, 240], soft: [248, 250, 252], green: [4, 120, 87], greenSoft: [236, 253, 245],
    amber: [180, 83, 9], amberSoft: [255, 251, 235], blueSoft: [239, 244, 255]
  };
  const PAGE = { w: 210, h: 297, m: 18 };
  const CONTENT_W = PAGE.w - PAGE.m * 2;
  const FOOTER_Y = PAGE.h - 12;

  const kb = () => (typeof CIVIKA_KNOWLEDGE_BASE !== "undefined" ? CIVIKA_KNOWLEDGE_BASE : null);
  const app = () => window.civikaApp;
  const currentBiz = () => {
    const base = kb();
    const id = app() ? app().selectedBusinessId : "tienda_ropa";
    return base.emprendimientosComunes.find(b => b.id === id) || base.emprendimientosComunes[0];
  };
  const today = () => new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });
  const slug = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40).replace(/(^-+|-+$)/g, "");

  // La fuente estándar del PDF solo admite caracteres latinos: se limpian emojis y símbolos raros
  const clean = (t) => String(t == null ? "" : t)
    .replace(/²/g, "2").replace(/[≤]/g, "<=").replace(/[≥]/g, ">=").replace(/[→➜➡]/g, "->").replace(/[✓✔]/g, "*")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ–—•…€]/g, "")
    .replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();

  const toast = (msg) => { if (typeof window.civikaToast === "function") window.civikaToast(msg); };

  // ---------------- Motor de maquetación ----------------
  class Doc {
    constructor(title) {
      const { jsPDF } = window.jspdf;
      this.pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
      this.pdf.setProperties({ title: clean(title), subject: "Cívika · Guía ciudadana de trámites en Riobamba", creator: "Cívika" });
      this.y = PAGE.m;
      this.title = title;
    }
    color(rgb, kind = "text") {
      if (kind === "text") this.pdf.setTextColor(...rgb);
      else if (kind === "fill") this.pdf.setFillColor(...rgb);
      else this.pdf.setDrawColor(...rgb);
    }
    font(size, style = "normal", rgb = C.text) {
      this.pdf.setFont("helvetica", style);
      this.pdf.setFontSize(size);
      this.color(rgb);
    }
    ensure(h) {
      if (this.y + h > FOOTER_Y - 6) { this.pdf.addPage(); this.y = PAGE.m; }
    }
    header(kicker, title, subtitle) {
      const p = this.pdf;
      this.color(C.navy, "fill");
      p.rect(0, 0, PAGE.w, 30, "F");
      p.setFillColor(255, 255, 255);
      p.roundedRect(PAGE.m, 8, 12, 12, 2, 2, "F");
      this.font(13, "bold", C.navy);
      p.text("C", PAGE.m + 6, 16.3, { align: "center" });
      this.font(13, "bold", [255, 255, 255]);
      p.text("Cívika", PAGE.m + 16, 13.2);
      this.font(8.5, "normal", [203, 213, 225]);
      p.text("Guía ciudadana de trámites · Riobamba", PAGE.m + 16, 18.2);
      p.text(`Generado el ${today()}`, PAGE.w - PAGE.m, 13.2, { align: "right" });
      p.text("civika-riobamba", PAGE.w - PAGE.m, 18.2, { align: "right" });

      this.y = 40;
      if (kicker) { this.font(8.5, "bold", C.primary); this.pdf.text(clean(kicker).toUpperCase(), PAGE.m, this.y); this.y += 6; }
      this.font(17, "bold", C.text);
      const lines = p.splitTextToSize(clean(title), CONTENT_W);
      p.text(lines, PAGE.m, this.y);
      this.y += lines.length * 7;
      if (subtitle) {
        this.font(10, "normal", C.muted);
        const sl = p.splitTextToSize(clean(subtitle), CONTENT_W);
        p.text(sl, PAGE.m, this.y);
        this.y += sl.length * 4.8;
      }
      this.y += 4;
    }
    section(title) {
      this.ensure(14);
      this.y += 2;
      this.font(11.5, "bold", C.navy);
      this.pdf.text(clean(title), PAGE.m, this.y);
      this.y += 2;
      this.color(C.border, "draw");
      this.pdf.setLineWidth(0.3);
      this.pdf.line(PAGE.m, this.y, PAGE.w - PAGE.m, this.y);
      this.y += 5;
    }
    paragraph(text, size = 10, rgb = C.text) {
      if (!text) return;
      this.font(size, "normal", rgb);
      const lines = this.pdf.splitTextToSize(clean(text), CONTENT_W);
      lines.forEach(line => { this.ensure(5); this.pdf.text(line, PAGE.m, this.y); this.y += size * 0.47; });
      this.y += 2;
    }
    labelValue(label, value) {
      if (!value) return;
      this.font(10, "bold", C.text);
      const lw = this.pdf.getTextWidth(clean(label) + " ");
      const lines = this.pdf.splitTextToSize(clean(value), CONTENT_W - lw);
      this.ensure(lines.length * 4.8 + 1);
      this.pdf.text(clean(label), PAGE.m, this.y);
      this.font(10, "normal", C.text);
      this.pdf.text(lines, PAGE.m + lw, this.y);
      this.y += lines.length * 4.7 + 1.5;
    }
    bullets(items, opts = {}) {
      const { checkbox = false, size = 10 } = opts;
      (items || []).filter(Boolean).forEach(item => {
        this.font(size, "normal", C.text);
        const indent = checkbox ? 8 : 6;
        const lines = this.pdf.splitTextToSize(clean(item), CONTENT_W - indent);
        this.ensure(lines.length * 4.7 + 2);
        if (checkbox) {
          this.color(C.muted, "draw"); this.pdf.setLineWidth(0.35);
          this.pdf.rect(PAGE.m, this.y - 3.3, 3.8, 3.8);
        } else {
          this.color(C.primary, "fill");
          this.pdf.circle(PAGE.m + 1.5, this.y - 1.3, 0.8, "F");
        }
        this.pdf.text(lines, PAGE.m + indent, this.y);
        this.y += lines.length * 4.7 + 1.8;
      });
      this.y += 1;
    }
    box(title, body, fill, accent) {
      const p = this.pdf;
      this.font(10, "normal", C.text);
      const bodyLines = p.splitTextToSize(clean(body), CONTENT_W - 10);
      const h = 8 + bodyLines.length * 4.7 + (title ? 5 : 0);
      this.ensure(h + 3);
      this.color(fill, "fill");
      p.roundedRect(PAGE.m, this.y - 4, CONTENT_W, h, 2, 2, "F");
      this.color(accent, "fill");
      p.rect(PAGE.m, this.y - 4, 1.2, h, "F");
      let yy = this.y + 1;
      if (title) { this.font(9.5, "bold", accent); p.text(clean(title), PAGE.m + 5, yy); yy += 5; }
      this.font(10, "normal", C.text);
      p.text(bodyLines, PAGE.m + 5, yy);
      this.y += h + 3;
    }
    stepRow(n, title, status, detailLines) {
      const p = this.pdf;
      const done = status === "listo";
      const na = status === "no aplica";
      this.font(10, "normal", C.text);
      const details = (detailLines || []).filter(Boolean).map(d => p.splitTextToSize(clean(d), CONTENT_W - 14));
      const detailH = details.reduce((a, l) => a + l.length * 4.5 + 1, 0);
      // El título se ajusta al ancho disponible (deja espacio para la etiqueta de estado a la derecha)
      this.font(10.5, "bold", C.text);
      const titleLines = p.splitTextToSize(clean(title), CONTENT_W - 11 - 28);
      const extraTitle = (titleLines.length - 1) * 4.6;
      const h = 9 + detailH + extraTitle;
      this.ensure(h + 2);
      this.color(C.border, "draw"); p.setLineWidth(0.3);
      p.roundedRect(PAGE.m, this.y - 5, CONTENT_W, h, 2, 2, "S");
      this.color(done ? C.green : na ? C.muted : C.navy, "fill");
      p.circle(PAGE.m + 5.5, this.y - 0.5, 3.2, "F");
      this.font(9, "bold", [255, 255, 255]);
      p.text(String(n), PAGE.m + 5.5, this.y + 0.7, { align: "center" });
      this.font(10.5, "bold", C.text);
      p.text(titleLines, PAGE.m + 11, this.y);
      const tag = done ? "LISTO" : na ? "NO APLICA" : "PENDIENTE";
      this.font(8, "bold", done ? C.green : na ? C.muted : C.amber);
      p.text(tag, PAGE.w - PAGE.m - 3, this.y, { align: "right" });
      let yy = this.y + 5 + extraTitle;
      this.font(9.5, "normal", C.muted);
      details.forEach(l => { p.text(l, PAGE.m + 11, yy); yy += l.length * 4.5 + 1; });
      this.y += h + 2;
    }
    footer() {
      const p = this.pdf;
      const total = p.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        p.setPage(i);
        this.color(C.border, "draw"); p.setLineWidth(0.3);
        p.line(PAGE.m, FOOTER_Y - 4, PAGE.w - PAGE.m, FOOTER_Y - 4);
        this.font(7.5, "normal", C.muted);
        p.text("Información orientativa revisada en noviembre de 2026. Confirma costos y requisitos en la entidad oficial.", PAGE.m, FOOTER_Y - 0.5);
        p.text("Cívika no pide contraseñas ni claves.", PAGE.m, FOOTER_Y + 3.5);
        p.text(`Página ${i} de ${total}`, PAGE.w - PAGE.m, FOOTER_Y + 4, { align: "right" });
      }
    }
    save(filename) {
      this.footer();
      this.pdf.save(filename);
    }
  }

  function ready() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("No se pudo cargar el generador de PDF. Recarga la página e inténtalo de nuevo.");
      return false;
    }
    return true;
  }

  // ---------------- 1. Ficha del trámite ----------------
  function stepGuide(stepId) {
    if (!ready()) return;
    const base = kb();
    const step = base.pasosSecuenciales.find(s => s.id === stepId);
    if (!step) return;
    const biz = currentBiz();
    const pil = step.pilares || {};
    const doc = new Doc(`Ficha: ${step.nombre}`);

    doc.header(`Paso ${step.paso} de ${base.pasosSecuenciales.length} · ${step.entidad}`, step.titulo || step.nombre, `Ficha personalizada para: ${biz.nombre}`);

    doc.box("Costo oficial", step.costo, C.greenSoft, C.green);
    doc.labelValue("Tiempo en línea:", step.tiempoEnLinea);
    doc.labelValue("Tiempo presencial:", step.tiempoPresencial);
    doc.y += 2;

    doc.section("¿Qué es?");
    doc.paragraph(step.queEs);
    doc.section("¿Para qué sirve?");
    doc.paragraph(step.paraQueSirve);
    if (step.porQuePrimero) { doc.section("¿Por qué va en este orden?"); doc.paragraph(step.porQuePrimero); }

    doc.section("¿Qué debes hacer?");
    doc.paragraph(step.queHacer);

    if ((pil.checklistPersonalizado || []).length) {
      doc.section("Lista de requisitos (márcalos al tenerlos)");
      doc.bullets(pil.checklistPersonalizado.map(c => c.item + (c.obligatorio === false ? " (si aplica)" : "")), { checkbox: true });
    }

    doc.section("Documento para tu carpeta");
    doc.paragraph(step.documentoParaCarpeta);
    if (step.comoPresentarEnCarpeta) doc.paragraph(step.comoPresentarEnCarpeta, 9.5, C.muted);

    if ((step.queRevisar || []).length) {
      doc.section("Revisa esto antes de ir");
      doc.bullets(step.queRevisar);
    }
    if ((pil.pasosConPrevencion || []).length) {
      doc.section("Errores que hacen rebotar la carpeta");
      pil.pasosConPrevencion.forEach(e => doc.box(e.accion, e.alertaCritica, C.amberSoft, C.amber));
    }
    if ((pil.planBAccionable || []).length) {
      doc.section("Plan B");
      pil.planBAccionable.forEach(e => doc.box(e.escenario, e.solucion, C.blueSoft, C.primary));
    }

    doc.section("¿Dónde se obtiene?");
    doc.paragraph(step.dondeObtenerlo);
    if (step.enlaceOficial) doc.labelValue("Portal oficial:", step.enlaceOficial);
    if (step.conexionSiguienteTramite && step.conexionSiguienteTramite.siguienteTitulo) {
      doc.labelValue("Siguiente paso:", `Paso ${step.conexionSiguienteTramite.siguientePasoNumero}: ${step.conexionSiguienteTramite.siguienteTitulo}`);
    }

    doc.save(`civika-paso-${step.paso}-${slug(step.nombre)}.pdf`);
    toast("PDF descargado: ficha del trámite");
  }

  // ---------------- 2. Pasaporte Ciudadano QR ----------------
  // QR en alta resolución (512 px) para que se lea bien impreso
  function getQrDataUrl() {
    if (typeof window.QRCode === "function" && window.civikaFeatures) {
      const tmp = document.createElement("div");
      tmp.style.cssText = "position:fixed;left:-9999px;top:0;";
      document.body.appendChild(tmp);
      try {
        new window.QRCode(tmp, { text: window.civikaFeatures.buildPassportPayload(), width: 512, height: 512, colorDark: "#0F172A", colorLight: "#FFFFFF", correctLevel: window.QRCode.CorrectLevel.M });
        const c = tmp.querySelector("canvas");
        if (c) return c.toDataURL("image/png");
      } catch (e) { /* se usa el QR de la pantalla */ } finally { tmp.remove(); }
    }
    const canvas = document.querySelector("#passportQrCanvas canvas");
    if (canvas) { try { return canvas.toDataURL("image/png"); } catch (e) { /* nada */ } }
    return null;
  }

  function passport() {
    if (!ready()) return;
    const a = app();
    const base = kb();
    const biz = currentBiz();
    const f = a.draftForm || {};
    const pasos = base.pasosSecuenciales;
    const done = pasos.filter(p => a.stepsState[p.id]).length;
    const pct = Math.round((done / pasos.length) * 100);
    const passportId = `CIV-RIO-2026-${String(a.selectedBusinessId || "").slice(0, 3).toUpperCase()}-${done}${pasos.length}`;
    const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
    const parroquia = (base.parroquiasRiobamba || []).find(x => x.id === f.parroquia);
    const parroquiaTxt = parroquia ? parroquia.nombre : (f.parroquia || "—");
    const tenenciaTxt = f.tenenciaLocal === "propio" ? "Propio" : f.tenenciaLocal === "arrendado" ? "Arrendado" : cap(f.tenenciaLocal) || "—";
    const regime = typeof a.getPassportRegimeLabel === "function" ? a.getPassportRegimeLabel(biz) : "";
    const noAplica = biz.pasosNoAplicanSinLocal || [];

    const doc = new Doc("Pasaporte Ciudadano");
    doc.header("Pasaporte Ciudadano · GAD Riobamba", f.nombreComercial || biz.nombre, `${biz.nombre} · ${passportId}`);

    const p = doc.pdf;
    const qr = getQrDataUrl();
    const qrSize = 56;
    const top = doc.y;
    if (qr) {
      doc.color(C.border, "draw"); p.setLineWidth(0.4);
      p.roundedRect(PAGE.m, top, qrSize + 8, qrSize + 14, 2, 2, "S");
      p.addImage(qr, "PNG", PAGE.m + 4, top + 4, qrSize, qrSize);
      doc.font(7.5, "bold", C.muted);
      p.text("ESCANEAR EN VENTANILLA", PAGE.m + 4 + qrSize / 2, top + qrSize + 9.5, { align: "center" });
    }
    // Datos a la derecha del QR
    const x = PAGE.m + qrSize + 16;
    const rows = [
      ["Giro", biz.nombre],
      ["Parroquia", parroquiaTxt],
      ["Local", `${tenenciaTxt}${f.areaMetros ? `, ${f.areaMetros} m²` : ""}`],
      ["Cédula / RUC", f.esIdentificacionValida ? `Validada (${f.identificacionMascarada})` : "Pendiente de validar"],
      ["Régimen y ARCSA", regime],
      ["Carpeta", `${done} de ${pasos.length} pasos (${pct} %)`],
      ["Generado", today()]
    ];
    let yy = top + 6;
    rows.forEach(([k, v]) => {
      doc.font(8, "bold", C.muted); p.text(k.toUpperCase(), x, yy);
      doc.font(10.5, "normal", C.text);
      const lines = p.splitTextToSize(clean(v), PAGE.w - PAGE.m - x);
      p.text(lines, x, yy + 4.6);
      yy += 5 + lines.length * 4.6 + 1.5;
    });
    doc.y = Math.max(top + qrSize + 20, yy) + 2;

    doc.section("Estado de los trámites");
    pasos.forEach(s => {
      const status = a.stepsState[s.id] ? "listo" : noAplica.includes(s.id) ? "no aplica" : "pendiente";
      doc.stepRow(s.paso, s.nombre, status, [`Entidad: ${s.entidad}`]);
    });

    doc.section("Cómo usar este pasaporte");
    doc.bullets([
      "Imprímelo para la portada de tu carpeta o muéstralo en tu celular en la Ventanilla Única (5 de Junio y Veloz).",
      "El código solo tiene datos declarados por ti y tu cédula enmascarada. Lleva siempre los documentos originales."
    ], { size: 9.5 });

    doc.save(`civika-pasaporte-${slug(f.nombreComercial || biz.nombre)}.pdf`);
    toast("PDF descargado: Pasaporte Ciudadano");
  }

  // ---------------- 3. Mi carpeta completa ----------------
  function folder() {
    if (!ready()) return;
    const a = app();
    const base = kb();
    const biz = currentBiz();
    const pasos = base.pasosSecuenciales;
    const noAplica = biz.pasosNoAplicanSinLocal || [];
    const done = pasos.filter(p => a.stepsState[p.id]).length;

    const doc = new Doc("Mi carpeta");
    doc.header("Mi carpeta para el GAD Riobamba", biz.nombre, `${biz.categoria} · ${done} de ${pasos.length} pasos listos`);

    doc.box("Costo aproximado", biz.costoAproxTotal, C.greenSoft, C.green);
    doc.labelValue("Régimen SRI:", biz.regimenRecomendado);
    doc.labelValue("ARCSA:", biz.requiereArcsa);
    doc.labelValue("Bomberos:", biz.riesgoBomberos);
    doc.y += 1;

    doc.section("Requisitos de tu negocio (márcalos al tenerlos)");
    doc.bullets(biz.documentacionRequerida, { checkbox: true });
    if (biz.advertenciaSector) doc.box("Atención", biz.advertenciaSector, C.amberSoft, C.amber);

    doc.section("Trámites en orden");
    pasos.forEach(s => {
      const status = a.stepsState[s.id] ? "listo" : noAplica.includes(s.id) ? "no aplica" : "pendiente";
      doc.stepRow(s.paso, s.nombre, status, [
        `Entidad: ${s.entidad}`,
        `Documento: ${s.documentoParaCarpeta}`,
        `Costo: ${s.costo}`
      ]);
    });

    const guia = base.guiaCarpetaFinal;
    if (guia && Array.isArray(guia.ordenFolios)) {
      doc.section("Cómo armar la carpeta física");
      if (guia.tipoCarpeta) doc.paragraph(guia.tipoCarpeta, 9.5, C.muted);
      doc.bullets(guia.ordenFolios.map(fo => `${fo.folio}: ${fo.doc}`), { checkbox: true });
    }

    doc.save(`civika-mi-carpeta-${slug(biz.nombre)}.pdf`);
    toast("PDF descargado: Mi carpeta");
  }

  window.civikaPDF = { stepGuide, passport, folder };
})();
