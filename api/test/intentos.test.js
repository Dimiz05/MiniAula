import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import {
  Inscripcion,
  Leccion,
  Pregunta,
  Progreso,
  Usuario,
  sequelize,
} from '../models/index.js';
import {
  calificarRespuestas,
  INTENTOS_MAXIMOS,
  registrarIntento,
  toIntentoResultado,
} from '../services/intento.service.js';
import { signAccessToken } from '../utils/jwt.js';

const TRANSACCION = { LOCK: { UPDATE: 'UPDATE' } };
const FECHA = new Date('2026-11-24T10:00:00.000Z');

function leccionFalsa(cambios = {}) {
  return {
    id: 12,
    titulo: 'Cuestionario final',
    tipo: 'cuestionario',
    contenido: null,
    videoUrl: null,
    orden: 1,
    notaMinima: 70,
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

function preguntaFalsa(cambios = {}) {
  return {
    id: 41,
    enunciado: '¿Cuál es la respuesta?',
    opciones: ['A', 'B', 'C'],
    indiceCorrecto: 1,
    leccionId: 12,
    ...cambios,
  };
}

function progresoFalso(cambios = {}) {
  const progreso = {
    id: 21,
    inscripcionId: 11,
    leccionId: 12,
    completada: false,
    intentos: 0,
    mejorNota: null,
    actualizadoEn: FECHA,
    ...cambios,
  };

  progreso.save = async () => {};
  return progreso;
}

function simularTransaccion(t) {
  t.mock.method(sequelize, 'transaction', async (callback) => callback(TRANSACCION));
}

function prepararIntento(t, {
  leccion = leccionFalsa(),
  inscripcion = inscripcionFalsa(),
  lecciones,
  preguntas = [preguntaFalsa()],
  progreso = progresoFalso(),
  progresoAnterior,
  guardar,
} = {}) {
  let creado = false;
  let consultaInscripcion;

  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcion;
  });
  t.mock.method(Leccion, 'findAll', async () => lecciones ?? [leccion]);
  t.mock.method(Pregunta, 'findAll', async () => preguntas);
  t.mock.method(Progreso, 'findOrCreate', async () => {
    creado = true;
    return [progreso, true];
  });
  t.mock.method(Progreso, 'findOne', async (opciones) => (
    opciones.lock === TRANSACCION.LOCK.UPDATE ? progreso : progresoAnterior
  ));

  if (guardar) {
    progreso.save = guardar;
  }

  return {
    progreso,
    fueCreado: () => creado,
    consultaInscripcion: () => consultaInscripcion,
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

test('grading counts correct answers and rounds the score to an integer', () => {
  const preguntas = [
    preguntaFalsa({ id: 41, indiceCorrecto: 1 }),
    preguntaFalsa({ id: 42, indiceCorrecto: 0 }),
    preguntaFalsa({ id: 43, indiceCorrecto: 2 }),
  ];

  assert.deepEqual(
    calificarRespuestas(preguntas, [
      { preguntaId: 41, opcion: 1 },
      { preguntaId: 42, opcion: 0 },
      { preguntaId: 43, opcion: 0 },
    ]),
    { correctas: 2, total: 3, nota: 67 },
  );

  assert.deepEqual(
    calificarRespuestas(preguntas, [
      { preguntaId: 41, opcion: 0 },
      { preguntaId: 42, opcion: 1 },
      { preguntaId: 43, opcion: 0 },
    ]),
    { correctas: 0, total: 3, nota: 0 },
  );

  assert.deepEqual(
    calificarRespuestas([], []),
    { correctas: 0, total: 0, nota: 0 },
  );
});

test('the attempt result exposes safe fields and approval by best grade', () => {
  const resultado = toIntentoResultado(
    progresoFalso({ intentos: 2, mejorNota: 85 }),
    leccionFalsa(),
    60,
  );

  assert.deepEqual(resultado, {
    nota: 60,
    aprobada: true,
    mejorNota: 85,
    notaMinima: 70,
    intentos: 2,
    intentosDisponibles: 1,
  });
  assert.equal(JSON.stringify(resultado).includes('indiceCorrecto'), false);
});

test('an enrolled student passes a quiz and stores the first attempt', async (t) => {
  simularTransaccion(t);
  let opcionesGuardado;
  const { progreso, consultaInscripcion } = prepararIntento(t, {
    guardar: async (opciones) => {
      opcionesGuardado = opciones;
    },
  });

  const resultado = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 1 },
  ]);

  assert.deepEqual(resultado, {
    nota: 100,
    aprobada: true,
    mejorNota: 100,
    notaMinima: 70,
    intentos: 1,
    intentosDisponibles: 2,
  });
  assert.equal(progreso.intentos, 1);
  assert.equal(progreso.mejorNota, 100);
  assert.equal(opcionesGuardado.transaction, TRANSACCION);
  assert.deepEqual(consultaInscripcion().where, { estudianteId: 7, cursoId: 5 });
});

