/**
 * Maneja el estado de la app (página actual, filtros), coordina
 * las llamadas al API, y llama a los componentes para renderizar.
 * Es el "cerebro" del frontend.
 */

// ─── Estado Global ──────────────────────────────────────────────────────────

const state = {
  page: 1,
  limit: 12,
  q: "",
  sort: "id",
  order: "ASC",
  currentRatingSeriesId: null,
  pendingImageFile: null,   // Imagen pendiente antes de saber el ID de la serie
  selectedScore: null,
};

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  loadSeries();
  bindFilters();
  bindExport();
  buildStarUI();
  bindImageUpload();
});

/**
 * Carga y renderiza las series según el estado actual.
 */
async function loadSeries() {
  try {
    const data = await getSeries({
      page:  state.page,
      limit: state.limit,
      q:     state.q,
      sort:  state.sort,
      order: state.order,
    });

    renderGrid(data.data);
    updateStats(data.data, data.total);
    renderPagination(data, (newPage) => {
      state.page = newPage;
      loadSeries();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } catch (err) {
    showToast("Error loading series: " + err.message, true);
  }
}

// ─── Filtros ────────────────────────────────────────────────────────────────

function bindFilters() {
  // Búsqueda con debounce para no spamear el servidor
  let debounceTimer;
  document.getElementById("search-input").addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.q = e.target.value.trim();
      state.page = 1;
      loadSeries();
    }, 350);
  });

  document.getElementById("sort-select").addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.page = 1;
    loadSeries();
  });

  document.getElementById("order-select").addEventListener("change", (e) => {
    state.order = e.target.value;
    state.page = 1;
    loadSeries();
  });

  document.getElementById("limit-select").addEventListener("change", (e) => {
    state.limit = parseInt(e.target.value);
    state.page = 1;
    loadSeries();
  });
}

// ─── Acciones de tarjeta ────────────────────────────────────────────────────

/**
 * Incrementa o decrementa el episodio actual de una serie.
 * @param {number} id
 * @param {number} delta - +1 o -1
 */
async function handleEpisodeChange(id, delta) {
  try {
    // Obtener el estado actual de la serie antes de actualizar
    const series = await getSeriesById(id);
    const newEp = series.current_episode + delta;

    if (newEp < 0 || newEp > series.total_episodes) return;

    await updateSeries(id, { current_episode: newEp });
    await loadSeries();
  } catch (err) {
    showToast(err.message, true);
  }
}

/**
 * Elimina una serie tras confirmación del usuario.
 * @param {number} id
 * @param {string} name
 */
async function handleDelete(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    await deleteSeries(id);
    showToast(`"${name}" deleted`);
    await loadSeries();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ─── Modal de serie ─────────────────────────────────────────────────────────

function openCreateModal() {
  clearSeriesModal();
  document.getElementById("modal-title").textContent = "New Series";
  document.getElementById("save-label").textContent = "Save Series";
  document.getElementById("image-group").classList.remove("hidden");
  document.getElementById("series-modal").classList.remove("hidden");
}

function openEditModal(series) {
  clearSeriesModal();
  document.getElementById("modal-title").textContent = "Edit Series";
  document.getElementById("save-label").textContent = "Save Changes";
  document.getElementById("edit-id").value = series.id;
  document.getElementById("field-name").value = series.name;
  document.getElementById("field-current").value = series.current_episode;
  document.getElementById("field-total").value = series.total_episodes;

  // Mostrar imagen actual si existe
  if (series.image_url) {
    const preview = document.getElementById("upload-preview");
    preview.src = "http://localhost:8080" + series.image_url;
    preview.classList.remove("hidden");
    document.getElementById("upload-placeholder").classList.add("hidden");
  }

  document.getElementById("image-group").classList.remove("hidden");
  document.getElementById("series-modal").classList.remove("hidden");
}

function closeSeriesModal() {
  document.getElementById("series-modal").classList.add("hidden");
  state.pendingImageFile = null;
}

function clearSeriesModal() {
  document.getElementById("edit-id").value = "";
  document.getElementById("field-name").value = "";
  document.getElementById("field-current").value = 1;
  document.getElementById("field-total").value = "";
  document.getElementById("err-name").textContent = "";
  document.getElementById("err-current").textContent = "";
  document.getElementById("err-total").textContent = "";
  document.getElementById("err-general").textContent = "";
  document.getElementById("upload-preview").classList.add("hidden");
  document.getElementById("upload-placeholder").classList.remove("hidden");
  document.getElementById("field-image").value = "";
  state.pendingImageFile = null;
}

/**
 * Guarda una serie nueva o editada.
 * Si hay imagen pendiente, la sube después de crear/editar.
 */
async function saveSeries() {
  const editId = document.getElementById("edit-id").value;
  const name = document.getElementById("field-name").value.trim();
  const current = parseInt(document.getElementById("field-current").value);
  const total = parseInt(document.getElementById("field-total").value);

  // Limpiar errores previos
  ["err-name", "err-current", "err-total", "err-general"].forEach(id => {
    document.getElementById(id).textContent = "";
  });

  const saveBtn = document.getElementById("btn-save-series");
  saveBtn.disabled = true;
  document.getElementById("save-label").textContent = "Saving…";

  try {
    let series;

    if (editId) {
      // Editar serie existente
      series = await updateSeries(parseInt(editId), { name, current_episode: current, total_episodes: total });
    } else {
      // Crear nueva serie
      series = await createSeries({ name, current_episode: current, total_episodes: total });
    }

    // Si hay una imagen seleccionada, subirla ahora que tenemos el ID
    if (state.pendingImageFile) {
      try {
        await uploadImage(series.id, state.pendingImageFile);
      } catch (imgErr) {
        showToast("Series saved, but image upload failed: " + imgErr.message, true);
      }
    }

    closeSeriesModal();
    showToast(editId ? "Series updated ✓" : "Series added ✓");
    await loadSeries();
  } catch (err) {
    // Mostrar errores de validación por campo
    if (err.details) {
      if (err.details.name) document.getElementById("err-name").textContent = err.details.name;
      if (err.details.current_episode) document.getElementById("err-current").textContent = err.details.current_episode;
      if (err.details.total_episodes) document.getElementById("err-total").textContent = err.details.total_episodes;
    } else {
      document.getElementById("err-general").textContent = err.message;
    }
  } finally {
    saveBtn.disabled = false;
    document.getElementById("save-label").textContent = editId ? "Save Changes" : "Save Series";
  }
}

/**
 * Preview de imagen antes de subir — muestra la imagen seleccionada en el modal.
 */
function bindImageUpload() {
  document.getElementById("field-image").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (1MB)
    if (file.size > 1 * 1024 * 1024) {
      showToast("Image must be under 1MB", true);
      e.target.value = "";
      return;
    }

    state.pendingImageFile = file;

    // Mostrar preview usando FileReader (no necesita subirla todavía)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = document.getElementById("upload-preview");
      preview.src = ev.target.result;
      preview.classList.remove("hidden");
      document.getElementById("upload-placeholder").classList.add("hidden");
    };
    reader.readAsDataURL(file);
  });
}

