import { AppError } from '../utils/errors.js';
import { formatZodIssues } from '../utils/zod.js';

const FUENTES = ['params', 'query', 'body'];

export function validate(schemas) {
  return (request, _response, next) => {
    const validated = {};
    const details = [];

    for (const source of FUENTES) {
      const schema = schemas[source];
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(request[source]);
      if (result.success) {
        validated[source] = result.data;
      } else {
        details.push(...formatZodIssues(result.error));
      }
    }

    if (details.length > 0) {
      return next(new AppError(
        422,
        'VALIDACION',
        'Los datos enviados no son válidos.',
        details,
      ));
    }

    request.validated = validated;
    return next();
  };
}
