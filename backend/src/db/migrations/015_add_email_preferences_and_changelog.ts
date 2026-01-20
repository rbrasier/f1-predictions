import type { Database } from '../database';

export async function up(db: Database): Promise<void> {
  // Add email preferences to users table
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS race_reminder_emails BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS race_results_emails BOOLEAN DEFAULT true;
  `);

  // Create table to track which races have had emails sent
  await db.query(`
    CREATE TABLE IF NOT EXISTS race_email_log (
      id SERIAL PRIMARY KEY,
      season_year INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      email_type TEXT NOT NULL, -- 'pre_race' or 'post_race'
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      users_sent_to INTEGER DEFAULT 0,
      UNIQUE(season_year, round_number, email_type)
    );
  `);

  console.log('Migration 015: Added email preferences and race email tracking');
}

export async function down(db: Database): Promise<void> {
  await db.query(`DROP TABLE IF EXISTS race_email_log;`);
  await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS race_reminder_emails,
    DROP COLUMN IF EXISTS race_results_emails;
  `);

  console.log('Migration 015: Rolled back email preferences and race email tracking');
}
