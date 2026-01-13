import jwt from 'jsonwebtoken';
import db from '../../db/database';
import bcrypt from 'bcrypt';

export interface TestUser {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  token: string;
}

/**
 * Create a test user and return authentication token
 */
export async function createTestUser(
  username: string = 'testuser',
  email: string = 'test@example.com',
  isAdmin: boolean = false
): Promise<TestUser> {
  const password = await bcrypt.hash('password123', 10);

  // Clean up existing test user
  await db.prepare('DELETE FROM users WHERE email = $1').run(email);

  // Create user
  const result = await db.query(
    'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id',
    [username, email, password, isAdmin]
  );

  const userId = result.rows[0].id;

  // Generate token
  const token = jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  return {
    id: userId,
    username,
    email,
    is_admin: isAdmin,
    token,
  };
}

/**
 * Create an admin test user
 */
export async function createTestAdmin(): Promise<TestUser> {
  return createTestUser('admin', 'admin@example.com', true);
}

/**
 * Clean up test users
 */
export async function cleanupTestUsers() {
  await db.prepare('DELETE FROM users WHERE email LIKE $1').run('%@example.com');
}
