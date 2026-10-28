import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../middlewares/validation.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Public auth routes
router.post('/signup', validateSignup, AuthController.signup);
router.post('/login', validateLogin, AuthController.login);

// Protected user profile route
router.get('/me', requireAuth, AuthController.getMe);

export default router;
