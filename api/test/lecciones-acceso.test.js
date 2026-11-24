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
  obtenerLeccionEstudiante,
  toLeccionEstudiante,
} from '../services/leccion.service.js';
import { signAccessToken } from '../utils/jwt.js';

const FECHA = new Date('2026-11-24T10:00:00.000Z');

function leccionFalsa(cambios = {}) {
  const leccion = {
    id: 10,
    titulo: 'Introducción',
    tipo: 'contenido',
    contenido: 'Texto privado de la lección',
    videoUrl: null,
    orden: 1,
    notaMinima: null,
    cursoId: 5,
    ...cambios,
  };

  leccion.get = () => ({ ...leccion });
  return leccion;
}

function inscripcionFalsa(cambios = {}) {
  const inscripcion = {
    id: 11,
    estudianteId: 7,
    cursoId: 5,
    completado: false,
    ...cambios,
  };

  inscripcion.get = () => ({ ...inscripcion });
  return inscripcion;
}

function progresoFalso(cambios = {}) {
  return {
    id: 21,
    inscripcionId: 11,
    leccionId: 10,
    completada: false,
    intentos: 0,
    mejorNota: null,
    actualizadoEn: FECHA,
    ...cambios,
  };
}

function cursoPublicoFalso(cambios = {}) {
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

test('the student lesson presenter returns the content of a content lesson', () => {
  const leccion = toLeccionEstudiante(leccionFalsa({
    videoUrl: 'https://videos.example.com/leccion.mp4',
  }));

  assert.deepEqual(leccion, {
    id: 10,
    titulo: 'Introducción',
    tipo: 'contenido',
    contenido: 'Texto privado de la lección',
    videoUrl: 'https://videos.example.com/leccion.mp4',
    orden: 1,
    notaMinima: null,
    cursoId: 5,
  });
});

test('the student lesson presenter never exposes quiz questions or answers', () => {
  const leccion = toLeccionEstudiante(leccionFalsa({
    tipo: 'cuestionario',
    contenido: null,
    notaMinima: 70,
    preguntas: [{
      id: 1,
      enunciado: '¿Constante?',
      opciones: ['var', 'const'],
      indiceCorrecto: 1,
    }],
  }));

  assert.equal(leccion.contenido, null);
  assert.equal(leccion.videoUrl, null);
  assert.equal(leccion.notaMinima, 70);
  assert.equal('preguntas' in leccion, false);
  assert.equal(JSON.stringify(leccion).includes('indiceCorrecto'), false);
});

test('an enrolled student receives the first lesson with its content', async (t) => {
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  let consultaInscripcion;
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcionFalsa();
  });
  t.mock.method(Leccion, 'findAll', async () => [leccionFalsa()]);
  let progresoConsultado = false;
  t.mock.method(Progreso, 'findOne', async () => {
    progresoConsultado = true;
    return null;
  });

  const leccion = await obtenerLeccionEstudiante(7, 10);

  assert.deepEqual(consultaInscripcion.where, { estudianteId: 7, cursoId: 5 });
  assert.equal(progresoConsultado, false);
  assert.equal(leccion.contenido, 'Texto privado de la lección');
});

test('a student who is not enrolled cannot access lesson content', async (t) => {
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  t.mock.method(Inscripcion, 'findOne', async () => null);

  await assert.rejects(
    () => obtenerLeccionEstudiante(7, 10),
    (error) => error.statusCode === 403 && error.code === 'NO_INSCRITO',
  );
});

test('a missing lesson returns 404 before checking enrollment', async (t) => {
  t.mock.method(Leccion, 'findByPk', async () => null);
  let inscripcionConsultada = false;
  t.mock.method(Inscripcion, 'findOne', async () => {
    inscripcionConsultada = true;
    return null;
  });

  await assert.rejects(
    () => obtenerLeccionEstudiante(7, 99),
    (error) => error.statusCode === 404 && error.code === 'LECCION_NO_ENCONTRADA',
  );
  assert.equal(inscripcionConsultada, false);
});

test('a lesson stays locked while the previous content lesson is incomplete', async (t) => {
  const primera = leccionFalsa({ id: 10, orden: 1 });
  const segunda = leccionFalsa({ id: 11, orden: 2, contenido: 'Texto bloqueado' });

  t.mock.method(Leccion, 'findByPk', async () => segunda);
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [primera, segunda]);
  t.mock.method(Progreso, 'findOne', async () => progresoFalso());

  await assert.rejects(
    () => obtenerLeccionEstudiante(7, 11),
    (error) => error.statusCode === 403 && error.code === 'LECCION_BLOQUEADA',
  );
});

