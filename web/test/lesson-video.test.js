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

const { default: LessonVideo } = await vite.ssrLoadModule(
  '/src/components/LessonVideo.jsx',
);
const { obtenerFuenteVideo } = await vite.ssrLoadModule('/src/utils/media.js');

test('a direct video file plays with the native player inside the page', () => {
  const html = renderToStaticMarkup(createElement(LessonVideo, {
    videoUrl: 'https://videos.example.com/leccion.mp4',
    titulo: 'Componentes y JSX',
  }));

  assert.match(html, /<video/);
  assert.match(html, /controls/);
  assert.match(html, /preload="metadata"/);
  assert.match(html, /src="https:\/\/videos\.example\.com\/leccion\.mp4"/);
  assert.match(html, /Video de la lección/);
  assert.doesNotMatch(html, /Abrir video/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('a YouTube lesson is embedded instead of linking out', () => {
  const html = renderToStaticMarkup(createElement(LessonVideo, {
    videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    titulo: 'Componentes y JSX',
  }));

  assert.match(html, /<iframe/);
  assert.match(html, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/W6NZfCO5SIk"/);
  assert.match(html, /allowfullscreen/i);
  assert.doesNotMatch(html, /<video/);
});

test('video sources are normalized to an embeddable player', () => {
  assert.deepEqual(obtenerFuenteVideo('https://youtu.be/W6NZfCO5SIk'), {
    tipo: 'youtube',
    src: 'https://www.youtube-nocookie.com/embed/W6NZfCO5SIk',
  });
  assert.deepEqual(
    obtenerFuenteVideo('https://www.youtube-nocookie.com/embed/W6NZfCO5SIk'),
    {
      tipo: 'youtube',
      src: 'https://www.youtube-nocookie.com/embed/W6NZfCO5SIk',
    },
  );
  assert.deepEqual(obtenerFuenteVideo('https://vimeo.com/76979871'), {
    tipo: 'vimeo',
    src: 'https://player.vimeo.com/video/76979871',
  });
  assert.deepEqual(obtenerFuenteVideo('/uploads/videos/leccion.mp4'), {
    tipo: 'archivo',
    src: '/uploads/videos/leccion.mp4',
  });
  assert.equal(obtenerFuenteVideo(null), null);
});

test('a lesson without video renders nothing', () => {
  assert.equal(
    renderToStaticMarkup(createElement(LessonVideo, { videoUrl: null })),
    '',
  );
});
