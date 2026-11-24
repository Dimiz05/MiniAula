import { Router } from 'express';
import { actualizar, eliminar } from '../controllers/pregunta.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  actualizarPreguntaSchema,
  preguntaIdParamsSchema,
} from '../schemas/pregunta.js';

const router = Router();

router.put(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate({ params: preguntaIdParamsSchema, body: actualizarPreguntaSchema }),
  actualizar,
);
router.delete(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate({ params: preguntaIdParamsSchema }),
  eliminar,
);

export default router;
