import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import { Curso, Leccion, Pregunta, Usuario } from '../models/index.js';
import {
  actualizarCuestionarioSchema,
  actualizarPreguntaSchema,
  crearPreguntaSchema,
  preguntaIdParamsSchema,
} from '../schemas/pregunta.js';
import {
  actualizarCuestionarioPropia,
  listarLeccionesPropias,
  toLeccionDetalle,
} from '../services/leccion.service.js';
import { toTemarioItem } from '../services/curso.service.js';
import {
  actualizarPreguntaPropia,
  crearPreguntaPropia,
  eliminarPreguntaPropia,
  toPreguntaDetalle,
} from '../services/pregunta.service.js';
import { signAccessToken } from '../utils/jwt.js';

function cursoFalso(cambios = {}) {
  const curso = {
    id: 5,
    titulo: 'Curso de prueba',
    instructorId: 9,
    ...cambios,
  };

  curso.get = () => ({ ...curso });

  return curso;
}

function leccionFalsa(cambios = {}) {
  const leccion = {
    id: 10,
    titulo: 'Cuestionario final',
    tipo: 'cuestionario',
    contenido: null,
    videoUrl: null,
    orden: 1,
    notaMinima: 70,
    cursoId: 5,
    ...cambios,
  };

  leccion.get = () => ({ ...leccion });
  leccion.save = async () => {};
  leccion.destroy = async () => {};

  return leccion;
}

function preguntaFalsa(cambios = {}) {
  const pregunta = {
    id: 20,
    enunciado: '¿Cuál es la respuesta?',
    opciones: ['A', 'B'],
    indiceCorrecto: 0,
    leccionId: 10,
    ...cambios,
  };

  pregunta.get = () => ({ ...pregunta });
  pregunta.save = async () => {};
  pregunta.destroy = async () => {};

  return pregunta;
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

test('question payloads trim text and reject invalid structures', () => {
  assert.deepEqual(
    crearPreguntaSchema.parse({
      enunciado: '  ¿Cuál es la capital?  ',
      opciones: ['  Lima  ', 'Bogotá'],
      indiceCorrecto: 1,
    }),
    {
      enunciado: '¿Cuál es la capital?',
      opciones: ['Lima', 'Bogotá'],
      indiceCorrecto: 1,
    },
  );

  for (const invalido of [
    { enunciado: '   ', opciones: ['A', 'B'], indiceCorrecto: 0 },
    { enunciado: 'Pregunta', opciones: ['A'], indiceCorrecto: 0 },
    { enunciado: 'Pregunta', opciones: ['A', '   '], indiceCorrecto: 0 },
    { enunciado: 'Pregunta', opciones: ['A', 'B'], indiceCorrecto: 2 },
    { enunciado: 'Pregunta', opciones: ['A', 'B'], indiceCorrecto: -1 },
    { enunciado: 'Pregunta', opciones: ['A', 'B'], indiceCorrecto: 0.5 },
    { enunciado: 'Pregunta', opciones: ['A', 'B'], indiceCorrecto: '0' },
    { enunciado: 'Pregunta', opciones: ['A', 'B'], indiceCorrecto: 0, leccionId: 1 },
    { opciones: ['A', 'B'], indiceCorrecto: 0 },
    { enunciado: 'Pregunta', indiceCorrecto: 0 },
  ]) {
    assert.equal(crearPreguntaSchema.safeParse(invalido).success, false);
  }
});

test('updating a question requires the complete replacement payload', () => {
  assert.equal(
    actualizarPreguntaSchema.safeParse({ enunciado: 'Nuevo' }).success,
    false,
  );
  assert.equal(
    actualizarPreguntaSchema.safeParse({
      enunciado: 'Nuevo',
      opciones: ['A', 'B'],
      indiceCorrecto: 1,
    }).success,
    true,
  );
});

test('the passing grade must be an integer between 1 and 100', () => {
  assert.deepEqual(
    actualizarCuestionarioSchema.parse({ notaMinima: 70 }),
    { notaMinima: 70 },
  );

  for (const invalido of [
    {},
    { notaMinima: 0 },
    { notaMinima: 101 },
    { notaMinima: 70.5 },
    { notaMinima: '70' },
    { notaMinima: 70, extra: true },
  ]) {
    assert.equal(actualizarCuestionarioSchema.safeParse(invalido).success, false);
  }
});

test('question ids reject invalid values', () => {
  for (const id of ['0', '-1', '1.5', 'abc']) {
    assert.equal(preguntaIdParamsSchema.safeParse({ id }).success, false);
  }

  assert.equal(preguntaIdParamsSchema.parse({ id: '4' }).id, 4);
});

test('the question presenter includes the correct index for the instructor editor', () => {
  assert.deepEqual(toPreguntaDetalle(preguntaFalsa()), {
    id: 20,
    enunciado: '¿Cuál es la respuesta?',
    opciones: ['A', 'B'],
    indiceCorrecto: 0,
    leccionId: 10,
  });
});

test('the public outline never exposes questions or correct answers', () => {
  const item = toTemarioItem({
    get: () => ({
      id: 10,
      titulo: 'Cuestionario final',
      tipo: 'cuestionario',
      orden: 1,
      notaMinima: 70,
      preguntas: [
        {
          id: 20,
          enunciado: '¿Pregunta?',
          opciones: ['A', 'B'],
          indiceCorrecto: 0,
        },
      ],
    }),
  });

  assert.deepEqual(item, {
    id: 10,
    titulo: 'Cuestionario final',
    tipo: 'cuestionario',
    orden: 1,
    notaMinima: 70,
  });
  assert.equal('preguntas' in item, false);
});

test('listing own lessons includes quiz questions ordered by id', async (t) => {
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Leccion, 'findAll', async () => [
    leccionFalsa({
      preguntas: [
        {
          id: 22,
          enunciado: 'Segunda',
          opciones: ['A', 'B'],
          indiceCorrecto: 1,
          leccionId: 10,
        },
        {
          id: 21,
          enunciado: 'Primera',
          opciones: ['A', 'B'],
          indiceCorrecto: 0,
          leccionId: 10,
        },
      ],
    }),
    leccionFalsa({
      id: 11,
      tipo: 'contenido',
      contenido: 'Texto',
      notaMinima: null,
    }),
  ]);

  const lecciones = await listarLeccionesPropias(9, 5);

  assert.deepEqual(lecciones[0].preguntas.map((pregunta) => pregunta.id), [21, 22]);
  assert.equal('preguntas' in lecciones[1], false);
});

