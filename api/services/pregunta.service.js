import { Curso, Leccion, Pregunta } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import { asegurarPropiedadCurso } from './curso.service.js';

export function toPreguntaDetalle(pregunta) {
  const datos = typeof pregunta.get === 'function'
    ? pregunta.get({ plain: true })
    : pregunta;

  const {
    id,
    enunciado,
    opciones,
    indiceCorrecto,
    leccionId,
  } = datos;

  return {
    id,
    enunciado,
    opciones,
    indiceCorrecto,
    leccionId,
  };
}

async function obtenerLeccionPropia(instructorId, leccionId) {
  const leccion = await Leccion.findByPk(leccionId);

  if (!leccion) {
    throw new AppError(404, 'LECCION_NO_ENCONTRADA', 'La lección no existe.');
  }

  const curso = await Curso.findByPk(leccion.cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  return leccion;
}

async function obtenerPreguntaPropia(instructorId, preguntaId) {
  const pregunta = await Pregunta.findByPk(preguntaId);

  if (!pregunta) {
    throw new AppError(404, 'PREGUNTA_NO_ENCONTRADA', 'La pregunta no existe.');
  }

  const leccion = await Leccion.findByPk(pregunta.leccionId);

  if (!leccion) {
    throw new AppError(404, 'LECCION_NO_ENCONTRADA', 'La lección no existe.');
  }

  const curso = await Curso.findByPk(leccion.cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  return pregunta;
}

function asegurarCuestionario(leccion) {
  if (leccion.tipo !== 'cuestionario') {
    throw new AppError(
      409,
      'LECCION_NO_ES_CUESTIONARIO',
      'Solo puedes gestionar preguntas de un cuestionario.',
    );
  }
}

export async function crearPreguntaPropia(instructorId, leccionId, datos) {
  const leccion = await obtenerLeccionPropia(instructorId, leccionId);
  asegurarCuestionario(leccion);

  const pregunta = await Pregunta.create({
    enunciado: datos.enunciado,
    opciones: datos.opciones,
    indiceCorrecto: datos.indiceCorrecto,
    leccionId: leccion.id,
  });

  return toPreguntaDetalle(pregunta);
}

export async function actualizarPreguntaPropia(instructorId, preguntaId, datos) {
  const pregunta = await obtenerPreguntaPropia(instructorId, preguntaId);

  pregunta.enunciado = datos.enunciado;
  pregunta.opciones = datos.opciones;
  pregunta.indiceCorrecto = datos.indiceCorrecto;

  await pregunta.save();

  return toPreguntaDetalle(pregunta);
}

export async function eliminarPreguntaPropia(instructorId, preguntaId) {
  const pregunta = await obtenerPreguntaPropia(instructorId, preguntaId);

  await pregunta.destroy();
}
