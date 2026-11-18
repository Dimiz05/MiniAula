import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

function createRateLimiter({ windowMinutes, limit, code, message }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (_request, _response, next) => next(new AppError(429, code, message)),
  });
}

export const loginRateLimiter = createRateLimiter({
  windowMinutes: env.LOGIN_RATE_WINDOW_MINUTES,
  limit: env.LOGIN_RATE_MAX,
  code: 'DEMASIADOS_INTENTOS',
  message: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.',
});

export const registerRateLimiter = createRateLimiter({
  windowMinutes: env.REGISTER_RATE_WINDOW_MINUTES,
  limit: env.REGISTER_RATE_MAX,
  code: 'DEMASIADOS_REGISTROS',
  message: 'Demasiados registros desde esta conexión. Inténtalo de nuevo más tarde.',
});
