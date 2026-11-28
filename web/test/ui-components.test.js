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

const { default: Button } = await vite.ssrLoadModule('/src/components/Button.jsx');
const { default: ConfirmDialog } = await vite.ssrLoadModule('/src/components/ConfirmDialog.jsx');
const { default: FormActions } = await vite.ssrLoadModule('/src/components/FormActions.jsx');
const { default: CourseCard } = await vite.ssrLoadModule('/src/components/CourseCard.jsx');

test('el botón compartido puede renderizar un enlace y conserva su altura táctil', () => {
  const html = renderToStaticMarkup(
    createElement(Button, { as: 'a', href: '/catalog' }, 'Explorar cursos'),
  );

  assert.match(html, /<a href="\/catalog"/);
  assert.match(html, /min-h-11/);
  assert.doesNotMatch(html, /\sdisabled=/);
});

test('el botón compartido deshabilita mientras carga', () => {
  const html = renderToStaticMarkup(
    createElement(Button, { loading: true }, 'Guardar'),
  );

  assert.match(html, /disabled/);
  assert.match(html, /progress_activity/);
});

test('la barra de acciones anuncia su estado y agrupa las acciones', () => {
  const html = renderToStaticMarkup(
    createElement(
      FormActions,
      { status: 'Cambios sin guardar', tone: 'muted' },
      createElement(Button, null, 'Guardar'),
    ),
  );

  assert.match(html, /role="status"/);
  assert.match(html, /Cambios sin guardar/);
  assert.match(html, /Guardar/);
});

test('el diálogo de confirmación no ocupa DOM cerrado y expone título y acciones abierto', () => {
  const closed = renderToStaticMarkup(
    createElement(ConfirmDialog, {
      open: false,
      title: '¿Eliminar la lección?',
      onConfirm: () => {},
      onCancel: () => {},
    }),
  );
  assert.equal(closed, '');

  const open = renderToStaticMarkup(
    createElement(ConfirmDialog, {
      open: true,
      title: '¿Eliminar la lección?',
      description: 'También se eliminarán sus preguntas.',
      confirmLabel: 'Eliminar lección',
      onConfirm: () => {},
      onCancel: () => {},
    }),
  );
  assert.match(open, /<dialog/);
  // m-auto restores native dialog centering after Tailwind's margin reset.
  assert.match(open, /m-auto/);
  assert.match(open, /¿Eliminar la lección\?/);
  assert.match(open, /También se eliminarán sus preguntas\./);
  assert.match(open, /Eliminar lección/);
  assert.match(open, /Cancelar/);
});

test('la tarjeta de curso comparte portada, título, descripción y acción', () => {
  const html = renderToStaticMarkup(
    createElement(
      CourseCard,
      {
        portada: '',
        alt: 'Portada de React',
        title: 'React desde cero',
        description: 'Componentes y estado.',
        action: createElement(Button, { variant: 'secondary' }, 'Ver curso'),
      },
    ),
  );

  assert.match(html, /React desde cero/);
  assert.match(html, /Componentes y estado\./);
  assert.match(html, /Ver curso/);
  assert.match(html, /rounded-card/);
  assert.match(html, /p-4/);
});
