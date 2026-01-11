import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { f1ApiService } from '../services/f1ApiService';
import { getOriginalGrid, getAllSeasons } from '../utils/gridData';

/**
 * Get drivers for a specific season from API
 */
export const getDrivers = async (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    // Fetch drivers from API
    const data = await f1ApiService.fetchDrivers(year);
    const drivers = data?.MRData?.DriverTable?.Drivers || [];

    res.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get constructors/teams for a specific season from API
 */
export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    // Fetch constructors from API
    const data = await f1ApiService.fetchConstructors(year);
    const constructors = data?.MRData?.ConstructorTable?.Constructors || [];

    // Add is_top_four flag based on grid-data.json
    const gridData = getOriginalGrid(year.toString());
    const topFourTeams = gridData?.top_four_teams || [];

    const teams = constructors.map((constructor: any) => ({
      ...constructor,
      is_top_four: topFourTeams.includes(constructor.constructorId)
    }));

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get team principals for a specific season from grid-data.json
 */
export const getTeamPrincipals = (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    // Get principals from database (seeded from grid-data.json)
    const principals = db.prepare(`
      SELECT id, name, constructor_id, season_year
      FROM team_principals
      WHERE season_year = ?
      ORDER BY name
    `).all(year);

    res.json(principals);
  } catch (error) {
    console.error('Get team principals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get available seasons from grid-data.json
 */
export const getSeasons = (req: AuthRequest, res: Response) => {
  try {
    const seasons = getAllSeasons();
    const seasonData = seasons.map(year => {
      const grid = getOriginalGrid(year);
      return {
        year: parseInt(year),
        prediction_deadline: grid.prediction_deadline,
        is_active: grid.is_active
      };
    }).sort((a, b) => b.year - a.year);

    res.json(seasonData);
  } catch (error) {
    console.error('Get seasons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get the active season from grid-data.json
 */
export const getActiveSeason = (req: AuthRequest, res: Response) => {
  try {
    const seasons = getAllSeasons();
    for (const year of seasons) {
      const grid = getOriginalGrid(year);
      if (grid.is_active) {
        return res.json({
          year: parseInt(year),
          prediction_deadline: grid.prediction_deadline,
          is_active: true
        });
      }
    }

    return res.status(404).json({ error: 'No active season found' });
  } catch (error) {
    console.error('Get active season error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
