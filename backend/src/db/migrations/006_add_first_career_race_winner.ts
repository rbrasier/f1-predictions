export const name = 'Add first career race winner prediction to season predictions';

export async function up(db: any) {
  // Add first_career_race_winner column to season_predictions table
  await db.query(`
    ALTER TABLE season_predictions
    ADD COLUMN IF NOT EXISTS first_career_race_winner TEXT
  `);

  // Add first_career_race_winner column to season_results table
  await db.query(`
    ALTER TABLE season_results
    ADD COLUMN IF NOT EXISTS first_career_race_winner TEXT
  `);

  console.log('  Added first_career_race_winner column to season_predictions and season_results tables');
}
