import { z } from 'zod';
import { crearPreguntaSchema } from './pregunta.js';

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

const notaMinimaSchema = z
  .number({ message: 'La nota mínima debe ser un número.' })
  .int('La nota mínima debe ser un número entero.')
  .min(1, 'La nota mínima debe ser al menos 1.')
  .max(100, 'La nota mínima no puede superar 100.');

// Crea una lección de contenido o un cuestionario. Cuando `tipo` se omite se
// asume "contenido" para conservar el contrato anterior.
export const crearLeccionSchema = z
  .object({
    titulo: tituloLeccionSchema,
    tipo: z
      .enum(['contenido', 'cuestionario'], {
        message: 'El tipo de lección debe ser contenido o cuestionario.',
      })
      .optional(),
    contenido: contenidoLeccionSchema.optional(),
    videoUrl: videoUrlSchema,
    notaMinima: notaMinimaSchema.optional(),
    preguntas: z.array(crearPreguntaSchema).optional(),
  })
  .strict()
  .superRefine((datos, contexto) => {
    if (datos.tipo === 'cuestionario') {
      if (datos.notaMinima === undefined) {
        contexto.addIssue({
          code: 'custom',
          path: ['notaMinima'],
          message: 'La nota mínima es obligatoria para un cuestionario.',
        });
      }

      if (!Array.isArray(datos.preguntas) || datos.preguntas.length === 0) {
        contexto.addIssue({
          code: 'custom',
          path: ['preguntas'],
          message: 'El cuestionario debe tener al menos una pregunta.',
        });
      }

      if (datos.contenido !== undefined) {
        contexto.addIssue({
          code: 'custom',
          path: ['contenido'],
          message: 'Un cuestionario no lleva contenido de lección.',
        });
      }

      if (datos.videoUrl !== undefined) {
        contexto.addIssue({
          code: 'custom',
          path: ['videoUrl'],
          message: 'Un cuestionario no lleva enlace de video.',
        });
      }

      return;
    }

    if (!datos.contenido) {
      contexto.addIssue({
        code: 'custom',
        path: ['contenido'],
        message: 'El contenido es obligatorio.',
      });
    }

    if (datos.notaMinima !== undefined) {
      contexto.addIssue({
        code: 'custom',
        path: ['notaMinima'],
        message: 'La nota mínima solo aplica a un cuestionario.',
      });
    }

    if (datos.preguntas !== undefined) {
      contexto.addIssue({
        code: 'custom',
        path: ['preguntas'],
        message: 'Las preguntas solo aplican a un cuestionario.',
      });
    }
  });

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
