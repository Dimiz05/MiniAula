import {
  formatearEntero,
  formatearNota,
  formatearPorcentaje,
} from './panelMetrics.js';

export const etiquetasIntento = {
  1: 'Aprobaron en 1er intento',
  2: 'Aprobaron en 2do intento',
  3: 'Aprobaron en 3er intento',
};

export function anchoBarra(porcentaje) {
  if (porcentaje === null || porcentaje === undefined) {
    return '0%';
  }

  const valor = Number(porcentaje);

  if (Number.isNaN(valor)) {
    return '0%';
  }

  return `${Math.min(Math.max(valor, 0), 100)}%`;
}

export function describirMayorDesercion(leccion) {
  if (!leccion) {
    return null;
  }

  const estudiantes = Number(leccion.estudiantesDetenidos);
  const detalle = estudiantes === 1
    ? '1 estudiante se detuvo'
    : `${estudiantes} estudiantes se detuvieron`;

  return `Lección ${leccion.orden}: ${leccion.titulo} · ${detalle}`;
}

export function tarjetasAnaliticas(curso) {
  return [
    {
      label: 'Estudiantes inscritos',
      icon: 'group',
      tone: 'text-primary',
      value: formatearEntero(curso.totalInscritos),
      hint: 'Inscripciones al curso',
    },
    {
      label: 'Progreso promedio',
      icon: 'trending_up',
      tone: 'text-warning',
      value: formatearPorcentaje(curso.progresoPromedio),
      hint: 'Avance de tus estudiantes',
    },
    {
      label: 'Nota promedio',
      icon: 'grade',
      tone: 'text-success',
      value: formatearNota(curso.notaPromedio),
      hint: 'Notas de cuestionarios',
    },
    {
      label: 'Estudiantes completados',
      icon: 'verified',
      tone: 'text-secondary',
      value: formatearEntero(curso.estudiantesCompletados),
      hint: curso.tasaCompletado === null || curso.tasaCompletado === undefined
        ? 'Sin datos'
        : `${curso.tasaCompletado}% tasa de finalización`,
    },
  ];
}
