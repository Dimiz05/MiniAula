import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: { port: 24680 } },
  appType: 'custom',
});
after(() => vite.close());

const { default: CourseCover, resolverPortada } = await vite.ssrLoadModule(
  '/src/components/CourseCover.jsx',
);

test('renders the uploaded course cover and crops it to the card area', () => {
  const html = renderToStaticMarkup(createElement(CourseCover, {
    portada: '/uploads/portadas/react.jpg',
    alt: 'Portada de React',
    className: 'h-36',
    children: createElement('span', null, 'Programación'),
  }));

  assert.match(html, /src="\/uploads\/portadas\/react\.jpg"/);
  assert.match(html, /alt="Portada de React"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /object-cover/);
  assert.match(html, /Programación/);
});

test('resolves uploaded paths and keeps absolute image URLs intact', () => {
  assert.equal(resolverPortada('/uploads/portadas/react.jpg'), '/uploads/portadas/react.jpg');
  assert.equal(
    resolverPortada('https://images.example.com/react.jpg'),
    'https://images.example.com/react.jpg',
  );
  assert.equal(resolverPortada('blob:http://localhost/foto'), 'blob:http://localhost/foto');
  assert.equal(resolverPortada(null), null);
});

test('renders the gradient fallback when the course has no portada', () => {
  const html = renderToStaticMarkup(createElement(CourseCover, {
    portada: null,
    alt: 'Portada del curso',
  }));

  assert.doesNotMatch(html, /<img/);
  assert.match(html, /bg-gradient-to-br/);
  assert.match(html, /auto_stories/);
});
