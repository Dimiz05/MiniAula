export const MENSAJE_CURSO_NO_DISPONIBLE = 'El instructor eliminó el curso.';

export function mensajeErrorCurso(error) {
  if (error?.code === 'CURSO_NO_ENCONTRADO') {
    return MENSAJE_CURSO_NO_DISPONIBLE;
  }

  return error?.message ?? 'No pudimos cargar el curso.';
}
