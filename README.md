# FRONTEND de proyecto full stack de Programación Web

**Backend repo:** https://github.com/JorgeVilledaS/ProyectoWebBackend
**Live app:** https://proyecto-web-frontend-5gl5860lf-jorgevilledas-projects.vercel.app/ 

---

## Screenshot

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ccf949bd-f239-4ae4-b3a0-6a8ca9b4a442" />

## Screenshot del Deploy en Vercel
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/dda0c305-0aa9-4c26-89a4-c3254c6e92d9" />


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

## Reflexión

¿Volvería a usar este stack?

Usar JavaScript puro te obliga a entender las APIs reales del navegador — `fetch()`, `FormData`, `Blob`, `URLSearchParams`, `FileReader`. No hay una capa de abstracción entre tú y lo que realmente está pasando. Es más tedioso y está sujeto a bugs como vimos en clase, pero nada está oculto. Para un proyecto de este tamaño, es una decisión acertada.

La parte más difícil no fue la falta de librerías, fue la disciplina. Sin un framework que imponga estructura, es fácil terminar con un único archivo gigante y desordenado. Separar por responsabilidades (api / components / export / app) lo hizo manejable y realmente legible.
