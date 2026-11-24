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
import {
  construirTemarioEstudiante,
  obtenerTemarioEstudiante,
} from '../services/inscripcion.service.js';
import { signAccessToken } from '../utils/jwt.js';

const FECHA = new Date('2026-11-24T10:00:00.000Z');

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
    ...cambios,
  };

  inscripcion.get = () => ({ ...inscripcion });
  return inscripcion;
}

function leccionFalsa(cambios = {}) {
  const leccion = {
    id: 1,
    cursoId: 5,
    titulo: 'Introducción',
    tipo: 'contenido',
    contenido: 'Texto privado de la lección',
    videoUrl: 'https://videos.example.com/privado.mp4',
    orden: 1,
    notaMinima: null,
    ...cambios,
  };

  leccion.get = () => ({ ...leccion });
  return leccion;
}

function progresoFalso(cambios = {}) {
  return {
    inscripcionId: 11,
    leccionId: 1,
    completada: false,
    mejorNota: null,
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

test('the outline exposes completed, available and locked lessons in order', () => {
  const lecciones = [
    leccionFalsa({ id: 10, orden: 1, titulo: 'Introducción' }),
    leccionFalsa({ id: 11, orden: 2, titulo: 'Variables' }),
    leccionFalsa({
      id: 12,
      orden: 3,
      titulo: 'Cuestionario',
      tipo: 'cuestionario',
      contenido: null,
      notaMinima: 70,
    }),
    leccionFalsa({ id: 13, orden: 4, titulo: 'Funciones' }),
  ];
  const progresos = [
    progresoFalso({ leccionId: 10, completada: true }),
  ];

  const temario = construirTemarioEstudiante(lecciones, progresos);

  assert.deepEqual(
    temario.map((leccion) => [leccion.id, leccion.estado]),
    [
      [10, 'completada'],
      [11, 'disponible'],
      [12, 'bloqueada'],
      [13, 'bloqueada'],
    ],
  );
  assert.deepEqual(Object.keys(temario[0]).sort(), [
    'estado',
    'id',
    'notaMinima',
    'orden',
    'tipo',
    'titulo',
  ]);
  assert.equal('contenido' in temario[0], false);
  assert.equal('videoUrl' in temario[0], false);
});

test('a quiz unlocks the next lesson only when its best grade reaches the pass mark', () => {
  const lecciones = [
    leccionFalsa({
      id: 10,
      orden: 1,
      titulo: 'Cuestionario',
      tipo: 'cuestionario',
      contenido: null,
      notaMinima: 70,
    }),
    leccionFalsa({ id: 11, orden: 2, titulo: 'Siguiente lección' }),
  ];

  const reprobado = construirTemarioEstudiante(lecciones, [
    progresoFalso({ leccionId: 10, mejorNota: 69.99 }),
  ]);
  assert.deepEqual(
    reprobado.map((leccion) => leccion.estado),
    ['disponible', 'bloqueada'],
  );

  const aprobado = construirTemarioEstudiante(lecciones, [
    progresoFalso({ leccionId: 10, mejorNota: 70 }),
  ]);
  assert.deepEqual(
    aprobado.map((leccion) => leccion.estado),
    ['completada', 'disponible'],
  );
});

test('an enrolled student receives the outline without lesson content or video links', async (t) => {
  let consultaInscripcion;
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcionFalsa();
  });
  let consultaProgresos;
  t.mock.method(Leccion, 'findAll', async () => [
    leccionFalsa({ id: 10, orden: 1 }),
    leccionFalsa({ id: 11, orden: 2, titulo: 'Variables' }),
  ]);
  t.mock.method(Progreso, 'findAll', async (opciones) => {
    consultaProgresos = opciones;
    return [progresoFalso({ leccionId: 10, completada: true })];
  });

  const resultado = await obtenerTemarioEstudiante(7, 5);

  assert.deepEqual(consultaInscripcion.where, { estudianteId: 7, cursoId: 5 });
  assert.deepEqual(consultaProgresos.where, { inscripcionId: 11 });
  assert.equal(resultado.curso.titulo, 'Fundamentos de JavaScript');
  assert.equal(resultado.inscripcion.id, 11);
  assert.deepEqual(
    resultado.temario.map((leccion) => leccion.estado),
    ['completada', 'disponible'],
  );
  assert.equal(resultado.porcentajeAvance, 50);
  assert.equal(resultado.leccionesCompletadas, 1);
  assert.equal(resultado.totalLecciones, 2);
  assert.equal(JSON.stringify(resultado).includes('Texto privado'), false);
  assert.equal(JSON.stringify(resultado).includes('videos.example.com'), false);
});

test('a student outside the course cannot read its outline', async (t) => {
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Inscripcion, 'findOne', async () => null);
  let leccionesConsultadas = false;
  t.mock.method(Leccion, 'findAll', async () => {
    leccionesConsultadas = true;
    return [];
  });

  await assert.rejects(
    () => obtenerTemarioEstudiante(7, 5),
    (error) => error.statusCode === 403 && error.code === 'NO_INSCRITO',
  );
  assert.equal(leccionesConsultadas, false);
});

test('a missing course returns 404 before checking enrollment', async (t) => {
  t.mock.method(Curso, 'findByPk', async () => null);
  let inscripcionConsultada = false;
  t.mock.method(Inscripcion, 'findOne', async () => {
    inscripcionConsultada = true;
    return null;
  });

  await assert.rejects(
    () => obtenerTemarioEstudiante(7, 99),
    (error) => error.statusCode === 404 && error.code === 'CURSO_NO_ENCONTRADO',
  );
  assert.equal(inscripcionConsultada, false);
});

test('GET /api/cursos/:id/temario requires a student session', async (t) => {
  const baseUrl = await iniciarServidor(t);
  const response = await fetch(`${baseUrl}/api/cursos/5/temario`);

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('an instructor cannot read the student outline route', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));

  const response = await fetch(`${baseUrl}/api/cursos/5/temario`, {
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('the route uses the session student and returns the outline states', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  let consultaInscripcion;
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcionFalsa();
  });
  t.mock.method(Leccion, 'findAll', async () => [
    leccionFalsa({ id: 10, orden: 1 }),
    leccionFalsa({ id: 11, orden: 2, titulo: 'Variables' }),
  ]);
  t.mock.method(Progreso, 'findAll', async () => [
    progresoFalso({ leccionId: 10, completada: true }),
  ]);

  const response = await fetch(`${baseUrl}/api/cursos/5/temario?estudianteId=99`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(consultaInscripcion.where, { estudianteId: 7, cursoId: 5 });
  const body = await response.json();
  assert.deepEqual(
    body.temario.map((leccion) => leccion.estado),
    ['completada', 'disponible'],
  );
  assert.equal(body.porcentajeAvance, 50);
});

test('invalid course ids are rejected before the outline service runs', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  let cursoConsultado = false;
  t.mock.method(Curso, 'findByPk', async () => {
    cursoConsultado = true;
    return cursoFalso();
  });

  const response = await fetch(`${baseUrl}/api/cursos/abc/temario`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 422);
  assert.deepEqual(
    (await response.json()).error.details.map((detail) => detail.campo),
    ['id'],
  );
  assert.equal(cursoConsultado, false);
});
