# Cívika · Trámites para emprendedores de Riobamba

Guía ciudadana para obtener **RUC, permiso de Bomberos, uso de suelo, patente municipal, LUF y permiso ARCSA** en Riobamba, sin tramitadores.
Proyecto del Hackathon **INNOVAiLAB UNACH 2026** · Track Gobierno Digital y Servicios Ciudadanos.

**App publicada:** https://civika-riobamba-h9tc48lxongyzuhufxw2da.streamlit.app/

## Funciones
- 10 tipos de negocio con requisitos, costos y exoneraciones (incluye restaurante, peluquería, farmacia y venta por redes).
- Ruta de trámites en orden (Paso 1 al 6) con 4 pilares: diagnóstico, checklist, anti-rechazo y Plan B.
- Auditor pre-ventanilla de documentos y validador de cédula/RUC (Módulo 10 y 11).
- Pasaporte Ciudadano QR y **Modo Ventanilla** para que el funcionario lo escanee.
- **PDF descargables:** ficha de cada trámite, Pasaporte QR y "Mi carpeta" con casillas para marcar (generados en el navegador, sin internet).
- **Renovaciones** con avisos y archivo de calendario (.ics).
- **Copiloto con IA gratuita (Groq o Gemini)** que responde según el negocio y el paso de cada persona, con voz. Sin clave, usa respuestas guiadas.
- **Mapa interactivo** (Leaflet + OpenStreetMap): todas las oficinas, filtros, "Mi ubicación" con distancias y capas propias exportadas desde QGIS/OSGeo4W.
- Compartir requisitos por WhatsApp y Modo Lectura Fácil.
- Diseño para celular y laptop. Funciona sin internet abriendo `web/index.html`.

## Ejecutar en tu computadora
```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```
O abre `web/index.html` con doble clic.

## Conectar la IA
Lee **[GUIA_IA.md](GUIA_IA.md)**: crea una clave gratis en console.groq.com y pégala en Streamlit → Settings → Secrets. La clave nunca se sube a GitHub.

## Mapa y capas de QGIS
Lee **[GUIA_MAPAS.md](GUIA_MAPAS.md)**: cómo corregir las ubicaciones de las oficinas y agregar capas GeoJSON en `web/data/capas/`.

## Publicar y actualizar
Lee **[GUIA_GITHUB_STREAMLIT.md](GUIA_GITHUB_STREAMLIT.md)**. Resumen: sube el repositorio a GitHub, crea la app en share.streamlit.io con `streamlit_app.py` como archivo principal, y cada `push` actualiza la página.

## Estructura
| Ruta | Contenido |
|---|---|
| `streamlit_app.py` | Página de Streamlit: publica `web/` como componente a pantalla completa y atiende las preguntas a la IA |
| `civika_ai.py` | Conexión con Groq/Gemini (instrucciones, contexto, manejo de errores y límites) |
| `web/index.html` | Interfaz (barra lateral en laptop, menú inferior en celular) |
| `web/css/styles.css` | Sistema visual institucional (fuente Inter local) |
| `web/js/knowledge_base.js` | Negocios, trámites, requisitos y datos de ejemplo |
| `web/js/app.js` | Lógica principal: ruta, pilares, auditor, pasaporte QR |
| `web/js/features.js` | Renovaciones, Modo Ventanilla, WhatsApp, menú adaptable |
| `web/js/assistant.js` | Copiloto con voz (IA o respuestas guiadas) |
| `web/js/map.js` | Mapa interactivo (Leaflet + OpenStreetMap) y carga de capas GeoJSON |
| `web/data/capas/` | Capas propias exportadas desde QGIS (`capas.json` las lista) |
| `web/js/pdf.js` | Genera los PDF (ficha, pasaporte, mi carpeta) con jsPDF |
| `web/js/ai_bridge.js` | Puente entre la página y Python para consultar a la IA |
| `web/js/vendor/` | Tailwind, Lucide, QRCode, jsQR, jsPDF y Leaflet (locales, sin internet) |

## Aviso
Información orientativa revisada en noviembre de 2026. Las tasas y requisitos pueden cambiar: confirma siempre con el SRI, el GAD Municipal de Riobamba, el Cuerpo de Bomberos o ARCSA. Los nombres y números de RUC de las maquetas son ficticios. Algunas ubicaciones del mapa son aproximadas. Mapa © colaboradores de OpenStreetMap. Las métricas del panel son simuladas.
