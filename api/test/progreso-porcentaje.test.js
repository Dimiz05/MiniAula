import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { Op } from 'sequelize';
import app from '../app.js';
import {
  Inscripcion,
  Leccion,
  Progreso,
  Usuario,
} from '../models/index.js';
import {
  listarInscripcionesEstudiante,
  toInscripcionConAvance,
} from '../services/inscripcion.service.js';
import { calcularAvanceCurso } from '../services/progreso.service.js';
import { signAccessToken } from '../utils/jwt.js';

const FECHA = new Date('2026-11-23T10:00:00.000Z');

function cursoFalso(cambios = {}) {
  const curso = {
    id: 5,
    titulo: 'Fundamentos de JavaScript',
    descripcion: 'Curso de prueba',
    portada: null,
    categoria: 'Programación',
    nivel: 'basico',
    creadoEn: FECHA,
    instructor: { id: 9, nombre: 'Ana Torres' },
    ...cambios,
  };

  curso.get = () => ({ ...curso });

  return curso;
}

function inscripcionFalsa(cambios = {}) {
  const inscripcion = {
    id: 11,
    estudianteId: 7,
    cursoId: 5,
    fechaInscripcion: FECHA,
    completado: false,
    curso: cursoFalso(),
    ...cambios,
  };

  inscripcion.get = () => ({
    id: inscripcion.id,
    estudianteId: inscripcion.estudianteId,
    cursoId: inscripcion.cursoId,
    fechaInscripcion: inscripcion.fechaInscripcion,
    completado: inscripcion.completado,
  });

  return inscripcion;
}

function leccionFalsa(cambios = {}) {
  return {
    id: 1,
    cursoId: 5,
    tipo: 'contenido',
    notaMinima: null,
    ...cambios,
  };
}

async function iniciarServidor(t) {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  return `http://127.0.0.1:${server.address().port}`;
}

function tokenDe(id, rol) {
  return `Bearer ${signAccessToken({ id, rol })}`;
}

test('course progress counts completed content and passed quizzes over every lesson', () => {
  const lecciones = [
    leccionFalsa({ id: 1 }),
    leccionFalsa({ id: 2, tipo: 'cuestionario', notaMinima: 70 }),
    leccionFalsa({ id: 3, tipo: 'cuestionario', notaMinima: 70 }),
    leccionFalsa({ id: 4 }),
  ];
  const progresos = [
    { leccionId: 1, completada: true, mejorNota: null },
    { leccionId: 2, completada: false, mejorNota: 70 },
    { leccionId: 3, completada: true, mejorNota: 60 },
    { leccionId: 4, completada: false, mejorNota: null },
  ];

  assert.deepEqual(calcularAvanceCurso(lecciones, progresos), {
    porcentajeAvance: 50,
    leccionesCompletadas: 2,
    totalLecciones: 4,
  });
});

test('a quiz only advances when its best grade reaches the pass mark', () => {
  const lecciones = [leccionFalsa({
    id: 1,
    tipo: 'cuestionario',
    notaMinima: 80,
  })];

  assert.equal(
    calcularAvanceCurso(lecciones, [{ leccionId: 1, completada: true, mejorNota: 79 }])
      .porcentajeAvance,
    0,
  );
  assert.equal(
    calcularAvanceCurso(lecciones, [{ leccionId: 1, completada: false, mejorNota: 80 }])
      .porcentajeAvance,
    100,
  );
});

test('progress is rounded and a course without lessons avoids division by zero', () => {
  const lecciones = [
    leccionFalsa({ id: 1 }),
    leccionFalsa({ id: 2 }),
    leccionFalsa({ id: 3 }),
  ];

  assert.deepEqual(
    calcularAvanceCurso(lecciones, [{ leccionId: 1, completada: true, mejorNota: null }]),
    {
      porcentajeAvance: 33,
      leccionesCompletadas: 1,
      totalLecciones: 3,
    },
  );
  assert.deepEqual(calcularAvanceCurso([], []), {
    porcentajeAvance: 0,
    leccionesCompletadas: 0,
    totalLecciones: 0,
  });
});

test('the enrollment presenter joins the course with its progress summary', () => {
  const inscripcion = inscripcionFalsa();
  const presentada = toInscripcionConAvance(
    inscripcion,
    [leccionFalsa({ id: 1 }), leccionFalsa({ id: 2 })],
    [{ leccionId: 1, completada: true, mejorNota: null }],
  );

  assert.deepEqual(presentada, {
    id: 11,
    cursoId: 5,
    fechaInscripcion: FECHA,
    completado: false,
    porcentajeAvance: 50,
    leccionesCompletadas: 1,
    totalLecciones: 2,
    curso: {
      id: 5,
      titulo: 'Fundamentos de JavaScript',
      descripcion: 'Curso de prueba',
      portada: null,
      categoria: 'Programación',
      nivel: 'basico',
      creadoEn: FECHA,
      instructor: { id: 9, nombre: 'Ana Torres' },
    },
  });
});

