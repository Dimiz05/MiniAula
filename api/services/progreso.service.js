import {
  Inscripcion,
  Leccion,
  Progreso,
  sequelize,
} from '../models/index.js';
import { AppError } from '../utils/errors.js';

export function toProgreso(progreso) {
  const {
    id,
    inscripcionId,
    leccionId,
    completada,
    intentos,
    mejorNota,
    actualizadoEn,
  } = progreso.get({ plain: true });

  return {
    id,
    inscripcionId,
    leccionId,
    completada,
    intentos,
    mejorNota,
    actualizadoEn,
  };
}

function leccionAprobada(leccion, progreso) {
  if (!progreso) {
    return false;
  }

  if (leccion.tipo === 'cuestionario') {
    return progreso.mejorNota !== null
      && progreso.mejorNota !== undefined
      && Number(progreso.mejorNota) >= Number(leccion.notaMinima);
  }

  return progreso.completada === true;
}

async function asegurarLeccionDesbloqueada(leccion, inscripcionId, transaction) {
  const lecciones = await Leccion.findAll({
    where: { cursoId: leccion.cursoId },
    attributes: ['id', 'tipo', 'orden', 'notaMinima'],
    order: [['orden', 'ASC'], ['id', 'ASC']],
    transaction,
  });

  const indice = lecciones.findIndex(
    (item) => Number(item.id) === Number(leccion.id),
  );

  // The first lesson of the course has no previous requirement.
  if (indice <= 0) {
    return;
  }

  const anterior = lecciones[indice - 1];
  const progresoAnterior = await Progreso.findOne({
    where: {
      inscripcionId,
      leccionId: anterior.id,
    },
    transaction,
  });

  if (!leccionAprobada(anterior, progresoAnterior)) {
    throw new AppError(
      403,
      'LECCION_BLOQUEADA',
      'Completa la lección anterior para desbloquear esta lección.',
    );
  }
}

export async function marcarLeccionContenidoCompletada(estudianteId, leccionId) {
  return sequelize.transaction(async (transaction) => {
    const leccion = await Leccion.findByPk(leccionId, { transaction });

    if (!leccion) {
      throw new AppError(
        404,
        'LECCION_NO_ENCONTRADA',
        'La lección no existe.',
      );
    }

    const inscripcion = await Inscripcion.findOne({
      where: {
        estudianteId,
        cursoId: leccion.cursoId,
      },
      transaction,
    });

    if (!inscripcion) {
      throw new AppError(
        403,
        'NO_INSCRITO',
        'Debes estar inscrito en el curso para registrar tu progreso.',
      );
    }

    if (leccion.tipo !== 'contenido') {
      throw new AppError(
        409,
        'LECCION_NO_ES_CONTENIDO',
        'Solo puedes marcar lecciones de contenido como completadas.',
      );
    }

    await asegurarLeccionDesbloqueada(leccion, inscripcion.id, transaction);

    const [progreso, creado] = await Progreso.findOrCreate({
      where: {
        inscripcionId: inscripcion.id,
        leccionId: leccion.id,
      },
      defaults: {
        completada: true,
      },
      transaction,
    });

    if (!creado && !progreso.completada) {
      progreso.completada = true;
      await progreso.save({ transaction });
    }

    return toProgreso(progreso);
  });
}
