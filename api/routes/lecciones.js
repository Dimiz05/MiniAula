import { Router } from 'express';
import { actualizar, eliminar } from '../controllers/leccion.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  actualizarLeccionSchema,
  leccionIdParamsSchema,
} from '../schemas/leccion.js';

const router = Router();

router.put(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate({ params: leccionIdParamsSchema, body: actualizarLeccionSchema }),
  actualizar,
);
router.delete(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate({ params: leccionIdParamsSchema }),
  eliminar,
);

export default router;
