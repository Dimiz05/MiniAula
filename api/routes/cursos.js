import { Router } from 'express';
import {
  actualizar,
  archivar,
  crear,
  detalle,
  detallePropio,
  eliminar,
  listar,
  misCursos,
  publicar,
} from '../controllers/curso.js';
import { inscribir } from '../controllers/inscripcion.js';
import {
  crear as crearLeccion,
  reordenar as reordenarLecciones,
} from '../controllers/leccion.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  actualizarCursoSchema,
  catalogoQuerySchema,
  crearCursoSchema,
  cursoIdParamsSchema,
} from '../schemas/curso.js';
import {
  crearLeccionSchema,
  reordenarLeccionesSchema,
} from '../schemas/leccion.js';

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
  '/:id/inscripcion',
  authenticate,
  authorize('estudiante'),
  validate({ params: cursoIdParamsSchema }),
  inscribir,
);
router.post(
  '/:id/lecciones',
  authenticate,
  authorize('instructor'),
  validate({ params: cursoIdParamsSchema, body: crearLeccionSchema }),
  crearLeccion,
);
router.patch(
  '/:id/lecciones/orden',
  authenticate,
  authorize('instructor'),
  validate({ params: cursoIdParamsSchema, body: reordenarLeccionesSchema }),
  reordenarLecciones,
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
router.patch(
  '/:id/publicar',
  authenticate,
  authorize('instructor'),
  validate({ params: cursoIdParamsSchema }),
  publicar,
);
router.patch(
  '/:id/archivar',
  authenticate,
  authorize('instructor'),
  validate({ params: cursoIdParamsSchema }),
  archivar,
);
router.delete(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate({ params: cursoIdParamsSchema }),
  eliminar,
);

router.get('/', validate({ query: catalogoQuerySchema }), listar);
router.get('/:id', validate({ params: cursoIdParamsSchema }), detalle);

export default router;
