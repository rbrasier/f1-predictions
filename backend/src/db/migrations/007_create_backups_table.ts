
export const name = 'Create backups table';

export async function up(db: any) {
    await db.query(`
    CREATE TABLE IF NOT EXISTS backups (
      id SERIAL PRIMARY KEY,
      backup_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      data_json TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('  Created backups table');
}
