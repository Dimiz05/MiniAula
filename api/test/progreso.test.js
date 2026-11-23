import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import {
  Inscripcion,
  Leccion,
  Progreso,
  Usuario,
  sequelize,
} from '../models/index.js';
import {
  marcarLeccionContenidoCompletada,
  toProgreso,
} from '../services/progreso.service.js';
import { signAccessToken } from '../utils/jwt.js';

const TRANSACCION = { LOCK: { UPDATE: 'UPDATE' } };
const FECHA = new Date('2026-11-23T10:00:00.000Z');

function leccionFalsa(cambios = {}) {
  return {
    id: 10,
    titulo: 'Introducción',
    tipo: 'contenido',
    contenido: 'Texto de la lección',
    videoUrl: null,
    orden: 1,
    notaMinima: null,
    cursoId: 5,
    ...cambios,
  };
}

function inscripcionFalsa(cambios = {}) {
  return {
    id: 11,
    estudianteId: 7,
    cursoId: 5,
    completado: false,
    ...cambios,
  };
}

function progresoFalso(cambios = {}) {
  const progreso = {
    id: 21,
    inscripcionId: 11,
    leccionId: 10,
    completada: true,
    intentos: 0,
    mejorNota: null,
    actualizadoEn: FECHA,
    ...cambios,
  };

  progreso.get = () => ({ ...progreso });
  progreso.save = async () => {};

  return progreso;
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

test('the progress presenter exposes only the persisted progress fields', () => {
  assert.deepEqual(toProgreso(progresoFalso()), {
    id: 21,
    inscripcionId: 11,
    leccionId: 10,
    completada: true,
    intentos: 0,
    mejorNota: null,
    actualizadoEn: FECHA,
  });
});

test('an enrolled student completes the first content lesson of their course', async (t) => {
  simularTransaccion(t);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  let consultaInscripcion;
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcionFalsa();
  });
  t.mock.method(Leccion, 'findAll', async () => [leccionFalsa()]);
  let creacion;
  t.mock.method(Progreso, 'findOrCreate', async (opciones) => {
    creacion = opciones;
    return [progresoFalso(), true];
  });

  const progreso = await marcarLeccionContenidoCompletada(7, 10);

  assert.deepEqual(consultaInscripcion.where, { estudianteId: 7, cursoId: 5 });
  assert.equal(consultaInscripcion.transaction, TRANSACCION);
  assert.deepEqual(creacion.where, { inscripcionId: 11, leccionId: 10 });
  assert.deepEqual(creacion.defaults, { completada: true });
  assert.equal(creacion.transaction, TRANSACCION);
  assert.equal(progreso.completada, true);
  assert.equal(progreso.leccionId, 10);
});

test('marking an already completed lesson is idempotent and does not create another row', async (t) => {
  simularTransaccion(t);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [leccionFalsa()]);
  let guardados = 0;
  const progreso = progresoFalso({ completada: true });
  progreso.save = async () => {
    guardados += 1;
  };
  t.mock.method(Progreso, 'findOrCreate', async () => [progreso, false]);

  const resultado = await marcarLeccionContenidoCompletada(7, 10);

  assert.equal(guardados, 0);
  assert.equal(resultado.completada, true);
});

test('an existing incomplete progress row is completed without altering quiz fields', async (t) => {
  simularTransaccion(t);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [leccionFalsa()]);
  let opcionesGuardado;
  const progreso = progresoFalso({
    completada: false,
    intentos: 0,
    mejorNota: null,
  });
  progreso.save = async (opciones) => {
    opcionesGuardado = opciones;
  };
  t.mock.method(Progreso, 'findOrCreate', async () => [progreso, false]);

  const resultado = await marcarLeccionContenidoCompletada(7, 10);

  assert.equal(progreso.completada, true);
  assert.equal(progreso.intentos, 0);
  assert.equal(progreso.mejorNota, null);
  assert.equal(opcionesGuardado.transaction, TRANSACCION);
  assert.equal(resultado.completada, true);
});

test('a missing lesson returns 404', async (t) => {
  simularTransaccion(t);
  t.mock.method(Leccion, 'findByPk', async () => null);

  await assert.rejects(
    () => marcarLeccionContenidoCompletada(7, 10),
    (error) => error.statusCode === 404 && error.code === 'LECCION_NO_ENCONTRADA',
  );
});

test('a student who is not enrolled cannot register progress', async (t) => {
  simularTransaccion(t);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Inscripcion, 'findOne', async () => null);
  let creado = false;
  t.mock.method(Progreso, 'findOrCreate', async () => {
    creado = true;
    return [progresoFalso(), true];
  });

  await assert.rejects(
    () => marcarLeccionContenidoCompletada(7, 10),
    (error) => error.statusCode === 403 && error.code === 'NO_INSCRITO',
  );
  assert.equal(creado, false);
});

