import assert from 'node:assert/strict';
import { test } from 'node:test';
import { API_URL, setAccessToken } from '../src/config/http.js';
import {
  actualizarLeccion,
  crearLeccion,
  eliminarLeccion,
  reordenarLecciones,
} from '../src/services/leccion.service.js';
import {
  esUrlValida,
  moverLeccion,
  reordenarLista,
  validarLeccion,
} from '../src/pages/instructor/lessonForm.js';

test('lesson operations use the authenticated instructor endpoints', async (t) => {
  const calls = [];
  setAccessToken('instructor-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
      options.body,
    ]);

    if (options.method === 'DELETE') {
      return new Response(null, { status: 204 });
    }

    return Response.json({
      leccion: { id: 9, titulo: 'Introducción' },
    }, { status: options.method === 'POST' ? 201 : 200 });
  });

  const datos = { titulo: 'Introducción', contenido: 'Texto' };

  await crearLeccion(7, datos);
  await actualizarLeccion(9, datos);
  await eliminarLeccion(9);
  await reordenarLecciones(7, [3, 1, 2]);

  assert.deepEqual(calls, [
    ['/cursos/7/lecciones', 'POST', 'Bearer instructor-token', JSON.stringify(datos)],
    ['/lecciones/9', 'PUT', 'Bearer instructor-token', JSON.stringify(datos)],
    ['/lecciones/9', 'DELETE', 'Bearer instructor-token', undefined],
    ['/cursos/7/lecciones/orden', 'PATCH', 'Bearer instructor-token', JSON.stringify({ orden: [3, 1, 2] })],
  ]);
});

test('lesson validation trims fields and reports title, content and video errors', () => {
  const valida = validarLeccion({
    titulo: '  Introducción  ',
    contenido: '  Texto de la lección  ',
    videoUrl: '  https://videos.example.com/intro.mp4  ',
  });
  assert.deepEqual(valida.datos, {
    titulo: 'Introducción',
    contenido: 'Texto de la lección',
    videoUrl: 'https://videos.example.com/intro.mp4',
  });
  assert.deepEqual(valida.errores, {});

  const invalida = validarLeccion({
    titulo: 'ab',
    contenido: '   ',
    videoUrl: 'no-es-url',
  });
  assert.deepEqual(Object.keys(invalida.errores).sort(), ['contenido', 'titulo', 'videoUrl']);
});

test('lesson validation accepts an empty video and rejects unsupported protocols', () => {
  const sinVideo = validarLeccion({
    titulo: 'Introducción',
    contenido: 'Texto',
    videoUrl: '   ',
  });
  assert.equal(sinVideo.datos.videoUrl, '');
  assert.deepEqual(sinVideo.errores, {});

  assert.equal(esUrlValida('https://videos.example.com/intro.mp4'), true);
  assert.equal(esUrlValida('http://videos.example.com/intro.mp4'), true);
  assert.equal(esUrlValida('ftp://videos.example.com/intro.mp4'), false);
  assert.equal(esUrlValida('videos.example.com/intro.mp4'), false);
});

test('reorder helpers move one item and keep the array unchanged at the edges', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

  assert.deepEqual(
    reordenarLista(items, 0, 2).map((item) => item.id),
    [2, 3, 1],
  );
  assert.deepEqual(
    moverLeccion(items, 0, 1).map((item) => item.id),
    [2, 1, 3],
  );
  assert.equal(moverLeccion(items, 0, -1), items);
  assert.equal(moverLeccion(items, 2, 1), items);
  assert.equal(reordenarLista(items, -1, 0), items);
  assert.equal(reordenarLista(items, 0, 3), items);
});
