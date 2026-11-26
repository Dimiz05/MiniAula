import { API_URL } from '../config/http.js';

function origenApi() {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
}

// Resuelve rutas relativas de la API (por ejemplo /uploads/...) y deja intactas
// las URL absolutas, los data: y los blob:.
export function resolverRecurso(recurso) {
  if (!recurso) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(recurso)) {
    return recurso;
  }

  return `${origenApi()}${recurso.startsWith('/') ? '' : '/'}${recurso}`;
}

const YOUTUBE = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;

// Devuelve cómo se debe reproducir el video dentro de la página.
export function obtenerFuenteVideo(videoUrl) {
  if (!videoUrl) {
    return null;
  }

  const youtube = videoUrl.match(YOUTUBE);
  if (youtube) {
    return {
      tipo: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${youtube[1]}`,
    };
  }

  const vimeo = videoUrl.match(VIMEO);
  if (vimeo) {
    return {
      tipo: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
    };
  }

  return {
    tipo: 'archivo',
    src: resolverRecurso(videoUrl),
  };
}
