export function construirParamsCatalogo({ q, categoria, page } = {}) {
  const params = new URLSearchParams();

  if (q) {
    params.set('q', q);
  }
  if (categoria) {
    params.set('categoria', categoria);
  }
  if (page && page > 1) {
    params.set('page', String(page));
  }

  return params;
}

export function paginaDentroDeRango(page, totalPages) {
  if (totalPages <= 0) {
    return 1;
  }

  return Math.min(Math.max(1, page), totalPages);
}
