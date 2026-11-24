import { Router } from 'express';
import {
  actualizar,
  actualizarCuestionario,
  eliminar,
  obtener,
} from '../controllers/leccion.js';
import { crear as crearPregunta } from '../controllers/pregunta.js';
import { completar } from '../controllers/progreso.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  actualizarLeccionSchema,
  leccionIdParamsSchema,
} from '../schemas/leccion.js';
import {
  actualizarCuestionarioSchema,
  crearPreguntaSchema,
} from '../schemas/pregunta.js';

const router = Router();

router.get(
  '/:id',
  authenticate,
  authorize('estudiante'),
  validate({ params: leccionIdParamsSchema }),
  obtener,
);
router.post(
  '/:id/completar',
  authenticate,
  authorize('estudiante'),
  validate({ params: leccionIdParamsSchema }),
  completar,
);
router.post(
  '/:id/preguntas',
  authenticate,
  authorize('instructor'),
  validate({ params: leccionIdParamsSchema, body: crearPreguntaSchema }),
  crearPregunta,
);
router.patch(
  '/:id/cuestionario',
  authenticate,
  authorize('instructor'),
  validate({ params: leccionIdParamsSchema, body: actualizarCuestionarioSchema }),
  actualizarCuestionario,
);
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