test('the listing only queries the session student and returns one percentage per course', async (t) => {
  let consultaInscripciones;
  t.mock.method(Inscripcion, 'findAll', async (opciones) => {
    consultaInscripciones = opciones;
    return [
      inscripcionFalsa(),
      inscripcionFalsa({
        id: 12,
        cursoId: 6,
        curso: cursoFalso({ id: 6, titulo: 'Curso sin lecciones' }),
      }),
    ];
  });
  let consultaLecciones;
  t.mock.method(Leccion, 'findAll', async (opciones) => {
    consultaLecciones = opciones;
    return [
      leccionFalsa({ id: 1 }),
      leccionFalsa({ id: 2, tipo: 'cuestionario', notaMinima: 70 }),
    ];
  });
  let consultaProgresos;
  t.mock.method(Progreso, 'findAll', async (opciones) => {
    consultaProgresos = opciones;
    return [
      { inscripcionId: 11, leccionId: 1, completada: true, mejorNota: null },
      { inscripcionId: 11, leccionId: 2, completada: false, mejorNota: 70 },
    ];
  });

  const inscripciones = await listarInscripcionesEstudiante(7);

  assert.deepEqual(consultaInscripciones.where, { estudianteId: 7 });
  assert.deepEqual(consultaLecciones.where.cursoId[Op.in], [5, 6]);
  assert.deepEqual(consultaProgresos.where.inscripcionId[Op.in], [11, 12]);
  assert.equal(inscripciones.length, 2);
  assert.equal(inscripciones[0].porcentajeAvance, 100);
  assert.equal(inscripciones[0].leccionesCompletadas, 2);
  assert.equal(inscripciones[0].totalLecciones, 2);
  assert.equal(inscripciones[0].curso.titulo, 'Fundamentos de JavaScript');
  assert.equal(inscripciones[1].porcentajeAvance, 0);
  assert.equal(inscripciones[1].leccionesCompletadas, 0);
  assert.equal(inscripciones[1].totalLecciones, 0);
  assert.equal(inscripciones[1].curso.titulo, 'Curso sin lecciones');
});

test('a student without enrollments gets an empty list without querying lessons', async (t) => {
  t.mock.method(Inscripcion, 'findAll', async () => []);
  let leccionesConsultadas = false;
  t.mock.method(Leccion, 'findAll', async () => {
    leccionesConsultadas = true;
    return [];
  });

  const inscripciones = await listarInscripcionesEstudiante(7);

  assert.deepEqual(inscripciones, []);
  assert.equal(leccionesConsultadas, false);
});

test('GET /api/inscripciones/mias requires a student session', async (t) => {
  const baseUrl = await iniciarServidor(t);
  const response = await fetch(`${baseUrl}/api/inscripciones/mias`);

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('an instructor cannot read the student enrollment listing', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const response = await fetch(`${baseUrl}/api/inscripciones/mias`, {
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('the route returns only the authenticated student enrollments with their progress', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  let consultaInscripciones;
  t.mock.method(Inscripcion, 'findAll', async (opciones) => {
    consultaInscripciones = opciones;
    return [inscripcionFalsa()];
  });
  t.mock.method(Leccion, 'findAll', async () => [
    leccionFalsa({ id: 1 }),
    leccionFalsa({ id: 2 }),
  ]);
  t.mock.method(Progreso, 'findAll', async () => [
    { inscripcionId: 11, leccionId: 1, completada: true, mejorNota: null },
  ]);

  const response = await fetch(`${baseUrl}/api/inscripciones/mias?estudianteId=99`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(consultaInscripciones.where, { estudianteId: 7 });

  const body = await response.json();
  assert.equal(body.inscripciones.length, 1);
  assert.equal(body.inscripciones[0].id, 11);
  assert.equal(body.inscripciones[0].cursoId, 5);
  assert.equal(body.inscripciones[0].porcentajeAvance, 50);
  assert.equal(body.inscripciones[0].leccionesCompletadas, 1);
  assert.equal(body.inscripciones[0].totalLecciones, 2);
  assert.equal(body.inscripciones[0].curso.titulo, 'Fundamentos de JavaScript');
});
