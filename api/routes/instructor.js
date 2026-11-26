import { Router } from 'express';
import { misCursos, resumen } from '../controllers/curso.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { cursoIdParamsSchema } from '../schemas/curso.js';

const router = Router();

// Alias del contrato del proyecto para el panel del instructor.
router.use(authenticate, authorize('instructor'));

router.get('/cursos', misCursos);
router.get(
  '/cursos/:id/resumen',
  validate({ params: cursoIdParamsSchema }),
  resumen,
);

export default router;
