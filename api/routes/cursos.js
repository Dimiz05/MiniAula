import { Router } from 'express';
import { listar } from '../controllers/curso.js';
import { validate } from '../middlewares/validate.js';
import { catalogoQuerySchema } from '../schemas/curso.js';

const router = Router();

router.get('/', validate({ query: catalogoQuerySchema }), listar);

export default router;