test('a wrong answer stores a failing score without approving the quiz', async (t) => {
  simularTransaccion(t);
  const { progreso } = prepararIntento(t);

  const resultado = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 0 },
  ]);

  assert.equal(resultado.nota, 0);
  assert.equal(resultado.aprobada, false);
  assert.equal(resultado.mejorNota, 0);
  assert.equal(resultado.intentos, 1);
  assert.equal(resultado.intentosDisponibles, 2);
  assert.equal(progreso.mejorNota, 0);
});

test('a lower retry keeps the previous best grade and approval', async (t) => {
  simularTransaccion(t);
  const progreso = progresoFalso({ intentos: 1, mejorNota: 90 });
  prepararIntento(t, { progreso });

  const resultado = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 0 },
  ]);

  assert.equal(resultado.nota, 0);
  assert.equal(resultado.mejorNota, 90);
  assert.equal(resultado.aprobada, true);
  assert.equal(resultado.intentos, 2);
  assert.equal(resultado.intentosDisponibles, 1);
  assert.equal(progreso.mejorNota, 90);
});

test('a higher retry replaces the previous best grade', async (t) => {
  simularTransaccion(t);
  const progreso = progresoFalso({ intentos: 1, mejorNota: 60 });
  prepararIntento(t, { progreso });

  const resultado = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 1 },
  ]);

  assert.equal(resultado.nota, 100);
  assert.equal(resultado.mejorNota, 100);
  assert.equal(resultado.aprobada, true);
  assert.equal(resultado.intentos, 2);
  assert.equal(progreso.mejorNota, 100);
});

test('the third stored attempt leaves no attempts available', async (t) => {
  simularTransaccion(t);
  const progreso = progresoFalso({ intentos: 2, mejorNota: 70 });
  prepararIntento(t, { progreso });

  const resultado = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 1 },
  ]);

  assert.equal(resultado.intentos, INTENTOS_MAXIMOS);
  assert.equal(resultado.intentosDisponibles, 0);
  assert.equal(progreso.intentos, INTENTOS_MAXIMOS);
});

test('a fourth attempt is rejected without saving progress', async (t) => {
  simularTransaccion(t);
  let guardado = false;
  const progreso = progresoFalso({ intentos: INTENTOS_MAXIMOS, mejorNota: 100 });
  prepararIntento(t, {
    progreso,
    guardar: async () => {
      guardado = true;
    },
  });

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]),
    (error) => error.statusCode === 409 && error.code === 'INTENTOS_AGOTADOS',
  );
  assert.equal(guardado, false);
});

test('a missing answer is rejected without consuming an attempt', async (t) => {
  const { fueCreado } = prepararIntento(t, {
    preguntas: [
      preguntaFalsa(),
      preguntaFalsa({ id: 42, indiceCorrecto: 0 }),
    ],
  });

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]),
    (error) => error.statusCode === 422 && error.code === 'VALIDACION',
  );
  assert.equal(fueCreado(), false);
});

test('a duplicated question is rejected without consuming an attempt', async (t) => {
  const { fueCreado } = prepararIntento(t, {
    preguntas: [
      preguntaFalsa(),
      preguntaFalsa({ id: 42, indiceCorrecto: 0 }),
    ],
  });

  await assert.rejects(
    () => registrarIntento(7, 12, [
      { preguntaId: 41, opcion: 1 },
      { preguntaId: 41, opcion: 0 },
      { preguntaId: 42, opcion: 0 },
    ]),
    (error) => error.statusCode === 422 && error.code === 'VALIDACION',
  );
  assert.equal(fueCreado(), false);
});

test('a question from another quiz is rejected', async (t) => {
  const { fueCreado } = prepararIntento(t);

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 99, opcion: 0 }]),
    (error) => error.statusCode === 422 && error.code === 'VALIDACION',
  );
  assert.equal(fueCreado(), false);
});

test('an option outside the question range is rejected', async (t) => {
  const { fueCreado } = prepararIntento(t);

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 3 }]),
    (error) => error.statusCode === 422 && error.code === 'VALIDACION',
  );
  assert.equal(fueCreado(), false);
});

