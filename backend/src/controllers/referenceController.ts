import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { Driver, Team, TeamPrincipal } from '../types';

export const getDrivers = (req: AuthRequest, res: Response) => {
  try {
    const drivers = db.prepare(`
      SELECT d.id, d.name, d.team_id, d.is_active, t.name as team_name
      FROM drivers d
      LEFT JOIN teams t ON d.team_id = t.id
      WHERE d.is_active = 1
      ORDER BY d.name
    `).all() as (Driver & { team_name: string })[];

    res.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTeams = (req: AuthRequest, res: Response) => {
  try {
    const teams = db.prepare(`
      SELECT id, name, is_top_four, is_active
      FROM teams
      WHERE is_active = 1
      ORDER BY name
    `).all() as Team[];

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTeamPrincipals = (req: AuthRequest, res: Response) => {
  try {
    const principals = db.prepare(`
      SELECT tp.id, tp.name, tp.team_id, tp.is_active, t.name as team_name
      FROM team_principals tp
      LEFT JOIN teams t ON tp.team_id = t.id
      WHERE tp.is_active = 1
      ORDER BY tp.name
    `).all() as (TeamPrincipal & { team_name: string })[];

    res.json(principals);
  } catch (error) {
    console.error('Get team principals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSeasons = (req: AuthRequest, res: Response) => {
  try {
    const seasons = db.prepare(`
      SELECT id, year, prediction_deadline, is_active
      FROM seasons
      ORDER BY year DESC
    `).all();

    res.json(seasons);
  } catch (error) {
    console.error('Get seasons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getActiveSeason = (req: AuthRequest, res: Response) => {
  try {
    const season = db.prepare(`
      SELECT id, year, prediction_deadline, is_active
      FROM seasons
      WHERE is_active = 1
      LIMIT 1
    `).get();

    if (!season) {
      return res.status(404).json({ error: 'No active season found' });
    }

    res.json(season);
  } catch (error) {
    console.error('Get active season error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
