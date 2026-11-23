import assert from 'node:assert/strict';
import { test } from 'node:test';
import { API_URL, setAccessToken } from '../src/config/http.js';
import {
  esInscripcionDuplicada,
  estaInscritoEn,
  inscribirCurso,
  listarMisInscripciones,
  normalizarInscripciones,
} from '../src/services/inscripcion.service.js';

test('enrolling uses the published course endpoint with the student session', async (t) => {
  const calls = [];
  setAccessToken('student-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([url.slice(API_URL.length), options.method, options.headers.Authorization, options.body]);
    return Response.json({
      inscripcion: {
        id: 11,
        cursoId: 3,
        fechaInscripcion: '2026-11-23T10:00:00.000Z',
        completado: false,
      },
    }, { status: 201 });
  });

  const data = await inscribirCurso(3);

  assert.deepEqual(calls, [
    ['/cursos/3/inscripcion', 'POST', 'Bearer student-token', undefined],
  ]);
  assert.equal(data.inscripcion.cursoId, 3);
});

test('a duplicate enrollment keeps the 409 error and is recognized by the UI helper', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: {
      code: 'INSCRIPCION_DUPLICADA',
      message: 'Ya estás inscrito en este curso.',
      details: null,
    },
  }, { status: 409 }));

  await assert.rejects(
    () => inscribirCurso(3),
    (error) => {
      assert.equal(error.status, 409);
      assert.equal(error.code, 'INSCRIPCION_DUPLICADA');
      assert.equal(error.message, 'Ya estás inscrito en este curso.');
      assert.equal(esInscripcionDuplicada(error), true);
      return true;
    },
  );
});

test('the student courses screen calls the documented enrollment listing with authentication', async (t) => {
  let call;
  setAccessToken('student-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    call = [url.slice(API_URL.length), options.method, options.headers.Authorization];
    return Response.json({ inscripciones: [] });
  });

  const data = await listarMisInscripciones();

  assert.deepEqual(call, ['/inscripciones/mias', 'GET', 'Bearer student-token']);
  assert.deepEqual(data.inscripciones, []);
});

test('the listing is normalized and the current course enrollment is detected', () => {
  const payload = {
    inscripciones: [
      { id: 11, cursoId: 3, completado: false },
      { id: 12, curso: { id: 8 }, completado: true },
      { id: 13 },
    ],
  };

  assert.deepEqual(normalizarInscripciones(payload), [
    { id: 11, cursoId: 3, completado: false },
    { id: 12, curso: { id: 8 }, completado: true },
  ]);
  assert.equal(estaInscritoEn(payload.inscripciones, 3), true);
  assert.equal(estaInscritoEn(payload.inscripciones, '8'), true);
  assert.equal(estaInscritoEn(payload.inscripciones, 99), false);
  assert.deepEqual(
    normalizarInscripciones({ cursos: [{ id: 5, titulo: 'Curso directo' }] }),
    [{ cursoId: 5, curso: { id: 5, titulo: 'Curso directo' } }],
  );
  assert.deepEqual(normalizarInscripciones(null), []);
});
