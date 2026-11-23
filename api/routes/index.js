import { Router } from 'express';
import { getHealth } from '../controllers/health.js';
import authRoutes from './auth.js';
import cursoRoutes from './cursos.js';
import leccionRoutes from './lecciones.js';
import usuarioRoutes from './usuarios.js';

const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/users', usuarioRoutes);
router.use('/cursos', cursoRoutes);
router.use('/lecciones', leccionRoutes);

export default router;
