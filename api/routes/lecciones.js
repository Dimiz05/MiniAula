import { Router } from 'express';
import { registrar as registrarIntento } from '../controllers/intento.js';
import {
  actualizar,
  actualizarCuestionario,
  eliminar,
  obtener,
  obtenerCuestionario,
} from '../controllers/leccion.js';
import { crear as crearPregunta } from '../controllers/pregunta.js';
import { completar } from '../controllers/progreso.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { crearIntentoBodySchema } from '../schemas/intento.js';
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
router.get(
  '/:id/cuestionario',
  authenticate,
  authorize('estudiante'),
  validate({ params: leccionIdParamsSchema }),
  obtenerCuestionario,
);
router.post(
  '/:id/completar',
  authenticate,
  authorize('estudiante'),
  validate({ params: leccionIdParamsSchema }),
  completar,
);
router.post(
  '/:id/intentos',
  authenticate,
  authorize('estudiante'),
  validate({
    params: leccionIdParamsSchema,
    body: crearIntentoBodySchema,
  }),
  registrarIntento,
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
