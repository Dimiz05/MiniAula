import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { API_URL, setAccessToken } from '../src/config/http.js';
import {
  enviarIntento,
  obtenerCuestionarioEstudiante,
} from '../src/services/leccion.service.js';
import {
  aRespuestas,
  crearSeleccionInicial,
  normalizarIntento,
  respuestasPendientes,
  totalIntentos,
} from '../src/utils/quizState.js';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});

const { QuizPreguntas, QuizResultado } = await vite.ssrLoadModule(
  '/src/components/QuizAttempt.jsx',
);

after(() => vite.close());

test('quiz operations use the authenticated student endpoints', async (t) => {
  const calls = [];
  setAccessToken('student-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
      options.body,
    ]);

    if (options.method === 'POST') {
      return Response.json({
        intento: {
          nota: 100,
          aprobada: true,
          mejorNota: 100,
          notaMinima: 70,
          intentos: 1,
          intentosDisponibles: 2,
        },
      });
    }

    return Response.json({
      leccion: {
        id: 12,
        titulo: 'Cuestionario final',
        tipo: 'cuestionario',
        notaMinima: 70,
        preguntas: [
          {
            id: 41,
            enunciado: '¿Cuál es la capital de Perú?',
            opciones: ['Lima', 'Bogotá'],
            leccionId: 12,
          },
        ],
      },
      intento: {
        aprobada: false,
        mejorNota: null,
        notaMinima: 70,
        intentos: 0,
        intentosDisponibles: 3,
      },
    });
  });

  const cuestionario = await obtenerCuestionarioEstudiante(12);
  const resultado = await enviarIntento(12, [
    { preguntaId: 41, opcion: 0 },
  ]);

  assert.equal(cuestionario.leccion.preguntas[0].opciones[0], 'Lima');
  assert.equal(resultado.intento.nota, 100);
  assert.deepEqual(calls, [
    [
      '/lecciones/12/cuestionario',
      'GET',
      'Bearer student-token',
      undefined,
    ],
    [
      '/lecciones/12/intentos',
      'POST',
      'Bearer student-token',
      JSON.stringify({ respuestas: [{ preguntaId: 41, opcion: 0 }] }),
    ],
  ]);
});

test('quiz selections become the server payload without grading in the browser', () => {
  const preguntas = [
    { id: 41, enunciado: 'Pregunta 1', opciones: ['A', 'B'] },
    { id: 42, enunciado: 'Pregunta 2', opciones: ['C', 'D'] },
  ];
  const seleccion = crearSeleccionInicial(preguntas);

  assert.deepEqual(seleccion, { 41: null, 42: null });
  assert.deepEqual(respuestasPendientes(preguntas, seleccion), preguntas);

  const parcial = { ...seleccion, 41: 1 };
  assert.deepEqual(
    respuestasPendientes(preguntas, parcial).map((pregunta) => pregunta.id),
    [42],
  );

  const completa = { ...parcial, 42: 0 };
  assert.deepEqual(respuestasPendientes(preguntas, completa), []);
  assert.deepEqual(aRespuestas(preguntas, completa), [
    { preguntaId: 41, opcion: 1 },
    { preguntaId: 42, opcion: 0 },
  ]);
});

test('attempt values come from the API and keep a zero grade', () => {
  const intento = normalizarIntento({
    nota: 0,
    aprobada: false,
    mejorNota: 0,
    notaMinima: 70,
    intentos: 1,
    intentosDisponibles: 2,
  });

  assert.deepEqual(intento, {
    nota: 0,
    aprobada: false,
    mejorNota: 0,
    notaMinima: 70,
    intentos: 1,
    intentosDisponibles: 2,
  });
  assert.equal(totalIntentos(intento), 3);
});

test('the quiz form renders questions and options without answer keys', () => {
  const preguntas = [
    {
      id: 41,
      enunciado: '¿Cuál es la capital de Perú?',
      opciones: ['Lima', 'Bogotá'],
      leccionId: 12,
    },
  ];

  const html = renderToStaticMarkup(createElement(QuizPreguntas, {
    preguntas,
    seleccion: crearSeleccionInicial(preguntas),
    onSeleccionar: () => {},
    onSubmit: () => {},
    enviando: false,
    respondidas: 0,
    total: 1,
    error: null,
  }));

  assert.match(html, /¿Cuál es la capital de Perú\?/);
  assert.match(html, /Lima/);
  assert.match(html, /Bogotá/);
  assert.match(html, /type="radio"/);
  assert.match(html, /Enviar respuestas/);
  assert.match(html, /Respondidas: 0 de 1/);
  assert.equal(html.includes('indiceCorrecto'), false);
  assert.equal(html.includes('respuesta correcta'), false);

  const enviando = renderToStaticMarkup(createElement(QuizPreguntas, {
    preguntas,
    seleccion: crearSeleccionInicial(preguntas),
    onSeleccionar: () => {},
    onSubmit: () => {},
    enviando: true,
    respondidas: 1,
    total: 1,
    error: null,
  }));

  assert.match(enviando, /Enviando respuestas/);
  assert.match(enviando, /disabled/);
});

test('the result panel shows grade, pass state and remaining attempts', () => {
  const aprobado = renderToStaticMarkup(createElement(QuizResultado, {
    intento: {
      nota: 85,
      aprobada: true,
      mejorNota: 85,
      notaMinima: 70,
      intentos: 1,
      intentosDisponibles: 2,
    },
    onReintentar: () => {},
    puedeReintentar: true,
  }));

  assert.match(aprobado, /Aprobado/);
  assert.match(aprobado, /85/);
  assert.match(aprobado, /2 de 3/);
  assert.match(aprobado, /Reintentar para mejorar nota/);

  const reprobado = renderToStaticMarkup(createElement(QuizResultado, {
    intento: {
      nota: 50,
      aprobada: false,
      mejorNota: 50,
      notaMinima: 70,
      intentos: 3,
      intentosDisponibles: 0,
    },
    onReintentar: null,
    puedeReintentar: false,
  }));

  assert.match(reprobado, /Reprobado/);
  assert.match(reprobado, /50/);
  assert.match(reprobado, /0 de 3/);
  assert.equal(reprobado.includes('Reintentar para mejorar nota'), false);
});
