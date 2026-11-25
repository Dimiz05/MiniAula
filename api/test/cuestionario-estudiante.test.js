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
} from '../models/index.js';
import { obtenerCuestionarioEstudiante } from '../services/leccion.service.js';
import { toPreguntaEstudiante } from '../services/pregunta.service.js';
import { signAccessToken } from '../utils/jwt.js';

function leccionFalsa(cambios = {}) {
  const leccion = {
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

  leccion.get = () => ({ ...leccion });
  return leccion;
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
  const pregunta = {
    id: 41,
    enunciado: '¿Cuál es la capital de Perú?',
    opciones: ['Lima', 'Bogotá', 'Quito'],
    indiceCorrecto: 0,
    leccionId: 12,
    ...cambios,
  };

  pregunta.get = () => ({ ...pregunta });
  return pregunta;
}

function progresoFalso(cambios = {}) {
  return {
    id: 21,
    inscripcionId: 11,
    leccionId: 12,
    completada: false,
    intentos: 0,
    mejorNota: null,
    ...cambios,
  };
}

function prepararCuestionario(t, {
  leccion = leccionFalsa(),
  inscripcion = inscripcionFalsa(),
  lecciones,
  preguntas = [preguntaFalsa()],
  progreso = null,
  progresoAnterior = null,
} = {}) {
  let consultaInscripcion;

  t.mock.method(Leccion, 'findByPk', async () => leccion);
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcion;
  });
  t.mock.method(Leccion, 'findAll', async () => lecciones ?? [leccion]);
  t.mock.method(Pregunta, 'findAll', async () => preguntas);
  t.mock.method(Progreso, 'findOne', async ({ where }) => (
    Number(where.leccionId) === Number(leccion.id) ? progreso : progresoAnterior
  ));

  return {
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

test('the student quiz presenter never exposes the correct option index', () => {
  const pregunta = toPreguntaEstudiante(preguntaFalsa());

  assert.deepEqual(pregunta, {
    id: 41,
    enunciado: '¿Cuál es la capital de Perú?',
    opciones: ['Lima', 'Bogotá', 'Quito'],
    leccionId: 12,
  });
  assert.equal(JSON.stringify(pregunta).includes('indiceCorrecto'), false);
});

test('the quiz read endpoint returns questions and the initial attempt state', async (t) => {
  const { consultaInscripcion } = prepararCuestionario(t);

  const resultado = await obtenerCuestionarioEstudiante(7, 12);

  assert.deepEqual(consultaInscripcion().where, {
    estudianteId: 7,
    cursoId: 5,
  });
  assert.equal(resultado.leccion.id, 12);
  assert.equal(resultado.leccion.titulo, 'Cuestionario final');
  assert.equal(resultado.leccion.notaMinima, 70);
  assert.equal(resultado.leccion.preguntas.length, 1);
  assert.equal(resultado.leccion.preguntas[0].enunciado, '¿Cuál es la capital de Perú?');
  assert.equal(
    JSON.stringify(resultado).includes('indiceCorrecto'),
    false,
  );
  assert.deepEqual(resultado.intento, {
    aprobada: false,
    mejorNota: null,
    notaMinima: 70,
    intentos: 0,
    intentosDisponibles: 3,
  });
});

test('the quiz read endpoint reports the stored attempts and best grade', async (t) => {
  prepararCuestionario(t, {
    progreso: progresoFalso({ intentos: 1, mejorNota: 85 }),
  });

  const resultado = await obtenerCuestionarioEstudiante(7, 12);

  assert.deepEqual(resultado.intento, {
    aprobada: true,
    mejorNota: 85,
    notaMinima: 70,
    intentos: 1,
    intentosDisponibles: 2,
  });
});

test('the quiz read endpoint rejects a student outside the course', async (t) => {
  prepararCuestionario(t, { inscripcion: null });

  await assert.rejects(
    () => obtenerCuestionarioEstudiante(7, 12),
    (error) => error.statusCode === 403 && error.code === 'NO_INSCRITO',
  );
});

test('the quiz read endpoint rejects a content lesson', async (t) => {
  prepararCuestionario(t, {
    leccion: leccionFalsa({
      tipo: 'contenido',
      contenido: 'Texto',
      notaMinima: null,
    }),
  });

  await assert.rejects(
    () => obtenerCuestionarioEstudiante(7, 12),
    (error) => error.statusCode === 409
      && error.code === 'LECCION_NO_ES_CUESTIONARIO',
  );
});

test('the quiz read endpoint rejects a locked quiz', async (t) => {
  const anterior = leccionFalsa({ id: 10, orden: 1, tipo: 'contenido' });
  const cuestionario = leccionFalsa({ id: 12, orden: 2 });
  prepararCuestionario(t, {
    leccion: cuestionario,
    lecciones: [anterior, cuestionario],
    progresoAnterior: progresoFalso({
      leccionId: 10,
      completada: false,
    }),
  });

  await assert.rejects(
    () => obtenerCuestionarioEstudiante(7, 12),
    (error) => error.statusCode === 403 && error.code === 'LECCION_BLOQUEADA',
  );
});

test('GET /api/lecciones/:id/cuestionario requires a student session', async (t) => {
  const baseUrl = await iniciarServidor(t);

  const sinSesion = await fetch(`${baseUrl}/api/lecciones/12/cuestionario`);
  assert.equal(sinSesion.status, 401);
  assert.equal((await sinSesion.json()).error.code, 'NO_AUTENTICADO');

  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  const instructor = await fetch(`${baseUrl}/api/lecciones/12/cuestionario`, {
    headers: { Authorization: tokenDe(9, 'instructor') },
  });
  assert.equal(instructor.status, 403);
  assert.equal((await instructor.json()).error.code, 'SIN_PERMISO');
});

test('the quiz route returns sanitized questions for the session student', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  prepararCuestionario(t, {
    progreso: progresoFalso({ intentos: 2, mejorNota: 60 }),
  });

  const response = await fetch(`${baseUrl}/api/lecciones/12/cuestionario`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.leccion.id, 12);
  assert.equal(body.leccion.preguntas[0].opciones[0], 'Lima');
  assert.equal(JSON.stringify(body).includes('indiceCorrecto'), false);
  assert.deepEqual(body.intento, {
    aprobada: false,
    mejorNota: 60,
    notaMinima: 70,
    intentos: 2,
    intentosDisponibles: 1,
  });
});

test('invalid quiz ids are rejected before the quiz service runs', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  let leccionConsultada = false;
  t.mock.method(Leccion, 'findByPk', async () => {
    leccionConsultada = true;
    return leccionFalsa();
  });

  const response = await fetch(`${baseUrl}/api/lecciones/abc/cuestionario`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 422);
  assert.deepEqual(
    (await response.json()).error.details.map((detail) => detail.campo),
    ['id'],
  );
  assert.equal(leccionConsultada, false);
});
