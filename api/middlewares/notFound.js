import { AppError } from '../utils/errors.js';

export function notFoundHandler(request, _response, next) {
  next(new AppError(
    404,
    'RUTA_NO_ENCONTRADA',
    `No existe la ruta ${request.method} ${request.originalUrl}.`,
  ));
}
