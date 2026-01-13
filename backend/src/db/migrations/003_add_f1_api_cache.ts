export const name = 'Add F1 API cache table for storing Jolpica API data';

export async function up(db: any) {
  // F1 API Cache table - stores JSON blobs from Jolpica API
  await db.query(`
    CREATE TABLE IF NOT EXISTS f1_api_cache (
      id SERIAL PRIMARY KEY,
      resource_type TEXT NOT NULL,
      season_year INTEGER,
      round_number INTEGER,
      resource_id TEXT,
      data_json TEXT NOT NULL,
      last_fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resource_type, season_year, round_number, resource_id)
    )
  `);

  // Create indexes for faster lookups
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_f1_api_cache_resource
    ON f1_api_cache(resource_type, season_year)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_f1_api_cache_fetched_at
    ON f1_api_cache(last_fetched_at)
  `);

  console.log('  Created f1_api_cache table and indexes');
}
