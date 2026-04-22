/**
 * api.js — Módulo de comunicación con el backend.
 *
 * Centraliza todas las llamadas fetch() a la API REST.
 * El cliente no sabe nada de PostgreSQL; solo habla JSON con el servidor.
 * Toda petición va a BASE_URL para que sea fácil cambiar el host en producción.
 */

const BASE_URL = "https://proyectowebbackend-production-1617.up.railway.app";

const API_URL = `${BASE_URL}/api`;

/**
 * Wrapper genérico sobre fetch que:
 *  - Agrega Content-Type: application/json en métodos con body
 *  - Lanza un Error con el mensaje del servidor si la respuesta no es OK
 *  - Devuelve null para 204 No Content
 */
async function request(method, path, body = null) {
  const options = {
    method,
    headers: {},
  };

  if (body !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(BASE_URL + path, options);

  // 204 No Content — sin body
  if (response.status === 204) return null;

  const data = await response.json();

  // Si el servidor devolvió un error (4xx o 5xx), lanzamos el mensaje
  if (!response.ok) {
    const err = new Error(data.error || "Unknown error");
    err.details = data.details || null;
    err.status = response.status;
    throw err;
  }

  return data;
}

// ─── Series ────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista paginada de series con filtros opcionales.
 * @param {{ page, limit, q, sort, order }} params
 * @returns {Promise<PaginatedSeries>}
 */
async function getSeries(params = {}) {
  const qs = new URLSearchParams();
  if (params.page)  qs.set("page",  params.page);
  if (params.limit) qs.set("limit", params.limit);
  if (params.q)     qs.set("q",     params.q);
  if (params.sort)  qs.set("sort",  params.sort);
  if (params.order) qs.set("order", params.order);
  const query = qs.toString() ? "?" + qs.toString() : "";
  return request("GET", `/series${query}`);
}

/**
 * Obtiene una serie por ID.
 * @param {number} id
 */
async function getSeriesById(id) {
  return request("GET", `/series/${id}`);
}

/**
 * Crea una nueva serie.
 * @param {{ name, current_episode, total_episodes }} data
 */
async function createSeries(data) {
  return request("POST", "/series", data);
}

/**
 * Actualiza una serie existente (solo los campos enviados).
 * @param {number} id
 * @param {{ name?, current_episode?, total_episodes? }} data
 */
async function updateSeries(id, data) {
  return request("PUT", `/series/${id}`, data);
}

/**
 * Elimina una serie por ID.
 * @param {number} id
 */
async function deleteSeries(id) {
  return request("DELETE", `/series/${id}`);
}

// ─── Image Upload ───────────────────────────────────────────────────────────

/**
 * Sube la imagen de portada de una serie como multipart/form-data.
 * No usamos JSON aquí — el browser maneja el multipart automáticamente.
 * @param {number} id
 * @param {File} file
 */
async function uploadImage(id, file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${BASE_URL}/series/${id}/image`, {
    method: "POST",
    body: formData,
    // No ponemos Content-Type — el browser lo pone con el boundary correcto
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error uploading image");
  }
  return data;
}

// ─── Ratings ────────────────────────────────────────────────────────────

/**
 * Obtiene todos los ratings de una serie.
 * @param {number} seriesId
 */
async function getRatings(seriesId) {
  return request("GET", `/series/${seriesId}/rating`);
}

/**
 * Agrega un rating a una serie.
 * @param {number} seriesId
 * @param {{ score, comment }} data
 */
async function createRating(seriesId, data) {
  return request("POST", `/series/${seriesId}/rating`, data);
}

/**
 * Elimina un rating por su ID.
 * @param {number} ratingId
 */
async function deleteRating(ratingId) {
  return request("DELETE", `/ratings/${ratingId}`);
}