import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import { Curso, Leccion, Usuario, sequelize } from '../models/index.js';
import {
  actualizarLeccionSchema,
  crearLeccionSchema,
  leccionIdParamsSchema,
  reordenarLeccionesSchema,
} from '../schemas/leccion.js';
import {
  actualizarLeccionPropia,
  crearLeccionPropia,
  eliminarLeccionPropia,
  listarLeccionesPropias,
  reordenarLeccionesPropias,
  toLeccionDetalle,
} from '../services/leccion.service.js';
import { signAccessToken } from '../utils/jwt.js';

const TRANSACCION = { LOCK: { UPDATE: 'UPDATE' } };

function cursoFalso(cambios = {}) {
  const curso = {
    id: 5,
    titulo: 'Curso de prueba',
    instructorId: 9,
    ...cambios,
  };

  curso.get = () => ({ ...curso });
  curso.save = async () => {};
  curso.destroy = async () => {};

  return curso;
}

function leccionFalsa(cambios = {}) {
  const leccion = {
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

  leccion.get = () => ({ ...leccion });
  leccion.save = async () => {};
  leccion.destroy = async () => {};

  return leccion;
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

test('creating a content lesson trims input and rejects quiz or server fields', () => {
  const datos = crearLeccionSchema.parse({
    titulo: '  Introducción  ',
    contenido: '  Texto  ',
    videoUrl: '  https://videos.example.com/intro.mp4  ',
  });

  assert.deepEqual(datos, {
    titulo: 'Introducción',
    contenido: 'Texto',
    videoUrl: 'https://videos.example.com/intro.mp4',
  });

  assert.deepEqual(
    crearLeccionSchema.parse({
      titulo: 'Introducción',
      contenido: 'Texto',
      videoUrl: '   ',
    }),
    {
      titulo: 'Introducción',
      contenido: 'Texto',
      videoUrl: '',
    },
  );

  assert.equal(
    crearLeccionSchema.parse({
      titulo: 'Introducción',
      contenido: 'Texto',
      tipo: 'contenido',
    }).tipo,
    'contenido',
  );

  for (const invalido of [
    { titulo: 'ab', contenido: 'Texto' },
    { titulo: 'Introducción', contenido: '   ' },
    { titulo: 'Introducción', contenido: 'Texto', videoUrl: 'no-es-url' },
    { titulo: 'Introducción', contenido: 'Texto', videoUrl: 'ftp://videos.example.com/intro.mp4' },
    { titulo: 'Introducción', contenido: 'Texto', tipo: 'cuestionario' },
    { titulo: 'Introducción', contenido: 'Texto', orden: 1 },
    { titulo: 'Introducción', contenido: 'Texto', cursoId: 5 },
  ]) {
    assert.equal(crearLeccionSchema.safeParse(invalido).success, false);
  }
});

test('updating a lesson only accepts editable fields and at least one change', () => {
  assert.deepEqual(
    actualizarLeccionSchema.parse({ titulo: '  Nuevo título  ' }),
    { titulo: 'Nuevo título' },
  );
  assert.deepEqual(
    actualizarLeccionSchema.parse({ videoUrl: '' }),
    { videoUrl: '' },
  );

  const vacio = actualizarLeccionSchema.safeParse({});
  assert.equal(vacio.success, false);
  assert.match(vacio.error.issues[0].message, /al menos un campo/i);

  for (const invalido of [
    { tipo: 'contenido' },
    { orden: 2 },
    { cursoId: 5 },
    { contenido: '   ' },
  ]) {
    assert.equal(actualizarLeccionSchema.safeParse(invalido).success, false);
  }
});

test('reordering requires a list of positive integer ids', () => {
  assert.deepEqual(
    reordenarLeccionesSchema.parse({ orden: [3, 1, 2] }),
    { orden: [3, 1, 2] },
  );
  assert.deepEqual(reordenarLeccionesSchema.parse({ orden: [] }), { orden: [] });

  for (const invalido of [
    {},
    { orden: [0] },
    { orden: [-1] },
    { orden: [1.5] },
    { orden: ['abc'] },
    { orden: [1], extra: true },
  ]) {
    assert.equal(reordenarLeccionesSchema.safeParse(invalido).success, false);
  }
});

test('lesson ids reject invalid values', () => {
  for (const id of ['0', '-2', '1.5', 'abc']) {
    assert.equal(leccionIdParamsSchema.safeParse({ id }).success, false);
  }

  assert.equal(leccionIdParamsSchema.parse({ id: '7' }).id, 7);
});

test('the lesson presenter keeps the existing shape when questions are not loaded', () => {
  const detalle = toLeccionDetalle(
    leccionFalsa({ tipo: 'cuestionario', notaMinima: 70 }),
  );

  assert.deepEqual(detalle, {
    id: 10,
    titulo: 'Introducción',
    tipo: 'cuestionario',
    contenido: 'Texto de la lección',
    videoUrl: null,
    orden: 1,
    notaMinima: 70,
    cursoId: 5,
  });
  assert.equal('preguntas' in detalle, false);
});

test('listing own lessons checks ownership and returns full lessons', async (t) => {
  const actual = { curso: cursoFalso() };
  t.mock.method(Curso, 'findByPk', async () => actual.curso);
  t.mock.method(Leccion, 'findAll', async () => [leccionFalsa()]);

  const lecciones = await listarLeccionesPropias(9, 5);

  assert.equal(lecciones.length, 1);
  assert.equal(lecciones[0].contenido, 'Texto de la lección');

  actual.curso = cursoFalso({ instructorId: 2 });
  await assert.rejects(
    () => listarLeccionesPropias(9, 5),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  actual.curso = null;
  await assert.rejects(
    () => listarLeccionesPropias(9, 5),
    (error) => error.statusCode === 404 && error.code === 'CURSO_NO_ENCONTRADO',
  );
});

test('creating a lesson appends it to the course order', async (t) => {
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Leccion, 'max', async () => 3);

  let creada;
  t.mock.method(Leccion, 'create', async (datos, opciones) => {
    creada = { datos, opciones };
    return leccionFalsa({ ...datos, id: 15, orden: datos.orden });
  });

  const resultado = await crearLeccionPropia(9, 5, {
    titulo: 'Nueva lección',
    contenido: 'Contenido nuevo',
    videoUrl: '',
  });

  assert.equal(creada.datos.tipo, 'contenido');
  assert.equal(creada.datos.orden, 4);
  assert.equal(creada.datos.cursoId, 5);
  assert.equal(creada.datos.videoUrl, null);
  assert.equal(creada.opciones.transaction, TRANSACCION);
  assert.equal(resultado.orden, 4);
});

test('creating a lesson on a foreign or missing course fails before creating', async (t) => {
  simularTransaccion(t);
  const actual = { curso: cursoFalso({ instructorId: 2 }) };
  t.mock.method(Curso, 'findByPk', async () => actual.curso);

  let creada = false;
  t.mock.method(Leccion, 'create', async () => {
    creada = true;
  });

  const datos = { titulo: 'Nueva lección', contenido: 'Contenido nuevo' };

  await assert.rejects(
    () => crearLeccionPropia(9, 5, datos),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );
  assert.equal(creada, false);

  actual.curso = null;
  await assert.rejects(
    () => crearLeccionPropia(9, 5, datos),
    (error) => error.statusCode === 404 && error.code === 'CURSO_NO_ENCONTRADO',
  );
  assert.equal(creada, false);
});

test('updating a lesson saves only the received content fields', async (t) => {
  const leccion = leccionFalsa();
  let guardada = false;
  leccion.save = async () => {
    guardada = true;
  };
  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  const resultado = await actualizarLeccionPropia(9, 10, {
    titulo: 'Nuevo título',
    videoUrl: '',
  });

  assert.equal(guardada, true);
  assert.equal(resultado.titulo, 'Nuevo título');
  assert.equal(leccion.videoUrl, null);
});

test('updating a quiz lesson is rejected in this phase', async (t) => {
  const leccion = leccionFalsa({ tipo: 'cuestionario', notaMinima: 70 });
  let guardada = false;
  leccion.save = async () => {
    guardada = true;
  };
  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  await assert.rejects(
    () => actualizarLeccionPropia(9, 10, { titulo: 'Nuevo título' }),
    (error) => error.statusCode === 409 && error.code === 'LECCION_NO_ES_CONTENIDO',
  );
  assert.equal(guardada, false);
});

test('updating a missing or foreign lesson is rejected', async (t) => {
  const actual = { leccion: leccionFalsa() };
  t.mock.method(Leccion, 'findByPk', async () => actual.leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso({ instructorId: 2 }));

  await assert.rejects(
    () => actualizarLeccionPropia(9, 10, { titulo: 'Nuevo título' }),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  actual.leccion = null;
  await assert.rejects(
    () => actualizarLeccionPropia(9, 10, { titulo: 'Nuevo título' }),
    (error) => error.statusCode === 404 && error.code === 'LECCION_NO_ENCONTRADA',
  );
});

test('deleting an own lesson destroys it inside a transaction', async (t) => {
  simularTransaccion(t);
  const leccion = leccionFalsa();
  let destruida = false;
  leccion.destroy = async (opciones) => {
    destruida = true;
    assert.equal(opciones.transaction, TRANSACCION);
  };
  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  await eliminarLeccionPropia(9, 10);

  assert.equal(destruida, true);
});

test('deleting a foreign lesson is rejected without destroying it', async (t) => {
  simularTransaccion(t);
  const leccion = leccionFalsa();
  let destruida = false;
  leccion.destroy = async () => {
    destruida = true;
  };
  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso({ instructorId: 2 }));

  await assert.rejects(
    () => eliminarLeccionPropia(9, 10),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );
  assert.equal(destruida, false);
});

test('deleting a missing lesson returns 404 before opening a transaction', async (t) => {
  let abierta = false;
  t.mock.method(sequelize, 'transaction', async () => {
    abierta = true;
  });
  t.mock.method(Leccion, 'findByPk', async () => null);

  await assert.rejects(
    () => eliminarLeccionPropia(9, 10),
    (error) => error.statusCode === 404 && error.code === 'LECCION_NO_ENCONTRADA',
  );
  assert.equal(abierta, false);
});

test('reordering rewrites the full sequence from the received ids', async (t) => {
  simularTransaccion(t);
  const filas = [
    leccionFalsa({ id: 10, orden: 1 }),
    leccionFalsa({ id: 11, orden: 2 }),
    leccionFalsa({ id: 12, orden: 3 }),
  ];
  const updates = [];

  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Leccion, 'findAll', async () => [...filas].sort((a, b) => a.orden - b.orden));
  t.mock.method(Leccion, 'update', async (cambios, opciones) => {
    updates.push([
      cambios.orden,
      opciones.where.id,
      opciones.where.cursoId,
      opciones.transaction,
    ]);
    filas.find((fila) => fila.id === opciones.where.id).orden = cambios.orden;
    return [1];
  });

  const lecciones = await reordenarLeccionesPropias(9, 5, [12, 10, 11]);

  assert.deepEqual(updates, [
    [1, 12, 5, TRANSACCION],
    [2, 10, 5, TRANSACCION],
    [3, 11, 5, TRANSACCION],
  ]);
  assert.deepEqual(lecciones.map((leccion) => leccion.id), [12, 10, 11]);
});

test('reordering rejects missing, duplicate or foreign ids', async (t) => {
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Leccion, 'findAll', async () => [
    { id: 10 },
    { id: 11 },
    { id: 12 },
  ]);

  let actualizadas = 0;
  t.mock.method(Leccion, 'update', async () => {
    actualizadas += 1;
    return [1];
  });

  for (const orden of [[], [10, 11], [10, 10, 11], [10, 11, 12, 99]]) {
    await assert.rejects(
      () => reordenarLeccionesPropias(9, 5, orden),
      (error) => error.statusCode === 409 && error.code === 'ORDEN_LECCIONES_INVALIDO',
    );
  }

  assert.equal(actualizadas, 0);
});

