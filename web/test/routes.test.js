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

test('renders the public home, catalog and not-found routes', async () => {
  const { default: AppRoutes } = await vite.ssrLoadModule('/src/routes/AppRoutes.jsx');
  const { MemoryRouter } = await import('react-router');

  for (const [path, heading] of [
    ['/', 'Learn one lesson at a time'],
    ['/catalog', 'Course catalog'],
    ['/unknown', 'Page not found'],
  ]) {
    const html = renderToStaticMarkup(createElement(
      MemoryRouter, { initialEntries: [path] }, createElement(AppRoutes),
    ));
    assert.match(html, /<nav\b/);
    assert.match(html, new RegExp(`<h1[^>]*>${heading}</h1>`));
  }
});
