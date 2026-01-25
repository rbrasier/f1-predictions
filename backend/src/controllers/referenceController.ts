import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { f1ApiService } from '../services/f1ApiService';
import { getOriginalGrid, getAllSeasons } from '../utils/gridData';
import { logger } from '../utils/logger';

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
    logger.error('Get drivers error:', error);
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
    logger.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get team principals for a specific season from grid-data.json
 */
export const getTeamPrincipals = async (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    // Get principals from database (seeded from grid-data.json)
    const principals = await db.prepare(`
      SELECT id, name, constructor_id, season_year
      FROM team_principals
      WHERE season_year = $1
      ORDER BY name
    `).all(year);

    res.json(principals);
  } catch (error) {
    logger.error('Get team principals error:', error);
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
        is_active: grid.is_active,
        race_winners: grid.race_winners || []
      };
    }).sort((a, b) => b.year - a.year);

    res.json(seasonData);
  } catch (error) {
    logger.error('Get seasons error:', error);
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
          is_active: true,
          race_winners: grid.race_winners || []
        });
      }
    }

    return res.status(404).json({ error: 'No active season found' });
  } catch (error) {
    logger.error('Get active season error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get driver standings for a specific season with team associations
 * Falls back to previous year if current year has no standings yet
 */
export const getDriverStandings = async (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    logger.log(`Fetching driver standings for year ${year}...`);

    // Fetch driver standings from API (includes constructor associations)
    let data = await f1ApiService.fetchDriverStandings(year);
    let standings = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
    let usedYear = year;

    // If no standings for current year (season hasn't started), check for fallback or try previous year
    if (standings.length === 0) {
      const gridData = getOriginalGrid(year.toString());

      if (gridData?.driver_lineup_fallback) {
        logger.log(`Using driver lineup fallback for year ${year}...`);

        // Fetch drivers and constructors to populate the details
        const driversData = await f1ApiService.fetchDrivers(year);
        const drivers = driversData?.MRData?.DriverTable?.Drivers || [];

        const constructorsData = await f1ApiService.fetchConstructors(year);
        const constructors = constructorsData?.MRData?.ConstructorTable?.Constructors || [];

        // Map fallback data to synthetic standings
        standings = gridData.driver_lineup_fallback.map((item: any, index: number) => {
          const driver = drivers.find((d: any) => d.driverId === item.driverId);
          const constructor = constructors.find((c: any) => c.constructorId === item.constructorId);

          if (!driver || !constructor) return null;

          return {
            position: (index + 1).toString(),
            positionText: (index + 1).toString(),
            points: "0",
            wins: "0",
            Driver: driver,
            Constructors: [constructor]
          };
        }).filter((s: any) => s !== null);

        usedYear = year;
      } else {
        logger.warn(`No driver standings found for year ${year}, trying ${year - 1}...`);
        data = await f1ApiService.fetchDriverStandings(year - 1);
        standings = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
        usedYear = year - 1;
      }
    }

    logger.log(`Found ${standings.length} drivers in standings from year ${usedYear}`);

    if (standings.length === 0) {
      logger.warn(`No driver standings found for ${year} or ${year - 1}`);
      return res.json([]);
    }

    // Get top four teams from grid data for the REQUESTED year (not the fallback year)
    const gridData = getOriginalGrid(year.toString());
    const topFourTeams = gridData?.top_four_teams || [];

    logger.log('Top four teams:', topFourTeams);

    // Add is_top_four flag to each driver based on their team
    const enrichedStandings = standings.map((standing: any) => {
      const constructors = standing.Constructors || [];
      const isTopFour = constructors.some((c: any) => topFourTeams.includes(c.constructorId));

      return {
        ...standing,
        is_top_four_team: isTopFour
      };
    });

    const topFourDrivers = enrichedStandings.filter((s: any) => s.is_top_four_team);
    const midfieldDrivers = enrichedStandings.filter((s: any) => !s.is_top_four_team);
    logger.log(`Top 4 team drivers (${topFourDrivers.length} loaded)`);
    logger.log(`Midfield drivers (${midfieldDrivers.length} loaded)`);

    res.json(enrichedStandings);
  } catch (error) {
    logger.error('Get driver standings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
