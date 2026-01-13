import { Pool, PoolClient, QueryResult } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { runMigrations } from './migrations';

dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Database query wrapper to mimic better-sqlite3 API for easier migration
export const db = {
  prepare: (sql: string) => {
    return {
      run: async (...params: any[]) => {
        const client = await pool.connect();
        try {
          const result = await client.query(sql, params);
          return result;
        } finally {
          client.release();
        }
      },
      get: async (...params: any[]) => {
        const client = await pool.connect();
        try {
          const result = await client.query(sql, params);
          return result.rows[0] || null;
        } finally {
          client.release();
        }
      },
      all: async (...params: any[]) => {
        const client = await pool.connect();
        try {
          const result = await client.query(sql, params);
          return result.rows;
        } finally {
          client.release();
        }
      }
    };
  },
  // Direct query method for raw SQL
  query: async (sql: string, params: any[] = []): Promise<QueryResult> => {
    const client = await pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }
};

export async function initializeDatabase() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection established');
    client.release();

    // Run migrations
    await runMigrations();

    // Create default admin user if it doesn't exist
    await createDefaultAdminUser();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

async function createDefaultAdminUser() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'Administrator';

    // Check if admin user already exists
    const existingAdmin = await db.prepare('SELECT id FROM users WHERE username = $1').get(adminUsername);

    if (!existingAdmin) {
      // Hash the password
      const password_hash = await bcrypt.hash(adminPassword, 10);

      // Insert admin user
      await db.prepare(`
        INSERT INTO users (username, password_hash, display_name, is_admin)
        VALUES ($1, $2, $3, true)
      `).run(adminUsername, password_hash, adminDisplayName);

      console.log(`✅ Default admin user created: ${adminUsername}`);
    } else {
      console.log(`ℹ️  Admin user '${adminUsername}' already exists`);
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}

// Export pool for direct access if needed
export { pool };
export default db;
