import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { RaceResult, SeasonResult } from '../types';
import { f1ApiService } from '../services/f1ApiService';
import { backupService } from '../services/backupService';
import { raceEmailService } from '../services/raceEmailService';
import { logger } from '../utils/logger';

// Race Results
export const raceResultValidation = [
  body('pole_position_driver_api_id').isString().withMessage('Pole position driver is required'),
  body('podium_first_driver_api_id').isString().withMessage('First place driver is required'),
  body('podium_second_driver_api_id').isString().withMessage('Second place driver is required'),
  body('podium_third_driver_api_id').isString().withMessage('Third place driver is required'),
  body('midfield_hero_driver_api_id').isString().withMessage('Midfield hero driver is required')
];

export const enterRaceResults = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { year, round } = req.params;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid year or round number' });
    }

    const {
      pole_position_driver_api_id,
      podium_first_driver_api_id,
      podium_second_driver_api_id,
      podium_third_driver_api_id,
      midfield_hero_driver_api_id,
      sprint_pole_driver_api_id,
      sprint_winner_driver_api_id,
      sprint_midfield_hero_driver_api_id,
      crazy_predictions_happened
    } = req.body;

    // Check if results already exist
    const existing = await db.prepare(`
      SELECT id FROM race_results
      WHERE season_year = $1 AND round_number = $2
    `).get(seasonYear, roundNumber) as { id: number } | undefined;

    if (existing) {
      // Update existing results
      await db.prepare(`
        UPDATE race_results
        SET pole_position_driver_api_id = $1,
            podium_first_driver_api_id = $2,
            podium_second_driver_api_id = $3,
            podium_third_driver_api_id = $4,
            midfield_hero_driver_api_id = $5,
            sprint_pole_driver_api_id = $6,
            sprint_winner_driver_api_id = $7,
            sprint_midfield_hero_driver_api_id = $8,
            entered_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `).run(
        pole_position_driver_api_id,
        podium_first_driver_api_id,
        podium_second_driver_api_id,
        podium_third_driver_api_id,
        midfield_hero_driver_api_id,
        sprint_pole_driver_api_id || null,
        sprint_winner_driver_api_id || null,
        sprint_midfield_hero_driver_api_id || null,
        existing.id
      );
    } else {
      // Insert new results
      await db.prepare(`
        INSERT INTO race_results (
          season_year, round_number,
          pole_position_driver_api_id, podium_first_driver_api_id,
          podium_second_driver_api_id, podium_third_driver_api_id,
          midfield_hero_driver_api_id, sprint_pole_driver_api_id,
          sprint_winner_driver_api_id, sprint_midfield_hero_driver_api_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `).run(
        seasonYear,
        roundNumber,
        pole_position_driver_api_id,
        podium_first_driver_api_id,
        podium_second_driver_api_id,
        podium_third_driver_api_id,
        midfield_hero_driver_api_id,
        sprint_pole_driver_api_id || null,
        sprint_winner_driver_api_id || null,
        sprint_midfield_hero_driver_api_id || null
      );
    }

    // Mark crazy predictions that actually happened
    if (crazy_predictions_happened && Array.isArray(crazy_predictions_happened)) {
      for (const predictionId of crazy_predictions_happened) {
        const existingOutcome = await db.prepare(`
          SELECT id FROM crazy_prediction_outcomes
          WHERE prediction_type = 'race' AND prediction_id = $1
        `).get(predictionId) as { id: number } | undefined;

        if (existingOutcome) {
          await db.prepare(`
            UPDATE crazy_prediction_outcomes
            SET actually_happened = true, marked_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `).run(existingOutcome.id);
        } else {
          await db.prepare(`
            INSERT INTO crazy_prediction_outcomes (prediction_type, prediction_id, actually_happened)
            VALUES ('race', $1, true)
          `).run(predictionId);
        }
      }
    }

    // Calculate scores for this race
    await calculateRaceScores(seasonYear, roundNumber);

    const results = await db.prepare(`
      SELECT * FROM race_results
      WHERE season_year = $1 AND round_number = $2
    `).get(seasonYear, roundNumber);

    res.json(results);
  } catch (error) {
    logger.error('Enter race results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRaceResults = async (req: AuthRequest, res: Response) => {
  try {
    const { year, round } = req.params;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid year or round number' });
    }

    const results = await db.prepare(`
      SELECT * FROM race_results
      WHERE season_year = $1 AND round_number = $2
    `).get(seasonYear, roundNumber) as RaceResult | undefined;

    if (!results) {
      return res.status(404).json({ error: 'Results not found' });
    }

    res.json(results);
  } catch (error) {
    logger.error('Get race results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Season Results
export const seasonResultValidation = [
  body('drivers_championship_order')
    .isArray({ min: 20, max: 20 })
    .withMessage('Must provide exactly 20 drivers in order'),
  body('constructors_championship_order')
    .isArray({ min: 10, max: 10 })
    .withMessage('Must provide exactly 10 teams in order'),
  body('audi_vs_cadillac_winner')
    .isIn(['audi', 'cadillac'])
    .withMessage('Must specify audi or cadillac')
];

export const enterSeasonResults = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const {
      drivers_championship_order,
      constructors_championship_order,
      mid_season_sackings,
      audi_vs_cadillac_winner,
      actual_grid_2027,
      actual_grid_2028,
      crazy_predictions_happened
    } = req.body;

    const driversJson = JSON.stringify(drivers_championship_order);
    const constructorsJson = JSON.stringify(constructors_championship_order);
    const sackingsJson = JSON.stringify(mid_season_sackings || []);
    const grid2027Json = actual_grid_2027 ? JSON.stringify(actual_grid_2027) : null;
    const grid2028Json = actual_grid_2028 ? JSON.stringify(actual_grid_2028) : null;

    // Check if results already exist
    const existing = await db.prepare(`
      SELECT id FROM season_results WHERE season_year = $1
    `).get(seasonYear) as { id: number } | undefined;

    if (existing) {
      // Update existing results
      await db.prepare(`
        UPDATE season_results
        SET drivers_championship_order = $1,
            constructors_championship_order = $2,
            mid_season_sackings = $3,
            audi_vs_cadillac_winner = $4,
            actual_grid_2027 = $5,
            actual_grid_2028 = $6,
            entered_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `).run(
        driversJson,
        constructorsJson,
        sackingsJson,
        audi_vs_cadillac_winner,
        grid2027Json,
        grid2028Json,
        existing.id
      );
    } else {
      // Insert new results
      await db.prepare(`
        INSERT INTO season_results (
          season_year, drivers_championship_order, constructors_championship_order,
          mid_season_sackings, audi_vs_cadillac_winner, actual_grid_2027, actual_grid_2028
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `).run(
        seasonYear,
        driversJson,
        constructorsJson,
        sackingsJson,
        audi_vs_cadillac_winner,
        grid2027Json,
        grid2028Json
      );
    }

    // Mark crazy predictions that actually happened
    if (crazy_predictions_happened && Array.isArray(crazy_predictions_happened)) {
      for (const predictionId of crazy_predictions_happened) {
        const existingOutcome = await db.prepare(`
          SELECT id FROM crazy_prediction_outcomes
          WHERE prediction_type = 'season' AND prediction_id = $1
        `).get(predictionId) as { id: number } | undefined;

        if (existingOutcome) {
          await db.prepare(`
            UPDATE crazy_prediction_outcomes
            SET actually_happened = true, marked_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `).run(existingOutcome.id);
        } else {
          await db.prepare(`
            INSERT INTO crazy_prediction_outcomes (prediction_type, prediction_id, actually_happened)
            VALUES ('season', $1, true)
          `).run(predictionId);
        }
      }
    }

    // Calculate scores for season predictions
    await calculateSeasonScores(seasonYear);

    const results = await db.prepare(`
      SELECT * FROM season_results WHERE season_year = $1
    `).get(seasonYear);

    res.json(results);
  } catch (error) {
    logger.error('Enter season results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSeasonResults = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const results = await db.prepare(`
      SELECT * FROM season_results WHERE season_year = $1
    `).get(seasonYear) as SeasonResult | undefined;

    if (!results) {
      return res.status(404).json({ error: 'Results not found' });
    }

    res.json(results);
  } catch (error) {
    logger.error('Get season results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Scoring functions
async function calculateRaceScores(seasonYear: number, roundNumber: number) {
  const results = await db.prepare(`
    SELECT * FROM race_results
    WHERE season_year = $1 AND round_number = $2
  `).get(seasonYear, roundNumber) as any;

  if (!results) {
    return;
  }

  const predictions = await db.prepare(`
    SELECT * FROM race_predictions
    WHERE season_year = $1 AND round_number = $2
  `).all(seasonYear, roundNumber) as any[];

  for (const prediction of predictions) {
    let points = 0;

    // Pole position: 1 point
    if (prediction.pole_position_driver_api_id === results.pole_position_driver_api_id) {
      points += 1;
    }

    // Podium: 1 point per correct position (up to 3 points)
    if (prediction.podium_first_driver_api_id === results.podium_first_driver_api_id) {
      points += 1;
    }
    if (prediction.podium_second_driver_api_id === results.podium_second_driver_api_id) {
      points += 1;
    }
    if (prediction.podium_third_driver_api_id === results.podium_third_driver_api_id) {
      points += 1;
    }

    // Midfield hero: 1 point
    if (prediction.midfield_hero_driver_api_id === results.midfield_hero_driver_api_id) {
      points += 1;
    }

    // Sprint pole: 1 point
    if (prediction.sprint_pole_driver_api_id && prediction.sprint_pole_driver_api_id === results.sprint_pole_driver_api_id) {
      points += 1;
    }

    // Sprint winner: 1 point
    if (prediction.sprint_winner_driver_api_id && prediction.sprint_winner_driver_api_id === results.sprint_winner_driver_api_id) {
      points += 1;
    }

    // Sprint midfield hero: 1 point
    if (prediction.sprint_midfield_hero_driver_api_id && prediction.sprint_midfield_hero_driver_api_id === results.sprint_midfield_hero_driver_api_id) {
      points += 1;
    }

    // Crazy prediction: 1 point if validated AND actually happened
    if (prediction.crazy_prediction) {
      const isValidated = await isCrazyPredictionValidated('race', prediction.id);
      const actuallyHappened = await didCrazyPredictionHappen('race', prediction.id);

      if (isValidated && actuallyHappened) {
        points += 1;
      }
    }

    // Update prediction points
    await db.prepare('UPDATE race_predictions SET points_earned = $1 WHERE id = $2').run(points, prediction.id);
  }
}

async function calculateSeasonScores(seasonYear: number) {
  const results = await db.prepare(`
    SELECT * FROM season_results WHERE season_year = $1
  `).get(seasonYear) as any;

  if (!results) {
    return;
  }

  const predictions = await db.prepare(`
    SELECT * FROM season_predictions WHERE season_year = $1
  `).all(seasonYear) as any[];

  const actualDriversOrder = JSON.parse(results.drivers_championship_order);
  const actualConstructorsOrder = JSON.parse(results.constructors_championship_order);
  const actualSackings = JSON.parse(results.mid_season_sackings || '[]');
  const actualGrid2027 = results.actual_grid_2027 ? JSON.parse(results.actual_grid_2027) : null;
  const actualGrid2028 = results.actual_grid_2028 ? JSON.parse(results.actual_grid_2028) : null;

  for (const prediction of predictions) {
    let points = 0;

    // Drivers championship: 1 point per correct position
    const predictedDrivers = JSON.parse(prediction.drivers_championship_order);
    for (let i = 0; i < predictedDrivers.length; i++) {
      if (predictedDrivers[i] === actualDriversOrder[i]) {
        points += 1;
      }
    }

    // Constructors championship: 1 point per correct position
    const predictedConstructors = JSON.parse(prediction.constructors_championship_order);
    for (let i = 0; i < predictedConstructors.length; i++) {
      if (predictedConstructors[i] === actualConstructorsOrder[i]) {
        points += 1;
      }
    }

    // Mid-season sackings: 1 point per correct sacking
    const predictedSackings = JSON.parse(prediction.mid_season_sackings || '[]');
    for (const sacking of predictedSackings) {
      if (actualSackings.includes(sacking)) {
        points += 1;
      }
    }

    // Audi vs Cadillac: 1 point
    if (prediction.audi_vs_cadillac === results.audi_vs_cadillac_winner) {
      points += 1;
    }

    // 2027 Grid: 1 point per correct pairing
    if (actualGrid2027) {
      const predictedGrid2027 = JSON.parse(prediction.grid_2027);
      for (const pairing of predictedGrid2027) {
        const match = actualGrid2027.find(
          (actual: any) => actual.driver_api_id === pairing.driver_api_id && actual.constructor_api_id === pairing.constructor_api_id
        );
        if (match) {
          points += 1;
        }
      }
    }

    // 2028 Grid: 1 point per correct pairing
    if (actualGrid2028) {
      const predictedGrid2028 = JSON.parse(prediction.grid_2028);
      for (const pairing of predictedGrid2028) {
        const match = actualGrid2028.find(
          (actual: any) => actual.driver_api_id === pairing.driver_api_id && actual.constructor_api_id === pairing.constructor_api_id
        );
        if (match) {
          points += 1;
        }
      }
    }

    // Crazy prediction: 1 point if validated AND actually happened
    if (prediction.crazy_prediction) {
      const isValidated = await isCrazyPredictionValidated('season', prediction.id);
      const actuallyHappened = await didCrazyPredictionHappen('season', prediction.id);

      if (isValidated && actuallyHappened) {
        points += 1;
      }
    }

    // Update prediction points
    await db.prepare('UPDATE season_predictions SET points_earned = $1 WHERE id = $2').run(points, prediction.id);
  }
}

async function isCrazyPredictionValidated(type: string, predictionId: number): Promise<boolean> {
  // Get all validations for this prediction
  const validations = await db.prepare(`
    SELECT is_validated
    FROM crazy_prediction_validations
    WHERE prediction_type = $1 AND prediction_id = $2
  `).all(type, predictionId) as { is_validated: number }[];

  // No vote = auto-accept, so if no validations, it's accepted
  if (validations.length === 0) {
    return true;
  }

  // At least one validation must be positive
  return validations.some(v => Boolean(v.is_validated));
}

async function didCrazyPredictionHappen(type: string, predictionId: number): Promise<boolean> {
  const outcome = await db.prepare(`
    SELECT actually_happened
    FROM crazy_prediction_outcomes
    WHERE prediction_type = $1 AND prediction_id = $2
  `).get(type, predictionId) as { actually_happened: number } | undefined;

  return Boolean(outcome?.actually_happened);
}

export const recalculateAllScores = async (req: AuthRequest, res: Response) => {
  try {
    // Recalculate all race scores
    const raceResults = await db.prepare(`
      SELECT season_year, round_number FROM race_results
    `).all() as { season_year: number; round_number: number }[];

    for (const result of raceResults) {
      await calculateRaceScores(result.season_year, result.round_number);
    }

    // Recalculate all season scores
    const seasonResults = await db.prepare(`
      SELECT season_year FROM season_results
    `).all() as { season_year: number }[];

    for (const result of seasonResults) {
      await calculateSeasonScores(result.season_year);
    }

    res.json({ message: 'All scores recalculated successfully' });
  } catch (error) {
    logger.error('Recalculate scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// F1 API Data Refresh Endpoints

/**
 * Refresh all F1 data for a specific season
 * GET /api/admin/f1-data/refresh/:year
 */
export const refreshSeasonData = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear) || seasonYear < 1950 || seasonYear > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    await f1ApiService.refreshSeasonData(seasonYear);

    res.json({
      success: true,
      message: `Successfully refreshed all data for ${seasonYear} season`,
      year: seasonYear
    });
  } catch (error: any) {
    logger.error('Refresh season data error:', error);
    res.status(500).json({
      error: 'Failed to refresh season data',
      details: error.message
    });
  }
};

/**
 * Refresh race results for a specific round
 * GET /api/admin/f1-data/refresh/:year/:round
 */
export const refreshRaceResults = async (req: AuthRequest, res: Response) => {
  try {
    const { year, round } = req.params;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid year or round number' });
    }

    await f1ApiService.refreshRaceResults(seasonYear, roundNumber);

    res.json({
      success: true,
      message: `Successfully refreshed results for ${seasonYear} Round ${roundNumber}`,
      year: seasonYear,
      round: roundNumber
    });
  } catch (error: any) {
    logger.error('Refresh race results error:', error);
    res.status(500).json({
      error: 'Failed to refresh race results',
      details: error.message
    });
  }
};

/**
 * Get F1 API cache status
 * GET /api/admin/f1-data/cache-status
 */
export const getCacheStatus = async (req: AuthRequest, res: Response) => {
  try {
    const cacheRecords = await db.prepare(`
      SELECT
        resource_type,
        season_year,
        round_number,
        last_fetched_at,
        LENGTH(data_json) as data_size
      FROM f1_api_cache
      ORDER BY season_year DESC, resource_type, round_number
    `).all() as any[];

    const summary = {
      total_records: cacheRecords.length,
      total_size_bytes: cacheRecords.reduce((sum, r) => sum + (r.data_size || 0), 0),
      by_season: {} as Record<number, any>,
      by_type: {} as Record<string, number>
    };

    // Group by season
    for (const record of cacheRecords) {
      if (record.season_year) {
        if (!summary.by_season[record.season_year]) {
          summary.by_season[record.season_year] = {
            year: record.season_year,
            record_count: 0,
            last_updated: record.last_fetched_at
          };
        }
        summary.by_season[record.season_year].record_count++;

        // Track most recent update
        if (record.last_fetched_at > summary.by_season[record.season_year].last_updated) {
          summary.by_season[record.season_year].last_updated = record.last_fetched_at;
        }
      }

      // Count by resource type
      if (!summary.by_type[record.resource_type]) {
        summary.by_type[record.resource_type] = 0;
      }
      summary.by_type[record.resource_type]++;
    }

    res.json({
      summary,
      records: cacheRecords
    });
  } catch (error) {
    logger.error('Get cache status error:', error);
    res.status(500).json({ error: 'Failed to get cache status' });
  }
};

/**
 * Clear F1 API cache for a season
 * DELETE /api/admin/f1-data/cache/:year
 */
export const clearSeasonCache = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    f1ApiService.clearSeasonCache(seasonYear);

    res.json({
      success: true,
      message: `Successfully cleared cache for ${seasonYear} season`,
      year: seasonYear
    });
  } catch (error: any) {
    logger.error('Clear season cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
};

/**
 * Clear all F1 API cache
 * DELETE /api/admin/f1-data/cache
 */
export const clearAllCache = async (req: AuthRequest, res: Response) => {
  try {
    await f1ApiService.clearCache();

    res.json({
      success: true,
      message: 'Successfully cleared all cached F1 API data'
    });
  } catch (error: any) {
    logger.error('Clear all cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
};

// F1 Data Import Functions (using cached API data)

/**
 * Import race results from cached F1 API data
 * POST /api/admin/f1-data/import-race/:year/:round
 */
export const importRaceResults = async (req: AuthRequest, res: Response) => {
  try {
    const { year, round } = req.params;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid year or round number' });
    }

    // Get cached race results
    const resultsData = await f1ApiService.getCachedData('results', seasonYear, roundNumber);
    const qualifyingData = await f1ApiService.getCachedData('qualifying', seasonYear, roundNumber);
    const sprintData = await f1ApiService.getCachedData('sprint', seasonYear, roundNumber);

    if (!resultsData) {
      return res.status(404).json({
        error: 'No cached race results found. Please refresh the data first.',
        year: seasonYear,
        round: roundNumber
      });
    }

    // Extract race results from API response
    const race = resultsData.MRData?.RaceTable?.Races?.[0];
    if (!race || !race.Results) {
      return res.status(404).json({ error: 'Invalid race results data format' });
    }

    // Get podium (top 3 finishers)
    const podium = race.Results.slice(0, 3);
    const podiumFirst = podium[0]?.Driver?.driverId;
    const podiumSecond = podium[1]?.Driver?.driverId;
    const podiumThird = podium[2]?.Driver?.driverId;

    // Get pole position from qualifying
    let polePosition = null;
    if (qualifyingData) {
      const qualifyingRace = qualifyingData.MRData?.RaceTable?.Races?.[0];
      if (qualifyingRace?.QualifyingResults?.[0]) {
        polePosition = qualifyingRace.QualifyingResults[0].Driver?.driverId;
      }
    }

    // Get midfield hero (best finisher from positions 6-10)
    const midfieldResults = race.Results.slice(5, 10);
    const midfieldHero = midfieldResults[0]?.Driver?.driverId;

    // Get sprint data if available
    let sprintPole = null;
    let sprintWinner = null;
    let sprintMidfieldHero = null;

    if (sprintData) {
      const sprintRace = sprintData.MRData?.RaceTable?.Races?.[0];
      if (sprintRace?.SprintResults) {
        sprintWinner = sprintRace.SprintResults[0]?.Driver?.driverId;
        const sprintMidfield = sprintRace.SprintResults.slice(5, 10);
        sprintMidfieldHero = sprintMidfield[0]?.Driver?.driverId;
        // Sprint pole would need sprint qualifying data - skip for now
      }
    }

    // Check if results already exist
    const existing = await db.prepare(`
      SELECT id FROM race_results
      WHERE season_year = $1 AND round_number = $2
    `).get(seasonYear, roundNumber) as { id: number } | undefined;

    if (existing) {
      // Update existing results
      await db.prepare(`
        UPDATE race_results
        SET pole_position_driver_api_id = $1,
            podium_first_driver_api_id = $2,
            podium_second_driver_api_id = $3,
            podium_third_driver_api_id = $4,
            midfield_hero_driver_api_id = $5,
            sprint_pole_driver_api_id = $6,
            sprint_winner_driver_api_id = $7,
            sprint_midfield_hero_driver_api_id = $8,
            entered_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `).run(
        polePosition,
        podiumFirst,
        podiumSecond,
        podiumThird,
        midfieldHero,
        sprintPole,
        sprintWinner,
        sprintMidfieldHero,
        existing.id
      );
    } else {
      // Insert new results
      await db.prepare(`
        INSERT INTO race_results (
          season_year, round_number,
          pole_position_driver_api_id, podium_first_driver_api_id,
          podium_second_driver_api_id, podium_third_driver_api_id,
          midfield_hero_driver_api_id, sprint_pole_driver_api_id,
          sprint_winner_driver_api_id, sprint_midfield_hero_driver_api_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `).run(
        seasonYear,
        roundNumber,
        polePosition,
        podiumFirst,
        podiumSecond,
        podiumThird,
        midfieldHero,
        sprintPole,
        sprintWinner,
        sprintMidfieldHero
      );
    }

    // Calculate scores for this race
    await calculateRaceScores(seasonYear, roundNumber);

    const results = await db.prepare(`
      SELECT * FROM race_results
      WHERE season_year = $1 AND round_number = $2
    `).get(seasonYear, roundNumber);

    res.json({
      success: true,
      message: `Successfully imported results for ${seasonYear} Round ${roundNumber}`,
      data: results
    });
  } catch (error: any) {
    logger.error('Import race results error:', error);
    res.status(500).json({
      error: 'Failed to import race results',
      details: error.message
    });
  }
};

/**
 * Import season standings from cached F1 API data
 * POST /api/admin/f1-data/import-standings/:year
 */
export const importSeasonStandings = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    // Get cached driver and constructor standings
    const driverStandingsData = await f1ApiService.getCachedData('driverStandings', seasonYear);
    const constructorStandingsData = await f1ApiService.getCachedData('constructorStandings', seasonYear);

    if (!driverStandingsData || !constructorStandingsData) {
      return res.status(404).json({
        error: 'No cached standings found. Please refresh the data first.',
        year: seasonYear
      });
    }

    // Extract driver standings
    const driverStandings = driverStandingsData.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
    if (!driverStandings || driverStandings.length === 0) {
      return res.status(404).json({ error: 'Invalid driver standings data format' });
    }

    // Extract constructor standings
    const constructorStandings = constructorStandingsData.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;
    if (!constructorStandings || constructorStandings.length === 0) {
      return res.status(404).json({ error: 'Invalid constructor standings data format' });
    }

    // Build ordered arrays of driver and constructor IDs
    const driversOrder = driverStandings
      .sort((a: any, b: any) => parseInt(a.position) - parseInt(b.position))
      .map((standing: any) => standing.Driver.driverId);

    const constructorsOrder = constructorStandings
      .sort((a: any, b: any) => parseInt(a.position) - parseInt(b.position))
      .map((standing: any) => standing.Constructor.constructorId);

    const driversJson = JSON.stringify(driversOrder);
    const constructorsJson = JSON.stringify(constructorsOrder);

    // Check if results already exist
    const existing = await db.prepare(`
      SELECT id FROM season_results WHERE season_year = $1
    `).get(seasonYear) as { id: number } | undefined;

    if (existing) {
      // Update existing results
      await db.prepare(`
        UPDATE season_results
        SET drivers_championship_order = $1,
            constructors_championship_order = $2,
            entered_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `).run(driversJson, constructorsJson, existing.id);
    } else {
      // Insert new results (with empty arrays for other fields)
      await db.prepare(`
        INSERT INTO season_results (
          season_year, drivers_championship_order, constructors_championship_order,
          mid_season_sackings
        ) VALUES ($1, $2, $3, $4)
      `).run(seasonYear, driversJson, constructorsJson, '[]');
    }

    // Calculate scores for season predictions
    await calculateSeasonScores(seasonYear);

    const results = await db.prepare(`
      SELECT * FROM season_results WHERE season_year = $1
    `).get(seasonYear);

    res.json({
      success: true,
      message: `Successfully imported standings for ${seasonYear}`,
      data: results
    });
  } catch (error: any) {
    logger.error('Import season standings error:', error);
    res.status(500).json({
      error: 'Failed to import season standings',
      details: error.message
    });
  }
};

/**
 * Bulk import all races for a season from cached data
 * POST /api/admin/f1-data/import-season/:year
 */
export const bulkImportSeason = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    // Get cached schedule to know how many rounds there are
    const scheduleData = await f1ApiService.getCachedData('schedule', seasonYear);

    if (!scheduleData) {
      return res.status(404).json({
        error: 'No cached schedule found. Please refresh the data first.',
        year: seasonYear
      });
    }

    const races = scheduleData.MRData?.RaceTable?.Races;
    if (!races || races.length === 0) {
      return res.status(404).json({ error: 'Invalid schedule data format' });
    }

    const importedRaces = [];
    const failedRaces = [];

    // Import results for each race
    for (const race of races) {
      const round = parseInt(race.round);

      try {
        // Check if results are available for this race
        const resultsData = await f1ApiService.getCachedData('results', seasonYear, round);

        if (resultsData) {
          // Import this race (reuse logic from importRaceResults)
          const raceData = resultsData.MRData?.RaceTable?.Races?.[0];
          if (raceData?.Results) {
            const qualifyingData = await f1ApiService.getCachedData('qualifying', seasonYear, round);
            const sprintData = await f1ApiService.getCachedData('sprint', seasonYear, round);

            const podium = raceData.Results.slice(0, 3);
            const podiumFirst = podium[0]?.Driver?.driverId;
            const podiumSecond = podium[1]?.Driver?.driverId;
            const podiumThird = podium[2]?.Driver?.driverId;

            let polePosition = null;
            if (qualifyingData) {
              const qualifyingRace = qualifyingData.MRData?.RaceTable?.Races?.[0];
              if (qualifyingRace?.QualifyingResults?.[0]) {
                polePosition = qualifyingRace.QualifyingResults[0].Driver?.driverId;
              }
            }

            const midfieldResults = raceData.Results.slice(5, 10);
            const midfieldHero = midfieldResults[0]?.Driver?.driverId;

            let sprintWinner = null;
            let sprintMidfieldHero = null;
            if (sprintData) {
              const sprintRace = sprintData.MRData?.RaceTable?.Races?.[0];
              if (sprintRace?.SprintResults) {
                sprintWinner = sprintRace.SprintResults[0]?.Driver?.driverId;
                const sprintMidfield = sprintRace.SprintResults.slice(5, 10);
                sprintMidfieldHero = sprintMidfield[0]?.Driver?.driverId;
              }
            }

            const existing = await db.prepare(`
              SELECT id FROM race_results
              WHERE season_year = $1 AND round_number = $2
            `).get(seasonYear, round) as { id: number } | undefined;

            if (existing) {
              await db.prepare(`
                UPDATE race_results
                SET pole_position_driver_api_id = $1,
                    podium_first_driver_api_id = $2,
                    podium_second_driver_api_id = $3,
                    podium_third_driver_api_id = $4,
                    midfield_hero_driver_api_id = $5,
                    sprint_winner_driver_api_id = $6,
                    sprint_midfield_hero_driver_api_id = $7,
                    entered_at = CURRENT_TIMESTAMP
                WHERE id = $8
              `).run(
                polePosition,
                podiumFirst,
                podiumSecond,
                podiumThird,
                midfieldHero,
                sprintWinner,
                sprintMidfieldHero,
                existing.id
              );
            } else {
              await db.prepare(`
                INSERT INTO race_results (
                  season_year, round_number,
                  pole_position_driver_api_id, podium_first_driver_api_id,
                  podium_second_driver_api_id, podium_third_driver_api_id,
                  midfield_hero_driver_api_id, sprint_winner_driver_api_id,
                  sprint_midfield_hero_driver_api_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `).run(
                seasonYear,
                round,
                polePosition,
                podiumFirst,
                podiumSecond,
                podiumThird,
                midfieldHero,
                sprintWinner,
                sprintMidfieldHero
              );
            }

            await calculateRaceScores(seasonYear, round);
            importedRaces.push({ round, raceName: race.raceName });
          }
        } else {
          failedRaces.push({ round, raceName: race.raceName, reason: 'No results data in cache' });
        }
      } catch (error: any) {
        failedRaces.push({ round, raceName: race.raceName, reason: error.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk import completed for ${seasonYear}`,
      imported: importedRaces.length,
      failed: failedRaces.length,
      importedRaces,
      failedRaces
    });
  } catch (error: any) {
    logger.error('Bulk import season error:', error);
    res.status(500).json({
      error: 'Failed to bulk import season',
      details: error.message
    });
  }
};

/**
 * Populate driver images from cached F1 API data
 * POST /api/admin/f1-data/populate-driver-images/:year
 */
export const populateDriverImages = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    // Get cached drivers data
    const driversData = await f1ApiService.getCachedData('drivers', seasonYear);

    if (!driversData) {
      return res.status(404).json({
        error: 'No cached drivers found. Please refresh the data first.',
        year: seasonYear
      });
    }

    const drivers = driversData.MRData?.DriverTable?.Drivers;
    if (!drivers || drivers.length === 0) {
      return res.status(404).json({ error: 'Invalid drivers data format' });
    }

    // Note: The Jolpica F1 API doesn't include driver images
    // This endpoint would need to be extended to fetch images from another source
    // or to store placeholder data

    res.json({
      success: true,
      message: `Driver images functionality not yet implemented. API does not provide image URLs.`,
      driverCount: drivers.length,
      drivers: drivers.map((d: any) => ({
        driverId: d.driverId,
        name: `${d.givenName} ${d.familyName}`
      }))
    });
  } catch (error: any) {
    logger.error('Populate driver images error:', error);
    res.status(500).json({
      error: 'Failed to populate driver images',
      details: error.message
    });
  }
};

