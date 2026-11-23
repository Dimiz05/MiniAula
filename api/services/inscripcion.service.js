import { UniqueConstraintError } from 'sequelize';
import { Curso, Inscripcion, sequelize } from '../models/index.js';
import { AppError } from '../utils/errors.js';

export function toInscripcion(inscripcion) {
  const {
    id,
    cursoId,
    fechaInscripcion,
    completado,
  } = inscripcion.get({ plain: true });

  return {
    id,
    cursoId,
    fechaInscripcion,
    completado,
  };
}

export async function inscribirEstudiante(estudianteId, cursoId) {
  return sequelize.transaction(async (transaction) => {
    // Lock the course so archiving and enrollment cannot interleave.
    const curso = await Curso.findByPk(cursoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!curso || curso.estado !== 'publicado') {
      throw new AppError(
        404,
        'CURSO_NO_ENCONTRADO',
        'El curso no existe o no está publicado.',
      );
    }

    const inscripcionExistente = await Inscripcion.findOne({
      where: { estudianteId, cursoId },
      transaction,
    });

    if (inscripcionExistente) {
      throw new AppError(
        409,
        'INSCRIPCION_DUPLICADA',
        'Ya estás inscrito en este curso.',
      );
    }

    try {
      const inscripcion = await Inscripcion.create(
        { estudianteId, cursoId },
        { transaction },
      );

      return toInscripcion(inscripcion);
    } catch (error) {
      // The unique index is the final guard for concurrent enrollments.
      if (error instanceof UniqueConstraintError) {
        throw new AppError(
          409,
          'INSCRIPCION_DUPLICADA',
          'Ya estás inscrito en este curso.',
        );
      }

      throw error;
    }
  });
}
