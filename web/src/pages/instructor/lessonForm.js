export function esUrlValida(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validarLeccion({ titulo = '', contenido = '', videoUrl = '' }) {
  const datos = {
    titulo: titulo.trim(),
    contenido: contenido.trim(),
    videoUrl: videoUrl.trim(),
  };
  const errores = {};

  if (datos.titulo.length < 3 || datos.titulo.length > 150) {
    errores.titulo = 'El título debe tener entre 3 y 150 caracteres.';
  }

  if (!datos.contenido) {
    errores.contenido = 'El contenido es obligatorio.';
  }

  if (datos.videoUrl.length > 500) {
    errores.videoUrl = 'El enlace de video no puede superar los 500 caracteres.';
  } else if (datos.videoUrl && !esUrlValida(datos.videoUrl)) {
    errores.videoUrl = 'El enlace de video debe ser una URL válida.';
  }

  return { datos, errores };
}

export function reordenarLista(items, desde, hasta) {
  if (
    desde === hasta
    || desde < 0
    || hasta < 0
    || desde >= items.length
    || hasta >= items.length
  ) {
    return items;
  }

  const copia = [...items];
  const [movido] = copia.splice(desde, 1);
  copia.splice(hasta, 0, movido);

  return copia;
}

export function moverLeccion(items, index, delta) {
  const destino = index + delta;

  if (destino < 0 || destino >= items.length) {
    return items;
  }

  return reordenarLista(items, index, destino);
}
