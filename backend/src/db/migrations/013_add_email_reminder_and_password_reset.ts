export const name = 'Add email reminder snooze and password reset fields';

export async function up(db: any) {
  // Add email_reminder_snooze_until for users who postpone adding their email
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_reminder_snooze_until TIMESTAMP
  `);

  // Add password reset token and expiry fields
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
    ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP
  `);

  console.log('  Added email_reminder_snooze_until, password_reset_token, and password_reset_expires fields to users table');
}

export async function down(db: any) {
  await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS email_reminder_snooze_until,
    DROP COLUMN IF EXISTS password_reset_token,
    DROP COLUMN IF EXISTS password_reset_expires
  `);

  console.log('  Removed email_reminder_snooze_until, password_reset_token, and password_reset_expires fields from users table');
}
