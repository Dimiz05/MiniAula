import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { MemoryRouter } from 'react-router';
import { API_URL, setAccessToken } from '../src/config/http.js';
import { obtenerAnaliticasCurso } from '../src/services/curso.service.js';
import {
  anchoBarra,
  describirMayorDesercion,
} from '../src/pages/instructor/analytics.js';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});
after(() => vite.close());

const {
  DesempenoCuestionario,
  DistribucionProgreso,
  EmbudoRetencion,
  EstudiantesInscritos,
  ResumenAnaliticas,
} = await vite.ssrLoadModule('/src/pages/instructor/AnalyticsOverview.jsx');
const { default: AnalyticsPage } = await vite.ssrLoadModule(
  '/src/pages/instructor/AnalyticsPage.jsx',
);

const curso = {
  id: 3,
  titulo: 'React desde cero',
  estado: 'publicado',
  totalLecciones: 5,
  totalInscritos: 74,
  progresoPromedio: 58.4,
  notaPromedio: 81.6,
  estudiantesCompletados: 32,
  tasaCompletado: 43.2,
  leccionMayorDesercion: {
    leccionId: 12,
    titulo: 'Manejo de estado',
    orden: 2,
    estudiantesDetenidos: 26,
  },
};

function render(element) {
  return renderToStaticMarkup(element);
}

test('el servicio de analíticas consulta el detalle privado del curso', async (t) => {
  const llamadas = [];
  setAccessToken('analiticas-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    llamadas.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
    ]);

    return Response.json({
      analiticas: {
        curso,
        embudo: [],
        distribucionProgreso: [],
        cuestionario: null,
      },
    });
  });

  const data = await obtenerAnaliticasCurso(3);

  assert.deepEqual(llamadas, [
    ['/cursos/mios/3/analiticas', 'GET', 'Bearer analiticas-token'],
  ]);
  assert.equal(data.analiticas.curso.totalInscritos, 74);
});

test('un error de la API de analíticas conserva el mensaje del servidor', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: {
      code: 'CURSO_NO_PROPIO',
      message: 'Solo puedes administrar tus propios cursos.',
    },
  }, { status: 403 }));

  await assert.rejects(() => obtenerAnaliticasCurso(8), {
    status: 403,
    code: 'CURSO_NO_PROPIO',
    message: 'Solo puedes administrar tus propios cursos.',
  });
});

test('el resumen del curso muestra inscritos, progreso, nota y completados', () => {
  const html = render(createElement(ResumenAnaliticas, { curso }));

  assert.match(html, /Estudiantes inscritos/);
  assert.match(html, /Progreso promedio/);
  assert.match(html, /Nota promedio/);
  assert.match(html, /Estudiantes completados/);
  assert.match(html, />74</);
  assert.match(html, /58\.4%/);
  assert.match(html, /81\.6\/100/);
  assert.match(html, />32</);
  assert.match(html, /43\.2% tasa de finalización/);
});

test('el embudo destaca la lección con mayor deserción y su recomendación', () => {
  const embudo = [
    {
      id: 11,
      titulo: 'Introducción',
      tipo: 'contenido',
      orden: 1,
      estudiantesAprobados: 74,
      porcentajeAprobados: 100,
      estudiantesDetenidos: 0,
    },
    {
      id: 12,
      titulo: 'Manejo de estado',
      tipo: 'contenido',
      orden: 2,
      estudiantesAprobados: 42,
      porcentajeAprobados: 56.7,
      estudiantesDetenidos: 26,
    },
  ];

  const html = render(createElement(EmbudoRetencion, { curso, embudo }));

  assert.match(html, /Embudo de retención y avance por lección/);
  assert.match(html, /Mayor deserción detectada: Lección 2: Manejo de estado · 26 estudiantes se detuvieron/);
  assert.match(html, /Mayor detención/);
  assert.match(html, /26 estudiantes no avanzaron/);
  assert.match(html, /42 estudiantes \(\s*56\.7%\)/);
  assert.match(html, /role="progressbar"/);
});

test('el embudo vacío invita a agregar lecciones', () => {
  const html = render(createElement(EmbudoRetencion, {
    curso: { ...curso, leccionMayorDesercion: null },
    embudo: [],
  }));

  assert.match(html, /Agrega lecciones al curso para ver su embudo de retención/);
  assert.doesNotMatch(html, /Mayor deserción detectada/);
});

