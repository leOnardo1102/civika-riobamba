# Cívika · Trámites para emprendedores de Riobamba

Guía ciudadana para obtener **RUC, permiso de Bomberos, uso de suelo, patente municipal, LUF y permiso ARCSA** en Riobamba, sin tramitadores.
Proyecto del Hackathon **INNOVAiLAB UNACH 2026** · Track Gobierno Digital y Servicios Ciudadanos.

**App publicada:** `https://TU-APP.streamlit.app` *(reemplaza con tu enlace después de desplegar)*

## Funciones
- 10 tipos de negocio con requisitos, costos y exoneraciones (incluye restaurante, peluquería, farmacia y venta por redes).
- Ruta de trámites en orden (Paso 1 al 6) con 4 pilares: diagnóstico, checklist, anti-rechazo y Plan B.
- Auditor pre-ventanilla de documentos y validador de cédula/RUC (Módulo 10 y 11).
- Pasaporte Ciudadano QR y **Modo Ventanilla** para que el funcionario lo escanee.
- **Renovaciones** con avisos y archivo de calendario (.ics).
- Compartir requisitos por WhatsApp, Copiloto con voz, oficinas con mapa y Modo Lectura Fácil.
- Diseño para celular y laptop. Funciona sin internet abriendo `web/index.html`.

## Ejecutar en tu computadora
```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```
O abre `web/index.html` con doble clic.

## Publicar y actualizar
Lee **[GUIA_GITHUB_STREAMLIT.md](GUIA_GITHUB_STREAMLIT.md)**. Resumen: sube el repositorio a GitHub, crea la app en share.streamlit.io con `streamlit_app.py` como archivo principal, y cada `push` actualiza la página.

## Estructura
| Ruta | Contenido |
|---|---|
| `streamlit_app.py` | Página de Streamlit que muestra la app de `web/` a pantalla completa |
| `web/index.html` | Interfaz (barra lateral en laptop, menú inferior en celular) |
| `web/css/styles.css` | Sistema visual institucional (fuente Inter local) |
| `web/js/knowledge_base.js` | Negocios, trámites, requisitos y datos de ejemplo |
| `web/js/app.js` | Lógica principal: ruta, pilares, auditor, pasaporte QR |
| `web/js/features.js` | Renovaciones, Modo Ventanilla, WhatsApp, menú adaptable |
| `web/js/assistant.js` | Copiloto con voz |
| `web/js/vendor/` | Tailwind, Lucide, QRCode y jsQR (locales, sin internet) |

## Aviso
Información orientativa revisada en noviembre de 2026. Las tasas y requisitos pueden cambiar: confirma siempre con el SRI, el GAD Municipal de Riobamba, el Cuerpo de Bomberos o ARCSA. Los nombres y números de RUC de las maquetas son ficticios. Las métricas del panel son simuladas.
