export const name = 'Fix F1 API cache UNIQUE constraint to treat NULLs as equal';

export async function up(db: any) {
  // First, clear all existing cache data (which has duplicates)
  await db.query(`
    DELETE FROM f1_api_cache
  `);
  console.log('  Cleared all cache data');

  // Drop the old UNIQUE constraint
  await db.query(`
    ALTER TABLE f1_api_cache
    DROP CONSTRAINT IF EXISTS f1_api_cache_resource_type_season_year_round_number_resource_key
  `);

  // Also try the default constraint name format
  await db.query(`
    ALTER TABLE f1_api_cache
    DROP CONSTRAINT IF EXISTS f1_api_cache_resource_type_season_year_round_number_resou_key
  `);

  console.log('  Dropped old UNIQUE constraint');

  // Add new UNIQUE constraint that treats NULLs as NOT DISTINCT
  await db.query(`
    ALTER TABLE f1_api_cache
    ADD CONSTRAINT f1_api_cache_unique_resource
    UNIQUE NULLS NOT DISTINCT (resource_type, season_year, round_number, resource_id)
  `);

  console.log('  Added new UNIQUE constraint with NULLS NOT DISTINCT');
}
