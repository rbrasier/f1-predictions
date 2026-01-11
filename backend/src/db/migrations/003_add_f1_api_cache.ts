export const name = 'Add F1 API cache table for storing Jolpica API data';

export function up(db: any) {
  // F1 API Cache table - stores JSON blobs from Jolpica API
  db.prepare(`
    CREATE TABLE IF NOT EXISTS f1_api_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_type TEXT NOT NULL,
      season_year INTEGER,
      round_number INTEGER,
      resource_id TEXT,
      data_json TEXT NOT NULL,
      last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resource_type, season_year, round_number, resource_id)
    )
  `).run();

  // Create indexes for faster lookups
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_f1_api_cache_resource
    ON f1_api_cache(resource_type, season_year)
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_f1_api_cache_fetched_at
    ON f1_api_cache(last_fetched_at)
  `).run();

  console.log('  Created f1_api_cache table and indexes');
}
