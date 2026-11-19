"""
Cívika · Trámites para emprendedores de Riobamba
Página de Streamlit que publica la app web de la carpeta `web/` a pantalla completa.

Cómo funciona:
1. Lee web/index.html y le incrusta (inline) su CSS, JavaScript, fuentes e íconos.
2. Muestra ese HTML dentro de la página de Streamlit ocupando toda la pantalla.

Para cambiar la app: edita los archivos de `web/`, súbelos a GitHub y
Streamlit Community Cloud vuelve a publicar la página sola.
"""

from __future__ import annotations

import base64
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

WEB_DIR = Path(__file__).parent / "web"

st.set_page_config(
    page_title="Cívika · Trámites en Riobamba",
    page_icon=str(WEB_DIR / "icons" / "icon-192.png"),
    layout="wide",
    initial_sidebar_state="collapsed",
)


def _data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


def _safe_inline_js(code: str) -> str:
    # Evita que el navegador cierre la etiqueta <script> antes de tiempo
    return code.replace("</script", "<\\/script").replace("<!--", "<\\!--")


def _fingerprint() -> str:
    """Cambia cada vez que se modifica un archivo de web/ (para refrescar la caché)."""
    parts = [f"{p}:{p.stat().st_mtime_ns}" for p in sorted(WEB_DIR.rglob("*")) if p.is_file()]
    return "|".join(parts)


@st.cache_data(show_spinner=False)
def build_single_html(_fingerprint_value: str) -> str:
    html = (WEB_DIR / "index.html").read_text(encoding="utf-8")

    # 1) CSS en línea, con las fuentes Inter incrustadas
    css = (WEB_DIR / "css" / "styles.css").read_text(encoding="utf-8")
    css = re.sub(
        r'url\("fonts/([^"]+\.woff2)"\)',
        lambda m: f'url("{_data_uri(WEB_DIR / "css" / "fonts" / m.group(1), "font/woff2")}")',
        css,
    )
    html = html.replace('<link rel="stylesheet" href="css/styles.css">', f"<style>\n{css}\n</style>")

    # 2) Scripts en línea (vendor + app)
    def inline_script(match: re.Match) -> str:
        src = match.group(1)
        code = (WEB_DIR / src).read_text(encoding="utf-8")
        return f"<script>\n{_safe_inline_js(code)}\n</script>"

    html = re.sub(r'<script src="([^"]+)"></script>', inline_script, html)

    # 3) Íconos en línea
    for name in ("icon-192.png", "apple-touch-icon.png"):
        html = html.replace(f'href="icons/{name}"', f'href="{_data_uri(WEB_DIR / "icons" / name, "image/png")}"')

    # 4) Aviso para la app: está incrustada en Streamlit (sin instalación PWA)
    html = html.replace("<head>", "<head>\n  <script>window.CIVIKA_EMBEDDED = true;</script>", 1)
    return html


# Quitar márgenes y barras de Streamlit para que la app use toda la pantalla
st.markdown(
    """
    <style>
      header[data-testid="stHeader"], footer, #MainMenu,
      [data-testid="stToolbar"], [data-testid="stDecoration"], [data-testid="stStatusWidget"] { display: none !important; }
      .stApp, [data-testid="stAppViewContainer"], [data-testid="stMain"] { background: #F8FAFC; }
      .block-container, [data-testid="stMainBlockContainer"] { padding: 0 !important; max-width: 100% !important; }
      [data-testid="stVerticalBlock"] { gap: 0 !important; }
      iframe { display: block; width: 100%; height: 100vh !important; height: 100dvh !important; border: 0; }
    </style>
    """,
    unsafe_allow_html=True,
)

components.html(build_single_html(_fingerprint()), height=900, scrolling=False)
