import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { Race } from '../types';

export const getRaces = (req: AuthRequest, res: Response) => {
  try {
    const seasonId = req.query.seasonId;

    let query = `
      SELECT id, season_id, name, round_number, fp1_start, race_date, is_sprint_weekend, location
      FROM races
    `;

    const params: any[] = [];

    if (seasonId) {
      query += ' WHERE season_id = ?';
      params.push(seasonId);
    }

    query += ' ORDER BY round_number';

    const races = db.prepare(query).all(...params) as Race[];

    res.json(races);
  } catch (error) {
    console.error('Get races error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRace = (req: AuthRequest, res: Response) => {
  try {
    const { raceId } = req.params;

    const race = db.prepare(`
      SELECT id, season_id, name, round_number, fp1_start, race_date, is_sprint_weekend, location
      FROM races
      WHERE id = ?
    `).get(raceId) as Race | undefined;

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    res.json(race);
  } catch (error) {
    console.error('Get race error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNextRace = (req: AuthRequest, res: Response) => {
  try {
    const now = new Date().toISOString();

    const race = db.prepare(`
      SELECT id, season_id, name, round_number, fp1_start, race_date, is_sprint_weekend, location
      FROM races
      WHERE fp1_start > ?
      ORDER BY fp1_start
      LIMIT 1
    `).get(now) as Race | undefined;

    if (!race) {
      return res.status(404).json({ error: 'No upcoming races found' });
    }

    res.json(race);
  } catch (error) {
    console.error('Get next race error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
