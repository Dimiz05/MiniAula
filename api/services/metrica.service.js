import { Op } from 'sequelize';
import {
  Curso,
  Inscripcion,
  Leccion,
  Progreso,
} from '../models/index.js';
import { INTENTOS_MAXIMOS } from './intento.service.js';
import { leccionAprobada } from './progreso.service.js';
import { asegurarPropiedadCurso } from './curso.service.js';

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

const DISTRIBUCION_PROGRESO = [
  { rango: '0% - 25%', etiqueta: 'Iniciando', limite: 25 },
  { rango: '26% - 50%', etiqueta: 'Básico', limite: 50 },
  { rango: '51% - 75%', etiqueta: 'Intermedio avanzado', limite: 75 },
  { rango: '76% - 100%', etiqueta: 'Completado o evaluando', limite: 100 },
];

function indiceDistribucion(porcentaje) {
  const indice = DISTRIBUCION_PROGRESO.findIndex(
    (tramo) => porcentaje <= tramo.limite,
  );

  return indice === -1 ? DISTRIBUCION_PROGRESO.length - 1 : indice;
}

function construirEmbudo(lecciones, aprobadosPorLeccion, detenidosPorLeccion, totalInscritos) {
  return lecciones.map((leccion) => {
    const aprobados = aprobadosPorLeccion.get(Number(leccion.id)) ?? 0;

    return {
      id: Number(leccion.id),
      titulo: leccion.titulo,
      tipo: leccion.tipo,
      orden: Number(leccion.orden),
      estudiantesAprobados: aprobados,
      porcentajeAprobados: totalInscritos > 0
        ? redondear((aprobados * 100) / totalInscritos)
        : null,
      estudiantesDetenidos: detenidosPorLeccion.get(Number(leccion.id)) ?? 0,
    };
  });
}

function construirDistribucionProgreso(distribucion, totalInscritos) {
  return distribucion.map(({ rango, etiqueta, estudiantes }) => ({
    rango,
    etiqueta,
    estudiantes,
    porcentaje: totalInscritos > 0
      ? redondear((estudiantes * 100) / totalInscritos)
      : null,
  }));
}

function construirDesempenoCuestionario(
  cuestionarios,
  inscripciones,
  progresosPorInscripcion,
) {
  const cuestionario = cuestionarios.at(-1);

  if (!cuestionario) {
    return null;
  }

  const intentos = Array.from({ length: INTENTOS_MAXIMOS }, (_, indice) => ({
    intento: indice + 1,
    estudiantes: 0,
    notas: [],
  }));

  for (const inscripcion of inscripciones) {
    const progresos = progresosPorInscripcion.get(Number(inscripcion.id)) ?? [];
    const progreso = progresos.find(
      (item) => Number(item.leccionId) === Number(cuestionario.id),
    );

    if (!leccionAprobada(cuestionario, progreso)) {
      continue;
    }

    // `intentos` cuenta todos los envíos; el último tramo agrupa a quienes
    // necesitaron el máximo disponible, aunque el aprobado fuera antes.
    const numeroIntento = Math.min(
      Math.max(Number(progreso.intentos) || 1, 1),
      INTENTOS_MAXIMOS,
    );
    const tramo = intentos[numeroIntento - 1];

    tramo.estudiantes += 1;
    tramo.notas.push(Number(progreso.mejorNota));
  }

  return {
    leccionId: Number(cuestionario.id),
    titulo: cuestionario.titulo,
    orden: Number(cuestionario.orden),
    notaMinima: cuestionario.notaMinima === null
      || cuestionario.notaMinima === undefined
      ? null
      : Number(cuestionario.notaMinima),
    totalAprobados: intentos.reduce((total, tramo) => total + tramo.estudiantes, 0),
    intentos: intentos.map(({ intento, estudiantes, notas }) => ({
      intento,
      estudiantes,
      notaPromedio: notas.length > 0
        ? redondear(notas.reduce((total, nota) => total + nota, 0) / notas.length)
        : null,
    })),
  };
}

