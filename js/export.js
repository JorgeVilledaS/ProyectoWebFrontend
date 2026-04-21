/**
 * export.js — Módulo de exportación.
 *
 * Genera archivos CSV desde JavaScript puro — sin librerías.
 * El truco es crear un Blob con el contenido, generar una URL temporal
 * y simular un click en un <a> para descargar el archivo.
 */

/**
 * Escapa un valor para CSV: lo envuelve en comillas si contiene coma, comilla o salto.
 * @param {any} value
 * @returns {string}
 */
function escapeCSV(value) {
  const str = String(value ?? "");
  // Si contiene caracteres especiales, envolver en dobles comillas
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convierte un array de objetos a CSV.
 * Las columnas se infieren de las claves del primer objeto.
 * @param {Object[]} rows
 * @param {string[]} columns - columnas a incluir (en orden)
 * @param {string[]} headers - nombres de columna en el CSV
 * @returns {string} contenido CSV
 */
function objectsToCSV(rows, columns, headers) {
  // Línea de encabezados
  const headerLine = headers.map(escapeCSV).join(",");

  // Líneas de datos
  const dataLines = rows.map(row =>
    columns.map(col => escapeCSV(row[col])).join(",")
  );

  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Dispara la descarga de un archivo en el navegador.
 * Crea un elemento <a> invisible, lo activa, y lo elimina.
 * @param {string} content - contenido del archivo
 * @param {string} filename - nombre del archivo a descargar
 * @param {string} mimeType - tipo MIME del archivo
 */
function downloadFile(content, filename, mimeType) {
  // Crear un Blob con el contenido codificado en UTF-8
  // El BOM (0xEF 0xBB 0xBF) permite que Excel abra el CSV con caracteres especiales
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: mimeType });

  // Crear una URL temporal para el blob
  const url = URL.createObjectURL(blob);

  // Simular click en un <a> invisible
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Limpiar: remover el elemento y liberar la URL
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta todas las series a CSV.
 * Hace fetch de TODAS las series (limit alto) para incluirlas completas.
 */
async function exportToCSV() {
  try {
    showToast("Generating CSV…");

    // Obtener todas las series (sin paginación real: limit alto)
    const data = await getSeries({ page: 1, limit: 1000 });
    const series = data.data;

    if (!series || series.length === 0) {
      showToast("No series to export", true);
      return;
    }

    // Columnas a exportar y sus headers
    const columns = ["id", "name", "current_episode", "total_episodes", "average_rating", "rating_count"];
    const headers = ["ID", "Title", "Current Episode", "Total Episodes", "Avg Rating", "# Ratings"];

    // Agregar columna de porcentaje calculada en el cliente
    const enriched = series.map(s => ({
      ...s,
      progress: s.total_episodes > 0
        ? Math.round((s.current_episode / s.total_episodes) * 100) + "%"
        : "0%",
    }));

    const allColumns = [...columns, "progress"];
    const allHeaders = [...headers, "Progress"];

    const csv = objectsToCSV(enriched, allColumns, allHeaders);
    const filename = `cinelog-series-${new Date().toISOString().split("T")[0]}.csv`;

    downloadFile(csv, filename, "text/csv;charset=utf-8;");
    showToast(`Exported ${series.length} series ✓`);
  } catch (err) {
    showToast("Export failed: " + err.message, true);
  }
}