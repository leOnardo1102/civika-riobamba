"""
Cívika · Trámites para emprendedores de Riobamba
Página de Streamlit que publica la app web de la carpeta `web/` a pantalla completa
y conecta el Copiloto con una IA gratuita (Groq o Gemini).

Cómo funciona:
1. La carpeta `web/` se publica como un componente de Streamlit (una página web
   que puede enviar y recibir datos de Python).
2. Cuando el ciudadano pregunta algo al Copiloto, la página envía la pregunta y
   el contexto de su trámite. Python consulta a la IA con la clave guardada en
   los Secrets de Streamlit y devuelve la respuesta. La clave nunca llega al navegador.
3. Sin clave (o si se acaba la cuota), el Copiloto responde con sus guías propias.

Para cambiar la app: edita `web/`, sube a GitHub y Streamlit se actualiza solo.
"""

from __future__ import annotations

from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

import civika_ai

WEB_DIR = Path(__file__).parent / "web"
MAX_QUESTIONS_PER_SESSION = 40  # cuida la cuota gratuita de la IA

st.set_page_config(
    page_title="Cívika · Trámites en Riobamba",
    page_icon=str(WEB_DIR / "icons" / "icon-192.png"),
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Pantalla completa: el marco de Cívika queda fijo y solo se desplaza su contenido.
st.markdown(
    """
    <style>
      html, body { height: 100%; overflow: hidden !important; }
      .stApp, [data-testid="stApp"], [data-testid="stAppViewContainer"], [data-testid="stMain"],
      section.main, .main { overflow: hidden !important; background: #F8FAFC; }
      header[data-testid="stHeader"], footer, #MainMenu,
      [data-testid="stToolbar"], [data-testid="stDecoration"], [data-testid="stStatusWidget"],
      [data-testid="stBottom"] { display: none !important; }
      .block-container, [data-testid="stMainBlockContainer"] { padding: 0 !important; max-width: 100% !important; }
      iframe {
        position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
        width: 100vw !important; height: 100vh !important; height: 100dvh !important;
        border: 0 !important; z-index: 999990; background: #F8FAFC;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

ai_config = civika_ai.load_config(st.secrets)

state = st.session_state
state.setdefault("ai_reply", None)       # última respuesta enviada a la página
state.setdefault("ai_last_id", None)     # id de la última pregunta atendida
state.setdefault("ai_count", 0)          # preguntas atendidas en esta sesión

civika_component = components.declare_component("civika", path=str(WEB_DIR))

request = civika_component(
    key="civika_app",
    ai_enabled=ai_config.enabled,
    ai_label=ai_config.label if ai_config.enabled else "",
    reply=state.ai_reply,
    default=None,
)

# Nueva pregunta del Copiloto → consultar a la IA y devolver la respuesta
if isinstance(request, dict) and request.get("id") and request.get("id") != state.ai_last_id:
    state.ai_last_id = request["id"]
    if request.get("audio"):
        # Dictado por voz: se convierte el audio en texto (la clave sigue en el servidor)
        import base64
        if state.ai_count >= MAX_QUESTIONS_PER_SESSION:
            result = {"ok": False, "text": "", "error": "limite_sesion"}
        else:
            state.ai_count += 1
            try:
                audio_bytes = base64.b64decode(request["audio"], validate=False)
            except Exception:
                audio_bytes = b""
            result = civika_ai.transcribe(ai_config, audio_bytes, request.get("mime", "audio/webm"))
    elif state.ai_count >= MAX_QUESTIONS_PER_SESSION:
        result = {"ok": False, "text": "", "error": "limite_sesion"}
    else:
        state.ai_count += 1
        result = civika_ai.ask(
            ai_config,
            question=request.get("question", ""),
            context=request.get("context", ""),
            history=request.get("history") or [],
        )
    state.ai_reply = {"id": request["id"], **result}
    st.rerun()