test('reordering an empty course with an empty list is a no-op', async (t) => {
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Leccion, 'findAll', async () => []);

  const lecciones = await reordenarLeccionesPropias(9, 5, []);

  assert.deepEqual(lecciones, []);
});

test('reordering a foreign or missing course is rejected', async (t) => {
  simularTransaccion(t);
  const actual = { curso: cursoFalso({ instructorId: 2 }) };
  t.mock.method(Curso, 'findByPk', async () => actual.curso);

  await assert.rejects(
    () => reordenarLeccionesPropias(9, 5, [10]),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  actual.curso = null;
  await assert.rejects(
    () => reordenarLeccionesPropias(9, 5, [10]),
    (error) => error.statusCode === 404 && error.code === 'CURSO_NO_ENCONTRADO',
  );
});

test('lesson routes require an instructor session', async (t) => {
  const baseUrl = await iniciarServidor(t);

  for (const [method, path] of [
    ['POST', '/api/cursos/1/lecciones'],
    ['PATCH', '/api/cursos/1/lecciones/orden'],
    ['PUT', '/api/lecciones/1'],
    ['DELETE', '/api/lecciones/1'],
  ]) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : '{}',
    });

    assert.equal(response.status, 401, `${method} ${path}`);
    const body = await response.json();
    assert.equal(body.error.code, 'NO_AUTENTICADO');
  }
});

