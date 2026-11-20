import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { Op } from 'sequelize';
import app from '../app.js';
import { catalogoQuerySchema } from '../schemas/curso.js';
import { formatZodIssues } from '../utils/zod.js';
import {
  construirFiltroCatalogo,
  construirPaginacion,
  escaparLike,
  toPublicCurso,
} from '../services/curso.service.js';

test('catalog query applies pagination defaults and trims empty filters', () => {
  const query = catalogoQuerySchema.parse({ q: '  react  ', categoria: '' });

  assert.deepEqual(query, {
    q: 'react',
    categoria: undefined,
    page: 1,
    limit: 12,
  });
});

test('catalog query accepts valid page, limit and category', () => {
  const query = catalogoQuerySchema.parse({
    q: 'sql',
    categoria: 'Programación',
    page: '2',
    limit: '6',
  });

  assert.deepEqual(query, {
    q: 'sql',
    categoria: 'Programación',
    page: 2,
    limit: 6,
  });
});

test('catalog query rejects invalid pagination and unexpected filters', () => {
  const result = catalogoQuerySchema.safeParse({
    page: '0',
    limit: '100',
    estado: 'borrador',
  });

  assert.equal(result.success, false);
  assert.deepEqual(
    formatZodIssues(result.error).map((detail) => detail.campo).sort(),
    ['estado', 'limit', 'page'],
  );
});

test('catalog filter only exposes published courses', () => {
  assert.deepEqual(construirFiltroCatalogo({}), { estado: 'publicado' });
});

test('catalog filter builds category and escaped title search', () => {
  const filtro = construirFiltroCatalogo({ q: '100%_react', categoria: 'Programación' });

  assert.equal(filtro.estado, 'publicado');
  assert.equal(filtro.categoria, 'Programación');
  assert.equal(filtro.titulo[Op.like], '%100\\%\\_react%');
});

test('LIKE wildcards are escaped to keep the search literal', () => {
  assert.equal(escaparLike('a%b_c\\d'), 'a\\%b\\_c\\\\d');
});

test('pagination reports totals and pages', () => {
  assert.deepEqual(construirPaginacion(13, 2, 5), {
    pagina: 2,
    limite: 5,
    total: 13,
    totalPaginas: 3,
  });
  assert.deepEqual(construirPaginacion(0, 1, 12), {
    pagina: 1,
    limite: 12,
    total: 0,
    totalPaginas: 0,
  });
});

test('public course hides internal fields and flattens the instructor', () => {
  const curso = toPublicCurso({
    get: () => ({
      id: 4,
      titulo: 'React',
      descripcion: 'Curso de React',
      categoria: 'Programación',
      nivel: 'intermedio',
      estado: 'publicado',
      instructorId: 9,
      creadoEn: '2026-10-02T10:00:00.000Z',
      instructor: { id: 9, nombre: 'Bruno Salas', email: 'bruno@example.com' },
    }),
  });

  assert.deepEqual(curso, {
    id: 4,
    titulo: 'React',
    descripcion: 'Curso de React',
    categoria: 'Programación',
    nivel: 'intermedio',
    instructor: { id: 9, nombre: 'Bruno Salas' },
    creadoEn: '2026-10-02T10:00:00.000Z',
  });
});

test('GET /api/cursos rejects invalid filters before hitting the database', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/cursos?page=0&limit=100&estado=borrador`,
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, 'VALIDACION');
  assert.deepEqual(
    body.error.details.map((detail) => detail.campo).sort(),
    ['estado', 'limit', 'page'],
  );
});
