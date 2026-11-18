import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  MYSQL_HOST: z.string().trim().min(1, 'MYSQL_HOST es obligatorio.'),
  MYSQL_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  MYSQL_DATABASE: z.string().trim().min(1, 'MYSQL_DATABASE es obligatorio.'),
  MYSQL_USER: z.string().trim().min(1, 'MYSQL_USER es obligatorio.'),
  MYSQL_PASSWORD: z.string().min(1, 'MYSQL_PASSWORD es obligatorio.'),
  MYSQL_LOGGING: z.enum(['true', 'false']).default('false'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres.'),
  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhdwy]$/, 'JWT_EXPIRES_IN debe usar un formato como 15m, 2h o 7d.')
    .default('2h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  CORS_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  LOGIN_RATE_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
  LOGIN_RATE_MAX: z.coerce.number().int().min(1).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'entorno'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Configuración de entorno inválida:\n${problems}`);
}

export const env = Object.freeze(parsed.data);

export const corsOrigins = Object.freeze(
  env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
);
