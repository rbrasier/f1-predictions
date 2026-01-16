import db from './database';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface Migration {
  id: string;
  name: string;
  up: (db: any) => Promise<void> | void;
}

// Create migrations table if it doesn't exist
async function initMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Get list of applied migrations
async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await db.query('SELECT id FROM migrations');
  return new Set(result.rows.map(row => row.id));
}

// Record a migration as applied
async function recordMigration(id: string, name: string) {
  await db.query(
    'INSERT INTO migrations (id, name, applied_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
    [id, name]
  );
}

// Import all migration files
function loadMigrations(): Migration[] {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => (f.endsWith('.ts') || f.endsWith('.js')) && !f.endsWith('.d.ts'))
    .sort();

  return files.map(file => {
    const migration = require(path.join(migrationsDir, file));
    return {
      id: file.replace(/\.(ts|js)$/, ''),
      name: migration.name || file,
      up: migration.up
    };
  });
}

// Run pending migrations
export async function runMigrations() {
  logger.log('Running database migrations...');

  try {
    await initMigrationsTable();

    const appliedMigrations = await getAppliedMigrations();
    const allMigrations = loadMigrations();

    const pendingMigrations = allMigrations.filter(m => !appliedMigrations.has(m.id));

    if (pendingMigrations.length === 0) {
      logger.log('No pending migrations');
      return;
    }

    logger.log(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const migration of pendingMigrations) {
      logger.log(`  Running migration: ${migration.name}`);

      try {
        await migration.up(db);
        await recordMigration(migration.id, migration.name);
        logger.log(`  ✓ Migration ${migration.name} completed`);
      } catch (error) {
        logger.error(`  ✗ Migration ${migration.name} failed:`, error);
        throw error;
      }
    }

    logger.log('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}
