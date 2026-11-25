import {
  Inscripcion,
  Leccion,
  Pregunta,
  Progreso,
  sequelize,
} from '../models/index.js';
import { AppError } from '../utils/errors.js';
import {
  asegurarLeccionDesbloqueada,
  leccionAprobada,
} from './progreso.service.js';

export const INTENTOS_MAXIMOS = 3;

function validarRespuestas(preguntas, respuestas) {
  const preguntasPorId = new Map(
    preguntas.map((pregunta) => [Number(pregunta.id), pregunta]),
  );
  const respondidas = new Set();
  const detalles = [];

  respuestas.forEach((respuesta, indice) => {
    const preguntaId = Number(respuesta.preguntaId);
    const pregunta = preguntasPorId.get(preguntaId);

    if (!pregunta) {
      detalles.push({
        campo: `respuestas.${indice}.preguntaId`,
        mensaje: 'La pregunta no pertenece a este cuestionario.',
      });
      return;
    }

    if (respondidas.has(preguntaId)) {
      detalles.push({
        campo: `respuestas.${indice}.preguntaId`,
        mensaje: 'La pregunta está repetida.',
      });
      return;
    }

    respondidas.add(preguntaId);

    const opcion = Number(respuesta.opcion);
    const opciones = Array.isArray(pregunta.opciones) ? pregunta.opciones : [];

    if (!Number.isInteger(opcion) || opcion < 0 || opcion >= opciones.length) {
      detalles.push({
        campo: `respuestas.${indice}.opcion`,
        mensaje: 'La opción seleccionada no existe en la pregunta.',
      });
    }
  });

  const faltantes = preguntas.filter(
    (pregunta) => !respondidas.has(Number(pregunta.id)),
  );

  if (faltantes.length > 0) {
    detalles.push({
      campo: 'respuestas',
      mensaje: 'Debes responder todas las preguntas del cuestionario.',
    });
  }

  if (detalles.length > 0) {
    throw new AppError(
      422,
      'VALIDACION',
      'Las respuestas enviadas no son válidas.',
      detalles,
    );
  }
}

export function calificarRespuestas(preguntas, respuestas) {
  const respuestasPorPregunta = new Map(
    respuestas.map((respuesta) => [
      Number(respuesta.preguntaId),
      Number(respuesta.opcion),
    ]),
  );
  const total = preguntas.length;

  if (total === 0) {
    return { correctas: 0, total: 0, nota: 0 };
  }

  const correctas = preguntas.reduce((acumulado, pregunta) => (
    respuestasPorPregunta.get(Number(pregunta.id))
      === Number(pregunta.indiceCorrecto)
      ? acumulado + 1
      : acumulado
  ), 0);

  return {
    correctas,
    total,
    // La nota se redondea para que el resultado coincida con la escala entera
    // de 0 a 100 usada por notaMinima.
    nota: Math.round((correctas * 100) / total),
  };
}

export function toIntentoEstado(progreso, leccion) {
  const intentos = Number(progreso?.intentos ?? 0);
  const mejorNota = progreso?.mejorNota === null
    || progreso?.mejorNota === undefined
    ? null
    : Number(progreso.mejorNota);
  const notaMinima = Number(leccion.notaMinima);

  return {
    // La aprobación usa la misma regla que el desbloqueo secuencial para que
    // ambos cálculos no puedan divergir.
    aprobada: leccionAprobada(leccion, progreso),
    mejorNota,
    notaMinima,
    intentos,
    intentosDisponibles: Math.max(INTENTOS_MAXIMOS - intentos, 0),
  };
}

export function toIntentoResultado(progreso, leccion, nota) {
  return {
    nota,
    ...toIntentoEstado(progreso, leccion),
  };
}

export async function registrarIntento(estudianteId, leccionId, respuestas) {
  const leccion = await Leccion.findByPk(leccionId);

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
  });

  if (!inscripcion) {
    throw new AppError(
      403,
      'NO_INSCRITO',
      'Debes estar inscrito en el curso para rendir este cuestionario.',
    );
  }

  if (leccion.tipo !== 'cuestionario') {
    throw new AppError(
      409,
      'LECCION_NO_ES_CUESTIONARIO',
      'Solo puedes rendir lecciones de tipo cuestionario.',
    );
  }

  // RN-01: el cuestionario solo se rinde si la lección anterior está completa
  // o, si era otro cuestionario, aprobada.
  await asegurarLeccionDesbloqueada(leccion, inscripcion.id);

  const preguntas = await Pregunta.findAll({
    where: { leccionId: leccion.id },
    order: [['id', 'ASC']],
  });

  if (preguntas.length === 0) {
    throw new AppError(
      409,
      'CUESTIONARIO_SIN_PREGUNTAS',
      'El cuestionario no tiene preguntas para calificar.',
    );
  }

  validarRespuestas(preguntas, respuestas);
  const { nota } = calificarRespuestas(preguntas, respuestas);

  return sequelize.transaction(async (transaction) => {
    await Progreso.findOrCreate({
      where: {
        inscripcionId: inscripcion.id,
        leccionId: leccion.id,
      },
      defaults: {
        intentos: 0,
        mejorNota: null,
      },
      transaction,
    });

    // Bloquea la fila para que dos envíos simultáneos no superen el límite.
    const progreso = await Progreso.findOne({
      where: {
        inscripcionId: inscripcion.id,
        leccionId: leccion.id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const intentosActuales = Number(progreso.intentos);

    if (intentosActuales >= INTENTOS_MAXIMOS) {
      throw new AppError(
        409,
        'INTENTOS_AGOTADOS',
        `Has agotado los ${INTENTOS_MAXIMOS} intentos disponibles para este cuestionario.`,
      );
    }

    const mejorAnterior = progreso.mejorNota === null
      || progreso.mejorNota === undefined
      ? null
      : Number(progreso.mejorNota);
    const mejorNota = mejorAnterior === null
      ? nota
      : Math.max(mejorAnterior, nota);

    progreso.intentos = intentosActuales + 1;
    progreso.mejorNota = mejorNota;
    await progreso.save({ transaction });

    return toIntentoResultado(progreso, leccion, nota);
  });
}
