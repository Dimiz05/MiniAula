import { Curso, Leccion, Pregunta, sequelize } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import {
  asegurarPropiedadCurso,
  obtenerCursoBloqueado,
} from './curso.service.js';
import { toPreguntaDetalle } from './pregunta.service.js';

export function toLeccionDetalle(leccion) {
  const {
    id,
    titulo,
    tipo,
    contenido,
    videoUrl,
    orden,
    notaMinima,
    cursoId,
    preguntas,
  } = leccion.get({ plain: true });

  return {
    id,
    titulo,
    tipo,
    contenido,
    videoUrl,
    orden,
    notaMinima,
    cursoId,
    ...(tipo === 'cuestionario' && Array.isArray(preguntas)
      ? {
        preguntas: [...preguntas]
          .sort((a, b) => Number(a.id) - Number(b.id))
          .map(toPreguntaDetalle),
      }
      : {}),
  };
}

async function listarLeccionesDeCurso(cursoId, transaction) {
  const lecciones = await Leccion.findAll({
    where: { cursoId },
    order: [['orden', 'ASC'], ['id', 'ASC']],
    include: [{ model: Pregunta, as: 'preguntas' }],
    transaction,
  });

  return lecciones.map(toLeccionDetalle);
}

export async function listarLeccionesPropias(instructorId, cursoId) {
  const curso = await Curso.findByPk(cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  return listarLeccionesDeCurso(curso.id);
}

export async function crearLeccionPropia(instructorId, cursoId, datos) {
  return sequelize.transaction(async (transaction) => {
    const curso = await obtenerCursoBloqueado(cursoId, transaction);
    asegurarPropiedadCurso(curso, instructorId);

    const maximo = await Leccion.max('orden', {
      where: { cursoId },
      transaction,
    });

    const leccion = await Leccion.create(
      {
        titulo: datos.titulo,
        tipo: 'contenido',
        contenido: datos.contenido,
        videoUrl: datos.videoUrl || null,
        orden: Number(maximo ?? 0) + 1,
        cursoId,
      },
      { transaction },
    );

    return toLeccionDetalle(leccion);
  });
}

export async function actualizarLeccionPropia(instructorId, leccionId, cambios) {
  const leccion = await Leccion.findByPk(leccionId);

  if (!leccion) {
    throw new AppError(404, 'LECCION_NO_ENCONTRADA', 'La lección no existe.');
  }

  const curso = await Curso.findByPk(leccion.cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  // Los cuestionarios se configuran por PATCH /lecciones/:id/cuestionario y sus
  // preguntas por las rutas de /preguntas; esta ruta solo edita contenido.
  if (leccion.tipo !== 'contenido') {
    throw new AppError(
      409,
      'LECCION_NO_ES_CONTENIDO',
      'Solo puedes editar lecciones de contenido en esta versión.',
    );
  }

  if (cambios.titulo !== undefined) {
    leccion.titulo = cambios.titulo;
  }

  if (cambios.contenido !== undefined) {
    leccion.contenido = cambios.contenido;
  }

  if (cambios.videoUrl !== undefined) {
    leccion.videoUrl = cambios.videoUrl || null;
  }

  await leccion.save();

  return toLeccionDetalle(leccion);
}

export async function actualizarCuestionarioPropia(instructorId, leccionId, { notaMinima }) {
  const leccion = await Leccion.findByPk(leccionId);

  if (!leccion) {
    throw new AppError(404, 'LECCION_NO_ENCONTRADA', 'La lección no existe.');
  }

  const curso = await Curso.findByPk(leccion.cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  if (leccion.tipo !== 'cuestionario') {
    throw new AppError(
      409,
      'LECCION_NO_ES_CUESTIONARIO',
      'Solo puedes configurar la nota mínima de un cuestionario.',
    );
  }

  leccion.notaMinima = notaMinima;
  await leccion.save();

  return toLeccionDetalle(leccion);
}

export async function eliminarLeccionPropia(instructorId, leccionId) {
  const referencia = await Leccion.findByPk(leccionId, {
    attributes: ['id', 'cursoId'],
  });

  if (!referencia) {
    throw new AppError(404, 'LECCION_NO_ENCONTRADA', 'La lección no existe.');
  }

  await sequelize.transaction(async (transaction) => {
    // Lock the course first, in the same order as create and reorder, so
    // deleting a lesson cannot interleave with a course-wide reorder.
    const curso = await obtenerCursoBloqueado(referencia.cursoId, transaction);
    asegurarPropiedadCurso(curso, instructorId);

    const leccion = await Leccion.findByPk(leccionId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!leccion) {
      throw new AppError(404, 'LECCION_NO_ENCONTRADA', 'La lección no existe.');
    }

    await leccion.destroy({ transaction });
  });
}

export async function reordenarLeccionesPropias(instructorId, cursoId, ordenIds) {
  return sequelize.transaction(async (transaction) => {
    const curso = await obtenerCursoBloqueado(cursoId, transaction);
    asegurarPropiedadCurso(curso, instructorId);

    const actuales = await Leccion.findAll({
      where: { cursoId },
      attributes: ['id'],
      transaction,
    });

    const idsActuales = new Set(actuales.map((leccion) => Number(leccion.id)));
    const idsRecibidos = ordenIds.map(Number);
    const idsUnicos = new Set(idsRecibidos);

    const conjuntoInvalido = idsUnicos.size !== idsRecibidos.length
      || idsRecibidos.length !== idsActuales.size
      || idsRecibidos.some((id) => !idsActuales.has(id));

    if (conjuntoInvalido) {
      throw new AppError(
        409,
        'ORDEN_LECCIONES_INVALIDO',
        'El orden debe incluir todas las lecciones del curso sin repetir.',
      );
    }

    for (const [indice, id] of idsRecibidos.entries()) {
      await Leccion.update(
        { orden: indice + 1 },
        { where: { id, cursoId }, transaction },
      );
    }

    return listarLeccionesDeCurso(cursoId, transaction);
  });
}
