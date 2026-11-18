import { Usuario } from '../models/usuario.js';
import { AppError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/jwt.js';

function extractBearerToken(request) {
  const header = request.get('authorization') ?? '';
  const [scheme, token] = header.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function authenticate(request, _response, next) {
  try {
    const token = extractBearerToken(request);

    if (!token) {
      throw new AppError(401, 'NO_AUTENTICADO', 'Debes iniciar sesión para acceder a este recurso.');
    }

    const payload = verifyAccessToken(token);

    if (!payload.sub) {
      throw new AppError(401, 'TOKEN_INVALIDO', 'El token no es válido o expiró.');
    }

    const usuario = await Usuario.findByPk(payload.sub);

    if (!usuario) {
      throw new AppError(401, 'NO_AUTENTICADO', 'La cuenta asociada al token ya no existe.');
    }

    request.usuario = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.usuario) {
      return next(new AppError(401, 'NO_AUTENTICADO', 'Debes iniciar sesión para acceder a este recurso.'));
    }

    if (!roles.includes(request.usuario.rol)) {
      return next(new AppError(403, 'SIN_PERMISO', 'No tienes permisos para realizar esta acción.'));
    }

    return next();
  };
}
