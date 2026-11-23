export const niveles = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
export const estados = { borrador: 'Borrador', publicado: 'Publicado', archivado: 'Archivado' };

export function accionesCurso({ estado, totalLecciones, totalInscritos }) {
  return {
    publicar: estado === 'borrador' && totalLecciones > 0,
    archivar: estado === 'borrador' || estado === 'publicado',
    eliminar: totalInscritos === 0,
  };
}

export const PORTADA_TIPOS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const PORTADA_MAX_BYTES = 5 * 1024 * 1024;

export function validarArchivoPortada(archivo) {
  if (!archivo) {
    return 'Selecciona una imagen para la portada.';
  }

  const extension = archivo.name?.split('.').pop()?.toLowerCase();
  const extensionValida = ['png', 'jpg', 'jpeg', 'webp'].includes(extension);

  if (!PORTADA_TIPOS.includes(archivo.type) && !extensionValida) {
    return 'La portada debe ser una imagen PNG, JPG o WebP.';
  }

  if (archivo.size > PORTADA_MAX_BYTES) {
    return 'La imagen de portada no puede superar los 5 MB.';
  }

  return null;
}

export function validarCurso({ titulo, descripcion, categoria, nivel }) {
  const datos = {
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    categoria: categoria.trim(),
    nivel,
  };
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
