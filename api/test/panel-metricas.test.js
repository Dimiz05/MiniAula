import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import {
  Curso,
  Inscripcion,
  Leccion,
  Progreso,
  Usuario,
} from '../models/index.js';
import { obtenerMetricasCursos } from '../services/metrica.service.js';
import { signAccessToken } from '../utils/jwt.js';

async function iniciarServidor(t) {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  return `http://127.0.0.1:${server.address().port}`;
}

function cursoFalso({ id = 1, titulo = 'Curso de prueba', estado = 'publicado' } = {}) {
  return { id, titulo, estado };
}

function leccionFalsa({
  id,
  cursoId = 1,
  titulo = `Lección ${id}`,
  tipo = 'contenido',
  orden,
  notaMinima = null,
}) {
  return { id, cursoId, titulo, tipo, orden, notaMinima };
}

function inscripcionFalsa({ id, cursoId = 1 }) {
  return { id, cursoId };
}

function progresoFalso({
  inscripcionId,
  leccionId,
  completada = false,
  mejorNota = null,
}) {
  return { inscripcionId, leccionId, completada, mejorNota };
}

function simularDatos(t, {
  cursos,
  lecciones = [],
  inscripciones = [],
  progresos = [],
}) {
  let consultaCursos;
  let consultasLecciones = 0;
  let consultasInscripciones = 0;
  let consultasProgreso = 0;

  t.mock.method(Curso, 'findAll', async (opciones) => {
    consultaCursos = opciones;
    return cursos;
  });
  t.mock.method(Leccion, 'findAll', async () => {
    consultasLecciones += 1;
    return lecciones;
  });
  t.mock.method(Inscripcion, 'findAll', async () => {
    consultasInscripciones += 1;
    return inscripciones;
  });
  t.mock.method(Progreso, 'findAll', async () => {
    consultasProgreso += 1;
    return progresos;
  });

  return {
    consultaCursos: () => consultaCursos,
    consultasLecciones: () => consultasLecciones,
    consultasInscripciones: () => consultasInscripciones,
    consultasProgreso: () => consultasProgreso,
  };
}

test('panel metrics compute enrollment, progress, grade and drop-off from real rows', async (t) => {
  const lecciones = [
    leccionFalsa({ id: 11, titulo: 'Introducción', orden: 1 }),
    leccionFalsa({ id: 12, titulo: 'Componentes', orden: 2 }),
    leccionFalsa({
      id: 13,
      titulo: 'Cuestionario final',
      tipo: 'cuestionario',
      orden: 3,
      notaMinima: 70,
    }),
  ];
  const inscripciones = [1, 2, 3, 4, 5].map((id) => inscripcionFalsa({ id }));
  const progresos = [
    progresoFalso({ inscripcionId: 1, leccionId: 11, completada: true }),
    progresoFalso({ inscripcionId: 1, leccionId: 12, completada: true }),
    progresoFalso({ inscripcionId: 1, leccionId: 13, mejorNota: 80 }),
    ...([2, 3, 4].flatMap((inscripcionId) => [
      progresoFalso({ inscripcionId, leccionId: 11, completada: true }),
      progresoFalso({ inscripcionId, leccionId: 12, completada: true }),
    ])),
    progresoFalso({ inscripcionId: 5, leccionId: 11, completada: true }),
  ];
  const consultas = simularDatos(t, {
    cursos: [cursoFalso({ id: 1, titulo: 'React' })],
    lecciones,
    inscripciones,
    progresos,
  });

  const resultado = await obtenerMetricasCursos(9);

  assert.equal(consultas.consultaCursos().where.instructorId, 9);
  assert.equal(consultas.consultaCursos().raw, true);
  assert.equal(consultas.consultasLecciones(), 1);
  assert.equal(consultas.consultasInscripciones(), 1);
  assert.equal(consultas.consultasProgreso(), 1);
  assert.deepEqual(resultado.resumen, {
    totalCursos: 1,
    totalInscritos: 5,
    progresoPromedio: 66.7,
    notaPromedio: 80,
  });
  assert.deepEqual(resultado.cursos, [{
    id: 1,
    titulo: 'React',
    estado: 'publicado',
    totalLecciones: 3,
    totalInscritos: 5,
    progresoPromedio: 66.7,
    notaPromedio: 80,
    leccionMayorDesercion: {
      leccionId: 13,
      titulo: 'Cuestionario final',
      orden: 3,
      estudiantesDetenidos: 3,
    },
  }]);
});

