import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { f1ApiService } from '../services/f1ApiService';

/**
 * Get races for a specific season from API
 */
export const getRaces = async (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    // Fetch schedule from API
    const data = await f1ApiService.fetchSchedule(year);
    const races = data?.MRData?.RaceTable?.Races || [];

    res.json(races);
  } catch (error) {
    console.error('Get races error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a specific race by raceId (format: year-round) from API
 */
export const getRace = async (req: AuthRequest, res: Response) => {
  try {
    const { raceId } = req.params;

    // Parse raceId format: "year-round" (e.g., "2026-1")
    const [yearStr, round] = raceId.split('-');
    const year = parseInt(yearStr);

    if (!year || !round) {
      return res.status(400).json({ error: 'Invalid race ID format. Expected: year-round (e.g., 2026-1)' });
    }

    // Fetch schedule from API
    const data = await f1ApiService.fetchSchedule(year);
    const races = data?.MRData?.RaceTable?.Races || [];

    const race = races.find((r: any) => r.round === round);

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    res.json(race);
  } catch (error) {
    console.error('Get race error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get the next upcoming race from API
 */
export const getNextRace = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const year = now.getFullYear();

    // Fetch schedule from API
    const data = await f1ApiService.fetchSchedule(year);
    const races = data?.MRData?.RaceTable?.Races || [];

    // Find the next race after current date
    const nextRace = races.find((race: any) => {
      const raceDate = new Date(race.date + 'T' + (race.time || '00:00:00'));
      return raceDate > now;
    });

    if (!nextRace) {
      return res.status(404).json({ error: 'No upcoming races found' });
    }

    res.json(nextRace);
  } catch (error) {
    console.error('Get next race error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get upcoming races from API
 */
export const getUpcomingRaces = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    // Fetch schedule from API
    const data = await f1ApiService.fetchSchedule(year);
    const races = data?.MRData?.RaceTable?.Races || [];

    // Filter and limit upcoming races
    const upcomingRaces = races
      .filter((race: any) => {
        const raceDate = new Date(race.date + 'T' + (race.time || '00:00:00'));
        return raceDate > now;
      })
      .slice(0, limit);

    res.json(upcomingRaces);
  } catch (error) {
    console.error('Get upcoming races error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
