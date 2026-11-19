# Guía: conectar la IA gratuita al Copiloto de Cívika

El Copiloto ya está programado para usar una IA gratuita (**Groq**, recomendada, o **Gemini**). Solo falta crear tu clave y guardarla en Streamlit. Tarda unos 5 minutos.

## Cómo funciona (y por qué es seguro)

```
Ciudadano escribe en el Copiloto
      │  pregunta + contexto de su trámite (negocio, pasos listos, requisitos)
      ▼
streamlit_app.py (Python, en el servidor de Streamlit)
      │  usa la clave guardada en "Secrets"
      ▼
Groq / Gemini ──► respuesta ──► se muestra en el chat
```

- La clave **nunca** está en GitHub ni en el navegador: vive en los *Secrets* de Streamlit.
- La IA recibe la guía de Cívika del negocio y del paso en que está la persona, y tiene instrucciones de **no inventar** cifras ni requisitos que no estén ahí.
- Si no hay clave, la clave falla o se acaba la cuota gratuita, el Copiloto responde con sus **respuestas guiadas**, igual que antes.
- Cada sesión puede hacer hasta 40 preguntas a la IA, para cuidar la cuota gratuita.

---

## Paso 1 · Crear tu clave gratuita de Groq

1. Entra a **https://console.groq.com** y crea una cuenta (puedes usar tu correo o Google). No pide tarjeta.
2. En el menú, abre **API Keys** → **Create API Key**.
3. Ponle un nombre (ej. `civika-streamlit`) y copia la clave (empieza con `gsk_`). **Solo se muestra una vez**: guárdala en un lugar seguro.

> **No pegues la clave en ningún archivo del repositorio** ni en el chat de GitHub. Solo va en Streamlit (paso 2).

## Paso 2 · Guardar la clave en Streamlit

1. Entra a **https://share.streamlit.io** y busca tu app `civika-riobamba`.
2. Abre el menú **⋮** de la app → **Settings** → **Secrets**.
3. Pega esto, reemplazando la clave:

```toml
[ai]
provider = "groq"
api_key = "gsk_TU_CLAVE_AQUI"
```

4. Pulsa **Save**. La app se reinicia sola en unos segundos.

## Paso 3 · Comprobar

Abre tu página → **Copiloto IA**. Debajo del título debe decir **"IA conectada · Groq"** en verde. Haz una pregunta, por ejemplo: *"Tengo una peluquería en Maldonado, ¿qué me falta?"*. Las respuestas de la IA muestran arriba **"Copiloto Cívika · IA (Groq)"**.

Si dice **"Respuestas guiadas"**, revisa que en *Secrets* esté exactamente `[ai]` y `api_key = "..."` con comillas.

---

## Opcional · Usar Gemini en lugar de Groq

1. Crea una clave gratis en **https://aistudio.google.com** → *Get API key*.
2. En *Secrets*:

```toml
[ai]
provider = "gemini"
api_key = "TU_CLAVE_DE_GEMINI"
```

> Nota: en el plan gratuito de Gemini, Google puede usar los datos para mejorar sus modelos. Por eso recomendamos Groq para una app ciudadana.

## Opcional · Cambiar el modelo

Por defecto se usa `openai/gpt-oss-120b` en Groq. Si Groq lo retira o quieres otro, agrega la línea `model`:

```toml
[ai]
provider = "groq"
api_key = "gsk_..."
model = "llama-3.3-70b-versatile"
```

Los modelos disponibles y tus límites reales aparecen en console.groq.com → *Models* y *Limits*.

---

## Probar la IA en tu computadora (opcional)

1. Copia `.streamlit/secrets.toml.example` como `.streamlit/secrets.toml` y pon tu clave. Este archivo está en `.gitignore`, así que **no se sube** a GitHub.
2. Ejecuta `streamlit run streamlit_app.py`.

## Límites del plan gratuito

- Groq limita las preguntas por minuto y por día. Si se alcanzan, el Copiloto avisa y responde con la guía de Cívika.
- Para la presentación, la cuota gratuita alcanza de sobra.
