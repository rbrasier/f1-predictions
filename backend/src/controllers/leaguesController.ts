import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// Generate a unique invite code
function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

export const createLeagueValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('League name must be 1-100 characters')
];

export const joinLeagueValidation = [
  body('invite_code')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required')
];

// Create a new league
export const createLeague = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name } = req.body;
    const userId = req.user.id;

    // Generate a unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const existing = await db.prepare('SELECT id FROM leagues WHERE invite_code = $1').get(inviteCode);
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique invite code' });
    }

    // Create the league
    const result = await db.prepare(`
      INSERT INTO leagues (name, invite_code, is_world_league, created_by_user_id)
      VALUES ($1, $2, false, $3)
      RETURNING id, name, invite_code, is_world_league, created_by_user_id, created_at
    `).run(name, inviteCode, userId);

    const league = result.rows[0];

    // Add the creator to the league
    await db.prepare(`
      INSERT INTO user_leagues (user_id, league_id, is_default)
      VALUES ($1, $2, false)
    `).run(userId, league.id);

    res.status(201).json(league);
  } catch (error) {
    logger.error('Create league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all leagues for the current user
export const getUserLeagues = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const leagues = await db.prepare(`
      SELECT l.id, l.name, l.invite_code, l.is_world_league, l.created_by_user_id, l.created_at, ul.is_default, ul.joined_at,
             (SELECT COUNT(*) FROM user_leagues ul2 INNER JOIN users u ON ul2.user_id = u.id WHERE ul2.league_id = l.id AND u.username != 'admin') as member_count
      FROM leagues l
      INNER JOIN user_leagues ul ON l.id = ul.league_id
      WHERE ul.user_id = $1
      ORDER BY ul.is_default DESC, l.name
    `).all(req.user.id);

    res.json(leagues);
  } catch (error) {
    logger.error('Get user leagues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get default league for the current user
export const getDefaultLeague = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const league = await db.prepare(`
      SELECT l.id, l.name, l.invite_code, l.is_world_league, l.created_by_user_id, l.created_at, ul.is_default, ul.joined_at,
             (SELECT COUNT(*) FROM user_leagues ul2 INNER JOIN users u ON ul2.user_id = u.id WHERE ul2.league_id = l.id AND u.username != 'admin') as member_count
      FROM leagues l
      INNER JOIN user_leagues ul ON l.id = ul.league_id
      WHERE ul.user_id = $1 AND ul.is_default = true
      LIMIT 1
    `).get(req.user.id);

    if (!league) {
      return res.status(404).json({ error: 'No default league found' });
    }

    res.json(league);
  } catch (error) {
    logger.error('Get default league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Join a league via invite code
export const joinLeague = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { invite_code } = req.body;
    const userId = req.user.id;

    // Find the league
    const league = await db.prepare(`
      SELECT id, name, invite_code, is_world_league, created_by_user_id, created_at
      FROM leagues
      WHERE invite_code = $1
    `).get(invite_code.toUpperCase());

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Check if user is already in the league
    const existingMembership = await db.prepare(`
      SELECT id FROM user_leagues
      WHERE user_id = $1 AND league_id = $2
    `).get(userId, league.id);

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already a member of this league' });
    }

    // Check if this is the user's first league
    const userLeaguesCount = await db.query(
      'SELECT COUNT(*) as count FROM user_leagues WHERE user_id = $1',
      [userId]
    );
    const isFirstLeague = userLeaguesCount.rows[0].count === '0';

    // Add user to the league
    await db.prepare(`
      INSERT INTO user_leagues (user_id, league_id, is_default)
      VALUES ($1, $2, $3)
    `).run(userId, league.id, isFirstLeague);

    res.json({
      message: 'Successfully joined league',
      league
    });
  } catch (error) {
    logger.error('Join league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set default league for user
export const setDefaultLeague = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { leagueId } = req.params;
    const leagueIdNum = parseInt(leagueId);
    const userId = req.user.id;

    if (isNaN(leagueIdNum)) {
      return res.status(400).json({ error: 'Invalid league ID' });
    }

    // Check if user is a member of this league
    const membership = await db.prepare(`
      SELECT id FROM user_leagues
      WHERE user_id = $1 AND league_id = $2
    `).get(userId, leagueIdNum);

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this league' });
    }

    // Set all user's leagues to not default
    await db.prepare(`
      UPDATE user_leagues
      SET is_default = false
      WHERE user_id = $1
    `).run(userId);

    // Set the specified league as default
    await db.prepare(`
      UPDATE user_leagues
      SET is_default = true
      WHERE user_id = $1 AND league_id = $2
    `).run(userId, leagueIdNum);

    res.json({ message: 'Default league updated successfully' });
  } catch (error) {
    logger.error('Set default league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users in a league
export const getLeagueUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { leagueId } = req.params;
    const leagueIdNum = parseInt(leagueId);

    if (isNaN(leagueIdNum)) {
      return res.status(400).json({ error: 'Invalid league ID' });
    }

    // Check if user is a member of this league
    const membership = await db.prepare(`
      SELECT id FROM user_leagues
      WHERE user_id = $1 AND league_id = $2
    `).get(req.user.id, leagueIdNum);

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this league' });
    }

    // Get all users in the league
    const users = await db.prepare(`
      SELECT u.id, u.username, u.display_name, ul.joined_at
      FROM users u
      INNER JOIN user_leagues ul ON u.id = ul.user_id
      WHERE ul.league_id = $1
      ORDER BY u.display_name
    `).all(leagueIdNum);

    res.json(users);
  } catch (error) {
    logger.error('Get league users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Join the world league
export const joinWorldLeague = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;

    // Find the world league
    const worldLeague = await db.prepare(`
      SELECT id, name, invite_code, is_world_league, created_at
      FROM leagues
      WHERE is_world_league = true
      LIMIT 1
    `).get();

    if (!worldLeague) {
      return res.status(404).json({ error: 'World league not found' });
    }

    // Check if user is already in the world league
    const existingMembership = await db.prepare(`
      SELECT id FROM user_leagues
      WHERE user_id = $1 AND league_id = $2
    `).get(userId, worldLeague.id);

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already a member of the World League' });
    }

    // Check if this is the user's first league
    const userLeaguesCount = await db.query(
      'SELECT COUNT(*) as count FROM user_leagues WHERE user_id = $1',
      [userId]
    );
    const isFirstLeague = userLeaguesCount.rows[0].count === '0';

    // Add user to the world league
    await db.prepare(`
      INSERT INTO user_leagues (user_id, league_id, is_default)
      VALUES ($1, $2, $3)
    `).run(userId, worldLeague.id, isFirstLeague);

    res.json({
      message: 'Successfully joined World League',
      league: worldLeague
    });
  } catch (error) {
    logger.error('Join world league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Leave a league
export const leaveLeague = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { leagueId } = req.params;
    const leagueIdNum = parseInt(leagueId);
    const userId = req.user.id;

    if (isNaN(leagueIdNum)) {
      return res.status(400).json({ error: 'Invalid league ID' });
    }

    // Check if it's the world league
    const league = await db.prepare(`
      SELECT is_world_league FROM leagues WHERE id = $1
    `).get(leagueIdNum);

    if (league && league.is_world_league) {
      return res.status(400).json({ error: 'Cannot leave the World League' });
    }

    // Check if user is a member
    const membership = await db.prepare(`
      SELECT id, is_default FROM user_leagues
      WHERE user_id = $1 AND league_id = $2
    `).get(userId, leagueIdNum);

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this league' });
    }

    // Remove user from league
    await db.prepare(`
      DELETE FROM user_leagues
      WHERE user_id = $1 AND league_id = $2
    `).run(userId, leagueIdNum);

    // If this was the default league, set another league as default
    if (membership.is_default) {
      const remainingLeagues = await db.prepare(`
        SELECT league_id FROM user_leagues
        WHERE user_id = $1
        LIMIT 1
      `).get(userId);

      if (remainingLeagues) {
        await db.prepare(`
          UPDATE user_leagues
          SET is_default = true
          WHERE user_id = $1 AND league_id = $2
        `).run(userId, remainingLeagues.league_id);
      }
    }

    res.json({ message: 'Successfully left league' });
  } catch (error) {
    logger.error('Leave league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get league info by invite code (public endpoint - no auth required)
export const getLeagueByInviteCode = async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.params;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Find the league and get member count
    const league = await db.prepare(`
      SELECT l.id, l.name, l.invite_code, l.is_world_league,
             (SELECT COUNT(*) FROM user_leagues ul2 INNER JOIN users u ON ul2.user_id = u.id WHERE ul2.league_id = l.id AND u.username != 'admin') as member_count
      FROM leagues l
      WHERE l.invite_code = $1
    `).get(inviteCode.toUpperCase());

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    res.json(league);
  } catch (error) {
    logger.error('Get league by invite code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
