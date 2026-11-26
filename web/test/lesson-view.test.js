import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { API_URL, setAccessToken } from '../src/config/http.js';
import {
  completarLeccion,
  obtenerLeccion,
  obtenerTemarioEstudiante,
} from '../src/services/leccion.service.js';
import {
  clasificarErrorLeccion,
  ESTADOS_LECCION,
  normalizarEstadoLeccion,
  puedeAbrirLeccion,
  siguienteLeccionDespuesDe,
} from '../src/utils/lessonState.js';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});
after(() => vite.close());

const { default: LessonOutline } = await vite.ssrLoadModule(
  '/src/components/LessonOutline.jsx',
);
const { default: AppRoutes } = await vite.ssrLoadModule('/src/routes/AppRoutes.jsx');
const { AuthProvider } = await vite.ssrLoadModule('/src/hooks/useAuth.jsx');
const session = await vite.ssrLoadModule('/src/services/session.js');
const { MemoryRouter } = await import('react-router');

function createMemoryStorage() {
  const data = new Map();

  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

const storage = createMemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
  writable: true,
});

const demoUsuario = {
  id: 7,
  nombre: 'Carla Méndez',
  email: 'carla.estudiante@miniaula.test',
  rol: 'estudiante',
  creadoEn: '2026-01-15T12:00:00.000Z',
};

function renderRoute(path) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(AuthProvider, null, createElement(AppRoutes)),
    ),
  );
}

function renderOutline(props) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      createElement(LessonOutline, props),
    ),
  );
}

test('lesson access uses the authenticated student endpoints', async (t) => {
  const calls = [];
  setAccessToken('student-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
    ]);
    return Response.json({ leccion: { id: 10 }, temario: [] });
  });

  await obtenerLeccion(10);
  await obtenerTemarioEstudiante(5);

  assert.deepEqual(calls, [
    ['/lecciones/10', 'GET', 'Bearer student-token'],
    ['/cursos/5/temario', 'GET', 'Bearer student-token'],
  ]);
});

test('marking a content lesson complete uses the authenticated student endpoint', async (t) => {
  const calls = [];
  setAccessToken('student-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
    ]);
    return Response.json({ progreso: { completada: true } });
  });

  const resultado = await completarLeccion(10);

  assert.deepEqual(calls, [
    ['/lecciones/10/completar', 'POST', 'Bearer student-token'],
  ]);
  assert.equal(resultado.progreso.completada, true);
});

test('the lesson state helpers treat missing or unknown states as locked', () => {
  assert.equal(normalizarEstadoLeccion('completada'), ESTADOS_LECCION.COMPLETADA);
  assert.equal(normalizarEstadoLeccion('desconocida'), ESTADOS_LECCION.BLOQUEADA);
  assert.equal(normalizarEstadoLeccion(undefined), ESTADOS_LECCION.BLOQUEADA);

  assert.equal(puedeAbrirLeccion({ estado: 'disponible' }), true);
  assert.equal(puedeAbrirLeccion({ estado: 'completada' }), true);
  assert.equal(puedeAbrirLeccion({ estado: 'bloqueada' }), false);
  assert.equal(puedeAbrirLeccion({}), false);
});

test('the lesson error classifier separates locked, enrollment and server errors', () => {
  const bloqueada = clasificarErrorLeccion({
    status: 403,
    code: 'LECCION_BLOQUEADA',
    message: 'Completa la lección anterior para desbloquear esta lección.',
  });
  assert.equal(bloqueada.tipo, 'bloqueada');
  assert.equal(bloqueada.titulo, 'Lección bloqueada');

  const noInscrito = clasificarErrorLeccion({
    status: 403,
    code: 'NO_INSCRITO',
    message: 'Debes estar inscrito en el curso para acceder a sus lecciones.',
  });
  assert.equal(noInscrito.tipo, 'no-inscrito');

  const noEncontrada = clasificarErrorLeccion({
    status: 404,
    code: 'LECCION_NO_ENCONTRADA',
    message: 'La lección no existe.',
  });
  assert.equal(noEncontrada.tipo, 'no-encontrada');

  assert.equal(clasificarErrorLeccion({ status: 500 }).tipo, 'error');
});

test('the next lesson helper returns only an available lesson after the current one', () => {
  const temario = [
    { id: 10, titulo: 'Introducción', estado: 'completada' },
    { id: 12, titulo: 'Cuestionario', estado: 'disponible' },
    { id: 13, titulo: 'Siguiente lección', estado: 'bloqueada' },
  ];

  assert.equal(siguienteLeccionDespuesDe(temario, 12), null);
  assert.equal(siguienteLeccionDespuesDe(temario, 10)?.id, 12);

  const desbloqueado = temario.map((leccion) => (
    leccion.id === 12 ? { ...leccion, estado: 'completada' } : (
      leccion.id === 13 ? { ...leccion, estado: 'disponible' } : leccion
    )
  ));
  assert.equal(siguienteLeccionDespuesDe(desbloqueado, 12)?.id, 13);
  assert.equal(siguienteLeccionDespuesDe([], 12), null);
});

test('the outline renders API states and only links available or completed lessons', () => {
  const html = renderOutline({
    cursoId: 5,
    leccionActualId: 11,
    conEstados: true,
    lecciones: [
      { id: 10, titulo: 'Introducción', tipo: 'contenido', orden: 1, estado: 'completada' },
      { id: 11, titulo: 'Variables', tipo: 'contenido', orden: 2, estado: 'disponible' },
      { id: 12, titulo: 'Cuestionario', tipo: 'cuestionario', orden: 3, notaMinima: 70, estado: 'bloqueada' },
    ],
  });

  assert.match(html, /Completada/);
  assert.match(html, /Disponible/);
  assert.match(html, /Bloqueada/);
  assert.match(html, /href="\/cursos\/5\/lecciones\/10"/);
  assert.match(html, /href="\/cursos\/5\/lecciones\/11"/);
  assert.equal(html.includes('/cursos/5/lecciones/12'), false);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /aria-disabled="true"/);
});

test('the public preview never turns its visual hint into a lesson link', () => {
  const html = renderOutline({
    cursoId: 5,
    conEstados: false,
    lecciones: [
      { id: 10, titulo: 'Introducción', tipo: 'contenido', orden: 1 },
      { id: 11, titulo: 'Variables', tipo: 'contenido', orden: 2 },
    ],
  });

  assert.match(html, /Disponible al inscribirte/);
  assert.match(html, /Se desbloquea al avanzar/);
  assert.equal(html.includes('href="/cursos/5/lecciones/10"'), false);
  assert.equal(html.includes('href="/cursos/5/lecciones/11"'), false);
});

test('the lesson route is protected and available to students', () => {
  session.writeSession({ token: 'stored-token', usuario: demoUsuario });
  assert.match(renderRoute('/cursos/5/lecciones/10'), /Cargando la lección/);

  session.writeSession({
    token: 'stored-token',
    usuario: { ...demoUsuario, rol: 'instructor' },
  });
  assert.doesNotMatch(renderRoute('/cursos/5/lecciones/10'), /Cargando la lección/);

  session.clearSession();
  assert.doesNotMatch(renderRoute('/cursos/5/lecciones/10'), /Cargando la lección/);
});
