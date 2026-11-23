import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPLOADS_ROOT = fileURLToPath(new URL('../uploads', import.meta.url));
export const PORTADAS_DIR = path.join(UPLOADS_ROOT, 'portadas');
export const PORTADAS_URL_PREFIX = '/uploads/portadas';
