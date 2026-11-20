import { Router } from 'express';
import { login, register } from '../controllers/auth.js';
import { loginRateLimiter, registerRateLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registroSchema } from '../schemas/auth.js';

const router = Router();

router.post('/register', registerRateLimiter, validate({ body: registroSchema }), register);
router.post('/login', loginRateLimiter, validate({ body: loginSchema }), login);

export default router;
