import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { runMigrations } from './migrations';

dotenv.config();

const dbPath = path.join(__dirname, '../../database.sqlite');
const db: DatabaseType = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export async function initializeDatabase() {
  // Run migrations
  runMigrations();

  // Create default admin user if it doesn't exist
  await createDefaultAdminUser();
}

async function createDefaultAdminUser() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'Administrator';

    // Check if admin user already exists
    const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);

    if (!existingAdmin) {
      // Hash the password
      const password_hash = await bcrypt.hash(adminPassword, 10);

      // Insert admin user
      db.prepare(`
        INSERT INTO users (username, password_hash, display_name, is_admin)
        VALUES (?, ?, ?, 1)
      `).run(adminUsername, password_hash, adminDisplayName);

      console.log(`✅ Default admin user created: ${adminUsername}`);
    } else {
      console.log(`ℹ️  Admin user '${adminUsername}' already exists`);
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}

export default db;