test('a quiz without questions cannot be graded', async (t) => {
  const { fueCreado } = prepararIntento(t, { preguntas: [] });

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]),
    (error) => error.statusCode === 409
      && error.code === 'CUESTIONARIO_SIN_PREGUNTAS',
  );
  assert.equal(fueCreado(), false);
});

test('a content lesson cannot be graded as a quiz', async (t) => {
  const { fueCreado } = prepararIntento(t, {
    leccion: leccionFalsa({
      tipo: 'contenido',
      contenido: 'Texto',
      notaMinima: null,
    }),
  });

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]),
    (error) => error.statusCode === 409
      && error.code === 'LECCION_NO_ES_CUESTIONARIO',
  );
  assert.equal(fueCreado(), false);
});

test('a student outside the course cannot submit an attempt', async (t) => {
  const { fueCreado } = prepararIntento(t, { inscripcion: null });

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]),
    (error) => error.statusCode === 403 && error.code === 'NO_INSCRITO',
  );
  assert.equal(fueCreado(), false);
});

test('a missing lesson returns 404', async (t) => {
  t.mock.method(Leccion, 'findByPk', async () => null);

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]),
    (error) => error.statusCode === 404
      && error.code === 'LECCION_NO_ENCONTRADA',
  );
});

test('a locked quiz follows the existing sequential unlock rule', async (t) => {
  const primera = leccionFalsa({
    id: 10,
    orden: 1,
    tipo: 'contenido',
    contenido: 'Texto',
    notaMinima: null,
  });
  const cuestionario = leccionFalsa({ id: 12, orden: 2 });

  const { fueCreado } = prepararIntento(t, {
    leccion: cuestionario,
    lecciones: [primera, cuestionario],
    progresoAnterior: progresoFalso({
      leccionId: 10,
      completada: false,
      intentos: 0,
      mejorNota: null,
    }),
  });

  await assert.rejects(
    () => registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]),
    (error) => error.statusCode === 403 && error.code === 'LECCION_BLOQUEADA',
  );
  assert.equal(fueCreado(), false);
});

test('POST /api/lecciones/:id/intentos requires a student session', async (t) => {
  const baseUrl = await iniciarServidor(t);
  const response = await fetch(`${baseUrl}/api/lecciones/12/intentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ respuestas: [{ preguntaId: 41, opcion: 1 }] }),
  });

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('an instructor cannot submit a quiz attempt', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));

  const response = await fetch(`${baseUrl}/api/lecciones/12/intentos`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ respuestas: [{ preguntaId: 41, opcion: 1 }] }),
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('the route grades the session student attempt and returns safe fields', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  simularTransaccion(t);
  const { consultaInscripcion } = prepararIntento(t);

  const response = await fetch(`${baseUrl}/api/lecciones/12/intentos`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(7, 'estudiante'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ respuestas: [{ preguntaId: 41, opcion: 1 }] }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.intento, {
    nota: 100,
    aprobada: true,
    mejorNota: 100,
    notaMinima: 70,
    intentos: 1,
    intentosDisponibles: 2,
  });
  assert.equal(JSON.stringify(body).includes('indiceCorrecto'), false);
  assert.equal(JSON.stringify(body).includes('opciones'), false);
  assert.deepEqual(consultaInscripcion().where, { estudianteId: 7, cursoId: 5 });
});

test('the attempt body rejects fields that try to set the score or attempts', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));

  const response = await fetch(`${baseUrl}/api/lecciones/12/intentos`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(7, 'estudiante'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      respuestas: [{ preguntaId: 41, opcion: 1 }],
      nota: 100,
      intentos: 1,
      mejorNota: 100,
    }),
  });

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, 'VALIDACION');
  assert.deepEqual(
    body.error.details.map((detail) => detail.campo).sort(),
    ['intentos', 'mejorNota', 'nota'],
  );
});

test('a negative option is rejected by request validation', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));

  const response = await fetch(`${baseUrl}/api/lecciones/12/intentos`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(7, 'estudiante'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ respuestas: [{ preguntaId: 41, opcion: -1 }] }),
  });

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.deepEqual(
    body.error.details.map((detail) => detail.campo),
    ['respuestas.0.opcion'],
  );
});

test('an invalid lesson id is rejected before grading', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));

  const response = await fetch(`${baseUrl}/api/lecciones/abc/intentos`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(7, 'estudiante'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ respuestas: [{ preguntaId: 41, opcion: 1 }] }),
  });

  assert.equal(response.status, 422);
  assert.deepEqual(
    (await response.json()).error.details.map((detail) => detail.campo),
    ['id'],
  );
});
