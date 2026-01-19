import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { User, RegisterRequest, LoginRequest, AuthResponse } from '../types';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = '365d'; // 1 year

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('display_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be 1-50 characters')
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, display_name, invite_code } = req.body as RegisterRequest & { invite_code?: string };

    // Check if username already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE username = $1').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await db.prepare('SELECT id FROM users WHERE email = $1').get(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, is_admin)
      VALUES ($1, $2, $3, $4, false)
      RETURNING id
    `).run(username, email, password_hash, display_name);

    const userId = Number(result.rows[0].id);

    // If invite code is provided, join that league
    if (invite_code) {
      try {
        const league = await db.prepare(`
          SELECT id FROM leagues WHERE invite_code = $1
        `).get(invite_code.toUpperCase());

        if (league) {
          await db.prepare(`
            INSERT INTO user_leagues (user_id, league_id, is_default)
            VALUES ($1, $2, true)
          `).run(userId, league.id);
        }
      } catch (error) {
        logger.error('Error joining league during registration:', error);
        // Don't fail registration if league join fails
      }
    }
    // Users without an invite code will be shown the league selection modal

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, username, is_admin: false },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response: AuthResponse = {
      user: {
        id: userId,
        username,
        display_name,
        is_admin: false
      },
      token
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, invite_code } = req.body as LoginRequest & { invite_code?: string };

    // Find user
    const user = await db.prepare(`
      SELECT id, username, password_hash, display_name, is_admin
      FROM users
      WHERE username = $1
    `).get(username) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // OAuth users don't have a password, they must use OAuth to login
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use Google OAuth to login' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If invite code is provided, join that league
    if (invite_code) {
      try {
        const league = await db.prepare(`
          SELECT id FROM leagues WHERE invite_code = $1
        `).get(invite_code.toUpperCase());

        if (league) {
          // Check if user is already in the league
          const existingMembership = await db.prepare(`
            SELECT id FROM user_leagues WHERE user_id = $1 AND league_id = $2
          `).get(user.id, league.id);

          if (!existingMembership) {
            // Check if this is the user's first league
            const userLeaguesCount = await db.query(
              'SELECT COUNT(*) as count FROM user_leagues WHERE user_id = $1',
              [user.id]
            );
            const isFirstLeague = userLeaguesCount.rows[0].count === '0';

            await db.prepare(`
              INSERT INTO user_leagues (user_id, league_id, is_default)
              VALUES ($1, $2, $3)
            `).run(user.id, league.id, isFirstLeague);
          }
        }
      } catch (error) {
        logger.error('Error joining league during login:', error);
        // Don't fail login if league join fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        is_admin: Boolean(user.is_admin)
      },
      token
    };

    res.json(response);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.prepare(`
      SELECT id, username, display_name, email, is_admin, google_id, google_email, oauth_snooze_until, email_reminder_snooze_until
      FROM users
      WHERE id = $1
    `).get(req.user.id) as User | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      is_admin: Boolean(user.is_admin),
      google_id: user.google_id,
      google_email: user.google_email,
      oauth_snooze_until: user.oauth_snooze_until,
      email_reminder_snooze_until: user.email_reminder_snooze_until
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.prepare(`
      SELECT id, username, display_name, is_admin
      FROM users
      ORDER BY display_name
    `).all() as Omit<User, 'password_hash' | 'created_at'>[];

    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const grantAdminAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Only admins can grant admin access' });
    }

    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await db.prepare('SELECT id, username, display_name, is_admin FROM users WHERE id = $1').get(userIdNum);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Grant admin access
    await db.prepare('UPDATE users SET is_admin = true WHERE id = $1').run(userIdNum);

    res.json({ message: 'Admin access granted successfully', user: { ...user, is_admin: true } });
  } catch (error) {
    logger.error('Grant admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// OAuth callback handler
export const googleCallback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      // OAuth failed or account needs linking
      const errorMessage = (req as any).authInfo?.message;

      if (errorMessage === 'account_exists') {
        // Redirect to frontend with error info
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
        return res.redirect(`${frontendUrl}/login?oauth_error=account_exists&email=${encodeURIComponent((req as any).authInfo.email)}`);
      }

      return res.status(401).json({ error: 'Authentication failed' });
    }

    const user = req.user as User;

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    logger.error('Google callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Link Google account to existing user
export const linkGoogleAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify Google token and get user info
    // This would require using Google's token verification API
    // For simplicity, we'll use the OAuth flow initiated from frontend

    res.json({ message: 'Please use the OAuth flow to link your Google account' });
  } catch (error) {
    logger.error('Link Google account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Snooze OAuth migration modal
export const snoozeOAuthMigration = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Set snooze_until to 2 days from now
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 2);

    await db.prepare(`
      UPDATE users
      SET oauth_snooze_until = $1
      WHERE id = $2
    `).run(snoozeUntil.toISOString(), req.user.id);

    res.json({
      message: 'OAuth migration reminder snoozed',
      snooze_until: snoozeUntil.toISOString()
    });
  } catch (error) {
    logger.error('Snooze OAuth migration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update display name for OAuth users
export const updateDisplayName = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { display_name } = req.body;

    if (!display_name || display_name.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    if (display_name.length > 50) {
      return res.status(400).json({ error: 'Display name must be 50 characters or less' });
    }

    await db.prepare(`
      UPDATE users
      SET display_name = $1
      WHERE id = $2
    `).run(display_name.trim(), req.user.id);

    const updatedUser = await db.prepare(`
      SELECT id, username, display_name, is_admin, google_id, google_email, oauth_snooze_until
      FROM users
      WHERE id = $1
    `).get(req.user.id);

    res.json({
      message: 'Display name updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update display name error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save email for user
export const saveEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists for another user
    const existingEmail = await db.prepare(`
      SELECT id FROM users WHERE email = $1 AND id != $2
    `).get(email.trim(), req.user.id);

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Update user's email and clear snooze
    await db.prepare(`
      UPDATE users
      SET email = $1, email_reminder_snooze_until = NULL
      WHERE id = $2
    `).run(email.trim(), req.user.id);

    const updatedUser = await db.prepare(`
      SELECT id, username, display_name, email, is_admin, google_id, google_email, oauth_snooze_until, email_reminder_snooze_until
      FROM users
      WHERE id = $1
    `).get(req.user.id);

    res.json({
      message: 'Email saved successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Save email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Snooze email reminder modal
export const snoozeEmailReminder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Set snooze_until to 7 days from now
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7);

    await db.prepare(`
      UPDATE users
      SET email_reminder_snooze_until = $1
      WHERE id = $2
    `).run(snoozeUntil.toISOString(), req.user.id);

    res.json({
      message: 'Email reminder snoozed for 7 days',
      email_reminder_snooze_until: snoozeUntil.toISOString()
    });
  } catch (error) {
    logger.error('Snooze email reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request password reset
export const requestPasswordReset = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await db.prepare(`
      SELECT id, username, email, google_id
      FROM users
      WHERE email = $1
    `).get(email.trim()) as User | undefined;

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return res.json({ message: 'If an account exists with this email, a password reset code has been sent.' });
    }

    // Check if user is OAuth-only (no password)
    if (user.google_id && !user.password_hash) {
      return res.json({ message: 'If an account exists with this email, a password reset code has been sent.' });
    }

    // Generate a 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();

    // Set expiry to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Hash the reset code before storing
    const hashedResetCode = await bcrypt.hash(resetCode, 10);

    // Store reset token in database
    await db.prepare(`
      UPDATE users
      SET password_reset_token = $1, password_reset_expires = $2
      WHERE id = $3
    `).run(hashedResetCode, expiresAt.toISOString(), user.id);

    // Send email with reset code
    const emailSent = await emailService.sendPasswordResetEmail(user.email!, resetCode);

    if (!emailSent) {
      logger.warn(`Password reset email not sent (Mailgun disabled) for user ${user.username}`);
    }

    res.json({ message: 'If an account exists with this email, a password reset code has been sent.' });
  } catch (error) {
    logger.error('Request password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password with token
export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find user by email
    const user = await db.prepare(`
      SELECT id, username, email, password_reset_token, password_reset_expires
      FROM users
      WHERE email = $1
    `).get(email.trim()) as User | undefined;

    if (!user || !user.password_reset_token || !user.password_reset_expires) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Check if token has expired
    const expiresAt = new Date(user.password_reset_expires);
    if (expiresAt < new Date()) {
      // Clear expired token
      await db.prepare(`
        UPDATE users
        SET password_reset_token = NULL, password_reset_expires = NULL
        WHERE id = $1
      `).run(user.id);

      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    // Verify reset code
    const isValidCode = await bcrypt.compare(resetCode, user.password_reset_token);
    if (!isValidCode) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await db.prepare(`
      UPDATE users
      SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
      WHERE id = $2
    `).run(newPasswordHash, user.id);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