// ─── Botón add series en header ─────────────────────────────────────────────

document.getElementById("btn-add-series").addEventListener("click", openCreateModal);

// Cerrar modal al hacer click fuera
document.getElementById("series-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeSeriesModal();
});

document.getElementById("rating-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeRatingModal();
});

// ─── Export ─────────────────────────────────────────────────────────────────

function bindExport() {
  document.getElementById("btn-export-csv").addEventListener("click", exportToCSV);
}

// ─── Rating Modal ────────────────────────────────────────────────────────────

function buildStarUI() {
  const container = document.getElementById("star-rating");
  let html = "";
  for (let i = 1; i <= 10; i++) {
    html += `<button class="star-btn" data-score="${i}" title="${i}/10">★</button>`;
  }
  container.innerHTML = html;

  container.querySelectorAll(".star-btn").forEach(btn => {
    btn.addEventListener("click", () => selectScore(parseInt(btn.dataset.score)));
    btn.addEventListener("mouseenter", () => highlightStars(parseInt(btn.dataset.score)));
    btn.addEventListener("mouseleave", () => highlightStars(state.selectedScore || 0));
  });
}

function selectScore(score) {
  state.selectedScore = score;
  highlightStars(score);
  document.getElementById("score-display-value").textContent = score;
}

function highlightStars(upTo) {
  document.querySelectorAll(".star-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.score) <= upTo);
  });
}

async function openRatingModal(series) {
  state.currentRatingSeriesId = series.id;
  state.selectedScore = null;
  highlightStars(0);
  document.getElementById("score-display-value").textContent = "—";
  document.getElementById("rating-comment").value = "";
  document.getElementById("rating-series-name").textContent = `"${series.name}"`;
  document.getElementById("rating-modal").classList.remove("hidden");

  // Cargar historial de ratings
  await loadRatingsHistory(series.id);
}

function closeRatingModal() {
  document.getElementById("rating-modal").classList.add("hidden");
  state.currentRatingSeriesId = null;
}

async function loadRatingsHistory(seriesId) {
  const container = document.getElementById("ratings-history");
  container.innerHTML = `<p style="color:var(--text-muted);font-size:.8rem">Loading ratings…</p>`;

  try {
    const data = await getRatings(seriesId);
    if (!data.ratings || data.ratings.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:.8rem;text-align:center">No ratings yet — be the first!</p>`;
      return;
    }

    container.innerHTML = data.ratings.map(r => `
      <div class="rating-item">
        <span class="score">★ ${r.score}/10</span>
        <span class="comment">${escapeHTML(r.comment || "—")}</span>
        <button class="del-btn" data-rating-id="${r.id}" title="Delete this rating">✕</button>
      </div>
    `).join("");

    // Adjuntar eventos de eliminar rating
    container.querySelectorAll(".del-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          await deleteRating(parseInt(btn.dataset.ratingId));
          await loadRatingsHistory(seriesId);
          await loadSeries(); // Refrescar para actualizar promedio en tarjeta
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<p style="color:var(--red);font-size:.8rem">Error loading ratings</p>`;
  }
}

async function submitRating() {
  if (!state.selectedScore) {
    showToast("Please select a score first", true);
    return;
  }

  const comment = document.getElementById("rating-comment").value.trim();

  try {
    await createRating(state.currentRatingSeriesId, {
      score: state.selectedScore,
      comment,
    });

    showToast("Rating submitted ✓");
    state.selectedScore = null;
    document.getElementById("rating-comment").value = "";
    document.getElementById("score-display-value").textContent = "—";
    highlightStars(0);

    await loadRatingsHistory(state.currentRatingSeriesId);
    await loadSeries();
  } catch (err) {
    showToast(err.message, true);
  }
}