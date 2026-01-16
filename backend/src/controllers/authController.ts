import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { User, RegisterRequest, LoginRequest, AuthResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = '365d'; // 1 year

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
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

    const { username, password, display_name, invite_code } = req.body as RegisterRequest & { invite_code?: string };

    // Check if username already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE username = $1').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.prepare(`
      INSERT INTO users (username, password_hash, display_name, is_admin)
      VALUES ($1, $2, $3, false)
      RETURNING id
    `).run(username, password_hash, display_name);

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
        console.error('Error joining league during registration:', error);
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
    console.error('Registration error:', error);
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
        console.error('Error joining league during login:', error);
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.prepare(`
      SELECT id, username, display_name, is_admin
      FROM users
      WHERE id = $1
    `).get(req.user.id) as Omit<User, 'password_hash' | 'created_at'> | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      is_admin: Boolean(user.is_admin)
    });
  } catch (error) {
    console.error('Get me error:', error);
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
    console.error('Get users error:', error);
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
    console.error('Grant admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
