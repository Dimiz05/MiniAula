import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../middlewares/auth.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { signAccessToken, verifyAccessToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

function runMiddleware(middleware, request) {
  return new Promise((resolve) => {
    middleware(request, {}, resolve);
  });
}

test('JWT round trip keeps the user id and role', () => {
  const token = signAccessToken({ id: 12, rol: 'instructor' });
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, '12');
  assert.equal(payload.rol, 'instructor');
});

test('expired JWTs are rejected with a 401 AppError', () => {
  const expired = jwt.sign(
    { sub: '1', rol: 'estudiante' },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: -1,
      issuer: 'miniaula-api',
      audience: 'miniaula-web',
    },
  );

  assert.throws(
    () => verifyAccessToken(expired),
    (error) => error instanceof AppError
      && error.statusCode === 401
      && error.code === 'TOKEN_INVALIDO',
  );
});

test('bcrypt hashes and verifies passwords', async () => {
  const passwordHash = await hashPassword('Miniaula123!');

  assert.notEqual(passwordHash, 'Miniaula123!');
  assert.equal(await verifyPassword('Miniaula123!', passwordHash), true);
  assert.equal(await verifyPassword('otra-clave', passwordHash), false);
});

test('authenticate rejects requests without a bearer token', async () => {
  const request = { get: () => undefined };
  const error = await runMiddleware(authenticate, request);

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, 'NO_AUTENTICADO');
});

test('authenticate rejects a tampered bearer token', async () => {
  const request = { get: () => 'Bearer token-invalido' };
  const error = await runMiddleware(authenticate, request);

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, 'TOKEN_INVALIDO');
});

test('authorize allows the required role', async () => {
  const request = { usuario: { rol: 'instructor' } };
  const error = await runMiddleware(authorize('instructor'), request);

  assert.equal(error, undefined);
});

test('authorize rejects a different role with 403', async () => {
  const request = { usuario: { rol: 'estudiante' } };
  const error = await runMiddleware(authorize('instructor'), request);

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 403);
  assert.equal(error.code, 'SIN_PERMISO');
});

test('authorize rejects unauthenticated requests with 401', async () => {
  const error = await runMiddleware(authorize('estudiante'), {});

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 401);
});
