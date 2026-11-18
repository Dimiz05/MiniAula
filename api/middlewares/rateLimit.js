import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_WINDOW_MINUTES * 60 * 1000,
  limit: env.LOGIN_RATE_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_request, _response, next) => next(new AppError(
    429,
    'DEMASIADOS_INTENTOS',
    'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.',
  )),
});
