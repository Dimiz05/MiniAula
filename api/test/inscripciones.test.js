import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { UniqueConstraintError } from 'sequelize';
import app from '../app.js';
import {
  Curso,
  Inscripcion,
  Usuario,
  sequelize,
} from '../models/index.js';
import {
  inscribirEstudiante,
  toInscripcion,
} from '../services/inscripcion.service.js';
import { signAccessToken } from '../utils/jwt.js';

const TRANSACCION = { LOCK: { UPDATE: 'UPDATE' } };
const FECHA = new Date('2026-11-23T10:00:00.000Z');

function cursoFalso(cambios = {}) {
  return {
    id: 3,
    estado: 'publicado',
    ...cambios,
  };
}

function inscripcionFalsa(cambios = {}) {
  const inscripcion = {
    id: 11,
    estudianteId: 7,
    cursoId: 3,
    fechaInscripcion: FECHA,
    completado: false,
    ...cambios,
  };

  inscripcion.get = () => ({ ...inscripcion });
  return inscripcion;
}

function simularTransaccion(t) {
  t.mock.method(sequelize, 'transaction', async (callback) => callback(TRANSACCION));
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

test('the enrollment presenter exposes only the created resource fields', () => {
  assert.deepEqual(toInscripcion(inscripcionFalsa()), {
    id: 11,
    cursoId: 3,
    fechaInscripcion: FECHA,
    completado: false,
  });
  assert.equal('estudianteId' in toInscripcion(inscripcionFalsa()), false);
});

test('a published course enrolls the authenticated student', async (t) => {
  simularTransaccion(t);
  let consultaCurso;
  t.mock.method(Curso, 'findByPk', async (id, opciones) => {
    consultaCurso = { id, opciones };
    return cursoFalso();
  });
  t.mock.method(Inscripcion, 'findOne', async () => null);
  let creacion;
  t.mock.method(Inscripcion, 'create', async (datos, opciones) => {
    creacion = { datos, opciones };
    return inscripcionFalsa();
  });

  const inscripcion = await inscribirEstudiante(7, 3);

  assert.deepEqual(inscripcion, {
    id: 11,
    cursoId: 3,
    fechaInscripcion: FECHA,
    completado: false,
  });
  assert.deepEqual(creacion.datos, { estudianteId: 7, cursoId: 3 });
  assert.equal(creacion.opciones.transaction, TRANSACCION);
  assert.equal(consultaCurso.id, 3);
  assert.equal(consultaCurso.opciones.transaction, TRANSACCION);
  assert.equal(consultaCurso.opciones.lock, 'UPDATE');
});

test('an existing enrollment returns 409 without creating another row', async (t) => {
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  let creado = false;
  t.mock.method(Inscripcion, 'create', async () => {
    creado = true;
    return inscripcionFalsa();
  });

  await assert.rejects(
    () => inscribirEstudiante(7, 3),
    (error) => error.statusCode === 409 && error.code === 'INSCRIPCION_DUPLICADA',
  );

  assert.equal(creado, false);
});

test('only published courses can be enrolled', async (t) => {
  simularTransaccion(t);
  let cursoActual = cursoFalso({ estado: 'borrador' });
  t.mock.method(Curso, 'findByPk', async () => cursoActual);
  let creado = false;
  t.mock.method(Inscripcion, 'create', async () => {
    creado = true;
    return inscripcionFalsa();
  });

  for (const [caso, curso] of [
    ['borrador', cursoFalso({ estado: 'borrador' })],
    ['archivado', cursoFalso({ estado: 'archivado' })],
    ['inexistente', null],
  ]) {
    cursoActual = curso;

    await assert.rejects(
      () => inscribirEstudiante(7, 3),
      (error) => error.statusCode === 404 && error.code === 'CURSO_NO_ENCONTRADO',
      caso,
    );
  }

  assert.equal(creado, false);
});

test('a concurrent duplicate is translated to 409', async (t) => {
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Inscripcion, 'findOne', async () => null);
  t.mock.method(Inscripcion, 'create', async () => {
    throw new UniqueConstraintError({
      fields: { estudiante_id: 7, curso_id: 3 },
    });
  });

  await assert.rejects(
    () => inscribirEstudiante(7, 3),
    (error) => error.statusCode === 409 && error.code === 'INSCRIPCION_DUPLICADA',
  );
});

test('POST /api/cursos/:id/inscripcion requires a student session', async (t) => {
  const baseUrl = await iniciarServidor(t);
  const response = await fetch(`${baseUrl}/api/cursos/3/inscripcion`, {
    method: 'POST',
  });

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('an instructor cannot enroll in a course', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const response = await fetch(`${baseUrl}/api/cursos/3/inscripcion`, {
    method: 'POST',
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('a repeated enrollment returns HTTP 409 through the route', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  const response = await fetch(`${baseUrl}/api/cursos/3/inscripcion`, {
    method: 'POST',
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, 'INSCRIPCION_DUPLICADA');
});

test('invalid course ids are rejected before enrollment', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  const response = await fetch(`${baseUrl}/api/cursos/abc/inscripcion`, {
    method: 'POST',
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 422);
  assert.deepEqual(
    (await response.json()).error.details.map((detail) => detail.campo),
    ['id'],
  );
});

test('the route enrolls the session student and ignores a client student id', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Inscripcion, 'findOne', async () => null);
  let creacion;
  t.mock.method(Inscripcion, 'create', async (datos) => {
    creacion = datos;
    return inscripcionFalsa();
  });

  const response = await fetch(`${baseUrl}/api/cursos/3/inscripcion`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(7, 'estudiante'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estudianteId: 99 }),
  });

  assert.equal(response.status, 201);
  assert.deepEqual((await response.json()).inscripcion, {
    id: 11,
    cursoId: 3,
    fechaInscripcion: FECHA.toISOString(),
    completado: false,
  });
  assert.deepEqual(creacion, { estudianteId: 7, cursoId: 3 });
});
