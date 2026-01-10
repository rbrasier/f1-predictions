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

  // Seasons table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL UNIQUE,
      prediction_deadline TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0
    )
  `).run();

  // Teams table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_top_four INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `).run();

  // Drivers table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      team_id INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `).run();

  // Team Principals table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS team_principals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      team_id INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `).run();

  // Races table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS races (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      fp1_start TEXT NOT NULL,
      race_date TEXT NOT NULL,
      is_sprint_weekend INTEGER NOT NULL DEFAULT 0,
      location TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES seasons(id),
      UNIQUE(season_id, round_number)
    )
  `).run();

  // Season Predictions table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS season_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      season_id INTEGER NOT NULL,
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
      FOREIGN KEY (season_id) REFERENCES seasons(id),
      UNIQUE(user_id, season_id)
    )
  `).run();

  // Race Predictions table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS race_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      race_id INTEGER NOT NULL,
      pole_position_driver_id INTEGER,
      podium_first_driver_id INTEGER,
      podium_second_driver_id INTEGER,
      podium_third_driver_id INTEGER,
      midfield_hero_driver_id INTEGER,
      crazy_prediction TEXT,
      sprint_pole_driver_id INTEGER,
      sprint_winner_driver_id INTEGER,
      sprint_midfield_hero_driver_id INTEGER,
      points_earned INTEGER DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (race_id) REFERENCES races(id),
      UNIQUE(user_id, race_id)
    )
  `).run();

  // Race Results table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS race_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id INTEGER UNIQUE NOT NULL,
      pole_position_driver_id INTEGER,
      podium_first_driver_id INTEGER,
      podium_second_driver_id INTEGER,
      podium_third_driver_id INTEGER,
      midfield_hero_driver_id INTEGER,
      sprint_pole_driver_id INTEGER,
      sprint_winner_driver_id INTEGER,
      sprint_midfield_hero_driver_id INTEGER,
      entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (race_id) REFERENCES races(id)
    )
  `).run();

  // Season Results table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS season_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER UNIQUE NOT NULL,
      drivers_championship_order TEXT NOT NULL,
      constructors_championship_order TEXT NOT NULL,
      mid_season_sackings TEXT,
      audi_vs_cadillac_winner TEXT,
      actual_grid_2027 TEXT,
      actual_grid_2028 TEXT,
      entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES seasons(id)
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

  console.log('  Created all database tables');
}
