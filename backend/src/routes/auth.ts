import { Router } from 'express';
import { register, login, getMe, getAllUsers, grantAdminAccess, registerValidation, loginValidation } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getAllUsers);
router.post('/users/:userId/grant-admin', authenticate, requireAdmin, grantAdminAccess);

export default router;