function calcularAnaliticasDeCurso(
  curso,
  lecciones,
  inscripciones,
  progresosPorInscripcion,
) {
  const leccionesOrdenadas = ordenarLecciones(lecciones);
  const totalLecciones = leccionesOrdenadas.length;
  const ultimaLeccion = leccionesOrdenadas.at(-1) ?? null;
  const totalInscritos = inscripciones.length;
  const leccionIds = new Set(leccionesOrdenadas.map((leccion) => Number(leccion.id)));
  const aprobadosPorLeccion = new Map(
    leccionesOrdenadas.map((leccion) => [Number(leccion.id), 0]),
  );
  const detenidosPorLeccion = new Map(
    leccionesOrdenadas.map((leccion) => [Number(leccion.id), 0]),
  );
  const distribucion = DISTRIBUCION_PROGRESO.map(({ rango, etiqueta }) => ({
    rango,
    etiqueta,
    estudiantes: 0,
  }));
  const notas = [];
  let sumaAvance = 0;
  let inscripcionesConLecciones = 0;
  let estudiantesCompletados = 0;
  let algunInicio = false;

  for (const inscripcion of inscripciones) {
    const progresos = progresosPorInscripcion.get(Number(inscripcion.id)) ?? [];
    const progresosPorLeccion = progresosDeInscripcion(progresos);
    const tieneActividad = progresos.some(
      (progreso) => leccionIds.has(Number(progreso.leccionId)),
    );
    // Aprobar la última lección es la evidencia definitiva de que el curso
    // terminó: el desbloqueo secuencial impide llegar a ella sin completar las
    // anteriores. También cubre datos históricos sin todas las filas previas.
    const aproboUltima = ultimaLeccion
      ? leccionAprobada(
        ultimaLeccion,
        progresosPorLeccion.get(Number(ultimaLeccion.id)),
      )
      : false;

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
        aprobadosPorLeccion.set(
          Number(leccion.id),
          aprobadosPorLeccion.get(Number(leccion.id)) + 1,
        );
      } else if (tieneActividad && !leccionDetencionRegistrada && !aproboUltima) {
        detenidosPorLeccion.set(
          Number(leccion.id),
          detenidosPorLeccion.get(Number(leccion.id)) + 1,
        );
        leccionDetencionRegistrada = true;
      }
    }

    const porcentaje = (leccionesAprobadas * 100) / totalLecciones;
    distribucion[indiceDistribucion(porcentaje)].estudiantes += 1;
    sumaAvance += porcentaje;
    inscripcionesConLecciones += 1;

    if (leccionesAprobadas === totalLecciones || aproboUltima) {
      estudiantesCompletados += 1;
    }
  }

  return {
    curso: {
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
      estudiantesCompletados,
      tasaCompletado: totalInscritos > 0
        ? redondear((estudiantesCompletados * 100) / totalInscritos)
        : null,
      leccionMayorDesercion: calcularLeccionMayorDesercion(
        leccionesOrdenadas,
        detenidosPorLeccion,
        algunInicio,
      ),
    },
    embudo: construirEmbudo(
      leccionesOrdenadas,
      aprobadosPorLeccion,
      detenidosPorLeccion,
      totalInscritos,
    ),
    distribucionProgreso: construirDistribucionProgreso(
      distribucion,
      totalInscritos,
    ),
    cuestionario: construirDesempenoCuestionario(
      leccionesOrdenadas.filter((leccion) => leccion.tipo === 'cuestionario'),
      inscripciones,
      progresosPorInscripcion,
    ),
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

  return calcularMetricasDeCursos(cursos);
}

async function calcularMetricasDeCursos(cursos) {
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

// Alias per-curso: GET /api/instructor/cursos/:id/resumen.
export async function obtenerMetricaCurso(instructorId, cursoId) {
  const curso = await Curso.findByPk(cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  const { cursos } = await calcularMetricasDeCursos([{
    id: curso.id,
    titulo: curso.titulo,
    estado: curso.estado,
  }]);

  return cursos[0];
}

export async function obtenerAnaliticasCurso(instructorId, cursoId) {
  const curso = await Curso.findByPk(cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  const [lecciones, inscripciones] = await Promise.all([
    Leccion.findAll({
      where: { cursoId: curso.id },
      attributes: ATRIBUTOS_LECCION,
      order: [['orden', 'ASC'], ['id', 'ASC']],
      raw: true,
    }),
    Inscripcion.findAll({
      where: { cursoId: curso.id },
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
      attributes: [...ATRIBUTOS_PROGRESO, 'intentos'],
      raw: true,
    });

  return calcularAnaliticasDeCurso(
    {
      id: curso.id,
      titulo: curso.titulo,
      estado: curso.estado,
    },
    lecciones,
    inscripciones,
    agruparPor(progresos, (progreso) => progreso.inscripcionId),
  );
}
