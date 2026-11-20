"""
Cívika · Conexión con una IA gratuita (Groq o Gemini) para el Copiloto.

La clave de la IA se guarda en los "Secrets" de Streamlit, nunca en GitHub
ni en el navegador. Este archivo recibe la pregunta del ciudadano junto con
el contexto de su trámite (negocio, pasos, requisitos) y devuelve la respuesta.

Configuración (Streamlit Cloud → Manage app → Settings → Secrets):

    [ai]
    provider = "groq"            # o "gemini"
    api_key  = "gsk_..."         # tu clave
    # model  = "openai/gpt-oss-120b"   # opcional

Sin clave, el Copiloto sigue funcionando con sus respuestas guiadas.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import requests

PROVIDERS = {
    "groq": {
        "label": "Groq",
        "base_url": "https://api.groq.com/openai/v1",
        "model": "openai/gpt-oss-120b",
    },
    "gemini": {
        "label": "Gemini",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "model": "gemini-flash-latest",
    },
}

MAX_QUESTION_CHARS = 600
MAX_CONTEXT_CHARS = 7000
MAX_HISTORY_TURNS = 6

SYSTEM_PROMPT = """Eres el Copiloto de Cívika, una guía ciudadana para emprendedores del cantón Riobamba (Chimborazo, Ecuador).
Ayudas con estos trámites, en este orden: 1) RUC/RIMPE en el SRI, 2) permiso del Cuerpo de Bomberos de Riobamba,
3) uso de suelo (PUGS) en el GAD Municipal, 4) certificado de no adeudar, 5) patente municipal, 6) LUF y permiso ARCSA.

Reglas:
- Responde en español claro y cercano, en 2 a 6 frases o una lista corta. Máximo 160 palabras.
- Usa SOLO la información del CONTEXTO para requisitos, costos, direcciones y plazos. Si algo no está en el contexto,
  dilo con honestidad y recomienda confirmarlo en la entidad correspondiente. Nunca inventes cifras, artículos de ley ni fechas.
- Adapta la respuesta al negocio y al paso en que está la persona, y si corresponde, dile cuál es su siguiente paso.
- Nunca pidas contraseñas, claves del SRI, números de cuenta ni la cédula completa. Si alguien ofrece "ayuda" pagada,
  recuerda que los trámites se hacen sin tramitadores.
