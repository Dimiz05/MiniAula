import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { UniqueConstraintError } from 'sequelize';
import { errorHandler } from '../middlewares/errorHandler.js';
import { notFoundHandler } from '../middlewares/notFound.js';
import { AppError } from '../utils/errors.js';

async function withServer(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get('/prohibido', () => {
    throw new AppError(403, 'SIN_PERMISO', 'No tienes permisos para realizar esta acción.');
  });

  app.get('/duplicado', () => {
    throw new UniqueConstraintError({
      fields: { email: 'demo@example.com' },
      errors: [],
    });
  });

  app.get('/inesperado', () => {
    throw new Error('Detalle interno que no debe salir en la respuesta.');
  });

  app.post('/json', (request, response) => {
    response.json(request.body);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

test('central error handler serializes AppError', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/prohibido`);

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: {
        code: 'SIN_PERMISO',
        message: 'No tienes permisos para realizar esta acción.',
        details: null,
      },
    });
  });
});

test('central error handler hides unexpected error details', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await withServer(buildApp(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/inesperado`);

      assert.equal(response.status, 500);
      const body = await response.json();
      assert.equal(body.error.code, 'ERROR_INTERNO');
      assert.equal(body.error.message, 'Ocurrió un error inesperado.');
      assert.equal(body.error.details, null);
      assert.doesNotMatch(JSON.stringify(body), /Detalle interno/);
    });
  } finally {
    console.error = originalConsoleError;
  }
});

test('central error handler maps unique constraint errors to 409', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/duplicado`);

    assert.equal(response.status, 409);
    const body = await response.json();
    assert.equal(body.error.code, 'RECURSO_DUPLICADO');
    assert.deepEqual(body.error.details, [
      { campo: 'email', mensaje: 'Ya existe un registro con este valor.' },
    ]);
  });
});

test('central error handler maps malformed JSON to 400', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/json`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"nombre":',
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error.code, 'JSON_INVALIDO');
  });
});

test('unknown routes return the standard 404 error', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/no-existe`);

    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error.code, 'RUTA_NO_ENCONTRADA');
  });
});
