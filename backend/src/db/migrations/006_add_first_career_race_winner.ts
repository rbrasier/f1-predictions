export const name = 'Add first career race winner prediction to season predictions';

export function up(db: any) {
  // Add first_career_race_winner column to season_predictions table
  db.prepare(`
    ALTER TABLE season_predictions
    ADD COLUMN first_career_race_winner TEXT
  `).run();

  // Add first_career_race_winner column to season_results table
  db.prepare(`
    ALTER TABLE season_results
    ADD COLUMN first_career_race_winner TEXT
  `).run();

  console.log('  Added first_career_race_winner column to season_predictions and season_results tables');
}
