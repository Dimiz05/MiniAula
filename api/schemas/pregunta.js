import { z } from 'zod';

export const preguntaIdParamsSchema = z
  .object({
    id: z.coerce
      .number({ message: 'El identificador de la pregunta debe ser un número.' })
      .int('El identificador de la pregunta debe ser un número entero.')
      .positive('El identificador de la pregunta debe ser mayor que 0.'),
  })
  .strict();

const enunciadoSchema = z
  .string()
  .trim()
  .min(1, 'El enunciado es obligatorio.');

const opcionesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Cada opción debe ser un texto no vacío.'),
  )
  .min(2, 'La pregunta requiere al menos dos opciones.');

const indiceCorrectoSchema = z
  .number({ message: 'El índice de la respuesta correcta debe ser un número.' })
  .int('El índice de la respuesta correcta debe ser un número entero.')
  .min(0, 'El índice de la respuesta correcta no puede ser negativo.');

export const crearPreguntaSchema = z
  .object({
    enunciado: enunciadoSchema,
    opciones: opcionesSchema,
    indiceCorrecto: indiceCorrectoSchema,
  })
  .strict()
  .refine(
    (datos) => datos.indiceCorrecto < datos.opciones.length,
    {
      message: 'El índice de la respuesta correcta debe apuntar a una opción existente.',
      path: ['indiceCorrecto'],
    },
  );

// La edición reemplaza los tres campos para que el índice correcto siga
// apuntando a una opción existente cuando cambia la lista.
export const actualizarPreguntaSchema = crearPreguntaSchema;

export const actualizarCuestionarioSchema = z
  .object({
    notaMinima: z
      .number({ message: 'La nota mínima debe ser un número.' })
      .int('La nota mínima debe ser un número entero.')
      .min(1, 'La nota mínima debe ser al menos 1.')
      .max(100, 'La nota mínima no puede superar 100.'),
  })
  .strict();
