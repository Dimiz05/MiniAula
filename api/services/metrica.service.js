import { Op } from 'sequelize';
import {
  Curso,
  Inscripcion,
  Leccion,
  Progreso,
} from '../models/index.js';
import { leccionAprobada } from './progreso.service.js';

const ATRIBUTOS_CURSO = ['id', 'titulo', 'estado'];
const ATRIBUTOS_LECCION = [
  'id',
  'cursoId',
  'titulo',
  'tipo',
  'orden',
  'notaMinima',
];
const ATRIBUTOS_INSCRIPCION = ['id', 'cursoId'];
const ATRIBUTOS_PROGRESO = [
  'inscripcionId',
  'leccionId',
  'completada',
  'mejorNota',
];

function redondear(valor) {
  return Math.round(valor * 10) / 10;
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

function ordenarLecciones(lecciones) {
  return [...lecciones].sort((a, b) => (
    Number(a.orden) - Number(b.orden) || Number(a.id) - Number(b.id)
  ));
}

function progresosDeInscripcion(progresos) {
  return new Map(
    progresos.map((progreso) => [Number(progreso.leccionId), progreso]),
  );
}

function calcularLeccionMayorDesercion(lecciones, detenidosPorLeccion, algunInicio) {
  // Without any recorded activity there is no evidence of where students stopped.
  if (lecciones.length === 0 || !algunInicio) {
    return null;
  }

  let mayor = null;

  for (const leccion of lecciones) {
    const estudiantesDetenidos = detenidosPorLeccion.get(Number(leccion.id)) ?? 0;

    // A strict comparison keeps the earliest lesson when counts tie.
    if (estudiantesDetenidos > 0
      && (!mayor || estudiantesDetenidos > mayor.estudiantesDetenidos)) {
      mayor = {
        leccionId: Number(leccion.id),
        titulo: leccion.titulo,
        orden: Number(leccion.orden),
        estudiantesDetenidos,
      };
    }
  }

  return mayor;
}

function calcularMetricaCurso(curso, lecciones, inscripciones, progresosPorInscripcion) {
  const leccionesOrdenadas = ordenarLecciones(lecciones);
  const totalLecciones = leccionesOrdenadas.length;
  const totalInscritos = inscripciones.length;
  const leccionIds = new Set(leccionesOrdenadas.map((leccion) => Number(leccion.id)));
  const detenidosPorLeccion = new Map(
    leccionesOrdenadas.map((leccion) => [Number(leccion.id), 0]),
  );
  const notas = [];
  let sumaAvance = 0;
  let inscripcionesConLecciones = 0;
  let algunInicio = false;

  for (const inscripcion of inscripciones) {
    const progresos = progresosPorInscripcion.get(Number(inscripcion.id)) ?? [];
    const progresosPorLeccion = progresosDeInscripcion(progresos);
    const tieneActividad = progresos.some(
      (progreso) => leccionIds.has(Number(progreso.leccionId)),
    );

    for (const progreso of progresos) {
      if (leccionIds.has(Number(progreso.leccionId))
        && progreso.mejorNota !== null
        && progreso.mejorNota !== undefined) {
        notas.push(Number(progreso.mejorNota));
      }
    }

    if (totalLecciones === 0) {
      continue;
    }

    if (tieneActividad) {
      algunInicio = true;
    }

    let leccionesAprobadas = 0;
    let leccionDetencionRegistrada = false;

    for (const leccion of leccionesOrdenadas) {
      const aprobada = leccionAprobada(
        leccion,
        progresosPorLeccion.get(Number(leccion.id)),
      );

      if (aprobada) {
        leccionesAprobadas += 1;
      } else if (tieneActividad && !leccionDetencionRegistrada) {
        // The first unapproved lesson is where this active student stopped.
        const leccionId = Number(leccion.id);
        detenidosPorLeccion.set(
          leccionId,
          detenidosPorLeccion.get(leccionId) + 1,
        );
        leccionDetencionRegistrada = true;
      }
    }

    sumaAvance += (leccionesAprobadas * 100) / totalLecciones;
    inscripcionesConLecciones += 1;
  }

  return {
    id: Number(curso.id),
    titulo: curso.titulo,
    estado: curso.estado,
    totalLecciones,
    totalInscritos,
    progresoPromedio: inscripcionesConLecciones > 0
      ? redondear(sumaAvance / inscripcionesConLecciones)
      : null,
    notaPromedio: notas.length > 0
      ? redondear(notas.reduce((total, nota) => total + nota, 0) / notas.length)
      : null,
    leccionMayorDesercion: calcularLeccionMayorDesercion(
      leccionesOrdenadas,
      detenidosPorLeccion,
      algunInicio,
    ),
    // Internal values feed the panel summary without a second aggregation.
    _sumaAvance: sumaAvance,
    _inscripcionesConLecciones: inscripcionesConLecciones,
    _notas: notas,
  };
}

function construirResumen(metricas) {
  let totalInscritos = 0;
  let sumaAvance = 0;
  let inscripcionesConLecciones = 0;
  let sumaNotas = 0;
  let totalNotas = 0;

  for (const metrica of metricas) {
    totalInscritos += metrica.totalInscritos;
    sumaAvance += metrica._sumaAvance;
    inscripcionesConLecciones += metrica._inscripcionesConLecciones;
    sumaNotas += metrica._notas.reduce((total, nota) => total + nota, 0);
    totalNotas += metrica._notas.length;
  }

  return {
    totalCursos: metricas.length,
    totalInscritos,
    progresoPromedio: inscripcionesConLecciones > 0
      ? redondear(sumaAvance / inscripcionesConLecciones)
      : null,
    notaPromedio: totalNotas > 0
      ? redondear(sumaNotas / totalNotas)
      : null,
  };
}

function toMetricaPublica(metrica) {
  const {
    _sumaAvance,
    _inscripcionesConLecciones,
    _notas,
    ...publica
  } = metrica;

  return publica;
}

export async function obtenerMetricasCursos(instructorId) {
  // The instructor id always comes from the session; no course id is trusted.
  const cursos = await Curso.findAll({
    where: { instructorId },
    attributes: ATRIBUTOS_CURSO,
    order: [['creadoEn', 'DESC'], ['id', 'DESC']],
    raw: true,
  });

  if (cursos.length === 0) {
    return {
      resumen: {
        totalCursos: 0,
        totalInscritos: 0,
        progresoPromedio: null,
        notaPromedio: null,
      },
      cursos: [],
    };
  }

  const cursoIds = cursos.map((curso) => Number(curso.id));
  const [lecciones, inscripciones] = await Promise.all([
    Leccion.findAll({
      where: { cursoId: { [Op.in]: cursoIds } },
      attributes: ATRIBUTOS_LECCION,
      order: [['orden', 'ASC'], ['id', 'ASC']],
      raw: true,
    }),
    Inscripcion.findAll({
      where: { cursoId: { [Op.in]: cursoIds } },
      attributes: ATRIBUTOS_INSCRIPCION,
      raw: true,
    }),
  ]);

  const inscripcionIds = inscripciones.map(
    (inscripcion) => Number(inscripcion.id),
  );
  const progresos = inscripcionIds.length === 0
    ? []
    : await Progreso.findAll({
      where: { inscripcionId: { [Op.in]: inscripcionIds } },
      attributes: ATRIBUTOS_PROGRESO,
      raw: true,
    });

  const leccionesPorCurso = agruparPor(lecciones, (leccion) => leccion.cursoId);
  const inscripcionesPorCurso = agruparPor(
    inscripciones,
    (inscripcion) => inscripcion.cursoId,
  );
  const progresosPorInscripcion = agruparPor(
    progresos,
    (progreso) => progreso.inscripcionId,
  );

  const metricas = cursos.map((curso) => calcularMetricaCurso(
    curso,
    leccionesPorCurso.get(Number(curso.id)) ?? [],
    inscripcionesPorCurso.get(Number(curso.id)) ?? [],
    progresosPorInscripcion,
  ));

  return {
    resumen: construirResumen(metricas),
    cursos: metricas.map(toMetricaPublica),
  };
}
