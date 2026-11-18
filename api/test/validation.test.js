import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { z } from 'zod';
import { errorHandler } from '../middlewares/errorHandler.js';
import { validate } from '../middlewares/validate.js';
import { registroSchema } from '../schemas/auth.js';

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

  app.post('/registro', validate({ body: registroSchema }), (request, response) => {
    response.json(request.validated.body);
  });

  app.get(
    '/items/:id',
    validate({
      params: z.object({ id: z.coerce.number().int().positive() }),
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        q: z.string().trim().max(20).optional(),
      }),
    }),
    (request, response) => {
      response.json(request.validated);
    },
  );

  app.use(errorHandler);
  return app;
}

test('validate normalizes a valid registration body', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/registro`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: '  Carla Méndez ',
        email: ' CARLA@Example.COM ',
        password: 'Miniaula123!',
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      nombre: 'Carla Méndez',
      email: 'carla@example.com',
      password: 'Miniaula123!',
      rol: 'estudiante',
    });
  });
});

test('validate rejects an invalid body with the standard error shape', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/registro`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'A',
        email: 'no-es-email',
        password: 'corta',
        rol: 'admin',
      }),
    });

    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.error.code, 'VALIDACION');
    assert.equal(body.error.message, 'Los datos enviados no son válidos.');
    assert.ok(Array.isArray(body.error.details));
    assert.deepEqual(
      body.error.details.map((detail) => detail.campo).sort(),
      ['email', 'nombre', 'password', 'rol'],
    );
  });
});

test('validate rejects unexpected fields', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/registro`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Carla Méndez',
        email: 'carla@example.com',
        password: 'Miniaula123!',
        admin: true,
      }),
    });

    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.error.code, 'VALIDACION');
    assert.ok(body.error.details.some((detail) => detail.campo === 'admin'));
  });
});

test('validate checks params and query strings', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const valid = await fetch(`${baseUrl}/items/7`);
    assert.equal(valid.status, 200);
    assert.deepEqual(await valid.json(), {
      params: { id: 7 },
      query: { page: 1 },
    });

    const invalid = await fetch(`${baseUrl}/items/abc?page=0`);
    assert.equal(invalid.status, 422);

    const body = await invalid.json();
    assert.deepEqual(
      body.error.details.map((detail) => detail.campo).sort(),
      ['id', 'page'],
    );
  });
});
