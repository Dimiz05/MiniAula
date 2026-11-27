import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  construirParamsCatalogo,
  paginaDentroDeRango,
} from './catalogParams.js';

test('catalog params keep the active search, category and page', () => {
  const params = construirParamsCatalogo({
    q: 'react',
    categoria: 'Programación',
    page: 2,
  });

  assert.equal(params.get('q'), 'react');
  assert.equal(params.get('categoria'), 'Programación');
  assert.equal(params.get('page'), '2');
});

test('catalog params omit empty filters and the first page', () => {
  const params = construirParamsCatalogo({ q: '', categoria: '', page: 1 });

  assert.equal(params.has('q'), false);
  assert.equal(params.has('categoria'), false);
  assert.equal(params.has('page'), false);
});

test('an out-of-range page clamps to the available pages', () => {
  assert.equal(paginaDentroDeRango(99, 2), 2);
  assert.equal(paginaDentroDeRango(0, 2), 1);
  assert.equal(paginaDentroDeRango(2, 0), 1);
});
