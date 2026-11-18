import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
} from 'sequelize';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { formatZodIssues } from '../utils/zod.js';

function normalizeSequelizeValidationError(error) {
  const details = (error.errors ?? []).map((item) => ({
    campo: item.path ?? null,
    mensaje: item.message,
  }));

  return new AppError(422, 'VALIDACION', 'Los datos enviados no son válidos.', details);
}

function normalizeUniqueConstraintError(error) {
  const details = Object.keys(error.fields ?? {}).map((campo) => ({
    campo,
    mensaje: 'Ya existe un registro con este valor.',
  }));

  return new AppError(409, 'RECURSO_DUPLICADO', 'Ya existe un registro con esos datos.', details);
}

export function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(422, 'VALIDACION', 'Los datos enviados no son válidos.', formatZodIssues(error));
  }

  if (error instanceof UniqueConstraintError) {
    return normalizeUniqueConstraintError(error);
  }

  if (error instanceof SequelizeValidationError) {
    return normalizeSequelizeValidationError(error);
  }

  if (error instanceof ForeignKeyConstraintError) {
    return new AppError(409, 'REFERENCIA_INVALIDA', 'El recurso está relacionado con otros registros.');
  }

  if (error?.type === 'entity.parse.failed') {
    return new AppError(400, 'JSON_INVALIDO', 'El cuerpo de la petición no es un JSON válido.');
  }

  if (error?.type === 'entity.too.large') {
    return new AppError(413, 'CUERPO_DEMASIADO_GRANDE', 'El cuerpo de la petición es demasiado grande.');
  }

  return new AppError(500, 'ERROR_INTERNO', 'Ocurrió un error inesperado.');
}

export function errorHandler(error, request, response, _next) {
  if (response.headersSent) {
    return;
  }

  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    console.error(`[error] ${request.method} ${request.originalUrl}`, error);
  }

  response.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details ?? null,
    },
  });
}
