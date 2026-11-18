import { Router } from 'express';
import { getHealth } from '../controllers/health.js';
import authRoutes from './auth.js';
import usuarioRoutes from './usuarios.js';

const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/users', usuarioRoutes);

export default router;
