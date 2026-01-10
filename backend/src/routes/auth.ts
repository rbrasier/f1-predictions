import { Router } from 'express';
import { register, login, getMe, getAllUsers, registerValidation, loginValidation } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getAllUsers);

export default router;
