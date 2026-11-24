import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});
after(() => vite.close());

const { default: CourseProgress } = await vite.ssrLoadModule(
  '/src/components/CourseProgress.jsx',
);

function render(props) {
  return renderToStaticMarkup(createElement(CourseProgress, props));
}

test('displays the percentage and lesson count returned by the API', () => {
  const html = render({
    porcentaje: 60,
    leccionesCompletadas: 3,
    totalLecciones: 5,
    titulo: 'Fundamentos de JavaScript',
  });

  assert.match(html, /Avance de Fundamentos de JavaScript/);
  assert.match(html, /aria-valuenow="60"/);
  assert.match(html, /aria-valuetext="60% completado"/);
  assert.match(html, /60% completado/);
  assert.match(html, /3 de 5 lecciones completadas/);
  assert.match(html, /bg-primary/);
});

test('uses the API percentage instead of deriving it from the lesson counters', () => {
  const html = render({
    porcentaje: 20,
    leccionesCompletadas: 5,
    totalLecciones: 5,
    titulo: 'Curso en curso',
  });

  assert.match(html, /20% completado/);
  assert.doesNotMatch(html, /100% completado/);
  assert.match(html, /5 de 5 lecciones completadas/);
});

test('marks a course as completed only when the API reports 100 percent', () => {
  const html = render({
    porcentaje: 100,
    leccionesCompletadas: 4,
    totalLecciones: 4,
    titulo: 'Curso terminado',
  });

  assert.match(html, /100% completado/);
  assert.match(html, /bg-success/);
});

test('hides the lesson counter when the course has no lessons', () => {
  const html = render({
    porcentaje: 0,
    leccionesCompletadas: 0,
    totalLecciones: 0,
    titulo: 'Curso sin lecciones',
  });

  assert.match(html, /0% completado/);
  assert.doesNotMatch(html, /lecciones completadas/);
});
