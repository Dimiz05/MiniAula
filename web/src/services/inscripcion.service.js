import { apiRequest } from '../config/http.js';

export function inscribirCurso(cursoId) {
  return apiRequest(`/cursos/${encodeURIComponent(cursoId)}/inscripcion`, {
    method: 'POST',
    auth: true,
  });
}

export function listarMisInscripciones() {
  // Endpoint documented in the course brief as GET /api/inscripciones/mias.
  return apiRequest('/inscripciones/mias', { auth: true });
}

export function esInscripcionDuplicada(error) {
  return error?.status === 409 && error?.code === 'INSCRIPCION_DUPLICADA';
}

export function normalizarInscripciones(payload) {
  const listaDeInscripciones = Array.isArray(payload?.inscripciones);
  const listaDeCursos = !listaDeInscripciones && Array.isArray(payload?.cursos);
  const lista = listaDeInscripciones
    ? payload.inscripciones
    : listaDeCursos
      ? payload.cursos
      : Array.isArray(payload)
        ? payload
        : [];

  return lista.reduce((resultado, inscripcion) => {
    if (!inscripcion || typeof inscripcion !== 'object') {
      return resultado;
    }

    if (inscripcion.cursoId !== undefined || inscripcion.curso?.id !== undefined) {
      resultado.push(inscripcion);
      return resultado;
    }

    // Some list responses may return the course as the enrollment resource.
    if (listaDeCursos && inscripcion.id !== undefined) {
      resultado.push({ cursoId: inscripcion.id, curso: inscripcion });
    }

    return resultado;
  }, []);
}

export function estaInscritoEn(inscripciones, cursoId) {
  return normalizarInscripciones({ inscripciones }).some(
    (inscripcion) => String(inscripcion.cursoId ?? inscripcion.curso?.id) === String(cursoId),
  );
}

export function porcentajeAvanceInscripcion(inscripcion) {
  const porcentaje = Number(inscripcion?.porcentajeAvance);

  if (!Number.isFinite(porcentaje)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(porcentaje)));
}
