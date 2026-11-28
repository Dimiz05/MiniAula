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

const {
  default: CourseProgressRing,
  normalizarProgresoCurso,
} = await vite.ssrLoadModule('/src/components/CourseProgressRing.jsx');

function render(props) {
  return renderToStaticMarkup(createElement(CourseProgressRing, props));
}

test('normalizes the saved percentage and neither count can go negative', () => {
  assert.deepEqual(
    normalizarProgresoCurso({
      porcentaje: 32.5,
      leccionesCompletadas: 23,
      totalLecciones: 70,
    }),
    {
      porcentaje: 33,
      leccionesCompletadas: 23,
      totalLecciones: 70,
    },
  );
  assert.equal(
    normalizarProgresoCurso({
      porcentaje: 150,
      leccionesCompletadas: 4,
      totalLecciones: 4,
    }).porcentaje,
    100,
  );
  assert.equal(
    normalizarProgresoCurso({
      porcentaje: -20,
      leccionesCompletadas: -1,
      totalLecciones: 4,
    }).porcentaje,
    0,
  );
  assert.equal(
    normalizarProgresoCurso({
      porcentaje: 'sin dato',
      leccionesCompletadas: 0,
      totalLecciones: 0,
    }),
    null,
  );
  assert.equal(normalizarProgresoCurso({ porcentaje: 40 }), null);
});

test('renders the saved percentage inside the ring and the real lesson count beside it', () => {
  const html = render({
    porcentaje: 33,
    leccionesCompletadas: 23,
    totalLecciones: 70,
    titulo: 'Fundamentos de JavaScript',
  });

  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-label="Avance de Fundamentos de JavaScript"/);
  assert.match(html, /aria-valuenow="33"/);
  assert.match(html, /aria-valuemin="0"/);
  assert.match(html, /aria-valuemax="100"/);
  assert.match(
    html,
    /aria-valuetext="33% completado, 23 de 70 lecciones completadas"/,
  );
  assert.match(html, />33%</);
  assert.match(html, /23 de 70 lecciones completadas/);
  // The visual percentage and text are hidden so the progressbar announces once.
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /stroke-primary/);
});

test('starts the ring at the top and shows only the neutral track at zero', () => {
  const html = render({
    porcentaje: 0,
    leccionesCompletadas: 0,
    totalLecciones: 5,
    titulo: 'Curso sin empezar',
  });

  assert.match(html, /rotate\(-90 32 32\)/);
  assert.match(html, /stroke-outline/);
  assert.match(html, /stroke-linecap="butt"/);
  assert.match(html, /style="stroke-dashoffset:100;opacity:0"/);
  assert.match(html, />0%</);
  assert.match(html, /0 de 5 lecciones completadas/);
});

test('shows a complete success ring at one hundred percent and keeps the percentage', () => {
  const html = render({
    porcentaje: 100,
    leccionesCompletadas: 4,
    totalLecciones: 4,
    titulo: 'Curso terminado',
  });

  assert.match(html, /stroke-success/);
  assert.doesNotMatch(html, /stroke-primary/);
  assert.match(html, /style="stroke-dashoffset:0;opacity:1"/);
  assert.match(html, />100%</);
  assert.match(html, /4 de 4 lecciones completadas/);
});

test('animates only the arc for 240 ms and honours reduced motion', () => {
  const html = render({
    porcentaje: 60,
    leccionesCompletadas: 3,
    totalLecciones: 5,
    titulo: 'Curso en curso',
  });

  assert.match(html, /transition-\[stroke-dashoffset\]/);
  assert.match(html, /duration-\[240ms\]/);
  assert.match(html, /ease-out/);
  assert.match(html, /motion-reduce:transition-none/);
  // The first render already carries the saved offset, never an animation from 0.
  assert.match(html, /style="stroke-dashoffset:40;opacity:1"/);
});

test('distinguishes a course without lessons from one that has not started', () => {
  const sinLecciones = render({
    porcentaje: 0,
    leccionesCompletadas: 0,
    totalLecciones: 0,
    titulo: 'Curso vacío',
  });
  const sinEmpezar = render({
    porcentaje: 0,
    leccionesCompletadas: 0,
    totalLecciones: 12,
    titulo: 'Curso pendiente',
  });

  assert.match(sinLecciones, /Curso sin lecciones/);
  assert.doesNotMatch(sinLecciones, /0 de 0 lecciones completadas/);
  assert.match(sinLecciones, /aria-valuetext="Curso sin lecciones"/);

  assert.match(sinEmpezar, /0 de 12 lecciones completadas/);
  assert.doesNotMatch(sinEmpezar, /Curso sin lecciones/);
});

test('reports progress that is not available instead of inventing a percentage', () => {
  const html = render({
    porcentaje: undefined,
    leccionesCompletadas: undefined,
    totalLecciones: undefined,
    titulo: 'Curso sin datos',
  });

  assert.match(html, /Progreso no disponible/);
  assert.doesNotMatch(html, /role="progressbar"/);
  assert.doesNotMatch(html, />0%</);
});

test('keeps a long course title readable and wrapped on small screens', () => {
  const titulo =
    'Desarrollo de aplicaciones web con arquitectura de microservicios y despliegue continuo';
  const html = render({
    porcentaje: 45,
    leccionesCompletadas: 9,
    totalLecciones: 20,
    titulo,
  });

  assert.match(html, new RegExp(`aria-label="Avance de ${titulo}"`));
  assert.match(html, /aria-valuetext="45% completado, 9 de 20 lecciones completadas"/);
  assert.match(html, /min-w-0 break-words/);
  assert.match(html, /h-16 w-16 shrink-0/);
});
