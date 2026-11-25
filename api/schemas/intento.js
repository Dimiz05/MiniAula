import { z } from 'zod';

const respuestaSchema = z
  .object({
    preguntaId: z
      .number({ message: 'El identificador de la pregunta debe ser un número.' })
      .int('El identificador de la pregunta debe ser un número entero.')
      .positive('El identificador de la pregunta debe ser mayor que 0.'),
    opcion: z
      .number({ message: 'La opción seleccionada debe ser un número.' })
      .int('La opción seleccionada debe ser un número entero.')
      .min(0, 'La opción seleccionada no puede ser negativa.'),
  })
  .strict();

export const crearIntentoBodySchema = z
  .object({
    respuestas: z
      .array(respuestaSchema)
      .min(1, 'Debes responder al menos una pregunta.'),
  })
  .strict();