test('the lesson presenter keeps the existing shape when questions are absent', () => {
  const detalle = toLeccionDetalle(leccionFalsa({ preguntas: undefined }));

  assert.equal('preguntas' in detalle, false);
});

test('creating a question uses the lesson id from the route', async (t) => {
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  let creada;
  t.mock.method(Pregunta, 'create', async (datos) => {
    creada = datos;
    return preguntaFalsa({ ...datos, id: 30 });
  });

  const resultado = await crearPreguntaPropia(9, 10, {
    enunciado: 'Nueva pregunta',
    opciones: ['A', 'B'],
    indiceCorrecto: 1,
  });

  assert.deepEqual(creada, {
    enunciado: 'Nueva pregunta',
    opciones: ['A', 'B'],
    indiceCorrecto: 1,
    leccionId: 10,
  });
  assert.equal(resultado.id, 30);
});

test('creating a question checks ownership and quiz type before writing', async (t) => {
  const actual = {
    leccion: leccionFalsa(),
    curso: cursoFalso(),
  };
  let creada = false;

  t.mock.method(Leccion, 'findByPk', async () => actual.leccion);
  t.mock.method(Curso, 'findByPk', async () => actual.curso);
  t.mock.method(Pregunta, 'create', async () => {
    creada = true;
  });

  const datos = {
    enunciado: 'Nueva pregunta',
    opciones: ['A', 'B'],
    indiceCorrecto: 0,
  };

  actual.leccion = leccionFalsa({ tipo: 'contenido', contenido: 'Texto', notaMinima: null });
  await assert.rejects(
    () => crearPreguntaPropia(9, 10, datos),
    (error) => error.statusCode === 409 && error.code === 'LECCION_NO_ES_CUESTIONARIO',
  );

  actual.leccion = leccionFalsa();
  actual.curso = cursoFalso({ instructorId: 2 });
  await assert.rejects(
    () => crearPreguntaPropia(9, 10, datos),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  actual.curso = cursoFalso();
  actual.leccion = null;
  await assert.rejects(
    () => crearPreguntaPropia(9, 10, datos),
    (error) => error.statusCode === 404 && error.code === 'LECCION_NO_ENCONTRADA',
  );

  assert.equal(creada, false);
});

test('updating a question replaces the three editable fields', async (t) => {
  const pregunta = preguntaFalsa();
  let guardada = false;
  pregunta.save = async () => {
    guardada = true;
  };

  t.mock.method(Pregunta, 'findByPk', async () => pregunta);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  const resultado = await actualizarPreguntaPropia(9, 20, {
    enunciado: 'Pregunta actualizada',
    opciones: ['X', 'Y', 'Z'],
    indiceCorrecto: 2,
  });

  assert.equal(guardada, true);
  assert.equal(resultado.enunciado, 'Pregunta actualizada');
  assert.deepEqual(resultado.opciones, ['X', 'Y', 'Z']);
  assert.equal(resultado.indiceCorrecto, 2);
});

test('updating a missing or foreign question is rejected', async (t) => {
  const actual = {
    pregunta: preguntaFalsa(),
    curso: cursoFalso(),
  };

  t.mock.method(Pregunta, 'findByPk', async () => actual.pregunta);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Curso, 'findByPk', async () => actual.curso);

  const datos = {
    enunciado: 'Pregunta actualizada',
    opciones: ['A', 'B'],
    indiceCorrecto: 0,
  };

  actual.curso = cursoFalso({ instructorId: 2 });
  await assert.rejects(
    () => actualizarPreguntaPropia(9, 20, datos),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  actual.pregunta = null;
  await assert.rejects(
    () => actualizarPreguntaPropia(9, 20, datos),
    (error) => error.statusCode === 404 && error.code === 'PREGUNTA_NO_ENCONTRADA',
  );
});

test('deleting an own question destroys it and a foreign one is rejected', async (t) => {
  const pregunta = preguntaFalsa();
  const actual = { curso: cursoFalso() };
  let destruida = false;
  pregunta.destroy = async () => {
    destruida = true;
  };

  t.mock.method(Pregunta, 'findByPk', async () => pregunta);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Curso, 'findByPk', async () => actual.curso);

  actual.curso = cursoFalso({ instructorId: 2 });
  await assert.rejects(
    () => eliminarPreguntaPropia(9, 20),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );
  assert.equal(destruida, false);

  actual.curso = cursoFalso();
  await eliminarPreguntaPropia(9, 20);
  assert.equal(destruida, true);
});

