import { Router } from 'express';
import { detalle, listar } from '../controllers/curso.js';
import { validate } from '../middlewares/validate.js';
import { catalogoQuerySchema, cursoIdParamsSchema } from '../schemas/curso.js';

const router = Router();

router.get('/', validate({ query: catalogoQuerySchema }), listar);
router.get('/:id', validate({ params: cursoIdParamsSchema }), detalle);

export default router;
