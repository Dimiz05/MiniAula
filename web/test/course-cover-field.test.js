import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import {
  analizarArchivosSoltados,
  esArrastreDeArchivos,
} from '../src/pages/instructor/courseForm.js';

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: 'custom',
});
after(() => vite.close());

const { default: CoverField } = await vite.ssrLoadModule(
  '/src/pages/instructor/CoverField.jsx',
);

const noop = () => {};

function render(props = {}) {
  return renderToStaticMarkup(createElement(CoverField, {
    previewPortada: '',
    alt: 'Vista previa de la portada',
    nombrePortada: '',
    error: null,
    busy: false,
    uploading: false,
    onFile: noop,
    onRemove: noop,
    onError: noop,
    ...props,
  }));
}

test('el campo de portada ofrece arrastrar o hacer clic y asocia la etiqueta al input', () => {
  const html = render();

  assert.match(html, /Arrastra una imagen aquí o haz clic para seleccionarla/);
  assert.match(html, /PNG, JPG o WebP · máximo 5 MB\./);
  assert.match(html, /type="file"/);
  assert.match(html, /accept="image\/png,image\/jpeg,image\/jpg,image\/webp"/);

  const inputId = html.match(/<input[^>]*id="([^"]+)"/)?.[1];
  const labelFor = html.match(/<label[^>]*for="([^"]+)"/)?.[1];
  assert.ok(inputId, 'el input debe tener id');
  assert.equal(labelFor, inputId, 'la etiqueta debe apuntar al input de archivo');
});

test('la vista previa y el nombre del archivo se muestran sobre el campo', () => {
  const html = render({
    previewPortada: '/uploads/portadas/react.jpg',
    nombrePortada: 'react.jpg',
    alt: 'Vista previa de la portada de React',
  });

  assert.match(html, /src="\/uploads\/portadas\/react\.jpg"/);
  assert.match(html, /alt="Vista previa de la portada de React"/);
  assert.match(html, /Archivo: react\.jpg\./);
  assert.match(html, /Quitar portada/);
});

test('sin portada el campo invita a elegir una imagen', () => {
  const html = render();

  assert.match(html, /Elegir imagen/);
  assert.doesNotMatch(html, /Cambiar imagen/);
  assert.doesNotMatch(html, /Quitar portada/);
});

test('el error del archivo se anuncia y se enlaza al input', () => {
  const html = render({ error: 'Suelta una sola imagen a la vez para cambiar la portada.' });

  assert.match(html, /role="alert"/);
  assert.match(html, /Suelta una sola imagen a la vez/);

  const errorId = html.match(/<p[^>]*id="([^"]+)"[^>]*role="alert"/)?.[1];
  assert.ok(errorId, 'el mensaje de error debe tener id');
  assert.match(html, new RegExp(`aria-describedby="[^"]*${errorId}[^"]*"`));
});

test('mientras se guarda o sube, el input y los botones quedan deshabilitados', () => {
  const html = render({ busy: true, uploading: true });

  assert.match(html, /type="file"[^>]*disabled/);
  assert.match(html, /Subiendo…/);
});

test('solo un arrastre de archivos abre el área de soltar', () => {
  assert.equal(esArrastreDeArchivos({ types: ['Files'] }), true);
  assert.equal(esArrastreDeArchivos({ types: ['text/plain'] }), false);
  assert.equal(esArrastreDeArchivos({ types: [] }), false);
  assert.equal(esArrastreDeArchivos(null), false);
});

test('se acepta un archivo y se rechazan cero o varios', () => {
  const archivo = { name: 'foto.png', type: 'image/png', size: 1024 };

  assert.deepEqual(analizarArchivosSoltados([archivo]), { archivo, error: null });
  assert.deepEqual(analizarArchivosSoltados([]), {
    archivo: null,
    error: 'No se detectó ninguna imagen. Arrastra un archivo PNG, JPG o WebP.',
  });
  assert.deepEqual(analizarArchivosSoltados([archivo, archivo]), {
    archivo: null,
    error: 'Suelta una sola imagen a la vez para cambiar la portada.',
  });
});
