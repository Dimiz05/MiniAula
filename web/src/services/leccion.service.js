import { apiRequest } from '../config/http.js';

export function crearLeccion(cursoId, body) {
  return apiRequest(`/cursos/${encodeURIComponent(cursoId)}/lecciones`, {
    auth: true,
    method: 'POST',
    body,
  });
}

export function actualizarLeccion(id, body) {
  return apiRequest(`/lecciones/${encodeURIComponent(id)}`, {
    auth: true,
    method: 'PUT',
    body,
  });
}

export function eliminarLeccion(id) {
  return apiRequest(`/lecciones/${encodeURIComponent(id)}`, {
    auth: true,
    method: 'DELETE',
  });
}

export function reordenarLecciones(cursoId, orden) {
  return apiRequest(`/cursos/${encodeURIComponent(cursoId)}/lecciones/orden`, {
    auth: true,
    method: 'PATCH',
    body: { orden },
  });
}
