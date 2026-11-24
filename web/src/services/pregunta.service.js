import { apiRequest } from '../config/http.js';

export function crearPregunta(leccionId, body) {
  return apiRequest(`/lecciones/${encodeURIComponent(leccionId)}/preguntas`, {
    auth: true,
    method: 'POST',
    body,
  });
}

export function actualizarPregunta(id, body) {
  return apiRequest(`/preguntas/${encodeURIComponent(id)}`, {
    auth: true,
    method: 'PUT',
    body,
  });
}

export function eliminarPregunta(id) {
  return apiRequest(`/preguntas/${encodeURIComponent(id)}`, {
    auth: true,
    method: 'DELETE',
  });
}

export function actualizarCuestionario(id, body) {
  return apiRequest(`/lecciones/${encodeURIComponent(id)}/cuestionario`, {
    auth: true,
    method: 'PATCH',
    body,
  });
}
