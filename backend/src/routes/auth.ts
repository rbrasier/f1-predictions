import { Router } from 'express';
import { register, login, getMe, getAllUsers, grantAdminAccess, registerValidation, loginValidation, googleCallback, snoozeOAuthMigration, linkGoogleAccount } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';
import passport from '../config/passport';

const router = Router();

// Traditional auth routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getAllUsers);
router.post('/users/:userId/grant-admin', authenticate, requireAdmin, grantAdminAccess);

// OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:4000'}/login?oauth_error=failed`
  }),
  googleCallback
);

router.post('/oauth/snooze', authenticate, snoozeOAuthMigration);
router.post('/oauth/link', authenticate, linkGoogleAccount);

export default router;
