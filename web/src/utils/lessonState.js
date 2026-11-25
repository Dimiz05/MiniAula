export const ESTADOS_LECCION = {
  BLOQUEADA: 'bloqueada',
  DISPONIBLE: 'disponible',
  COMPLETADA: 'completada',
};

const estadosValidos = new Set(Object.values(ESTADOS_LECCION));

// The API is the source of truth. An unknown or missing state is treated as
// locked so a partial response can never open a lesson by accident.
export function normalizarEstadoLeccion(estado) {
  return estadosValidos.has(estado) ? estado : ESTADOS_LECCION.BLOQUEADA;
}

export function puedeAbrirLeccion(leccion) {
  const estado = normalizarEstadoLeccion(leccion?.estado);
  return estado === ESTADOS_LECCION.DISPONIBLE
    || estado === ESTADOS_LECCION.COMPLETADA;
}

export function esLeccionBloqueada(error) {
  return error?.status === 403 && error?.code === 'LECCION_BLOQUEADA';
}

export function esNoInscrito(error) {
  return error?.status === 403 && error?.code === 'NO_INSCRITO';
}

export function clasificarErrorLeccion(error) {
  if (esLeccionBloqueada(error)) {
    return {
      tipo: 'bloqueada',
      titulo: 'Lección bloqueada',
      mensaje: error.message,
    };
  }

  if (esNoInscrito(error)) {
    return {
      tipo: 'no-inscrito',
      titulo: 'No estás inscrito en este curso',
      mensaje: error.message,
    };
  }

  if (error?.status === 404) {
    return {
      tipo: 'no-encontrada',
      titulo: 'Lección no encontrada',
      mensaje: error.message ?? 'La lección no existe.',
    };
  }

  return {
    tipo: 'error',
    titulo: 'No pudimos cargar la lección',
    mensaje: error?.message ?? 'Inténtalo de nuevo en unos momentos.',
  };
}

export function rutaLeccion(cursoId, leccionId) {
  return `/cursos/${encodeURIComponent(cursoId)}/lecciones/${encodeURIComponent(leccionId)}`;
}

export function siguienteLeccion(temario) {
  const lecciones = Array.isArray(temario) ? temario : [];

  return lecciones.find(
    (leccion) => normalizarEstadoLeccion(leccion.estado) === ESTADOS_LECCION.DISPONIBLE,
  ) ?? [...lecciones].reverse().find(
    (leccion) => normalizarEstadoLeccion(leccion.estado) === ESTADOS_LECCION.COMPLETADA,
  ) ?? null;
}

// Devuelve la primera lección disponible después de la indicada. La usa el
// resultado del cuestionario para ofrecer el avance recién desbloqueado sin
// enlazar de vuelta a la lección actual.
export function siguienteLeccionDespuesDe(temario, leccionId) {
  const lecciones = Array.isArray(temario) ? temario : [];
  const indice = lecciones.findIndex(
    (leccion) => String(leccion.id) === String(leccionId),
  );
  const posteriores = indice >= 0 ? lecciones.slice(indice + 1) : lecciones;

  return posteriores.find(
    (leccion) => normalizarEstadoLeccion(leccion.estado) === ESTADOS_LECCION.DISPONIBLE,
  ) ?? null;
}
