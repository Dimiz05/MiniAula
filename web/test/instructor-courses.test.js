import assert from 'node:assert/strict';
import { test } from 'node:test';
import { API_URL, setAccessToken } from '../src/config/http.js';
import * as cursos from '../src/services/curso.service.js';
import { accionesCurso, validarCurso } from '../src/pages/instructor/courseForm.js';

test('las operaciones del instructor usan los endpoints privados y el cliente autenticado', async (t) => {
  const calls = [];
  setAccessToken('test-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([url.slice(API_URL.length), options.method, options.headers.Authorization, options.body]);
    return options.method === 'DELETE'
      ? new Response(null, { status: 204 })
      : Response.json({ curso: { id: 7, estado: 'borrador' } });
  });

  const datos = { titulo: 'Curso', descripcion: 'Contenido', categoria: 'Web', nivel: 'basico' };
  await cursos.listarCursosPropios();
  await cursos.obtenerCursoPropio(7);
  assert.equal((await cursos.crearCurso(datos)).curso.estado, 'borrador');
  await cursos.actualizarCurso(7, datos);
  await cursos.publicarCurso(7);
  await cursos.archivarCurso(7);
  assert.equal(await cursos.eliminarCurso(7), null);

  assert.deepEqual(calls, [
    ['/cursos/mios', 'GET', 'Bearer test-token', undefined],
    ['/cursos/mios/7', 'GET', 'Bearer test-token', undefined],
    ['/cursos', 'POST', 'Bearer test-token', JSON.stringify(datos)],
    ['/cursos/7', 'PUT', 'Bearer test-token', JSON.stringify(datos)],
    ['/cursos/7/publicar', 'PATCH', 'Bearer test-token', undefined],
    ['/cursos/7/archivar', 'PATCH', 'Bearer test-token', undefined],
    ['/cursos/7', 'DELETE', 'Bearer test-token', undefined],
  ]);
});

test('un detalle ajeno no devuelve datos utilizables por el editor', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { code: 'CURSO_NO_PROPIO', message: 'Solo puedes administrar tus propios cursos.' },
  }, { status: 403 }));
  await assert.rejects(() => cursos.obtenerCursoPropio(7), {
    status: 403, code: 'CURSO_NO_PROPIO', message: 'Solo puedes administrar tus propios cursos.',
  });
});

test('las acciones dependen del estado, las lecciones y los inscritos', () => {
  assert.deepEqual(accionesCurso({ estado: 'borrador', totalLecciones: 0, totalInscritos: 0 }),
    { publicar: false, archivar: true, eliminar: true });
  assert.deepEqual(accionesCurso({ estado: 'borrador', totalLecciones: 1, totalInscritos: 0 }),
    { publicar: true, archivar: true, eliminar: true });
  assert.deepEqual(accionesCurso({ estado: 'publicado', totalLecciones: 1, totalInscritos: 2 }),
    { publicar: false, archivar: true, eliminar: false });
  assert.deepEqual(accionesCurso({ estado: 'archivado', totalLecciones: 1, totalInscritos: 2 }),
    { publicar: false, archivar: false, eliminar: false });
});

test('un rechazo al publicar conserva el mensaje del servidor', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { code: 'CURSO_SIN_LECCIONES', message: 'Agrega al menos una lección para publicar el curso.' },
  }, { status: 409 }));
  await assert.rejects(() => cursos.publicarCurso(7), {
    code: 'CURSO_SIN_LECCIONES', message: 'Agrega al menos una lección para publicar el curso.',
  });
});

test('el formulario valida los campos editables y excluye estado y propietario', () => {
  const { datos, errores } = validarCurso({
    titulo: '  Curso  ', descripcion: ' Contenido ', categoria: ' Web ', nivel: 'basico',
    estado: 'publicado', instructorId: 9,
  });
  assert.deepEqual(datos, { titulo: 'Curso', descripcion: 'Contenido', categoria: 'Web', nivel: 'basico' });
  assert.deepEqual(errores, {});
  assert.deepEqual(Object.keys(validarCurso({
    titulo: ' ab ', descripcion: ' ', categoria: 'x'.repeat(61), nivel: 'otro',
  }).errores), ['titulo', 'descripcion', 'categoria', 'nivel']);
});
