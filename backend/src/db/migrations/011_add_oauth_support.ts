export const name = 'Add OAuth support to users table';

export async function up(db: any) {
  // Add Google OAuth fields to users table
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS google_email TEXT,
    ADD COLUMN IF NOT EXISTS oauth_snooze_until TIMESTAMP
  `);

  // Make password_hash nullable for OAuth users
  await db.query(`
    ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL
  `);

  console.log('  Added OAuth support columns to users table');
}

export async function down(db: any) {
  await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS google_id,
    DROP COLUMN IF EXISTS google_email,
    DROP COLUMN IF EXISTS oauth_snooze_until,
    ALTER COLUMN password_hash SET NOT NULL
  `);

  console.log('  Removed OAuth support columns from users table');
}
