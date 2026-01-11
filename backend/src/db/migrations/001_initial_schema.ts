export const name = 'Create initial database schema';

export function up(db: any) {
  // Users table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Team Principals table - uses constructorId from API instead of foreign key
  db.prepare(`
    CREATE TABLE IF NOT EXISTS team_principals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      constructor_id TEXT NOT NULL,
      season_year INTEGER NOT NULL,
      UNIQUE(name, season_year)
    )
  `).run();

  // Season Predictions table - stores API identifiers (driverId, constructorId strings)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS season_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, season_year)
    )
  `).run();

  // Race Predictions table - stores API identifiers (driverId strings) and race year/round
  db.prepare(`
    CREATE TABLE IF NOT EXISTS race_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, season_year, round_number)
    )
  `).run();

  // Crazy Prediction Validations table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS crazy_prediction_validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prediction_type TEXT NOT NULL,
      prediction_id INTEGER NOT NULL,
      validator_user_id INTEGER NOT NULL,
      is_validated BOOLEAN NOT NULL,
      validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (validator_user_id) REFERENCES users(id)
    )
  `).run();

  // Crazy Prediction Outcomes table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS crazy_prediction_outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prediction_type TEXT NOT NULL,
      prediction_id INTEGER NOT NULL,
      actually_happened BOOLEAN NOT NULL,
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Race Results table - stores actual race results using API identifiers
  db.prepare(`
    CREATE TABLE IF NOT EXISTS race_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(season_year, round_number)
    )
  `).run();

  // Season Results table - stores actual season championship results using API identifiers
  db.prepare(`
    CREATE TABLE IF NOT EXISTS season_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_year INTEGER NOT NULL UNIQUE,
      drivers_championship_order TEXT NOT NULL,
      constructors_championship_order TEXT NOT NULL,
      mid_season_sackings TEXT,
      audi_vs_cadillac_winner TEXT,
      actual_grid_2027 TEXT,
      actual_grid_2028 TEXT,
      entered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  console.log('  Created all database tables');
}
