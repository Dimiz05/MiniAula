import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import {
  actualizarCursoSchema,
  crearCursoSchema,
} from '../schemas/curso.js';
import {
  asegurarPropiedadCurso,
  toInstructorCurso,
} from '../services/curso.service.js';
import { formatZodIssues } from '../utils/zod.js';

async function iniciarServidor(t) {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  return `http://127.0.0.1:${server.address().port}`;
}

test('creating a course ignores client state and ownership fields', () => {
  const datos = crearCursoSchema.parse({
    titulo: '  Curso de prueba  ',
    descripcion: '  Descripción del curso  ',
    categoria: '  Diseño  ',
    nivel: 'avanzado',
    estado: 'publicado',
    instructorId: 99,
  });

  assert.deepEqual(datos, {
    titulo: 'Curso de prueba',
    descripcion: 'Descripción del curso',
    categoria: 'Diseño',
    nivel: 'avanzado',
  });
  assert.equal('estado' in datos, false);
  assert.equal('instructorId' in datos, false);
});

test('creating a course defaults the level to basic', () => {
  const datos = crearCursoSchema.parse({
    titulo: 'Curso de prueba',
    descripcion: 'Descripción',
    categoria: 'Diseño',
  });

  assert.equal(datos.nivel, 'basico');
});

test('creating a course validates required fields and level', () => {
  const result = crearCursoSchema.safeParse({
    titulo: 'ab',
    descripcion: '   ',
    categoria: 'X',
    nivel: 'experto',
  });

  assert.equal(result.success, false);
  assert.deepEqual(
    formatZodIssues(result.error).map((detail) => detail.campo).sort(),
    ['categoria', 'descripcion', 'nivel', 'titulo'],
  );
});

test('updating a course only accepts editable fields', () => {
  assert.deepEqual(
    actualizarCursoSchema.parse({ titulo: 'Título actualizado' }),
    { titulo: 'Título actualizado' },
  );

  const result = actualizarCursoSchema.safeParse({
    estado: 'publicado',
    instructorId: 9,
  });

  assert.equal(result.success, false);
  const campos = formatZodIssues(result.error)
    .map((detail) => detail.campo)
    .filter(Boolean);
  assert.deepEqual(campos.sort(), ['estado', 'instructorId']);
});

test('updating a course requires at least one change', () => {
  const result = actualizarCursoSchema.safeParse({});

  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /al menos un campo/i);
});

test('the instructor presenter exposes state and related totals', () => {
  const curso = toInstructorCurso(
    {
      get: () => ({
        id: 4,
        titulo: 'React',
        descripcion: 'Curso de React',
        categoria: 'Programación',
        nivel: 'intermedio',
        estado: 'borrador',
        instructorId: 9,
        creadoEn: '2026-10-02T10:00:00.000Z',
      }),
    },
    { totalLecciones: 3, totalInscritos: 2 },
  );

  assert.deepEqual(curso, {
    id: 4,
    titulo: 'React',
    descripcion: 'Curso de React',
    categoria: 'Programación',
    nivel: 'intermedio',
    estado: 'borrador',
    creadoEn: '2026-10-02T10:00:00.000Z',
    totalLecciones: 3,
    totalInscritos: 2,
  });
  assert.equal('instructorId' in curso, false);
});

test('a missing course returns 404 and a foreign course returns 403', () => {
  assert.throws(
    () => asegurarPropiedadCurso(null, 1),
    (error) => error.statusCode === 404 && error.code === 'CURSO_NO_ENCONTRADO',
  );

  assert.throws(
    () => asegurarPropiedadCurso({ instructorId: 2 }, 1),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  const curso = { instructorId: 1 };
  assert.equal(asegurarPropiedadCurso(curso, 1), curso);
});

test('own-course routes require an instructor session', async (t) => {
  const baseUrl = await iniciarServidor(t);

  for (const [method, path] of [
    ['GET', '/api/cursos/mios'],
    ['GET', '/api/cursos/mios/1'],
    ['POST', '/api/cursos'],
    ['PUT', '/api/cursos/1'],
  ]) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : '{}',
    });

    assert.equal(response.status, 401, `${method} ${path}`);
    const body = await response.json();
    assert.equal(body.error.code, 'NO_AUTENTICADO');
  }
});

test('GET /api/cursos/mios is not captured by the public /:id route', async (t) => {
  const baseUrl = await iniciarServidor(t);

  const response = await fetch(`${baseUrl}/api/cursos/mios`);

  // A 401 from authenticate proves the own-course route matched first;
  // the public route would answer 422 for the non-numeric id.
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});
