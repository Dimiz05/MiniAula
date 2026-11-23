import { Router } from 'express';
import { listarMias } from '../controllers/inscripcion.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/mias', authenticate, authorize('estudiante'), listarMias);

export default router;
