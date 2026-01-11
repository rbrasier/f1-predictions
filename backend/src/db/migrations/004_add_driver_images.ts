import db from '../database';

export function up() {
  console.log('Running migration 004: Add driver image URLs');

  // Add image_url column to drivers table
  db.prepare(`
    ALTER TABLE drivers
    ADD COLUMN image_url TEXT
  `).run();

  console.log('✓ Added image_url column to drivers table');
}

export function down() {
  // SQLite doesn't support DROP COLUMN easily, so we'd need to recreate the table
  console.log('Migration 004 rollback not implemented (SQLite limitation)');
}