// Email Management Endpoints

/**
 * Send pre-race sample emails to all admin users
 * POST /api/admin/emails/sample-pre-race/:year/:round
 */
export const sendPreRaceSampleEmails = async (req: AuthRequest, res: Response) => {
  try {
    const { year, round } = req.params;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid year or round number' });
    }

    const result = await raceEmailService.sendPreRaceEmailsToAdmins(seasonYear, roundNumber);

    res.json({
      success: true,
      message: `Pre-race sample emails sent to ${result.sent} admin users`,
      adminsSent: result.sent,
      token: result.token
    });
  } catch (error) {
    logger.error('Send pre-race sample emails error:', error);
    res.status(500).json({ error: 'Failed to send sample emails' });
  }
};

/**
 * Send post-race sample emails to all admin users
 * POST /api/admin/emails/sample-post-race/:year/:round
 */
export const sendPostRaceSampleEmails = async (req: AuthRequest, res: Response) => {
  try {
    const { year, round } = req.params;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid year or round number' });
    }

    const result = await raceEmailService.sendPostRaceEmailsToAdmins(seasonYear, roundNumber);

    res.json({
      success: true,
      message: `Post-race sample emails sent to ${result.sent} admin users`,
      adminsSent: result.sent,
      token: result.token
    });
  } catch (error) {
    logger.error('Send post-race sample emails error:', error);
    res.status(500).json({ error: 'Failed to send sample emails' });
  }
};

