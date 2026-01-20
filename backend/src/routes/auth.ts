import { Router } from 'express';
import { register, login, getMe, getAllUsers, grantAdminAccess, registerValidation, loginValidation, googleCallback, snoozeOAuthMigration, linkGoogleAccount, updateDisplayName, saveEmail, snoozeEmailReminder, requestPasswordReset, resetPassword, updateEmailPreferences, getEmailPreferences } from '../controllers/authController';
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
router.get('/google', (req, res, next) => {
  // Pass invite code through OAuth state if present
  const inviteCode = req.query.invite as string;
  const state = inviteCode ? inviteCode : undefined;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:4000'}/login?oauth_error=failed`
  }),
  googleCallback
);

router.post('/oauth/snooze', authenticate, snoozeOAuthMigration);
router.post('/oauth/link', authenticate, linkGoogleAccount);
router.post('/update-display-name', authenticate, updateDisplayName);

// Email management routes
router.post('/save-email', authenticate, saveEmail);
router.post('/email-reminder/snooze', authenticate, snoozeEmailReminder);
router.get('/email-preferences', authenticate, getEmailPreferences);
router.put('/email-preferences', authenticate, updateEmailPreferences);

// Password reset routes (public)
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;
