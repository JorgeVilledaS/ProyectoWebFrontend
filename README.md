# FRONTEND de proyecto full stack de Programación Web

**Backend repo:** https://github.com/JorgeVilledaS/ProyectoWebBackend
**Live app:** Aún en Local

---

## Screenshot

PENDIENTE

---

## Correr Localmente

### 1. Asegurarse de que Backend esté corriendo

El frontend se comunica con `http://localhost:8080`. Inicia primero el backend (ver el README del backend).

### 2. Servir el frontend

El frontend es HTML/CSS/JS estático — solo necesita un servidor HTTP local. Las opciones más sencillas:

**Option A — VS Code Live Server extension**  
Open the folder in VS Code, right-click `index.html` → "Open with Live Server".

**Option B — Python**
```bash
cd series-tracker-frontend
python3 -m http.server 3000
```
Then open `http://localhost:3000`.

**Option C — Node.js `serve`**
```bash
npx serve .
```

> ⚠️ Don't open `index.html` directly as `file://` — the browser will block `fetch()` requests due to CORS and same-origin policies.

---

## Estructura del Proyecto

```
series-tracker-frontend/
├── index.html        # Single-page app entry point
├── css/
│   └── style.css     
└── js/
    ├── api.js        # fetch() wrapper — all API calls live here
    ├── export.js     # CSV export — pure JS, no libraries
    ├── components.js # DOM rendering functions (cards, pagination, toasts)
    └── app.js        # App state, event handlers, modal logic
```

**¿Por qué hice cuatro archivos JS?** Cada archivo tiene una única responsabilidad:

* `api.js` se encarga del servidor, nada más
* `components.js` se encarga del DOM, nada más
* `export.js` se encarga de la generación de archivos, nada más
* `app.js` orquesta todo


---

## Retos implementados

* **Calidad visual** — Tema oscuro cinematográfico, tipografía Playfair Display, barras de progreso animadas, efectos hover, textura tipo grano, acentos en color dorado
* **Búsqueda** — Búsqueda en tiempo real con debounce usando `?q=`, se actualiza mientras escribes
* **Paginación** — Controles de página con `?page=` y `?limit=`
* **Ordenamiento** — Ordenar por nombre/episodios/total en dirección ASC/DESC
* **Subida de imágenes** — Carga de portada con preview, enviada como `multipart/form-data`
* **Sistema de calificaciones** — Interfaz interactiva de 10 estrellas, historial por serie, eliminación de calificaciones
* **Exportación a CSV** — JavaScript puro: construye el string CSV, crea un Blob y dispara la descarga
* **Códigos HTTP correctos** — El cliente interpreta 201/204/404/400 y maneja cada caso
* **Feedback de validación** — Los errores del servidor se muestran por campo en el formulario


---

## ¿Qué es CORS?
Esto se complementa con el README del Backend también

CORS es una política de seguridad del navegador. Cuando JavaScript en `localhost:3000` hace un `fetch()` hacia `localhost:8080`, el navegador bloquea la solicitud a menos que el servidor la permita explícitamente mediante encabezados en la respuesta.

El backend envía:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

El frontend envía automáticamente una solicitud previa `OPTIONS` (preflight) antes de ciertas llamadas `fetch`, y el servidor responde con esos encabezados para dar luz verde a la petición.


---

## Reflection

¿Volvería a usar este stack?

Usar JavaScript puro te obliga a entender las APIs reales del navegador — `fetch()`, `FormData`, `Blob`, `URLSearchParams`, `FileReader`. No hay una capa de abstracción entre tú y lo que realmente está pasando. Es más tedioso y está sujeto a bugs como vimos en clase, pero nada está oculto. Para un proyecto de este tamaño, es una decisión acertada.

La parte más difícil no fue la falta de librerías, fue la disciplina. Sin un framework que imponga estructura, es fácil terminar con un único archivo gigante y desordenado. Separar por responsabilidades (api / components / export / app) lo hizo manejable y realmente legible.
