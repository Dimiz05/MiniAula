import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});
after(() => vite.close());

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

beforeEach(() => {
  storage.clear();
});

function render(path) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(AuthProvider, null, createElement(AppRoutes)),
    ),
  );
}

test('shows the learning route panel only to signed-in users', () => {
  assert.doesNotMatch(render('/'), /Tu ruta de aprendizaje/);

  session.writeSession({ token: 'stored-token', usuario: demoUsuario });
  const home = render('/');
  assert.match(home, /Tu ruta de aprendizaje/);
  assert.match(home, /Hola, Carla/);

  session.clearSession();
});

test('shows a themed illustration on each authentication screen', async () => {
  const { default: AuthIllustration } = await vite.ssrLoadModule(
    '/src/components/AuthIllustration.jsx',
  );

  assert.match(render('/login'), /Inicio de sesión seguro/);
  assert.match(render('/registro'), /Estudiante con laptop, libros y birrete/);
  assert.match(
    renderToStaticMarkup(createElement(AuthIllustration, { variant: 'instructor' })),
    /Instructor creando un curso/,
  );
});

const demoUsuario = {
  id: 7,
  nombre: 'Carla Méndez',
  email: 'carla.estudiante@miniaula.test',
  rol: 'estudiante',
  creadoEn: '2026-01-15T12:00:00.000Z',
};

test('renders the public home, catalog and not-found routes', () => {
  for (const [path, heading] of [
    ['/', 'Aprende una lección a la vez.'],
    ['/catalog', 'Catálogo de cursos'],
    ['/unknown', 'Página no encontrada'],
  ]) {
    const html = render(path);
    assert.match(html, /aria-label="Navegación principal"/);
    assert.match(html, new RegExp(`<h1[^>]*>${heading}</h1>`));
  }
});

test('renders the login and registration screens with their forms', () => {
  const login = render('/login');
  assert.match(login, /<h1[^>]*>¡Qué bueno tenerte de vuelta!<\/h1>/);
  assert.match(login, /name="email"/);
  assert.match(login, /name="password"/);
  assert.match(login, /Iniciar sesión/);
  assert.match(login, /href="\/registro"/);

  const register = render('/registro');
  assert.match(register, /<h1[^>]*>Crea tu cuenta<\/h1>/);
  assert.match(register, /value="estudiante"/);
  assert.match(register, /value="instructor"/);
  assert.match(register, /name="confirmPassword"/);
  assert.match(register, /href="\/login"/);
});

test('keeps a stored session across a reload and shows the profile', () => {
  session.writeSession({ token: 'stored-token', usuario: demoUsuario });

  const html = render('/perfil');
  assert.match(html, /Datos personales/);
  assert.match(html, /Carla Méndez/);
  assert.match(html, /carla\.estudiante@miniaula\.test/);
  assert.match(html, /Miembro desde/);
  assert.match(html, /Cerrar sesión/);
  assert.match(html, /name="nombre"/);
});

test('does not render the profile without a session', () => {
  const html = render('/perfil');
  assert.doesNotMatch(html, /Datos personales/);
  assert.match(html, /aria-label="Navegación principal"/);
});

test('ignores a malformed stored session', () => {
  storage.setItem(
    session.SESSION_STORAGE_KEY,
    JSON.stringify({ token: '', usuario: { rol: 'admin' } }),
  );

  const html = render('/perfil');
  assert.doesNotMatch(html, /Datos personales/);
});

test('only instructors see course management routes and navigation', () => {
  const paths = ['/instructor/cursos', '/instructor/cursos/nuevo', '/instructor/cursos/7/editar'];
  for (const usuario of [null, demoUsuario]) {
    if (usuario) session.writeSession({ token: 'stored-token', usuario });
    for (const path of paths) {
      assert.doesNotMatch(render(path), /Mis cursos|Nuevo curso|Cargando curso|name="titulo"/);
    }
  }

  session.writeSession({ token: 'stored-token', usuario: { ...demoUsuario, rol: 'instructor' } });
  assert.match(render(paths[0]), /Cargando tus cursos/);
  const nuevo = render(paths[1]);
  assert.match(nuevo, /Nuevo curso/);
  assert.match(nuevo, /Borrador/);
  assert.match(nuevo, /name="titulo"/);
  const editar = render(paths[2]);
  assert.match(editar, /Cargando curso/);
  assert.doesNotMatch(editar, /name="titulo"/);
});

test('renders the student panel only for students', () => {
  session.writeSession({ token: 'stored-token', usuario: demoUsuario });
  const panel = render('/panel');
  assert.match(panel, /Resumen de aprendizaje/);
  assert.match(panel, /Hola, Carla/);
  assert.match(panel, /Continúa aprendiendo/);
  assert.match(panel, /Cursos recomendados para ti/);

  session.writeSession({ token: 'stored-token', usuario: { ...demoUsuario, rol: 'instructor' } });
  assert.doesNotMatch(render('/panel'), /Resumen de aprendizaje/);

  session.clearSession();
  assert.doesNotMatch(render('/panel'), /Resumen de aprendizaje/);
});

test('session helpers persist, validate and clear the stored session', () => {
  assert.equal(session.readSession(), null);

  assert.equal(session.writeSession({ token: 'abc', usuario: demoUsuario }), true);
  assert.deepEqual(session.readSession(), { token: 'abc', usuario: demoUsuario });

  storage.setItem(session.SESSION_STORAGE_KEY, '{not-json');
  assert.equal(session.readSession(), null);

  session.writeSession({ token: 'abc', usuario: demoUsuario });
  session.clearSession();
  assert.equal(session.readSession(), null);
});