test('creating a lesson through the route returns 201', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Leccion, 'max', async () => 0);
  t.mock.method(Leccion, 'create', async (datos) => leccionFalsa({ ...datos, id: 15 }));

  const response = await fetch(`${baseUrl}/api/cursos/5/lecciones`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ titulo: 'Nueva lección', contenido: 'Contenido' }),
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.leccion.id, 15);
  assert.equal(body.leccion.tipo, 'contenido');
  assert.equal(body.leccion.orden, 1);
});

test('updating a lesson through the route returns 200', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const leccion = leccionFalsa();
  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  const response = await fetch(`${baseUrl}/api/lecciones/10`, {
    method: 'PUT',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ titulo: 'Actualizado' }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).leccion.titulo, 'Actualizado');
});

test('deleting a lesson through the route returns 204', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  simularTransaccion(t);
  const leccion = leccionFalsa();
  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  const response = await fetch(`${baseUrl}/api/lecciones/10`, {
    method: 'DELETE',
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 204);
});

test('an incomplete order through the route returns 409', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Leccion, 'findAll', async () => [{ id: 10 }, { id: 11 }]);

  const response = await fetch(`${baseUrl}/api/cursos/5/lecciones/orden`, {
    method: 'PATCH',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orden: [] }),
  });

  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, 'ORDEN_LECCIONES_INVALIDO');
});

test('invalid lesson ids are rejected through the route', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));

  const response = await fetch(`${baseUrl}/api/lecciones/abc`, {
    method: 'PUT',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ titulo: 'Actualizado' }),
  });

  assert.equal(response.status, 422);
  assert.deepEqual(
    (await response.json()).error.details.map((detail) => detail.campo),
    ['id'],
  );
});
