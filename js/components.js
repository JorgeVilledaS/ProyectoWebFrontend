/**
 * components.js — Funciones de renderizado del DOM.
 *
 * Este módulo construye los elementos HTML de la interfaz.
 * No sabe nada de fetch ni de la base de datos — solo recibe datos y pinta.
 * Toda manipulación del DOM está aquí, separada de la lógica de la app.
 */

/**
 * Renderiza la grilla de tarjetas de series.
 * @param {Series[]} seriesList
 */
function renderGrid(seriesList) {
  const grid = document.getElementById("series-grid");
  const empty = document.getElementById("empty-state");
  const loadingState = document.getElementById("loading-state");

  // Ocultar loading
  if (loadingState) loadingState.remove();

  if (!seriesList || seriesList.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  grid.innerHTML = seriesList.map(s => buildCard(s)).join("");

  // Adjuntar eventos a los botones de cada tarjeta
  seriesList.forEach(s => attachCardEvents(s));
}

/**
 * Construye el HTML de una tarjeta de serie.
 * @param {Series} s
 * @returns {string}
 */
function buildCard(s) {
  const pct = s.total_episodes > 0
    ? Math.min(100, Math.round((s.current_episode / s.total_episodes) * 100))
    : 0;
  const isComplete = s.current_episode >= s.total_episodes;

  // Imagen o placeholder con inicial
  const initial = s.name.trim().charAt(0).toUpperCase();
  const posterHTML = s.image_url
    ? `<img class="card-poster" src="http://localhost:8080${s.image_url}" alt="${escapeHTML(s.name)}" loading="lazy" />`
    : `<div class="card-poster-placeholder">${initial}</div>`;

  // Estrellas basadas en el rating promedio (escala 1-10 → 5 estrellas)
  const starCount = Math.round((s.average_rating / 10) * 5);
  const starsHTML = s.rating_count > 0
    ? "★".repeat(starCount) + "☆".repeat(5 - starCount)
    : "☆☆☆☆☆";

  const ratingText = s.rating_count > 0
    ? `${s.average_rating.toFixed(1)} <span class="stars">${starsHTML}</span> (${s.rating_count})`
    : `<span style="color:var(--text-muted)">No ratings yet</span>`;

  return `
    <article class="series-card ${isComplete ? "completed" : ""}" data-id="${s.id}">
      ${posterHTML}
      <div class="card-body">
        <h3 class="card-title">${escapeHTML(s.name)}</h3>
        <div class="card-rating">${ratingText}</div>

        <div class="progress-wrap">
          <div class="progress-label">
            <span>Episode ${s.current_episode} / ${s.total_episodes}</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill ${isComplete ? "complete" : ""}" style="width:${pct}%"></div>
          </div>
        </div>

        <div class="ep-counter">
          <button class="ep-btn" data-action="decrement" data-id="${s.id}"
            ${s.current_episode <= 0 ? "disabled" : ""}>−</button>
          <span class="ep-label">Ep ${s.current_episode}</span>
          <button class="ep-btn" data-action="increment" data-id="${s.id}"
            ${s.current_episode >= s.total_episodes ? "disabled" : ""}>+</button>
        </div>

        <div class="card-controls">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${s.id}">✏ Edit</button>
          <button class="btn btn-ghost btn-sm" data-action="rate" data-id="${s.id}">★ Rate</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${s.id}">✕ Delete</button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Adjunta event listeners a los botones de una tarjeta.
 * @param {Series} s
 */
function attachCardEvents(s) {
  const card = document.querySelector(`.series-card[data-id="${s.id}"]`);
  if (!card) return;

  card.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id);

      if (action === "increment") await handleEpisodeChange(id, 1);
      if (action === "decrement") await handleEpisodeChange(id, -1);
      if (action === "edit")   openEditModal(s);
      if (action === "delete") handleDelete(id, s.name);
      if (action === "rate")   openRatingModal(s);
    });
  });
}

/**
 * Renderiza los controles de paginación.
 * @param {{ page, total_pages, total }} meta
 * @param {Function} onPageChange
 */
function renderPagination(meta, onPageChange) {
  const container = document.getElementById("pagination");
  if (!container) return;

  if (meta.total_pages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  // Botón anterior
  html += `<button class="page-btn" ${meta.page <= 1 ? "disabled" : ""} data-page="${meta.page - 1}">←</button>`;

  // Páginas
  for (let i = 1; i <= meta.total_pages; i++) {
    html += `<button class="page-btn ${i === meta.page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  // Botón siguiente
  html += `<button class="page-btn" ${meta.page >= meta.total_pages ? "disabled" : ""} data-page="${meta.page + 1}">→</button>`;

  container.innerHTML = html;

  // Adjuntar eventos
  container.querySelectorAll(".page-btn:not([disabled])").forEach(btn => {
    btn.addEventListener("click", () => onPageChange(parseInt(btn.dataset.page)));
  });
}

/**
 * Actualiza el strip de estadísticas.
 * @param {Series[]} all - todas las series de la página actual
 * @param {number} total - total en la base de datos
 */
function updateStats(all, total) {
  const completed = all.filter(s => s.current_episode >= s.total_episodes).length;
  const inProgress = all.filter(s => s.current_episode < s.total_episodes).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-completed").textContent = completed;
  document.getElementById("stat-in-progress").textContent = inProgress;
}

/**
 * Muestra una notificación toast temporal.
 * @param {string} message
 * @param {boolean} isError
 */
function showToast(message, isError = false) {
  // Remover toasts previos
  document.querySelectorAll(".toast").forEach(t => t.remove());

  const toast = document.createElement("div");
  toast.className = "toast" + (isError ? " error" : "");
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remover después de 3 segundos
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Escapa caracteres HTML para evitar XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}