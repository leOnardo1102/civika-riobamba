# Guía: subir Cívika a GitHub y publicarla en Streamlit

Esta carpeta (`C:\emprendimiento\civika-riobamba`) ya está lista para ser un repositorio de GitHub. Solo tienes que subirla y conectarla con Streamlit Community Cloud. Después, **cada cambio que subas a GitHub se publica solo** en la página.

```
civika-riobamba/
├── streamlit_app.py        ← la página de Streamlit (archivo principal)
├── requirements.txt        ← lo que Streamlit debe instalar (solo "streamlit")
├── .streamlit/config.toml  ← colores institucionales
├── .gitignore              ← archivos que NO se suben
├── web/                    ← la app Cívika completa (aquí haces tus cambios)
│   ├── index.html
│   ├── css/  js/  icons/
│   └── manifest.json, sw.js
├── README.md
└── GUIA_GITHUB_STREAMLIT.md  ← esta guía
```

`streamlit_app.py` toma la app de la carpeta `web/`, junta todo en una sola página (estilos, scripts, fuentes e íconos) y la muestra a pantalla completa. No tienes que reescribir nada en Python.

---

## Paso 0 · Probarla en tu computadora (opcional, 2 minutos)

Abre **PowerShell** en la carpeta y ejecuta:

```powershell
cd C:\emprendimiento\civika-riobamba
pip install -r requirements.txt
streamlit run streamlit_app.py
```

Se abre `http://localhost:8501` con Cívika. Para cerrarla, presiona `Ctrl + C`.

> Si `pip` o `streamlit` no se reconocen, prueba `python -m pip install -r requirements.txt` y `python -m streamlit run streamlit_app.py`.

---

## Paso 1 · Subir la carpeta a GitHub

Elige **una** de estas dos opciones.

### Opción A — GitHub Desktop (recomendada, sin comandos)
1. Descarga e instala **GitHub Desktop**: https://desktop.github.com e inicia sesión con tu cuenta de GitHub.
2. Menú **File → Add local repository…** y elige `C:\emprendimiento\civika-riobamba`.
3. Te dirá que la carpeta aún no es un repositorio: haz clic en **"create a repository"**.
   - Name: `civika-riobamba`
   - Deja *Git ignore* y *License* en **None** (ya incluimos `.gitignore`).
   - Clic en **Create repository**.
4. Clic en **Publish repository** (arriba).
   - Desmarca **"Keep this code private"** si quieres que sea público (lo más simple para Streamlit gratis).
   - Clic en **Publish repository**.
5. Listo: entra a `https://github.com/TU_USUARIO/civika-riobamba` y verifica que aparezcan `streamlit_app.py`, `requirements.txt` y la carpeta `web`.

### Opción B — Git por comandos (PowerShell)
Necesitas Git instalado (https://git-scm.com). Primero crea en github.com un repositorio **vacío** llamado `civika-riobamba` (sin README). Luego:

```powershell
cd C:\emprendimiento\civika-riobamba
git init
git add .
git commit -m "Cívika: primera versión"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/civika-riobamba.git
git push -u origin main
```

---

## Paso 2 · Publicar en Streamlit Community Cloud

1. Entra a **https://share.streamlit.io** y elige **Continue with GitHub**. Autoriza a Streamlit a ver tus repositorios.
   - Si tu repositorio es **privado**, acepta también el permiso para repositorios privados.
2. Arriba a la derecha, clic en **Create app**.
3. Cuando pregunte si ya tienes una app, elige la opción de **desplegar desde GitHub** y completa:
   - **Repository:** `TU_USUARIO/civika-riobamba`
   - **Branch:** `main`
   - **Main file path:** `streamlit_app.py`
   - **App URL:** por ejemplo `civika-riobamba` → quedará en `https://civika-riobamba.streamlit.app`
4. Clic en **Deploy**. En uno o dos minutos verás la app funcionando.

---

## Paso 3 · Cómo hacer cambios (y que se guarden)

1. Edita los archivos dentro de **`web/`** (por ejemplo `web/js/knowledge_base.js` o `web/css/styles.css`).
2. Para ver los cambios rápido en tu computadora, abre `web/index.html` con doble clic (o usa `streamlit run streamlit_app.py`).
3. Sube los cambios:
   - **GitHub Desktop:** escribe un resumen abajo a la izquierda (ej. *"Agrego requisitos de farmacia"*) → **Commit to main** → **Push origin**.
   - **Comandos:** `git add .` → `git commit -m "mensaje"` → `git push`
4. Streamlit detecta el cambio y **actualiza la página automáticamente** en uno o dos minutos. Todo queda guardado en el historial de GitHub, así que puedes volver a cualquier versión anterior.

> **Importante:** desde ahora trabaja en `C:\emprendimiento\civika-riobamba\web`. La carpeta antigua `C:\emprendimiento\civika_app` queda como respaldo.

---

## Antes de la presentación

- **La app gratuita se "duerme".** Si nadie la visita en unas 12 horas, al entrar aparece *"This app has gone to sleep"* y un botón para despertarla (tarda menos de un minuto). **Ábrela 10 minutos antes de presentar.**
- **Cámara del Modo Ventanilla:** funciona en la página de Streamlit porque usa `https`. El navegador pedirá permiso la primera vez.
- **Datos:** el avance, las renovaciones y el pasaporte se guardan en el navegador de cada persona (no en un servidor). Si cambias de celular o borras los datos del navegador, empiezas de cero.
- **Instalar como app (PWA):** dentro de Streamlit no se ofrece. Si lo necesitas, puedes publicar además la carpeta `web/` en GitHub Pages (Settings → Pages) o Netlify; ahí sí se instala.
- **Plan B sin internet:** lleva la carpeta en la laptop y abre `web/index.html` con doble clic.

---

## Problemas comunes

| Síntoma | Solución |
|---|---|
| Streamlit dice *"No module named streamlit"* al desplegar | Revisa que `requirements.txt` esté en la raíz del repositorio. |
| *"Main module does not exist"* | En *Main file path* escribe exactamente `streamlit_app.py`. |
| La página sale en blanco | Revisa que la carpeta `web/` se haya subido completa (con `js/vendor`). En Streamlit: *Manage app → logs*. |
| No veo mi repositorio al crear la app | En share.streamlit.io, autoriza el acceso a repositorios privados o haz público el repositorio. |
| Hice cambios y no aparecen | Confirma que hiciste **Push** en GitHub Desktop. Luego recarga la página. Si sigue igual: *Manage app → Reboot app*. |
