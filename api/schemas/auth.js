import { z } from 'zod';
import {
  emailSchema,
  nombreSchema,
  passwordSchema,
  rolSchema,
} from './usuario.js';

export const registroSchema = z
  .object({
    nombre: nombreSchema,
    email: emailSchema,
    password: passwordSchema,
    rol: rolSchema.optional().default('estudiante'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'La contraseña es obligatoria.').max(72),
  })
  .strict();
