import { Router } from 'express';
import { getHealth } from '../controllers/health.js';
import authRoutes from './auth.js';
import cursoRoutes from './cursos.js';
import inscripcionRoutes from './inscripciones.js';
import leccionRoutes from './lecciones.js';
import preguntaRoutes from './preguntas.js';
import usuarioRoutes from './usuarios.js';

const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/users', usuarioRoutes);
router.use('/cursos', cursoRoutes);
router.use('/inscripciones', inscripcionRoutes);
router.use('/lecciones', leccionRoutes);
router.use('/preguntas', preguntaRoutes);

export default router;
