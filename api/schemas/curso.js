import { z } from 'zod';

const textoOpcional = (maximo, mensaje) => z
  .string()
  .trim()
  .max(maximo, mensaje)
  .optional()
  .transform((value) => value || undefined);

export const cursoIdParamsSchema = z
  .object({
    id: z.coerce
      .number({ message: 'El identificador del curso debe ser un número.' })
      .int('El identificador del curso debe ser un número entero.')
      .positive('El identificador del curso debe ser mayor que 0.'),
  })
  .strict();

export const catalogoQuerySchema = z
  .object({
    q: textoOpcional(120, 'La búsqueda no puede superar los 120 caracteres.'),
    categoria: textoOpcional(80, 'La categoría no puede superar los 80 caracteres.'),
    page: z.coerce
      .number()
      .int('La página debe ser un número entero.')
      .min(1, 'La página debe ser mayor o igual a 1.')
      .default(1),
    limit: z.coerce
      .number()
      .int('El límite debe ser un número entero.')
      .min(1, 'El límite debe ser mayor o igual a 1.')
      .max(50, 'El límite no puede superar 50.')
      .default(12),
  })
  .strict();
