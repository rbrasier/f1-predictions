
export const name = 'Create leagues tables';

export async function up(db: any) {
    // Create leagues table
    await db.query(`
    CREATE TABLE IF NOT EXISTS leagues (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      invite_code VARCHAR(20) UNIQUE NOT NULL,
      is_world_league BOOLEAN DEFAULT FALSE,
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('  Created leagues table');

    // Create user_leagues table
    await db.query(`
    CREATE TABLE IF NOT EXISTS user_leagues (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      is_default BOOLEAN DEFAULT FALSE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, league_id)
    )
  `);

    console.log('  Created user_leagues table');

    // Create the World League
    await db.query(`
    INSERT INTO leagues (name, invite_code, is_world_league)
    VALUES ('World League', 'WORLD', TRUE)
    ON CONFLICT (invite_code) DO NOTHING
  `);

    console.log('  Created World League');

    // Add all existing users to the World League with it as their default
    await db.query(`
    INSERT INTO user_leagues (user_id, league_id, is_default)
    SELECT u.id, l.id, TRUE
    FROM users u
    CROSS JOIN leagues l
    WHERE l.is_world_league = TRUE
    ON CONFLICT (user_id, league_id) DO NOTHING
  `);

    console.log('  Added all existing users to World League');
}
