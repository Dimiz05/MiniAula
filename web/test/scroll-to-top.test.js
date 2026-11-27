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

const { default: ScrollToTop, debeReiniciarScroll, resetScroll } =
  await vite.ssrLoadModule('/src/components/ScrollToTop.jsx');
const { MemoryRouter } = await import('react-router');

test('resets the window scroll to the top immediately', () => {
  const calls = [];
  const win = { scrollTo: (options) => calls.push(options) };

  resetScroll(win);

  assert.deepEqual(calls, [{ top: 0, left: 0, behavior: 'instant' }]);
});

test('ignores environments without a scrollTo function', () => {
  assert.doesNotThrow(() => resetScroll(null));
  assert.doesNotThrow(() => resetScroll({}));
});

test('resets on a new pathname and on the first mount', () => {
  assert.equal(debeReiniciarScroll(null, '/catalog'), true);
  assert.equal(debeReiniciarScroll('/', '/catalog'), true);
  assert.equal(debeReiniciarScroll('/catalog', '/catalog/4'), true);
});

test('keeps the position when only the search params change', () => {
  assert.equal(debeReiniciarScroll('/catalog', '/catalog'), false);
});

test('renders nothing and works inside the router', () => {
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/catalog'] },
      createElement(ScrollToTop),
    ),
  );

  assert.equal(html, '');
});
