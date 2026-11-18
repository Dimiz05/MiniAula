import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

const ISSUER = 'miniaula-api';
const AUDIENCE = 'miniaula-web';

export function signAccessToken(usuario) {
  return jwt.sign(
    { sub: String(usuario.id), rol: usuario.rol },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch {
    throw new AppError(401, 'TOKEN_INVALIDO', 'El token no es válido o expiró.');
  }
}
