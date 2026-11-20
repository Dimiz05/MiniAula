import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  API_URL,
  ApiError,
  setAccessToken,
  setUnauthorizedHandler,
} from '../src/config/http.js';
import {
  fetchCurrentUser,
  loginRequest,
  registerRequest,
  updateCurrentUser,
} from '../src/services/auth.service.js';

const originalFetch = globalThis.fetch;
let unauthorizedCalls = 0;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  unauthorizedCalls = 0;
  setAccessToken(null);
  setUnauthorizedHandler(() => {
    unauthorizedCalls += 1;
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  setAccessToken(null);
  setUnauthorizedHandler(null);
});

test('attaches the bearer token when reading the profile', async () => {
  let captured;

  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({
      usuario: {
        id: 1,
        nombre: 'Sofía',
        email: 'sofia@example.com',
        rol: 'estudiante',
      },
    });
  };

  setAccessToken('token-123');
  const data = await fetchCurrentUser();

  assert.equal(captured.url, `${API_URL}/users/me`);
  assert.equal(captured.options.method, 'GET');
  assert.equal(captured.options.headers.Authorization, 'Bearer token-123');
  assert.equal(data.usuario.email, 'sofia@example.com');
});

test('sends login and registration as unauthenticated JSON requests', async () => {
  const calls = [];

  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse({
      usuario: { id: 1, nombre: 'Sofía', email: 'sofia@example.com', rol: 'estudiante' },
      token: 'new-token',
    });
  };

  await loginRequest({ email: 'sofia@example.com', password: 'Miniaula123!' });
  await registerRequest({
    nombre: 'Sofía',
    email: 'sofia@example.com',
    password: 'Miniaula123!',
    rol: 'estudiante',
  });

  assert.equal(calls[0].url, `${API_URL}/auth/login`);
  assert.equal(calls[1].url, `${API_URL}/auth/register`);
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    nombre: 'Sofía',
    email: 'sofia@example.com',
    password: 'Miniaula123!',
    rol: 'estudiante',
  });
});

test('updates the profile with PUT and exposes the API error details', async () => {
  let captured;

  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({
      usuario: { id: 1, nombre: 'Nuevo nombre', email: 'sofia@example.com', rol: 'estudiante' },
    });
  };

  setAccessToken('token-123');
  await updateCurrentUser({ nombre: 'Nuevo nombre' });

  assert.equal(captured.url, `${API_URL}/users/me`);
  assert.equal(captured.options.method, 'PUT');
  assert.deepEqual(JSON.parse(captured.options.body), { nombre: 'Nuevo nombre' });

  globalThis.fetch = async () => jsonResponse({
    error: {
      code: 'VALIDACION',
      message: 'Los datos enviados no son válidos.',
      details: [{ campo: 'email', mensaje: 'El email no es válido.' }],
    },
  }, 422);

  await assert.rejects(
    updateCurrentUser({ email: 'no-es-email' }),
    (error) => error instanceof ApiError
      && error.status === 422
      && error.code === 'VALIDACION'
      && error.details[0].campo === 'email',
  );
});

test('signs out only on authenticated 401 responses', async () => {
  globalThis.fetch = async () => jsonResponse({
    error: {
      code: 'TOKEN_INVALIDO',
      message: 'El token no es válido o expiró.',
      details: null,
    },
  }, 401);

  setAccessToken('expired-token');
  await assert.rejects(
    fetchCurrentUser(),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(unauthorizedCalls, 1);

  unauthorizedCalls = 0;
  await assert.rejects(
    loginRequest({ email: 'sofia@example.com', password: 'incorrecta' }),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(unauthorizedCalls, 0);
});

test('ignores a 401 from a request that belongs to an older token', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });

  globalThis.fetch = async () => {
    await gate;
    return jsonResponse({
      error: {
        code: 'TOKEN_INVALIDO',
        message: 'El token no es válido o expiró.',
        details: null,
      },
    }, 401);
  };

  setAccessToken('old-token');
  const pending = fetchCurrentUser();
  setAccessToken('new-token');
  release();

  await assert.rejects(
    pending,
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(unauthorizedCalls, 0);
});

test('turns a network failure into a readable ApiError', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };

  await assert.rejects(
    loginRequest({ email: 'sofia@example.com', password: 'Miniaula123!' }),
    (error) => error instanceof ApiError
      && error.status === 0
      && error.code === 'ERROR_DE_RED'
      && /No pudimos conectar/.test(error.message),
  );
});