/**
 * Release emails to all users (async)
 * POST /api/admin/emails/release
 */
export const releaseEmails = async (req: AuthRequest, res: Response) => {
  try {
    const { year, round, emailType } = req.body;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);
    const userId = req.user?.id;

    if (isNaN(seasonYear) || isNaN(roundNumber) || !userId) {
      return res.status(400).json({ error: 'Invalid year, round number, or user' });
    }

    if (emailType !== 'pre_race' && emailType !== 'post_race') {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    // Start the release in the background
    if (emailType === 'pre_race') {
      raceEmailService.releasePreRaceEmails(seasonYear, roundNumber, userId).catch(err => {
        logger.error('Background pre-race email release failed:', err);
      });
    } else {
      raceEmailService.releasePostRaceEmails(seasonYear, roundNumber, userId).catch(err => {
        logger.error('Background post-race email release failed:', err);
      });
    }

    res.json({
      success: true,
      message: `Releasing ${emailType.replace('_', '-')} emails for ${seasonYear} Round ${roundNumber}. This will run in the background.`,
      type: emailType,
      year: seasonYear,
      round: roundNumber
    });
  } catch (error) {
    logger.error('Release emails error:', error);
    res.status(500).json({ error: 'Failed to release emails' });
  }
};

/**
 * Get email log status for a race
 * GET /api/admin/emails/log/:year/:round/:type
 */
