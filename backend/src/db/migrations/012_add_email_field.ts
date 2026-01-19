export const name = 'Add email field to users table';

export async function up(db: any) {
  // Add email field for non-OAuth users
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email TEXT UNIQUE
  `);

  console.log('  Added email field to users table');
}

export async function down(db: any) {
  await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS email
  `);

  console.log('  Removed email field from users table');
}