test('a lesson unlocks when the previous content lesson is complete', async (t) => {
  const primera = leccionFalsa({ id: 10, orden: 1 });
  const segunda = leccionFalsa({ id: 11, orden: 2, contenido: 'Texto desbloqueado' });

  t.mock.method(Leccion, 'findByPk', async () => segunda);
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [primera, segunda]);
  t.mock.method(Progreso, 'findOne', async () => progresoFalso({
    leccionId: 10,
    completada: true,
  }));

  const leccion = await obtenerLeccionEstudiante(7, 11);

  assert.equal(leccion.id, 11);
  assert.equal(leccion.contenido, 'Texto desbloqueado');
});

test('a previous quiz unlocks only when its stored best grade reaches the pass mark', async (t) => {
  const cuestionario = leccionFalsa({
    id: 10,
    tipo: 'cuestionario',
    contenido: null,
    notaMinima: 70,
  });
  const contenido = leccionFalsa({ id: 11, orden: 2, contenido: 'Siguiente lección' });
  let mejorNota = 69.99;

  t.mock.method(Leccion, 'findByPk', async () => contenido);
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [cuestionario, contenido]);
  t.mock.method(Progreso, 'findOne', async () => progresoFalso({
    leccionId: 10,
    completada: false,
    mejorNota,
  }));

  await assert.rejects(
    () => obtenerLeccionEstudiante(7, 11),
    (error) => error.statusCode === 403 && error.code === 'LECCION_BLOQUEADA',
  );

  mejorNota = 70;
  const leccion = await obtenerLeccionEstudiante(7, 11);

  assert.equal(leccion.id, 11);
  assert.equal(leccion.contenido, 'Siguiente lección');
});

test('GET /api/lecciones/:id requires a student session', async (t) => {
  const baseUrl = await iniciarServidor(t);
  const response = await fetch(`${baseUrl}/api/lecciones/10`);

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('an instructor cannot use the student lesson access route', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));

  const response = await fetch(`${baseUrl}/api/lecciones/10`, {
    headers: { Authorization: tokenDe(9, 'instructor') },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('the route returns content for the session student and ignores a client student id', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  t.mock.method(Leccion, 'findByPk', async () => leccionFalsa());
  let consultaInscripcion;
  t.mock.method(Inscripcion, 'findOne', async (opciones) => {
    consultaInscripcion = opciones;
    return inscripcionFalsa();
  });
  t.mock.method(Leccion, 'findAll', async () => [leccionFalsa()]);

  const response = await fetch(`${baseUrl}/api/lecciones/10?estudianteId=99`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(consultaInscripcion.where, { estudianteId: 7, cursoId: 5 });
  const body = await response.json();
  assert.equal(body.leccion.id, 10);
  assert.equal(body.leccion.contenido, 'Texto privado de la lección');
});

test('a locked lesson through the route returns 403 without leaking its content', async (t) => {
  const baseUrl = await iniciarServidor(t);
  const primera = leccionFalsa({ id: 10, orden: 1 });
  const segunda = leccionFalsa({ id: 11, orden: 2, contenido: 'Texto bloqueado' });

  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  t.mock.method(Leccion, 'findByPk', async () => segunda);
  t.mock.method(Inscripcion, 'findOne', async () => inscripcionFalsa());
  t.mock.method(Leccion, 'findAll', async () => [primera, segunda]);
  t.mock.method(Progreso, 'findOne', async () => progresoFalso());

  const response = await fetch(`${baseUrl}/api/lecciones/11`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error.code, 'LECCION_BLOQUEADA');
  assert.equal('leccion' in body, false);
  assert.equal(JSON.stringify(body).includes('Texto bloqueado'), false);
});

test('invalid lesson ids are rejected before the access service runs', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 7, rol: 'estudiante' }));
  let leccionConsultada = false;
  t.mock.method(Leccion, 'findByPk', async () => {
    leccionConsultada = true;
    return leccionFalsa();
  });

  const response = await fetch(`${baseUrl}/api/lecciones/abc`, {
    headers: { Authorization: tokenDe(7, 'estudiante') },
  });

  assert.equal(response.status, 422);
  assert.deepEqual(
    (await response.json()).error.details.map((detail) => detail.campo),
    ['id'],
  );
  assert.equal(leccionConsultada, false);
});

test('the public course outline never returns lesson content or video links', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Curso, 'findOne', async () => cursoPublicoFalso());
  t.mock.method(Leccion, 'findAll', async () => [
    leccionFalsa({ videoUrl: 'https://videos.example.com/privado.mp4' }),
  ]);

  const response = await fetch(`${baseUrl}/api/cursos/5`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.temario.length, 1);
  assert.equal('contenido' in body.temario[0], false);
  assert.equal('videoUrl' in body.temario[0], false);
  assert.equal(JSON.stringify(body).includes('Texto privado de la lección'), false);
});
