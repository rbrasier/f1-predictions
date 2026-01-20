export async function up(db: any): Promise<void> {
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
      ready_at TIMESTAMP,
      released_at TIMESTAMP,
      released_by_user_id INTEGER,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      users_sent_to INTEGER DEFAULT 0,
      UNIQUE(season_year, round_number, email_type)
    );
  `);

  console.log('Migration 015: Added email preferences and race email tracking');
}

export async function down(db: any): Promise<void> {
  // Since SQLite doesn't support dropping columns easily, we'll need to recreate the table
  await db.query(`
    CREATE TABLE race_email_log_old AS SELECT * FROM race_email_log;
  `);

  await db.query(`DROP TABLE race_email_log;`);

  await db.query(`
    CREATE TABLE race_email_log (
      id SERIAL PRIMARY KEY,
      season_year INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      email_type TEXT NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      users_sent_to INTEGER DEFAULT 0,
      UNIQUE(season_year, round_number, email_type)
    );
  `);

  await db.query(`
    INSERT INTO race_email_log (id, season_year, round_number, email_type, sent_at, users_sent_to)
    SELECT id, season_year, round_number, email_type, sent_at, users_sent_to FROM race_email_log_old;
  `);

  await db.query(`DROP TABLE race_email_log_old;`);

  await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS race_reminder_emails,
    DROP COLUMN IF EXISTS race_results_emails;
  `);

  console.log('Migration 015: Rolled back email preferences and race email tracking');
}
