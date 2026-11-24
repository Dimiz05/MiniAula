import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: { port: 24679 } },
  appType: 'custom',
});
after(() => vite.close());

const { default: LessonEditor } = await vite.ssrLoadModule(
  '/src/pages/instructor/LessonEditor.jsx',
);

test('renders content and quiz lessons with their available actions', () => {
  const html = renderToStaticMarkup(createElement(LessonEditor, {
    cursoId: 7,
    lecciones: [
      {
        id: 1,
        titulo: 'Introducción',
        tipo: 'contenido',
        contenido: 'Texto de la lección',
        videoUrl: 'https://videos.example.com/intro.mp4',
        orden: 1,
        notaMinima: null,
      },
      {
        id: 2,
        titulo: 'Cuestionario final',
        tipo: 'cuestionario',
        contenido: null,
        videoUrl: null,
        orden: 2,
        notaMinima: 70,
        preguntas: [
          { id: 10, enunciado: '¿Pregunta uno?', opciones: ['A', 'B'], indiceCorrecto: 0 },
          { id: 11, enunciado: '¿Pregunta dos?', opciones: ['A', 'B'], indiceCorrecto: 1 },
        ],
      },
    ],
  }));

  assert.match(html, /2\. Estructura del temario y lecciones/);
  assert.match(html, /Introducción/);
  assert.match(html, /Contenido/);
  assert.match(html, /Cuestionario final/);
  assert.match(html, /2 preguntas configuradas · Nota mínima: 70/);
  assert.match(html, /https:\/\/videos\.example\.com\/intro\.mp4/);
  assert.match(html, /Agregar lección de contenido/);
  assert.match(html, /Editar Introducción/);
  assert.match(html, /Editar preguntas de Cuestionario final/);
  assert.doesNotMatch(html, /Editar Cuestionario final/);
});

test('renders an empty state when the course has no lessons', () => {
  const html = renderToStaticMarkup(createElement(LessonEditor, {
    cursoId: 7,
    lecciones: [],
  }));

  assert.match(html, /Todavía no hay lecciones/);
  assert.match(html, /Agrega la primera lección de contenido/);
});
