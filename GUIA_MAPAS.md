# Guía: el mapa de Cívika y tus capas de QGIS (OSGeo4W)

El mapa de **Oficinas y mapa** usa **Leaflet + OpenStreetMap**, que es software y cartografía libres. Sin claves ni costo. Desde ahí puedes:

- ver todas las oficinas a la vez, con colores por entidad y filtros;
- tocar un punto para ver la dirección y el horario, con "Cómo llegar" y "Ver en OSM";
- usar **Mi ubicación**, que muestra la distancia a cada oficina y ordena la lista por cercanía;
- cambiar el mapa base (Calles, Claro o Satélite) con el botón de capas ▣;
- **cargar tus propias capas hechas en QGIS** (parroquias, zonas del PUGS, centro histórico, etc.).

## Cómo se "conecta" con OSGeo

OSGeo4W, que tienes instalado en `C:\OSGeo4W`, trae **QGIS** y **GDAL**: son programas para crear y corregir datos geográficos. No es un servicio en línea al que la página se conecte. El flujo es este:

```
QGIS (OSGeo4W)  ──exportar GeoJSON──►  web/data/capas/  ──GitHub──►  Streamlit  ──►  mapa de Cívika
```

---

## 1 · Corregir las ubicaciones de las oficinas (importante)

Las coordenadas actuales son **aproximadas**. Tres oficinas están marcadas así en la app: Ordenamiento Territorial, ARCSA y Artesanos. Para dejarlas exactas:

1. Abre **QGIS** (menú Inicio → *OSGeo4W* → *QGIS*).
2. En el panel **Navegador**, despliega **XYZ Tiles** y haz doble clic en **OpenStreetMap**.
3. En la esquina inferior derecha, cambia el sistema de coordenadas a **EPSG:4326** (clic en el código EPSG y búscalo).
4. Acércate al edificio de la oficina. Con clic derecho → **Copiar coordenadas** → **EPSG:4326**. Obtendrás algo como `-78.6521, -1.6745` (primero **longitud**, después **latitud**).
5. Abre `web/js/institutions.js`, busca la oficina y actualiza:
   ```js
   coordenadas: { lat: -1.6745, lng: -78.6521 },
   ```
   Si ya la verificaste, borra la línea `ubicacionAproximada: true,`.
6. Sube el cambio con GitHub Desktop: **Commit → Push**.

> Lo ideal es confirmar cada dirección en persona o en el sitio web de la entidad antes de la presentación.

## 2 · Agregar una capa propia (GeoJSON)

**Ejemplos útiles para emprendedores:** el polígono del **Centro Histórico** (allí aplican reglas de rotulación), las **parroquias urbanas** de Riobamba o las **zonas del PUGS**, digitalizadas desde el plano oficial con el *Georreferenciador* de QGIS.

1. En QGIS, crea o abre la capa. Para dibujar una: *Capa → Crear capa → Nueva capa GeoPackage*, tipo Polígono, en EPSG:4326.
2. Si es grande, simplifícala: *Vectorial → Herramientas de geometría → Simplificar* (tolerancia 0.00005).
3. Clic derecho sobre la capa → **Exportar → Guardar objetos como…**
   - **Formato:** GeoJSON
   - **SRC:** EPSG:4326 – WGS 84 (obligatorio)
   - **Nombre de archivo:** `C:\emprendimiento\civika-riobamba\web\data\capas\centro_historico.geojson`
   - En *Opciones de capa*, `COORDINATE_PRECISION` = 6
4. Abre `web/data/capas/capas.json` y agrega la capa:
   ```json
   {
     "capas": [
       {
         "archivo": "centro_historico.geojson",
         "nombre": "Centro Histórico",
         "color": "#B45309",
         "opacidad": 0.15,
         "visible": true,
         "campos": ["nombre", "regla"]
       }
     ]
   }
   ```
   - `campos`: columnas de la tabla de atributos que se mostrarán al tocar el polígono.
   - `visible`: `true` para que aparezca encendida; si no, se activa desde el botón de capas ▣.
5. Sube los cambios a GitHub (**Commit → Push**). En uno o dos minutos la capa aparece en tu página.

> Las capas solo se cargan desde la página publicada (Streamlit) o con `streamlit run`, no al abrir `index.html` con doble clic.
> Mantén cada archivo por debajo de unos 3 MB para que el mapa cargue rápido en el celular.

## 3 · Ideas con datos libres

- **Competencia cercana:** con el complemento **QuickOSM** de QGIS puedes descargar de OpenStreetMap las cafeterías, farmacias o peluquerías de Riobamba. Expórtalas como GeoJSON para mostrar cuántos negocios similares hay cerca del local.
- **Límites oficiales:** los límites de parroquias del Ecuador los publican entidades del Estado. Revisa la licencia de uso y cita la fuente en `nombre` o en el README.

## Créditos que deben verse

El mapa ya muestra "© colaboradores de OpenStreetMap" (y CARTO o Esri según el mapa base). No los quites: es una condición de uso de esos mapas.
