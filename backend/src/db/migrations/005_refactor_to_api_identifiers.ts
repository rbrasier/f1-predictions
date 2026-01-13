export const name = 'Refactor predictions to use API identifiers and year/round';

export async function up(db: any) {
  // This migration was needed for SQLite but is handled by the initial schema in PostgreSQL
  // Skipping for PostgreSQL migration
  console.log('  Skipped (handled by initial schema for PostgreSQL)');
}

export function down(db: any) {
  // This migration is destructive and cannot be easily reversed
  console.log('  Warning: Migration 005 cannot be automatically reversed');
}
