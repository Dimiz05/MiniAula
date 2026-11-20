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

// Aliases kept for compatibility with different naming conventions.
export const listarCursosPublicados = listarCursos;
export const listarCursosPublicos = listarCursos;
export const fetchCursos = listarCursos;
export const fetchCourses = listarCursos;
export const fetchCatalogo = listarCursos;
export const fetchCatalog = listarCursos;
export const getCursos = listarCursos;
export const getCatalogo = listarCursos;
export const getCatalog = listarCursos;
export const obtenerCursos = listarCursos;
export const obtenerCatalogo = listarCursos;
export const cargarCursos = listarCursos;
export const cargarCatalogo = listarCursos;

export const obtenerCursoPublicado = obtenerCurso;
export const obtenerCursoPublico = obtenerCurso;
export const fetchCurso = obtenerCurso;
export const fetchCourse = obtenerCurso;
export const fetchDetalleCurso = obtenerCurso;
export const fetchCourseDetail = obtenerCurso;
export const getCurso = obtenerCurso;
export const getCourse = obtenerCurso;
export const cargarCurso = obtenerCurso;
export const cargarDetalleCurso = obtenerCurso;
export const getCourseDetail = obtenerCurso;
export const getCursoDetalle = obtenerCurso;
export const fetchCursoById = obtenerCurso;
export const obtenerCursoPorId = obtenerCurso;
export const listarCatalogo = listarCursos;
export const fetchCatalogoCursos = listarCursos;
export const fetchCourseById = obtenerCurso;