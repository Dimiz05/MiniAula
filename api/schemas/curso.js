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

const tituloCursoSchema = z
  .string()
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres.')
  .max(150, 'El título no puede superar los 150 caracteres.');

const descripcionCursoSchema = z
  .string()
  .trim()
  .min(1, 'La descripción es obligatoria.');

const categoriaCursoSchema = z
  .string()
  .trim()
  .min(2, 'La categoría debe tener al menos 2 caracteres.')
  .max(60, 'La categoría no puede superar los 60 caracteres.');

const nivelCursoSchema = z.enum(
  ['basico', 'intermedio', 'avanzado'],
  { message: 'El nivel debe ser básico, intermedio o avanzado.' },
);

// New courses always start as drafts on the server. Unknown fields such as
// estado or instructorId are stripped instead of trusted.
export const crearCursoSchema = z.object({
  titulo: tituloCursoSchema,
  descripcion: descripcionCursoSchema,
  categoria: categoriaCursoSchema,
  nivel: nivelCursoSchema.default('basico'),
});

export const actualizarCursoSchema = z
  .object({
    titulo: tituloCursoSchema.optional(),
    descripcion: descripcionCursoSchema.optional(),
    categoria: categoriaCursoSchema.optional(),
    nivel: nivelCursoSchema.optional(),
  })
  .strict()
  .refine(
    (datos) => Object.keys(datos).length > 0,
    'Envía al menos un campo para actualizar.',
  );

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
