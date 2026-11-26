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
  sequelize,
} from '../models/index.js';
import { signAccessToken } from '../utils/jwt.js';

const TRANSACCION = { LOCK: { UPDATE: 'UPDATE' } };
const FECHA = new Date('2026-11-25T10:00:00.000Z');

function cursoInstancia(cambios = {}) {
  const curso = {
    id: 5,
    titulo: 'React desde cero',
    descripcion: 'Curso de prueba',
    portada: 'https://images.example.com/react.jpg',
    categoria: 'Programación',
    nivel: 'intermedio',
    estado: 'borrador',
    instructorId: 9,
    creadoEn: FECHA,
    ...cambios,
  };

  curso.get = () => ({ ...curso });
  curso.save = async () => {};
  return curso;
}

function leccionInstancia(cambios = {}) {
  const leccion = {
    id: 10,
    cursoId: 5,
    titulo: 'Componentes y JSX',
    tipo: 'contenido',
    contenido: 'Texto de la lección',
    videoUrl: null,
    orden: 1,
    notaMinima: null,
    ...cambios,
  };

  leccion.get = () => ({ ...leccion });
  return leccion;
}

function inscripcionInstancia(cambios = {}) {
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

function simularUsuario(t) {
  t.mock.method(Usuario, 'findByPk', async (id) => ({
    id: Number(id),
    rol: [9, 10].includes(Number(id)) ? 'instructor' : 'estudiante',
  }));
}

test('GET /api/instructor/cursos requires an instructor session', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);

  const sinSesion = await fetch(`${baseUrl}/api/instructor/cursos`);
  assert.equal(sinSesion.status, 401);

  const estudiante = await fetch(`${baseUrl}/api/instructor/cursos`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });
  assert.equal(estudiante.status, 403);
});

test('GET /api/instructor/cursos lists the signed-in instructor courses', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);
  t.mock.method(Curso, 'findAll', async () => [cursoInstancia()]);
  t.mock.method(Leccion, 'findAll', async () => [{ cursoId: 5, total: 5 }]);
  t.mock.method(Inscripcion, 'findAll', async () => [{ cursoId: 5, total: 2 }]);

  const response = await fetch(`${baseUrl}/api/instructor/cursos`, {
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.cursos.length, 1);
  assert.equal(body.cursos[0].titulo, 'React desde cero');
  assert.equal(body.cursos[0].totalLecciones, 5);
  assert.equal(body.cursos[0].totalInscritos, 2);
});

test('GET /api/instructor/cursos/:id/resumen returns that course metrics', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);
  t.mock.method(Curso, 'findByPk', async () => cursoInstancia({ estado: 'publicado' }));
  t.mock.method(Leccion, 'findAll', async () => [leccionInstancia()]);
  t.mock.method(Inscripcion, 'findAll', async () => []);

  const response = await fetch(`${baseUrl}/api/instructor/cursos/5/resumen`, {
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.resumen.id, 5);
  assert.equal(body.resumen.titulo, 'React desde cero');
  assert.equal(body.resumen.totalLecciones, 1);
  assert.equal(body.resumen.progresoPromedio, null);
});

test('GET /api/instructor/cursos/:id/resumen rejects another instructor course', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);
  t.mock.method(Curso, 'findByPk', async () => cursoInstancia());

  const response = await fetch(`${baseUrl}/api/instructor/cursos/5/resumen`, {
    headers: { Authorization: tokenDe(10, 'instructor') },
  });

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error.code, 'CURSO_NO_PROPIO');
});

test('PATCH /api/cursos/:id/estado publishes through the compatibility alias', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);
  t.mock.method(sequelize, 'transaction', async (callback) => callback(TRANSACCION));
  t.mock.method(Curso, 'findByPk', async () => cursoInstancia());
  t.mock.method(Leccion, 'count', async () => 5);
  t.mock.method(Inscripcion, 'count', async () => 0);

  const response = await fetch(`${baseUrl}/api/cursos/5/estado`, {
    method: 'PATCH',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estado: 'publicado' }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.curso.estado, 'publicado');
});

test('PATCH /api/cursos/:id/estado rejects a non publishable state', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);

  const response = await fetch(`${baseUrl}/api/cursos/5/estado`, {
    method: 'PATCH',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estado: 'borrador' }),
  });

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, 'VALIDACION');
});

test('GET /api/cursos/:id/progreso returns 403 when the student is not enrolled', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);
  t.mock.method(Curso, 'findByPk', async () => cursoInstancia({
    instructor: { id: 9, nombre: 'Lucía Ferrer' },
  }));
  t.mock.method(Inscripcion, 'findOne', async () => null);

  const response = await fetch(`${baseUrl}/api/cursos/5/progreso`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error.code, 'NO_INSCRITO');
});

test('GET /api/cursos/:id/progreso returns the outline and percentage', async (t) => {
  const baseUrl = await iniciarServidor(t);
  simularUsuario(t);
  t.mock.method(Curso, 'findByPk', async () => cursoInstancia({
    instructor: { id: 9, nombre: 'Lucía Ferrer' },
  }));
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionInstancia());
  t.mock.method(Leccion, 'findAll', async () => [leccionInstancia()]);
  t.mock.method(Progreso, 'findAll', async () => []);

  const response = await fetch(`${baseUrl}/api/cursos/5/progreso`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.curso.titulo, 'React desde cero');
  assert.equal(body.porcentajeAvance, 0);
  assert.equal(body.temario[0].estado, 'disponible');
});
