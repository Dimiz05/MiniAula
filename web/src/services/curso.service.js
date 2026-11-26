import { apiRequest } from '../config/http.js';

function construirQuery(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set('q', params.q);
  }
  if (params.categoria) {
    searchParams.set('categoria', params.categoria);
  }
  if (params.page !== undefined && params.page !== null && params.page !== '') {
    searchParams.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    searchParams.set('limit', params.limit);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listarCursos(...args) {
  let params = args[0];

  if (typeof params === 'number') {
    params = {
      page: args[0],
      limit: args[1],
      q: args[2],
      categoria: args[3],
    };
  }

  return apiRequest(`/cursos${construirQuery(params ?? {})}`);
}

export async function obtenerCurso(...args) {
  let id = args[0];

  if (id && typeof id === 'object') {
    id = id.id ?? id.cursoId ?? id.curso?.id;
  }

  return apiRequest(`/cursos/${id}`);
}

export function listarCursosPropios() {
  return apiRequest('/cursos/mios', { auth: true });
}

export function obtenerMetricasPanel() {
  return apiRequest('/cursos/mios/metricas', { auth: true });
}

export function obtenerCursoPropio(id) {
  return apiRequest(`/cursos/mios/${encodeURIComponent(id)}`, { auth: true });
}

export function obtenerAnaliticasCurso(id) {
  return apiRequest(`/cursos/mios/${encodeURIComponent(id)}/analiticas`, { auth: true });
}

export function crearCurso(body) {
  return apiRequest('/cursos', { auth: true, method: 'POST', body });
}

export function actualizarCurso(id, body) {
  return apiRequest(`/cursos/${encodeURIComponent(id)}`, { auth: true, method: 'PUT', body });
}

export function subirPortada(id, archivo) {
  return apiRequest(`/cursos/${encodeURIComponent(id)}/portada`, {
    auth: true,
    method: 'POST',
    rawBody: archivo,
    headers: { 'Content-Type': archivo.type || 'application/octet-stream' },
  });
}

export function eliminarPortada(id) {
  return apiRequest(`/cursos/${encodeURIComponent(id)}/portada`, { auth: true, method: 'DELETE' });
}

export function publicarCurso(id) {
  return apiRequest(`/cursos/${encodeURIComponent(id)}/publicar`, { auth: true, method: 'PATCH' });
}

export function archivarCurso(id) {
  return apiRequest(`/cursos/${encodeURIComponent(id)}/archivar`, { auth: true, method: 'PATCH' });
}

export function eliminarCurso(id) {
  return apiRequest(`/cursos/${encodeURIComponent(id)}`, { auth: true, method: 'DELETE' });
}
