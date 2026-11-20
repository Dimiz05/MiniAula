import { Router } from 'express';
import {
  actualizar,
  crear,
  detalle,
  detallePropio,
  listar,
  misCursos,
} from '../controllers/curso.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  actualizarCursoSchema,
  catalogoQuerySchema,
  crearCursoSchema,
  cursoIdParamsSchema,
} from '../schemas/curso.js';

const router = Router();

// Own-course routes must be registered before the public /:id route.
router.get('/mios', authenticate, authorize('instructor'), misCursos);
router.get(
  '/mios/:id',
  authenticate,
  authorize('instructor'),
  validate({ params: cursoIdParamsSchema }),
  detallePropio,
);
router.post(
  '/',
  authenticate,
  authorize('instructor'),
  validate({ body: crearCursoSchema }),
  crear,
);
router.put(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate({ params: cursoIdParamsSchema, body: actualizarCursoSchema }),
  actualizar,
);

router.get('/', validate({ query: catalogoQuerySchema }), listar);
router.get('/:id', validate({ params: cursoIdParamsSchema }), detalle);

export default router;