export const getEmailLog = async (req: AuthRequest, res: Response) => {
  try {
    const { year, round, type } = req.params;
    const seasonYear = parseInt(year);
    const roundNumber = parseInt(round);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid year or round number' });
    }

    if (type !== 'pre_race' && type !== 'post_race') {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    const log = await db.prepare(`
      SELECT
        id,
        season_year,
        round_number,
        email_type,
        ready_at,
        released_at,
        released_by_user_id,
        sent_at,
        users_sent_to
      FROM race_email_log
      WHERE season_year = $1 AND round_number = $2 AND email_type = $3
    `).get(seasonYear, roundNumber, type) as any;

    if (!log) {
      return res.status(404).json({ error: 'No email log found for this race' });
    }

    // Get the user info if there's a released_by_user_id
    let releasedByUser = null;
    if (log.released_by_user_id) {
      releasedByUser = await db.prepare(`
        SELECT id, display_name, email FROM users WHERE id = $1
      `).get(log.released_by_user_id) as any;
    }

    res.json({
      ...log,
      releasedByUser: releasedByUser ? {
        id: releasedByUser.id,
        displayName: releasedByUser.display_name,
        email: releasedByUser.email
      } : null,
      status: log.released_at ? 'released' : log.ready_at ? 'ready' : 'pending'
    });
  } catch (error) {
    logger.error('Get email log error:', error);
    res.status(500).json({ error: 'Failed to get email log' });
  }
};

// Backups
export const getBackups = async (req: AuthRequest, res: Response) => {
  try {
    const backups = await backupService.getBackups();
    res.json(backups);
  } catch (error) {
    logger.error('Get backups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadBackup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const backupId = parseInt(id);

    if (isNaN(backupId)) {
      return res.status(400).json({ error: 'Invalid backup ID' });
    }

    const backup = await backupService.getBackupById(backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // data_json is a string (TEXT type in DB)
    res.setHeader('Content-Type', 'application/json');
    // Basic filename with date (assuming backup_date is Date object from pg driver)
    const dateStr = backup.backup_date instanceof Date ? backup.backup_date.toISOString().split('T')[0] : String(backup.backup_date).substring(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename=f1-tips-backup-${dateStr}.json`);
    res.send(backup.data_json);
  } catch (error) {
    logger.error('Download backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const triggerBackup = async (req: AuthRequest, res: Response) => {
  try {
    await backupService.createBackup();
    res.json({ success: true, message: 'Backup created successfully' });
  } catch (error) {
    logger.error('Trigger backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
