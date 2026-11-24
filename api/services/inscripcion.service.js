import { Op, UniqueConstraintError } from 'sequelize';
import {
  Curso,
  Inscripcion,
  Leccion,
  Progreso,
  Usuario,
  sequelize,
} from '../models/index.js';
import { toPublicCurso, toTemarioItem } from './curso.service.js';
import { calcularAvanceCurso, leccionAprobada } from './progreso.service.js';
import { AppError } from '../utils/errors.js';

const ATRIBUTOS_INSTRUCTOR = ['id', 'nombre'];
const ATRIBUTOS_LECCION_AVANCE = [
  'id',
  'cursoId',
  'titulo',
  'tipo',
  'orden',
  'notaMinima',
];
const ATRIBUTOS_PROGRESO_AVANCE = [
  'inscripcionId',
  'leccionId',
  'completada',
  'mejorNota',
];

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

function agruparPor(items, obtenerClave) {
  const grupos = new Map();

  for (const item of items) {
    const clave = Number(obtenerClave(item));

    if (!grupos.has(clave)) {
      grupos.set(clave, []);
    }

    grupos.get(clave).push(item);
  }

  return grupos;
}

export function toInscripcionConAvance(inscripcion, lecciones, progresos) {
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
    ...calcularAvanceCurso(lecciones, progresos),
    curso: inscripcion.curso ? toPublicCurso(inscripcion.curso) : null,
  };
}

function progresoDeLeccion(progresosPorLeccion, leccion) {
  return progresosPorLeccion.get(Number(leccion.id)) ?? null;
}

// El estado del temario refleja exactamente la regla de desbloqueo del
// servidor: una lección se abre cuando la inmediatamente anterior está
// completada o, si es un cuestionario, aprobada con la nota mínima.
function estadoDeLeccion(leccion, indice, lecciones, progresosPorLeccion) {
  const progreso = progresoDeLeccion(progresosPorLeccion, leccion);

  if (leccionAprobada(leccion, progreso)) {
    return 'completada';
  }

  if (indice === 0) {
    return 'disponible';
  }

  const anterior = lecciones[indice - 1];
  const progresoAnterior = progresoDeLeccion(progresosPorLeccion, anterior);

  return leccionAprobada(anterior, progresoAnterior) ? 'disponible' : 'bloqueada';
}

export function construirTemarioEstudiante(lecciones, progresos) {
  const progresosPorLeccion = new Map(
    progresos.map((progreso) => [Number(progreso.leccionId), progreso]),
  );

  return lecciones.map((leccion, indice) => ({
    ...toTemarioItem(leccion),
    estado: estadoDeLeccion(leccion, indice, lecciones, progresosPorLeccion),
  }));
}

export async function obtenerTemarioEstudiante(estudianteId, cursoId) {
  const curso = await Curso.findByPk(cursoId, {
    include: [{
      model: Usuario,
      as: 'instructor',
      attributes: ATRIBUTOS_INSTRUCTOR,
    }],
  });

  if (!curso) {
    throw new AppError(404, 'CURSO_NO_ENCONTRADO', 'El curso no existe.');
  }

  const inscripcion = await Inscripcion.findOne({
    where: { estudianteId, cursoId },
  });

  if (!inscripcion) {
    throw new AppError(
      403,
      'NO_INSCRITO',
      'Debes estar inscrito en el curso para consultar su temario.',
    );
  }

  const [lecciones, progresos] = await Promise.all([
    Leccion.findAll({
      where: { cursoId },
      attributes: ATRIBUTOS_LECCION_AVANCE,
      order: [['orden', 'ASC'], ['id', 'ASC']],
    }),
    Progreso.findAll({
      where: { inscripcionId: inscripcion.id },
      attributes: ATRIBUTOS_PROGRESO_AVANCE,
    }),
  ]);

  return {
    curso: toPublicCurso(curso),
    inscripcion: toInscripcion(inscripcion),
    temario: construirTemarioEstudiante(lecciones, progresos),
    ...calcularAvanceCurso(lecciones, progresos),
  };
}

export async function listarInscripcionesEstudiante(estudianteId) {
  // RN-08: the session student is the only owner of the returned rows.
  const inscripciones = await Inscripcion.findAll({
    where: { estudianteId },
    include: [{
      model: Curso,
      as: 'curso',
      include: [{
        model: Usuario,
        as: 'instructor',
        attributes: ATRIBUTOS_INSTRUCTOR,
      }],
    }],
    order: [['fechaInscripcion', 'DESC'], ['id', 'DESC']],
  });

  if (inscripciones.length === 0) {
    return [];
  }

  const cursoIds = [
    ...new Set(inscripciones.map((inscripcion) => Number(inscripcion.cursoId))),
  ];
  const inscripcionIds = inscripciones.map(
    (inscripcion) => Number(inscripcion.id),
  );
  const [lecciones, progresos] = await Promise.all([
    Leccion.findAll({
      where: { cursoId: { [Op.in]: cursoIds } },
      attributes: ATRIBUTOS_LECCION_AVANCE,
    }),
    Progreso.findAll({
      where: { inscripcionId: { [Op.in]: inscripcionIds } },
      attributes: ATRIBUTOS_PROGRESO_AVANCE,
    }),
  ]);

  const leccionesPorCurso = agruparPor(lecciones, (leccion) => leccion.cursoId);
  const progresosPorInscripcion = agruparPor(
    progresos,
    (progreso) => progreso.inscripcionId,
  );

  return inscripciones.map((inscripcion) => toInscripcionConAvance(
    inscripcion,
    leccionesPorCurso.get(Number(inscripcion.cursoId)) ?? [],
    progresosPorInscripcion.get(Number(inscripcion.id)) ?? [],
  ));
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