test('a quiz cannot be completed through the content progress endpoint', async (t) => {
  simularTransaccion(t);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa({
    tipo: 'cuestionario',
    contenido: null,
    notaMinima: 70,
  }));
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  let creado = false;
  t.mock.method(Progreso, 'findOrCreate', async () => {
    creado = true;
    return [progresoFalso(), true];
  });

  await assert.rejects(
    () => marcarLeccionContenidoCompletada(7, 10),
    (error) => error.statusCode === 409 && error.code === 'LECCION_NO_ES_CONTENIDO',
  );
  assert.equal(creado, false);
});

test('a lesson is locked while the previous content lesson is incomplete', async (t) => {
  simularTransaccion(t);
  const primera = leccionFalsa({ id: 10, orden: 1 });
  const segunda = leccionFalsa({ id: 11, orden: 2 });
  t.mock.method(Leccion, 'findByPk', async () => segunda);
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [primera, segunda]);
  t.mock.method(Progreso, 'findOne', async () => progresoFalso({ completada: false }));
  let creado = false;
  t.mock.method(Progreso, 'findOrCreate', async () => {
    creado = true;
    return [progresoFalso(), true];
  });

  await assert.rejects(
    () => marcarLeccionContenidoCompletada(7, 11),
    (error) => error.statusCode === 403 && error.code === 'LECCION_BLOQUEADA',
  );
  assert.equal(creado, false);
});

test('a lesson unlocks when the previous content lesson is complete', async (t) => {
  simularTransaccion(t);
  const primera = leccionFalsa({ id: 10, orden: 1 });
  const segunda = leccionFalsa({ id: 11, orden: 2 });
  t.mock.method(Leccion, 'findByPk', async () => segunda);
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [primera, segunda]);
  t.mock.method(Progreso, 'findOne', async () => progresoFalso({ completada: true }));
  t.mock.method(Progreso, 'findOrCreate', async () => [
    progresoFalso({ id: 22, leccionId: 11 }),
    true,
  ]);

  const progreso = await marcarLeccionContenidoCompletada(7, 11);

  assert.equal(progreso.leccionId, 11);
  assert.equal(progreso.completada, true);
});

test('a previous quiz requires the stored best grade to reach its pass mark', async (t) => {
  simularTransaccion(t);
  const cuestionario = leccionFalsa({
    id: 10,
    tipo: 'cuestionario',
    contenido: null,
    notaMinima: 70,
  });
  const contenido = leccionFalsa({ id: 11, orden: 2 });
  let mejorNota = 60;

  t.mock.method(Leccion, 'findByPk', async () => contenido);
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [cuestionario, contenido]);
  t.mock.method(Progreso, 'findOne', async () => progresoFalso({
    leccionId: 10,
    completada: false,
    mejorNota,
  }));
  t.mock.method(Progreso, 'findOrCreate', async () => [
    progresoFalso({ id: 22, leccionId: 11 }),
    true,
  ]);

  await assert.rejects(
    () => marcarLeccionContenidoCompletada(7, 11),
    (error) => error.statusCode === 403 && error.code === 'LECCION_BLOQUEADA',
  );

  mejorNota = 70;
  const progreso = await marcarLeccionContenidoCompletada(7, 11);

  assert.equal(progreso.leccionId, 11);
  assert.equal(progreso.completada, true);
});

test('POST /api/lecciones/:id/completar requires a student session', async (t) => {
  const baseUrl = await iniciarServidor(t);
  const response = await fetch(`${baseUrl}/api/lecciones/10/completar`, {
    method: 'POST',
  });

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('an instructor cannot mark a lesson as completed', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const response = await fetch(`${baseUrl}/api/lecciones/10/completar`, {
    method: 'POST',
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('the route marks the session student progress and ignores a client student id', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  simularTransaccion(t);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  let consultaInscripcion;
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcionFalsa();
  });
  t.mock.method(Leccion, 'findAll', async () => [leccionFalsa()]);
  t.mock.method(Progreso, 'findOrCreate', async () => [progresoFalso(), true]);

  const response = await fetch(`${baseUrl}/api/lecciones/10/completar`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(7, 'estudiante'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estudianteId: 99 }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.progreso.leccionId, 10);
  assert.equal(body.progreso.completada, true);
  assert.deepEqual(consultaInscripcion.where, { estudianteId: 7, cursoId: 5 });
});

test('invalid lesson ids are rejected before marking progress', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  const response = await fetch(`${baseUrl}/api/lecciones/abc/completar`, {
    method: 'POST',
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 422);
  assert.deepEqual(
    (await response.json()).error.details.map((detail) => detail.campo),
    ['id'],
  );
});
