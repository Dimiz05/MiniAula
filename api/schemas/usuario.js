import { z } from 'zod';

export const nombreSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(120, 'El nombre no puede superar los 120 caracteres.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'El email es obligatorio.')
  .max(180, 'El email no puede superar los 180 caracteres.')
  .email('El email no es válido.');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña no puede superar los 72 caracteres.')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'La contraseña no puede superar los 72 bytes.',
  );

export const rolSchema = z.enum(['estudiante', 'instructor'], {
  message: 'El rol debe ser estudiante o instructor.',
});

export const actualizarPerfilSchema = z
  .object({
    nombre: nombreSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
  })
  .strict()
  .refine(
    (datos) => Object.keys(datos).length > 0,
    'Envía al menos un campo para actualizar.',
  );