test('metrics for multiple courses use one query per entity', async (t) => {
  const consultas = simularDatos(t, {
    cursos: [
      cursoFalso({ id: 7, titulo: 'Curso activo' }),
      cursoFalso({ id: 8, titulo: 'Curso inactivo' }),
    ],
    lecciones: [
      leccionFalsa({ id: 71, cursoId: 7, orden: 1 }),
      leccionFalsa({ id: 81, cursoId: 8, orden: 1 }),
    ],
    inscripciones: [
      inscripcionFalsa({ id: 71, cursoId: 7 }),
      inscripcionFalsa({ id: 81, cursoId: 8 }),
    ],
    progresos: [
      progresoFalso({ inscripcionId: 71, leccionId: 71, completada: true }),
    ],
  });

  const resultado = await obtenerMetricasCursos(9);

  assert.equal(consultas.consultasLecciones(), 1);
  assert.equal(consultas.consultasInscripciones(), 1);
  assert.equal(consultas.consultasProgreso(), 1);
  assert.equal(resultado.resumen.totalCursos, 2);
  assert.equal(resultado.resumen.totalInscritos, 2);
  assert.equal(resultado.resumen.progresoPromedio, 50);
  assert.equal(resultado.cursos[0].progresoPromedio, 100);
  assert.equal(resultado.cursos[1].progresoPromedio, 0);
});

test('a course without enrollments reports no activity instead of inventing averages', async (t) => {
  const consultas = simularDatos(t, {
    cursos: [cursoFalso({ id: 2, titulo: 'Sin estudiantes' })],
    lecciones: [
      leccionFalsa({ id: 21, cursoId: 2, orden: 1 }),
      leccionFalsa({ id: 22, cursoId: 2, orden: 2 }),
    ],
    inscripciones: [],
    progresos: [],
  });

  const resultado = await obtenerMetricasCursos(9);

  assert.equal(consultas.consultasProgreso(), 0);
  assert.deepEqual(resultado.resumen, {
    totalCursos: 1,
    totalInscritos: 0,
    progresoPromedio: null,
    notaPromedio: null,
  });
  assert.deepEqual(resultado.cursos[0], {
    id: 2,
    titulo: 'Sin estudiantes',
    estado: 'publicado',
    totalLecciones: 2,
    totalInscritos: 0,
    progresoPromedio: null,
    notaPromedio: null,
    leccionMayorDesercion: null,
  });
});

test('enrolled students without progress report 0% and no grade', async (t) => {
  simularDatos(t, {
    cursos: [cursoFalso({ id: 3 })],
    lecciones: [
      leccionFalsa({ id: 31, cursoId: 3, orden: 1 }),
      leccionFalsa({ id: 32, cursoId: 3, orden: 2 }),
    ],
    inscripciones: [
      inscripcionFalsa({ id: 31, cursoId: 3 }),
      inscripcionFalsa({ id: 32, cursoId: 3 }),
    ],
    progresos: [],
  });

  const resultado = await obtenerMetricasCursos(9);

  assert.equal(resultado.resumen.progresoPromedio, 0);
  assert.equal(resultado.resumen.notaPromedio, null);
  assert.equal(resultado.cursos[0].progresoPromedio, 0);
  assert.equal(resultado.cursos[0].notaPromedio, null);
  assert.equal(resultado.cursos[0].leccionMayorDesercion, null);
});

test('a failed quiz does not count as completed for progress or drop-off', async (t) => {
  simularDatos(t, {
    cursos: [cursoFalso({ id: 4 })],
    lecciones: [
      leccionFalsa({ id: 41, cursoId: 4, orden: 1 }),
      leccionFalsa({
        id: 42,
        cursoId: 4,
        orden: 2,
        tipo: 'cuestionario',
        notaMinima: 70,
      }),
    ],
    inscripciones: [inscripcionFalsa({ id: 41, cursoId: 4 })],
    progresos: [
      progresoFalso({ inscripcionId: 41, leccionId: 41, completada: true }),
      progresoFalso({ inscripcionId: 41, leccionId: 42, mejorNota: 60 }),
    ],
  });

  const resultado = await obtenerMetricasCursos(9);

  assert.equal(resultado.cursos[0].progresoPromedio, 50);
  assert.equal(resultado.cursos[0].notaPromedio, 60);
  assert.deepEqual(resultado.cursos[0].leccionMayorDesercion, {
    leccionId: 42,
    titulo: 'Lección 42',
    orden: 2,
    estudiantesDetenidos: 1,
  });
});