test('updating the passing grade saves the quiz lesson', async (t) => {
  const leccion = leccionFalsa();
  let guardada = false;
  leccion.save = async () => {
    guardada = true;
  };

  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  const resultado = await actualizarCuestionarioPropia(9, 10, { notaMinima: 85 });

  assert.equal(guardada, true);
  assert.equal(resultado.notaMinima, 85);
});

test('the passing grade rejects content lessons, foreign courses and missing lessons', async (t) => {
  const actual = {
    leccion: leccionFalsa({ tipo: 'contenido', contenido: 'Texto', notaMinima: null }),
    curso: cursoFalso(),
  };

  t.mock.method(Leccion, 'findByPk', async () => actual.leccion);
  t.mock.method(Curso, 'findByPk', async () => actual.curso);

  await assert.rejects(
    () => actualizarCuestionarioPropia(9, 10, { notaMinima: 80 }),
    (error) => error.statusCode === 409 && error.code === 'LECCION_NO_ES_CUESTIONARIO',
  );

  actual.leccion = leccionFalsa();
  actual.curso = cursoFalso({ instructorId: 2 });
  await assert.rejects(
    () => actualizarCuestionarioPropia(9, 10, { notaMinima: 80 }),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  actual.leccion = null;
  await assert.rejects(
    () => actualizarCuestionarioPropia(9, 10, { notaMinima: 80 }),
    (error) => error.statusCode === 404 && error.code === 'LECCION_NO_ENCONTRADA',
  );
});

test('question routes require an instructor session', async (t) => {
  const baseUrl = await iniciarServidor(t);

  for (const [method, path] of [
    ['POST', '/api/lecciones/1/preguntas'],
    ['PATCH', '/api/lecciones/1/cuestionario'],
    ['PUT', '/api/preguntas/1'],
    ['DELETE', '/api/preguntas/1'],
  ]) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : '{}',
    });

    assert.equal(response.status, 401, `${method} ${path}`);
    assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
  }
});

