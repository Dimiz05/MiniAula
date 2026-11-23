import { z } from 'zod';

export const leccionIdParamsSchema = z
  .object({
    id: z.coerce
      .number({ message: 'El identificador de la lección debe ser un número.' })
      .int('El identificador de la lección debe ser un número entero.')
      .positive('El identificador de la lección debe ser mayor que 0.'),
  })
  .strict();

const tituloLeccionSchema = z
  .string()
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres.')
  .max(150, 'El título no puede superar los 150 caracteres.');

const contenidoLeccionSchema = z
  .string()
  .trim()
  .min(1, 'El contenido es obligatorio.');

const videoUrlSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return undefined;
    }

    return typeof value === 'string' ? value.trim() : value;
  },
  z
    .union([
      z.literal(''),
      z
        .string()
        .max(500, 'El enlace de video no puede superar los 500 caracteres.')
        .url('El enlace de video debe ser una URL válida.')
        .refine(
          (value) => /^https?:\/\//i.test(value),
          'El enlace de video debe usar http o https.',
        ),
    ])
    .optional(),
);

// Esta fase solo crea lecciones de contenido. La Tarea 6 extiende el contrato
// para los cuestionarios y su nota mínima.
export const crearLeccionSchema = z
  .object({
    titulo: tituloLeccionSchema,
    tipo: z
      .enum(['contenido'], {
        message: 'Solo se pueden crear lecciones de contenido en esta versión.',
      })
      .optional(),
    contenido: contenidoLeccionSchema,
    videoUrl: videoUrlSchema,
  })
  .strict();

export const actualizarLeccionSchema = z
  .object({
    titulo: tituloLeccionSchema.optional(),
    contenido: contenidoLeccionSchema.optional(),
    videoUrl: videoUrlSchema,
  })
  .strict()
  .refine(
    (datos) => Object.keys(datos).length > 0,
    'Envía al menos un campo para actualizar.',
  );

export const reordenarLeccionesSchema = z
  .object({
    orden: z.array(
      z
        .number({ message: 'Cada identificador de lección debe ser un número.' })
        .int('Cada identificador de lección debe ser un número entero.')
        .positive('Cada identificador de lección debe ser mayor que 0.'),
    ),
  })
  .strict();