test('students who never started are not attributed to a drop-off lesson', async (t) => {
  simularDatos(t, {
    cursos: [cursoFalso({ id: 6 })],
    lecciones: [
      leccionFalsa({ id: 61, cursoId: 6, orden: 1 }),
      leccionFalsa({ id: 62, cursoId: 6, orden: 2 }),
    ],
    inscripciones: [
      inscripcionFalsa({ id: 61, cursoId: 6 }),
      inscripcionFalsa({ id: 62, cursoId: 6 }),
      inscripcionFalsa({ id: 63, cursoId: 6 }),
    ],
    progresos: [
      progresoFalso({ inscripcionId: 63, leccionId: 61, completada: true }),
    ],
  });

  const resultado = await obtenerMetricasCursos(9);

  // Only the student who started is counted, and they are stuck on lesson 2.
  assert.deepEqual(resultado.cursos[0].leccionMayorDesercion, {
    leccionId: 62,
    titulo: 'Lección 62',
    orden: 2,
    estudiantesDetenidos: 1,
  });
});

test('drop-off ties resolve to the earliest lesson', async (t) => {
  const lecciones = [
    leccionFalsa({ id: 51, cursoId: 5, orden: 1 }),
    leccionFalsa({ id: 52, cursoId: 5, orden: 2 }),
    leccionFalsa({ id: 53, cursoId: 5, orden: 3 }),
  ];
  const inscripciones = [51, 52, 53, 54, 55].map((id) => inscripcionFalsa({ id, cursoId: 5 }));
  const progresos = [
    ...([51, 52].flatMap((inscripcionId) => [
      progresoFalso({ inscripcionId, leccionId: 51, completada: true }),
    ])),
    ...([53, 54].flatMap((inscripcionId) => [
      progresoFalso({ inscripcionId, leccionId: 51, completada: true }),
      progresoFalso({ inscripcionId, leccionId: 52, completada: true }),
    ])),
    progresoFalso({ inscripcionId: 55, leccionId: 51, completada: true }),
    progresoFalso({ inscripcionId: 55, leccionId: 52, completada: true }),
    progresoFalso({ inscripcionId: 55, leccionId: 53, completada: true }),
  ];

  simularDatos(t, {
    cursos: [cursoFalso({ id: 5 })],
    lecciones,
    inscripciones,
    progresos,
  });

  const resultado = await obtenerMetricasCursos(9);

  // Both lessons have two students stuck; the earliest lesson wins.
  assert.equal(resultado.cursos[0].leccionMayorDesercion.leccionId, 52);
  assert.equal(resultado.cursos[0].leccionMayorDesercion.estudiantesDetenidos, 2);
});

test('an instructor without courses receives an empty panel', async (t) => {
  simularDatos(t, { cursos: [] });

  const resultado = await obtenerMetricasCursos(9);

  assert.deepEqual(resultado, {
    resumen: {
      totalCursos: 0,
      totalInscritos: 0,
      progresoPromedio: null,
      notaPromedio: null,
    },
    cursos: [],
  });
});

test('the metrics route requires an authenticated instructor', async (t) => {
  const baseUrl = await iniciarServidor(t);

  const response = await fetch(`${baseUrl}/api/cursos/mios/metricas`);

  // A 401 proves the own-course metrics route matched before the public /:id route.
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('the metrics route rejects a student session with 403', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 3, rol: 'estudiante' }));
  const token = signAccessToken({ id: 3, rol: 'estudiante' });

  const response = await fetch(`${baseUrl}/api/cursos/mios/metricas`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('the metrics route returns only the authenticated instructor data', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const consultas = simularDatos(t, {
    cursos: [cursoFalso({ id: 1, titulo: 'React' })],
    lecciones: [
      leccionFalsa({ id: 11, orden: 1 }),
      leccionFalsa({ id: 12, orden: 2 }),
    ],
    inscripciones: [inscripcionFalsa({ id: 11 })],
    progresos: [
      progresoFalso({ inscripcionId: 11, leccionId: 11, completada: true }),
    ],
  });
  const token = signAccessToken({ id: 9, rol: 'instructor' });

  const response = await fetch(`${baseUrl}/api/cursos/mios/metricas`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(consultas.consultaCursos().where.instructorId, 9);
  assert.equal(body.resumen.totalCursos, 1);
  assert.equal(body.cursos[0].titulo, 'React');
});