test('a student cannot manage questions', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));

  const response = await fetch(`${baseUrl}/api/lecciones/10/preguntas`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(7, 'estudiante'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enunciado: 'Pregunta',
      opciones: ['A', 'B'],
      indiceCorrecto: 0,
    }),
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('creating a question through the route returns 201', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Pregunta, 'create', async (datos) => preguntaFalsa({ ...datos, id: 30 }));

  const response = await fetch(`${baseUrl}/api/lecciones/10/preguntas`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enunciado: 'Nueva pregunta',
      opciones: ['A', 'B'],
      indiceCorrecto: 1,
    }),
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.pregunta.id, 30);
  assert.equal(body.pregunta.indiceCorrecto, 1);
});

test('question routes return 403, 409 and 404 for the expected cases', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));

  const actual = {
    leccion: leccionFalsa(),
    curso: cursoFalso({ instructorId: 2 }),
  };
  t.mock.method(Leccion, 'findByPk', async () => actual.leccion);
  t.mock.method(Curso, 'findByPk', async () => actual.curso);

  const datos = {
    enunciado: 'Nueva pregunta',
    opciones: ['A', 'B'],
    indiceCorrecto: 0,
  };

  let response = await fetch(`${baseUrl}/api/lecciones/10/preguntas`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'CURSO_NO_PROPIO');

  actual.curso = cursoFalso();
  actual.leccion = leccionFalsa({ tipo: 'contenido', contenido: 'Texto', notaMinima: null });
  response = await fetch(`${baseUrl}/api/lecciones/10/preguntas`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, 'LECCION_NO_ES_CUESTIONARIO');

  actual.leccion = null;
  response = await fetch(`${baseUrl}/api/lecciones/10/preguntas`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'LECCION_NO_ENCONTRADA');
});

test('invalid question payloads and ids are rejected with 422', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));

  let response = await fetch(`${baseUrl}/api/lecciones/10/preguntas`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enunciado: 'Pregunta',
      opciones: ['A'],
      indiceCorrecto: 0,
    }),
  });

  assert.equal(response.status, 422);
  let body = await response.json();
  assert.equal(body.error.code, 'VALIDACION');
  assert.equal(body.error.details.some((detail) => detail.campo === 'opciones'), true);

  response = await fetch(`${baseUrl}/api/preguntas/abc`, {
    method: 'PUT',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enunciado: 'Pregunta',
      opciones: ['A', 'B'],
      indiceCorrecto: 0,
    }),
  });

  assert.equal(response.status, 422);
  body = await response.json();
  assert.deepEqual(
    body.error.details.map((detail) => detail.campo),
    ['id'],
  );
});

test('updating a question and its passing grade through the routes returns 200', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const leccion = leccionFalsa();
  const pregunta = preguntaFalsa();
  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());
  t.mock.method(Pregunta, 'findByPk', async () => pregunta);

  let response = await fetch(`${baseUrl}/api/preguntas/20`, {
    method: 'PUT',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enunciado: 'Pregunta actualizada',
      opciones: ['X', 'Y', 'Z'],
      indiceCorrecto: 2,
    }),
  });

  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.pregunta.enunciado, 'Pregunta actualizada');
  assert.equal(body.pregunta.indiceCorrecto, 2);

  response = await fetch(`${baseUrl}/api/lecciones/10/cuestionario`, {
    method: 'PATCH',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notaMinima: 85 }),
  });

  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.leccion.notaMinima, 85);

  response = await fetch(`${baseUrl}/api/lecciones/10/cuestionario`, {
    method: 'PATCH',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notaMinima: 0 }),
  });

  assert.equal(response.status, 422);
  body = await response.json();
  assert.deepEqual(
    body.error.details.map((detail) => detail.campo),
    ['notaMinima'],
  );
});

test('deleting a question through the route returns 204', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const pregunta = preguntaFalsa();
  let destruida = false;
  pregunta.destroy = async () => {
    destruida = true;
  };
  t.mock.method(Pregunta, 'findByPk', async () => pregunta);
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  const response = await fetch(`${baseUrl}/api/preguntas/20`, {
    method: 'DELETE',
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 204);
  assert.equal(destruida, true);
});
