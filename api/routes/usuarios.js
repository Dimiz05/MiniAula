import { Router } from 'express';
import { getMe, updateMe } from '../controllers/usuarios.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { actualizarPerfilSchema } from '../schemas/usuario.js';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validate({ body: actualizarPerfilSchema }), updateMe);

export default router;
