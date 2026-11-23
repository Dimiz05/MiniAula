import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { PORTADAS_DIR, PORTADAS_URL_PREFIX } from '../config/uploads.js';

export function rutaPortadaLocal(portada, directorio = PORTADAS_DIR) {
  if (
    typeof portada !== 'string'
    || !portada.startsWith(`${PORTADAS_URL_PREFIX}/`)
  ) {
    return null;
  }

  const nombre = path.basename(portada);

  return nombre ? path.join(directorio, nombre) : null;
}

export async function borrarArchivoPortada(portada, directorio = PORTADAS_DIR) {
  const ruta = rutaPortadaLocal(portada, directorio);

  if (ruta) {
    await unlink(ruta).catch(() => {});
  }
}
