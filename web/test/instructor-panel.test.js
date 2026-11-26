import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router';
import { API_URL, setAccessToken } from '../src/config/http.js';
import { obtenerMetricasPanel } from '../src/services/curso.service.js';
import {
  describirDesercion,
  formatearEntero,
  formatearNota,
  formatearPorcentaje,
} from '../src/pages/instructor/panelMetrics.js';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});
after(() => vite.close());

const { MetricasCurso, ResumenMetricas } = await vite.ssrLoadModule(
  '/src/pages/instructor/InstructorMetrics.jsx',
);
const { default: MyCoursesPage } = await vite.ssrLoadModule(
  '/src/pages/instructor/MyCoursesPage.jsx',
);

function render(element) {
  return renderToStaticMarkup(element);
}

test('el panel consulta las métricas privadas del instructor autenticado', async (t) => {
  const llamadas = [];
  setAccessToken('panel-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    llamadas.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
    ]);

    return Response.json({
      resumen: {
        totalCursos: 1,
        totalInscritos: 74,
        progresoPromedio: 58.4,
        notaPromedio: 81.6,
      },
      cursos: [],
    });
  });

  const data = await obtenerMetricasPanel();

  assert.deepEqual(llamadas, [
    ['/cursos/mios/metricas', 'GET', 'Bearer panel-token'],
  ]);
  assert.equal(data.resumen.totalInscritos, 74);
});

test('un error de la API del panel conserva el mensaje del servidor', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: {
      code: 'NO_AUTORIZADO',
      message: 'Necesitas una sesión de instructor para ver estas métricas.',
    },
  }, { status: 403 }));

  await assert.rejects(() => obtenerMetricasPanel(), {
    status: 403,
    code: 'NO_AUTORIZADO',
    message: 'Necesitas una sesión de instructor para ver estas métricas.',
  });
});

test('el resumen muestra las cuatro métricas que devuelve la API', () => {
  const html = render(createElement(ResumenMetricas, {
    resumen: {
      totalCursos: 2,
      totalInscritos: 74,
      progresoPromedio: 58.4,
      notaPromedio: 81.6,
    },
    publicados: 1,
    borradores: 1,
  }));

  assert.match(html, /Total de cursos/);
  assert.match(html, /Estudiantes inscritos/);
  assert.match(html, /Progreso promedio/);
  assert.match(html, /Nota promedio/);
  assert.match(html, /tabular-nums text-secondary">2</);
  assert.match(html, /tabular-nums text-secondary">74</);
  assert.match(html, /58\.4%/);
  assert.match(html, /81\.6\/100/);
  assert.match(html, /1 publicados · 1 borradores/);
});

test('cada curso muestra inscritos, progreso, nota y mayor deserción', () => {
  const html = render(createElement(MetricasCurso, {
    metrica: {
      id: 3,
      titulo: 'React desde cero',
      estado: 'publicado',
      totalLecciones: 5,
      totalInscritos: 74,
      progresoPromedio: 58.4,
      notaPromedio: 81.6,
      leccionMayorDesercion: {
        leccionId: 18,
        titulo: 'Manejo de estado',
        orden: 3,
        estudiantesDetenidos: 26,
      },
    },
  }));

  assert.match(html, /Métricas del curso/);
  assert.match(html, /Inscritos/);
  assert.match(html, /Progreso promedio/);
  assert.match(html, /Nota promedio/);
  assert.match(html, /Mayor deserción/);
  assert.match(html, />74</);
  assert.match(html, /58\.4%/);
  assert.match(html, /81\.6\/100/);
  assert.match(html, /Lección 3: Manejo de estado · 26 estudiantes/);
});

test('los valores nulos se muestran como sin datos sin inventar cifras', () => {
  const html = render(createElement(MetricasCurso, {
    metrica: {
      totalInscritos: 0,
      progresoPromedio: null,
      notaPromedio: null,
      leccionMayorDesercion: null,
    },
  }));

  assert.equal((html.match(/Sin datos/g) ?? []).length, 3);
  assert.match(html, />0</);
  assert.doesNotMatch(html, /null/);
});

test('un curso con inscripciones pero sin actividad conserva el progreso en cero', () => {
  const html = render(createElement(MetricasCurso, {
    metrica: {
      totalInscritos: 2,
      progresoPromedio: 0,
      notaPromedio: null,
      leccionMayorDesercion: null,
    },
  }));

  assert.match(html, /0%/);
  assert.equal((html.match(/Sin datos/g) ?? []).length, 2);
});

test('usa los inscritos de la lista de cursos cuando las métricas no están disponibles', () => {
  const html = render(createElement(MetricasCurso, { inscritos: 7 }));

  assert.match(html, />7</);
  assert.equal((html.match(/Sin datos/g) ?? []).length, 3);
});

test('muestra la carga mientras llegan las métricas y las etiquetas de formato', () => {
  const html = render(createElement(MetricasCurso, { cargando: true }));

  assert.match(html, /Cargando métricas…/);
  assert.equal(formatearPorcentaje(58.4), '58.4%');
  assert.equal(formatearPorcentaje(null), 'Sin datos');
  assert.equal(formatearNota(81.6), '81.6/100');
  assert.equal(formatearNota(undefined), 'Sin datos');
  assert.equal(formatearEntero(0), '0');
  assert.equal(formatearEntero(null), 'Sin datos');
  assert.equal(describirDesercion(null), 'Sin datos');
  assert.equal(
    describirDesercion({ titulo: 'Introducción', orden: 1, estudiantesDetenidos: 1 }),
    'Lección 1: Introducción · 1 estudiante',
  );
});

test('la pantalla del panel pide las métricas y los cursos al cargar', () => {
  const html = render(
    createElement(
      MemoryRouter,
      null,
      createElement(MyCoursesPage),
    ),
  );

  assert.match(html, /Cargando métricas del panel…/);
  assert.match(html, /Cargando tus cursos…/);
});
