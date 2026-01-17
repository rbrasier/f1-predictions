export const name = 'Fix f1_api_cache timestamp to use timezone-aware column';

export async function up(db: any) {
  // Change last_fetched_at from TIMESTAMP to TIMESTAMPTZ to preserve timezone info
  await db.query(`
    ALTER TABLE f1_api_cache
    ALTER COLUMN last_fetched_at TYPE TIMESTAMPTZ USING last_fetched_at AT TIME ZONE 'UTC'
  `);

  console.log('  Fixed f1_api_cache last_fetched_at column to use TIMESTAMPTZ');
}