test('la distribución de progreso informa estudiantes y porcentajes', () => {
  const html = render(createElement(DistribucionProgreso, {
    distribucion: [
      { rango: '0% - 25%', etiqueta: 'Iniciando', estudiantes: 12, porcentaje: 16 },
      { rango: '26% - 50%', etiqueta: 'Básico', estudiantes: 14, porcentaje: 19 },
      {
        rango: '51% - 75%',
        etiqueta: 'Intermedio avanzado',
        estudiantes: 16,
        porcentaje: 22,
      },
      {
        rango: '76% - 100%',
        etiqueta: 'Completado o evaluando',
        estudiantes: 32,
        porcentaje: 43,
      },
    ],
  }));

  assert.match(html, /Distribución de progreso de estudiantes/);
  assert.match(html, /12 estudiantes \(\s*16%\)/);
  assert.match(html, /32 estudiantes \(\s*43%\)/);
});

test('el desempeño del cuestionario muestra los intentos y sus promedios', () => {
  const html = render(createElement(DesempenoCuestionario, {
    cuestionario: {
      leccionId: 13,
      titulo: 'Cuestionario final',
      orden: 5,
      notaMinima: 70,
      totalAprobados: 32,
      intentos: [
        { intento: 1, estudiantes: 21, notaPromedio: 88 },
        { intento: 2, estudiantes: 9, notaPromedio: 76 },
        { intento: 3, estudiantes: 2, notaPromedio: 72 },
      ],
    },
  }));

  assert.match(html, /Desempeño en cuestionario/);
  assert.match(html, /Aprobaron en 1er intento/);
  assert.match(html, /Aprobaron en 2do intento/);
  assert.match(html, /Aprobaron en 3er intento/);
  assert.match(html, /Promedio: 88\/100/);
  assert.match(html, /21 estudiantes/);
  assert.match(html, /32 estudiantes aprobaron el cuestionario/);
});

test('un curso sin cuestionarios muestra un estado vacío', () => {
  const html = render(createElement(DesempenoCuestionario, { cuestionario: null }));

  assert.match(html, /Este curso todavía no tiene cuestionarios/);
});

test('los ayudantes de análisis formatean barras y deserción', () => {
  assert.equal(anchoBarra(58.4), '58.4%');
  assert.equal(anchoBarra(120), '100%');
  assert.equal(anchoBarra(null), '0%');
  assert.equal(
    describirMayorDesercion({
      orden: 3,
      titulo: 'Hooks',
      estudiantesDetenidos: 1,
    }),
    'Lección 3: Hooks · 1 estudiante se detuvo',
  );
  assert.equal(describirMayorDesercion(null), null);
});

test('el cuadro de estudiantes lista los inscritos y su cantidad', () => {
  const html = render(createElement(EstudiantesInscritos, {
    estudiantes: [
      {
        id: 31,
        nombre: 'Carla Méndez',
        email: 'carla@miniaula.test',
        fechaInscripcion: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 32,
        nombre: 'Diego Rojas',
        email: 'diego@miniaula.test',
        fechaInscripcion: null,
      },
    ],
  }));

  assert.match(html, /Estudiantes inscritos/);
  assert.match(html, /2 estudiantes/);
  assert.match(html, /Carla Méndez/);
  assert.match(html, /carla@miniaula\.test/);
  assert.match(html, /Diego Rojas/);
  assert.match(html, /Fecha de inscripción sin datos/);
});

test('el cuadro de estudiantes muestra carga, vacío y error', () => {
  const cargando = render(createElement(EstudiantesInscritos, { loading: true }));
  assert.match(cargando, /Cargando estudiantes…/);

  const vacio = render(createElement(EstudiantesInscritos, { estudiantes: [] }));
  assert.match(vacio, /Aún no hay estudiantes inscritos/);

  const error = render(createElement(EstudiantesInscritos, {
    error: new Error('No se pudo cargar la lista.'),
    onRetry: () => {},
  }));
  assert.match(error, /No se pudieron cargar los estudiantes/);
  assert.match(error, /No se pudo cargar la lista\./);
  assert.match(error, /Reintentar/);
});

test('la página de analíticas muestra la carga inicial de cursos', () => {
  const html = render(
    createElement(
      MemoryRouter,
      null,
      createElement(AnalyticsPage),
    ),
  );

  assert.match(html, /Analíticas detalladas del curso/);
  assert.match(html, /Cargando tus cursos…/);
});
