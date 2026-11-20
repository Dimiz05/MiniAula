export const niveles = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
export const estados = { borrador: 'Borrador', publicado: 'Publicado', archivado: 'Archivado' };

export function accionesCurso({ estado, totalLecciones, totalInscritos }) {
  return {
    publicar: estado === 'borrador' && totalLecciones > 0,
    archivar: estado === 'borrador' || estado === 'publicado',
    eliminar: totalInscritos === 0,
  };
}

export function validarCurso({ titulo, descripcion, categoria, nivel }) {
  const datos = { titulo: titulo.trim(), descripcion: descripcion.trim(), categoria: categoria.trim(), nivel };
  const errores = {};

  if (datos.titulo.length < 3 || datos.titulo.length > 150) {
    errores.titulo = 'El título debe tener entre 3 y 150 caracteres.';
  }
  if (!datos.descripcion) errores.descripcion = 'La descripción es obligatoria.';
  if (datos.categoria.length < 2 || datos.categoria.length > 60) {
    errores.categoria = 'La categoría debe tener entre 2 y 60 caracteres.';
  }
  if (!Object.hasOwn(niveles, nivel)) errores.nivel = 'Selecciona un nivel válido.';

  return { datos, errores };
}
