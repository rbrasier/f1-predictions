import db from './database';
import fs from 'fs';
import path from 'path';

interface Migration {
  id: string;
  name: string;
  up: (db: any) => void;
}

// Create migrations table if it doesn't exist
function initMigrationsTable() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `).run();
}

// Get list of applied migrations
function getAppliedMigrations(): Set<string> {
  const rows = db.prepare('SELECT id FROM migrations').all() as { id: string }[];
  return new Set(rows.map(row => row.id));
}

// Record a migration as applied
function recordMigration(id: string, name: string) {
  db.prepare('INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)').run(
    id,
    name,
    new Date().toISOString()
  );
}

// Import all migration files
function loadMigrations(): Migration[] {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
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
export function runMigrations() {
  console.log('Running database migrations...');

  initMigrationsTable();

  const appliedMigrations = getAppliedMigrations();
  const allMigrations = loadMigrations();

  const pendingMigrations = allMigrations.filter(m => !appliedMigrations.has(m.id));

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Found ${pendingMigrations.length} pending migration(s)`);

  pendingMigrations.forEach(migration => {
    console.log(`  Running migration: ${migration.name}`);

    try {
      migration.up(db);
      recordMigration(migration.id, migration.name);
      console.log(`  ✓ Migration ${migration.name} completed`);
    } catch (error) {
      console.error(`  ✗ Migration ${migration.name} failed:`, error);
      throw error;
    }
  });

  console.log('All migrations completed successfully');
}
