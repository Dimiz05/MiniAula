export function formatearPorcentaje(valor) {
  return valor === null || valor === undefined ? 'Sin datos' : `${valor}%`;
}

export function formatearNota(valor) {
  return valor === null || valor === undefined ? 'Sin datos' : `${valor}/100`;
}

export function formatearEntero(valor) {
  return valor === null || valor === undefined ? 'Sin datos' : String(valor);
}

export function describirDesercion(leccion) {
  if (!leccion) {
    return 'Sin datos';
  }

  const estudiantes = Number(leccion.estudiantesDetenidos);
  const detalle = estudiantes === 1 ? '1 estudiante' : `${estudiantes} estudiantes`;

  return `Lección ${leccion.orden}: ${leccion.titulo} · ${detalle}`;
}
