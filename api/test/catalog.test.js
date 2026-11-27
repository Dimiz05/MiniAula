import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { Op } from 'sequelize';
import app from '../app.js';
import { Curso } from '../models/index.js';
import {
  catalogoQuerySchema,
  cursoIdParamsSchema,
} from '../schemas/curso.js';
import { formatZodIssues } from '../utils/zod.js';
import {
  construirFiltroCatalogo,
  construirPaginacion,
  escaparLike,
  listarCursosPublicados,
  toPublicCurso,
  toTemarioItem,
} from '../services/curso.service.js';

test('catalog query applies pagination defaults and trims empty filters', () => {
  const query = catalogoQuerySchema.parse({ q: '  react  ', categoria: '' });

  assert.deepEqual(query, {
    q: 'react',
    categoria: undefined,
    page: 1,
    limit: 6,
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
  assert.deepEqual(construirPaginacion(0, 1, 6), {
    pagina: 1,
    limite: 6,
    total: 0,
    totalPaginas: 0,
  });
});

function cursoPublicoFalso(id) {
  return {
    get: () => ({
      id,
      titulo: `Curso ${id}`,
      descripcion: 'Descripción del curso',
      portada: null,
      categoria: 'Programación',
      nivel: 'basico',
      creadoEn: '2026-10-02T10:00:00.000Z',
      instructor: { id: 1, nombre: 'Lucía Ferrer' },
    }),
  };
}

test('published catalog filters and paginates in the database query', async (t) => {
  let opciones;
  t.mock.method(Curso, 'findAndCountAll', async (options) => {
    opciones = options;
    return { rows: [cursoPublicoFalso(7), cursoPublicoFalso(8)], count: 13 };
  });

  const resultado = await listarCursosPublicados({
    page: 2,
    limit: 6,
    q: 'react',
    categoria: 'Programación',
  });

  assert.deepEqual(
    opciones.where,
    construirFiltroCatalogo({ q: 'react', categoria: 'Programación' }),
  );
  assert.deepEqual(opciones.order, [['creadoEn', 'DESC'], ['id', 'DESC']]);
  assert.equal(opciones.limit, 6);
  assert.equal(opciones.offset, 6);
  assert.equal(opciones.distinct, true);
  assert.deepEqual(resultado.paginacion, {
    pagina: 2,
    limite: 6,
    total: 13,
    totalPaginas: 3,
  });
  assert.deepEqual(resultado.cursos.map((curso) => curso.id), [7, 8]);
});

test('public course hides internal fields and flattens the instructor', () => {
  const curso = toPublicCurso({
    get: () => ({
      id: 4,
      titulo: 'React',
      descripcion: 'Curso de React',
      portada: 'https://images.example.com/react.jpg',
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
    portada: 'https://images.example.com/react.jpg',
    categoria: 'Programación',
    nivel: 'intermedio',
    instructor: { id: 9, nombre: 'Bruno Salas' },
    creadoEn: '2026-10-02T10:00:00.000Z',
  });
});

test('course detail accepts positive integer ids only', () => {
  assert.deepEqual(cursoIdParamsSchema.parse({ id: '12' }), { id: 12 });

  for (const id of ['0', '-2', '1.5', 'abc']) {
    const result = cursoIdParamsSchema.safeParse({ id });

    assert.equal(result.success, false);
    assert.deepEqual(
      formatZodIssues(result.error).map((detail) => detail.campo),
      ['id'],
    );
  }
});

test('outline items never expose lesson content, video, or course internals', () => {
  const item = toTemarioItem({
    get: () => ({
      id: 7,
      titulo: 'Componentes y props',
      tipo: 'contenido',
      contenido: 'Texto privado de la lección',
      videoUrl: 'https://videos.example.com/privado.mp4',
      orden: 2,
      notaMinima: null,
      cursoId: 3,
    }),
  });

  assert.deepEqual(item, {
    id: 7,
    titulo: 'Componentes y props',
    tipo: 'contenido',
    orden: 2,
    notaMinima: null,
  });
  assert.equal('contenido' in item, false);
  assert.equal('videoUrl' in item, false);
  assert.equal('cursoId' in item, false);
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

test('GET /api/cursos/:id rejects invalid ids before hitting the database', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/cursos/abc`,
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, 'VALIDACION');
  assert.deepEqual(body.error.details.map((detail) => detail.campo), ['id']);
});
