import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { API_URL, setAccessToken } from '../src/config/http.js';
import { listarEstudiantesCurso } from '../src/services/inscripcion.service.js';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});
after(() => vite.close());

const { default: StudentsList } = await vite.ssrLoadModule(
  '/src/pages/instructor/StudentsList.jsx',
);

function render(element) {
  return renderToStaticMarkup(element);
}

test('el servicio de estudiantes consulta la lista privada del curso', async (t) => {
  const llamadas = [];
  setAccessToken('estudiantes-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    llamadas.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
    ]);

    return Response.json({
      curso: { id: 3, titulo: 'Inglés técnico', estado: 'publicado' },
      estudiantes: [],
    });
  });

  const data = await listarEstudiantesCurso(3);

  assert.deepEqual(llamadas, [
    ['/cursos/mios/3/estudiantes', 'GET', 'Bearer estudiantes-token'],
  ]);
  assert.equal(data.curso.titulo, 'Inglés técnico');
});

test('un error de la API de estudiantes conserva el mensaje del servidor', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: {
      code: 'CURSO_NO_PROPIO',
      message: 'Solo puedes administrar tus propios cursos.',
    },
  }, { status: 403 }));

  await assert.rejects(() => listarEstudiantesCurso(8), {
    status: 403,
    code: 'CURSO_NO_PROPIO',
    message: 'Solo puedes administrar tus propios cursos.',
  });
});

test('la lista muestra el nombre y correo de cada estudiante', () => {
  const html = render(createElement(StudentsList, {
    estudiantes: [
      {
        id: 31,
        estudianteId: 5,
        nombre: 'Carla Méndez',
        email: 'carla@miniaula.test',
        fechaInscripcion: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 32,
        estudianteId: 6,
        nombre: 'Diego Rojas',
        email: 'diego@miniaula.test',
        fechaInscripcion: null,
      },
    ],
  }));

  assert.match(html, /Carla Méndez/);
  assert.match(html, /carla@miniaula\.test/);
  assert.match(html, /CM/);
  assert.match(html, /Diego Rojas/);
  assert.match(html, /diego@miniaula\.test/);
  assert.match(html, /DR/);
  assert.match(html, /Inscrito:/);
  assert.match(html, /Fecha de inscripción sin datos/);
});
