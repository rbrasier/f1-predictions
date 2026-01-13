export const name = 'Create initial database schema';

export async function up(db: any) {
  // Users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Team Principals table - uses constructorId from API instead of foreign key
  await db.query(`
    CREATE TABLE IF NOT EXISTS team_principals (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      constructor_id TEXT NOT NULL,
      season_year INTEGER NOT NULL,
      UNIQUE(name, season_year)
    )
  `);

  // Season Predictions table - stores API identifiers (driverId, constructorId strings)
  await db.query(`
    CREATE TABLE IF NOT EXISTS season_predictions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      season_year INTEGER NOT NULL,
      drivers_championship_order TEXT NOT NULL,
      constructors_championship_order TEXT NOT NULL,
      mid_season_sackings TEXT,
      audi_vs_cadillac TEXT,
      crazy_prediction TEXT,
      grid_2027 TEXT NOT NULL,
      grid_2028 TEXT NOT NULL,
      points_earned INTEGER DEFAULT 0,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, season_year)
    )
  `);

  // Race Predictions table - stores API identifiers (driverId strings) and race year/round
  await db.query(`
    CREATE TABLE IF NOT EXISTS race_predictions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      season_year INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      pole_position_driver_api_id TEXT,
      podium_first_driver_api_id TEXT,
      podium_second_driver_api_id TEXT,
      podium_third_driver_api_id TEXT,
      midfield_hero_driver_api_id TEXT,
      crazy_prediction TEXT,
      sprint_pole_driver_api_id TEXT,
      sprint_winner_driver_api_id TEXT,
      sprint_midfield_hero_driver_api_id TEXT,
      points_earned INTEGER DEFAULT 0,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, season_year, round_number)
    )
  `);

  // Crazy Prediction Validations table
  await db.query(`
    CREATE TABLE IF NOT EXISTS crazy_prediction_validations (
      id SERIAL PRIMARY KEY,
      prediction_type TEXT NOT NULL,
      prediction_id INTEGER NOT NULL,
      validator_user_id INTEGER NOT NULL,
      is_validated BOOLEAN NOT NULL,
      validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (validator_user_id) REFERENCES users(id)
    )
  `);

  // Crazy Prediction Outcomes table
  await db.query(`
    CREATE TABLE IF NOT EXISTS crazy_prediction_outcomes (
      id SERIAL PRIMARY KEY,
      prediction_type TEXT NOT NULL,
      prediction_id INTEGER NOT NULL,
      actually_happened BOOLEAN NOT NULL,
      marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Race Results table - stores actual race results using API identifiers
  await db.query(`
    CREATE TABLE IF NOT EXISTS race_results (
      id SERIAL PRIMARY KEY,
      season_year INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      pole_position_driver_api_id TEXT,
      podium_first_driver_api_id TEXT,
      podium_second_driver_api_id TEXT,
      podium_third_driver_api_id TEXT,
      midfield_hero_driver_api_id TEXT,
      sprint_pole_driver_api_id TEXT,
      sprint_winner_driver_api_id TEXT,
      sprint_midfield_hero_driver_api_id TEXT,
      entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(season_year, round_number)
    )
  `);

  // Season Results table - stores actual season championship results using API identifiers
  await db.query(`
    CREATE TABLE IF NOT EXISTS season_results (
      id SERIAL PRIMARY KEY,
      season_year INTEGER NOT NULL UNIQUE,
      drivers_championship_order TEXT NOT NULL,
      constructors_championship_order TEXT NOT NULL,
      mid_season_sackings TEXT,
      audi_vs_cadillac_winner TEXT,
      actual_grid_2027 TEXT,
      actual_grid_2028 TEXT,
      entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('  Created all database tables');
}
