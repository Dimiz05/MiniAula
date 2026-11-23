import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  PORTADAS_DIR,
  PORTADAS_URL_PREFIX,
} from '../config/uploads.js';
import { Curso } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import {
  borrarArchivoPortada,
  rutaPortadaLocal,
} from '../utils/portadaFiles.js';
import {
  asegurarPropiedadCurso,
  contarRelacionadosCurso,
  toInstructorCurso,
} from './curso.service.js';

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const FIRMA_JPEG = Buffer.from([0xff, 0xd8, 0xff]);

const FORMATOS = {
  png: { extension: 'png' },
  jpg: { extension: 'jpg' },
  webp: { extension: 'webp' },
};

export function detectarFormatoImagen(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  if (buffer.subarray(0, FIRMA_PNG.length).equals(FIRMA_PNG)) {
    return 'png';
  }

  if (buffer.subarray(0, FIRMA_JPEG.length).equals(FIRMA_JPEG)) {
    return 'jpg';
  }

  const esWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  return esWebp ? 'webp' : null;
}

export async function guardarPortadaPropia(
  instructorId,
  cursoId,
  buffer,
  { directorio = PORTADAS_DIR } = {},
) {
  const formato = detectarFormatoImagen(buffer);

  if (!formato) {
    throw new AppError(
      422,
      'PORTADA_INVALIDA',
      'La portada debe ser una imagen PNG, JPG o WebP válida.',
    );
  }

  const curso = await Curso.findByPk(cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  await mkdir(directorio, { recursive: true });

  const nombre = `${randomUUID()}.${FORMATOS[formato].extension}`;
  const rutaNueva = path.join(directorio, nombre);
  const portadaAnterior = curso.portada;
  const rutaAnterior = rutaPortadaLocal(portadaAnterior, directorio);

  await writeFile(rutaNueva, buffer, { flag: 'wx' });

  try {
    curso.portada = `${PORTADAS_URL_PREFIX}/${nombre}`;
    await curso.save();
  } catch (error) {
    await borrarArchivoPortada(curso.portada, directorio);
    throw error;
  }

  if (rutaAnterior && rutaAnterior !== rutaNueva) {
    await borrarArchivoPortada(portadaAnterior, directorio);
  }

  return toInstructorCurso(
    curso,
    await contarRelacionadosCurso(curso.id),
  );
}

export async function eliminarPortadaPropia(
  instructorId,
  cursoId,
  { directorio = PORTADAS_DIR } = {},
) {
  const curso = await Curso.findByPk(cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  const portadaAnterior = curso.portada;

  if (curso.portada !== null && curso.portada !== undefined) {
    curso.portada = null;
    await curso.save();
  }

  await borrarArchivoPortada(portadaAnterior, directorio);

  return toInstructorCurso(
    curso,
    await contarRelacionadosCurso(curso.id),
  );
}
