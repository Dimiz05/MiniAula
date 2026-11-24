import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { API_URL, setAccessToken } from '../src/config/http.js';
import {
  actualizarCuestionario,
  actualizarPregunta,
  crearPregunta,
  eliminarPregunta,
} from '../src/services/pregunta.service.js';
import {
  quitarOpcion,
  toPreguntaErrors,
  validarNotaMinima,
  validarPregunta,
} from '../src/pages/instructor/quizForm.js';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: { port: 24681 } },
  appType: 'custom',
});

const { default: QuestionEditor } = await vite.ssrLoadModule(
  '/src/pages/instructor/QuestionEditor.jsx',
);

after(() => vite.close());

test('question operations use the authenticated instructor endpoints', async (t) => {
  const calls = [];
  setAccessToken('instructor-token');
  t.after(() => setAccessToken(null));
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([
      url.slice(API_URL.length),
      options.method,
      options.headers.Authorization,
      options.body,
    ]);

    if (options.method === 'DELETE') {
      return new Response(null, { status: 204 });
    }

    return Response.json(
      { pregunta: { id: 3 } },
      { status: options.method === 'POST' ? 201 : 200 },
    );
  });

  const datos = {
    enunciado: '¿Cuál es la capital?',
    opciones: ['Lima', 'Bogotá'],
    indiceCorrecto: 1,
  };

  await crearPregunta(10, datos);
  await actualizarPregunta(3, datos);
  await eliminarPregunta(3);
  await actualizarCuestionario(10, { notaMinima: 80 });

  assert.deepEqual(calls, [
    ['/lecciones/10/preguntas', 'POST', 'Bearer instructor-token', JSON.stringify(datos)],
    ['/preguntas/3', 'PUT', 'Bearer instructor-token', JSON.stringify(datos)],
    ['/preguntas/3', 'DELETE', 'Bearer instructor-token', undefined],
    ['/lecciones/10/cuestionario', 'PATCH', 'Bearer instructor-token', JSON.stringify({ notaMinima: 80 })],
  ]);
});

test('question validation trims text and requires a marked correct option', () => {
  const valida = validarPregunta({
    enunciado: '  ¿Cuál es la capital?  ',
    opciones: ['  Lima  ', 'Bogotá'],
    indiceCorrecto: 1,
  });

  assert.deepEqual(valida.datos, {
    enunciado: '¿Cuál es la capital?',
    opciones: ['Lima', 'Bogotá'],
    indiceCorrecto: 1,
  });
  assert.deepEqual(valida.errores, {});

  assert.equal(
    validarPregunta({ enunciado: '   ', opciones: ['A', 'B'], indiceCorrecto: 0 }).errores.enunciado,
    'El enunciado es obligatorio.',
  );
  assert.equal(
    validarPregunta({ enunciado: 'P', opciones: ['A'], indiceCorrecto: 0 }).errores.opciones,
    'La pregunta requiere al menos dos opciones.',
  );
  assert.equal(
    validarPregunta({ enunciado: 'P', opciones: ['A', '   '], indiceCorrecto: 0 }).errores.opciones,
    'Cada opción debe tener texto.',
  );
  assert.equal(
    validarPregunta({ enunciado: 'P', opciones: ['A', 'B'], indiceCorrecto: -1 }).errores.indiceCorrecto,
    'Marca la opción correcta.',
  );
  assert.equal(
    validarPregunta({ enunciado: 'P', opciones: ['A', 'B'], indiceCorrecto: 2 }).errores.indiceCorrecto,
    'Marca la opción correcta.',
  );
});

test('passing grade validation accepts integers from 1 to 100', () => {
  assert.deepEqual(validarNotaMinima('70'), { valor: 70, error: null });
  assert.deepEqual(validarNotaMinima(100), { valor: 100, error: null });

  for (const invalido of ['', '0', '101', '70.5', 'abc']) {
    assert.deepEqual(validarNotaMinima(invalido), {
      valor: null,
      error: 'La nota mínima debe ser un número entero entre 1 y 100.',
    });
  }
});

test('removing an option keeps at least two and fixes the correct index', () => {
  assert.deepEqual(
    quitarOpcion(['A', 'B'], 0, 0),
    { opciones: ['A', 'B'], indiceCorrecto: 0 },
  );
  assert.deepEqual(
    quitarOpcion(['A', 'B', 'C'], 2, 0),
    { opciones: ['B', 'C'], indiceCorrecto: 1 },
  );
  assert.deepEqual(
    quitarOpcion(['A', 'B', 'C'], 1, 1),
    { opciones: ['A', 'C'], indiceCorrecto: -1 },
  );
  assert.deepEqual(
    quitarOpcion(['A', 'B', 'C'], 0, 2),
    { opciones: ['A', 'B'], indiceCorrecto: 0 },
  );
});

test('api option errors are mapped to the options field', () => {
  assert.deepEqual(
    toPreguntaErrors([{ campo: 'opciones.0', mensaje: 'Cada opción debe ser un texto no vacío.' }]),
    { opciones: 'Cada opción debe ser un texto no vacío.' },
  );
  assert.deepEqual(
    toPreguntaErrors([{ campo: 'indiceCorrecto', mensaje: 'El índice no es válido.' }]),
    { indiceCorrecto: 'El índice no es válido.' },
  );
  assert.deepEqual(toPreguntaErrors(null), {});
});

test('question editor lists questions with the correct option and actions', () => {
  const html = renderToStaticMarkup(createElement(QuestionEditor, {
    leccion: {
      id: 10,
      titulo: 'Cuestionario final',
      tipo: 'cuestionario',
      notaMinima: 70,
      preguntas: [
        {
          id: 20,
          enunciado: '¿Cuál es la capital?',
          opciones: ['Lima', 'Bogotá'],
          indiceCorrecto: 1,
          leccionId: 10,
        },
      ],
    },
    onUpdate: () => {},
    onClose: () => {},
  }));

  assert.match(html, /Editor de preguntas/);
  assert.match(html, /Cuestionario final/);
  assert.match(html, /Nota mínima: 70\/100/);
  assert.match(html, /¿Cuál es la capital\?/);
  assert.match(html, /Bogotá/);
  assert.match(html, /Editar pregunta 1/);
  assert.match(html, /Eliminar pregunta 1/);
  assert.match(html, /Agregar pregunta/);
  assert.match(html, /1 pregunta configurada/);
  assert.match(html, /value="70"/);
});

test('question editor shows an empty state when the quiz has no questions', () => {
  const html = renderToStaticMarkup(createElement(QuestionEditor, {
    leccion: {
      id: 10,
      titulo: 'Cuestionario',
      tipo: 'cuestionario',
      notaMinima: 70,
    },
  }));

  assert.match(html, /Todavía no hay preguntas/);
  assert.match(html, /0 preguntas configuradas/);
});