- Si la pregunta no trata de trámites o emprendimiento en Riobamba, explica amablemente que solo ayudas con eso.
- Puedes usar **negritas** para lo importante y viñetas que empiecen con "- ".
"""


@dataclass
class AIConfig:
    provider: str
    api_key: str
    model: str
    base_url: str
    label: str
    mock: bool = False

    @property
    def enabled(self) -> bool:
        return self.mock or bool(self.api_key)


def load_config(secrets) -> AIConfig:
    """Lee la configuración desde st.secrets (o variables de entorno)."""
    section = {}
    try:
        section = dict(secrets.get("ai", {}))
    except Exception:  # sin archivo de secretos
        section = {}

    provider = (section.get("provider") or os.environ.get("CIVIKA_AI_PROVIDER") or "groq").lower().strip()
    if provider not in PROVIDERS:
        provider = "groq"
    preset = PROVIDERS[provider]
    api_key = (
        section.get("api_key")
        or os.environ.get("CIVIKA_AI_KEY")
        or os.environ.get("GROQ_API_KEY" if provider == "groq" else "GEMINI_API_KEY")
        or ""
    ).strip()
    return AIConfig(
        provider=provider,
        api_key=api_key,
        model=(section.get("model") or preset["model"]).strip(),
        base_url=(os.environ.get("CIVIKA_AI_BASE_URL") or preset["base_url"]).rstrip("/"),
        label=preset["label"],
        mock=os.environ.get("CIVIKA_AI_MOCK") == "1",
    )


def _clean(text, limit: int) -> str:
    return str(text or "").replace("\x00", "").strip()[:limit]


def build_messages(question: str, context: str, history: list | None) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.append({"role": "system", "content": "CONTEXTO DEL CIUDADANO Y DE SUS TRÁMITES:\n" + _clean(context, MAX_CONTEXT_CHARS)})
    for turn in (history or [])[-MAX_HISTORY_TURNS:]:
        role = "assistant" if turn.get("role") == "assistant" else "user"
        content = _clean(turn.get("text"), 800)
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": _clean(question, MAX_QUESTION_CHARS)})
    return messages


def ask(config: AIConfig, question: str, context: str, history: list | None = None, timeout: int = 25) -> dict:
    """Devuelve {"ok": bool, "text": str, "error": str|None}."""
    if not config.enabled:
        return {"ok": False, "text": "", "error": "sin_clave"}
    if not _clean(question, MAX_QUESTION_CHARS):
        return {"ok": False, "text": "", "error": "pregunta_vacia"}

    if config.mock:  # Solo para pruebas locales (CIVIKA_AI_MOCK=1)
        return {"ok": True, "text": f"**Respuesta de prueba.** Recibí tu pregunta y {len(context)} caracteres de contexto.", "error": None}

    payload = {
        "model": config.model,
        "messages": build_messages(question, context, history),
        "temperature": 0.3,
        "max_tokens": 700,
    }
    if config.provider == "groq" and config.model.startswith("openai/gpt-oss"):
        payload["reasoning_effort"] = "low"

    try:
        resp = requests.post(
            f"{config.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {config.api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout,
        )
    except requests.RequestException:
        return {"ok": False, "text": "", "error": "sin_conexion"}

    if resp.status_code == 429:
        return {"ok": False, "text": "", "error": "limite"}
    if resp.status_code in (401, 403):
        return {"ok": False, "text": "", "error": "clave_invalida"}
    if resp.status_code >= 400:
        return {"ok": False, "text": "", "error": f"http_{resp.status_code}"}

    try:
        text = resp.json()["choices"][0]["message"]["content"] or ""
    except (ValueError, KeyError, IndexError, TypeError):
        return {"ok": False, "text": "", "error": "respuesta_invalida"}
    text = text.strip()
    if not text:
        return {"ok": False, "text": "", "error": "respuesta_vacia"}
    return {"ok": True, "text": text, "error": None}

MAX_AUDIO_BYTES = 4_000_000  # ~ unos minutos de audio comprimido; las preguntas son de pocos segundos


def transcribe(config: AIConfig, audio: bytes, mime: str = "audio/webm", timeout: int = 30) -> dict:
    """Convierte la voz del ciudadano en texto. Devuelve {"ok", "text", "error"}."""
    if not config.enabled:
        return {"ok": False, "text": "", "error": "sin_clave"}
    if not audio or len(audio) < 800:
        return {"ok": False, "text": "", "error": "audio_vacio"}
    if len(audio) > MAX_AUDIO_BYTES:
        return {"ok": False, "text": "", "error": "audio_largo"}
    if config.mock:
        return {"ok": True, "text": "¿Qué necesito para el permiso de Bomberos?", "error": None}

    mime = (mime or "audio/webm").split(";")[0].strip() or "audio/webm"
    ext = {"audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav"}.get(mime, "webm")

    try:
        if config.provider == "groq":
            resp = requests.post(
                f"{config.base_url}/audio/transcriptions",
                headers={"Authorization": f"Bearer {config.api_key}"},
                files={"file": (f"voz.{ext}", audio, mime)},
                data={"model": "whisper-large-v3-turbo", "language": "es", "response_format": "json", "temperature": "0"},
                timeout=timeout,
            )
        else:  # Gemini (API nativa, admite audio en línea)
            import base64
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{config.model}:generateContent",
                headers={"x-goog-api-key": config.api_key, "Content-Type": "application/json"},
                json={"contents": [{"parts": [
                    {"text": "Transcribe literalmente este audio en español. Responde solo con la transcripción, sin comillas."},
                    {"inline_data": {"mime_type": mime, "data": base64.b64encode(audio).decode()}},
                ]}]},
                timeout=timeout,
            )
    except requests.RequestException:
        return {"ok": False, "text": "", "error": "sin_conexion"}

    if resp.status_code == 429:
        return {"ok": False, "text": "", "error": "limite"}
    if resp.status_code in (401, 403):
        return {"ok": False, "text": "", "error": "clave_invalida"}
    if resp.status_code >= 400:
        return {"ok": False, "text": "", "error": f"http_{resp.status_code}"}
    try:
        data = resp.json()
        if config.provider == "groq":
            text = data.get("text", "")
        else:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (ValueError, KeyError, IndexError, TypeError, AttributeError):
        return {"ok": False, "text": "", "error": "respuesta_invalida"}
    text = (text or "").strip()
    if not text:
        return {"ok": False, "text": "", "error": "respuesta_vacia"}
    return {"ok": True, "text": text[:MAX_QUESTION_CHARS], "error": None}