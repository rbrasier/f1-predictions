import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { RaceResult, SeasonResult } from '../types';
import { f1ApiService } from '../services/f1ApiService';

// Race Results
export const raceResultValidation = [
  body('pole_position_driver_id').isInt().withMessage('Pole position driver is required'),
  body('podium_first_driver_id').isInt().withMessage('First place driver is required'),
  body('podium_second_driver_id').isInt().withMessage('Second place driver is required'),
  body('podium_third_driver_id').isInt().withMessage('Third place driver is required'),
  body('midfield_hero_driver_id').isInt().withMessage('Midfield hero driver is required')
];

export const enterRaceResults = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { raceId } = req.params;
    const {
      pole_position_driver_id,
      podium_first_driver_id,
      podium_second_driver_id,
      podium_third_driver_id,
      midfield_hero_driver_id,
      sprint_pole_driver_id,
      sprint_winner_driver_id,
      sprint_midfield_hero_driver_id,
      crazy_predictions_happened
    } = req.body;

    // Check if results already exist
    const existing = db.prepare('SELECT id FROM race_results WHERE race_id = ?').get(raceId) as { id: number } | undefined;

    if (existing) {
      // Update existing results
      db.prepare(`
        UPDATE race_results
        SET pole_position_driver_id = ?,
            podium_first_driver_id = ?,
            podium_second_driver_id = ?,
            podium_third_driver_id = ?,
            midfield_hero_driver_id = ?,
            sprint_pole_driver_id = ?,
            sprint_winner_driver_id = ?,
            sprint_midfield_hero_driver_id = ?,
            entered_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        pole_position_driver_id,
        podium_first_driver_id,
        podium_second_driver_id,
        podium_third_driver_id,
        midfield_hero_driver_id,
        sprint_pole_driver_id || null,
        sprint_winner_driver_id || null,
        sprint_midfield_hero_driver_id || null,
        existing.id
      );
    } else {
      // Insert new results
      db.prepare(`
        INSERT INTO race_results (
          race_id, pole_position_driver_id, podium_first_driver_id,
          podium_second_driver_id, podium_third_driver_id, midfield_hero_driver_id,
          sprint_pole_driver_id, sprint_winner_driver_id, sprint_midfield_hero_driver_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        raceId,
        pole_position_driver_id,
        podium_first_driver_id,
        podium_second_driver_id,
        podium_third_driver_id,
        midfield_hero_driver_id,
        sprint_pole_driver_id || null,
        sprint_winner_driver_id || null,
        sprint_midfield_hero_driver_id || null
      );
    }

    // Mark crazy predictions that actually happened
    if (crazy_predictions_happened && Array.isArray(crazy_predictions_happened)) {
      for (const predictionId of crazy_predictions_happened) {
        const existingOutcome = db.prepare(`
          SELECT id FROM crazy_prediction_outcomes
          WHERE prediction_type = 'race' AND prediction_id = ?
        `).get(predictionId) as { id: number } | undefined;

        if (existingOutcome) {
          db.prepare(`
            UPDATE crazy_prediction_outcomes
            SET actually_happened = 1, marked_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(existingOutcome.id);
        } else {
          db.prepare(`
            INSERT INTO crazy_prediction_outcomes (prediction_type, prediction_id, actually_happened)
            VALUES ('race', ?, 1)
          `).run(predictionId);
        }
      }
    }

    // Calculate scores for this race
    await calculateRaceScores(parseInt(raceId));

    const results = db.prepare('SELECT * FROM race_results WHERE race_id = ?').get(raceId);
    res.json(results);
  } catch (error) {
    console.error('Enter race results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRaceResults = (req: AuthRequest, res: Response) => {
  try {
    const { raceId } = req.params;

    const results = db.prepare('SELECT * FROM race_results WHERE race_id = ?').get(raceId) as RaceResult | undefined;

    if (!results) {
      return res.status(404).json({ error: 'Results not found' });
    }

    res.json(results);
  } catch (error) {
    console.error('Get race results error:', error);
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

    const { seasonId } = req.params;
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
    const existing = db.prepare('SELECT id FROM season_results WHERE season_id = ?').get(seasonId) as { id: number } | undefined;

    if (existing) {
      // Update existing results
      db.prepare(`
        UPDATE season_results
        SET drivers_championship_order = ?,
            constructors_championship_order = ?,
            mid_season_sackings = ?,
            audi_vs_cadillac_winner = ?,
            actual_grid_2027 = ?,
            actual_grid_2028 = ?,
            entered_at = CURRENT_TIMESTAMP
        WHERE id = ?
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
      db.prepare(`
        INSERT INTO season_results (
          season_id, drivers_championship_order, constructors_championship_order,
          mid_season_sackings, audi_vs_cadillac_winner, actual_grid_2027, actual_grid_2028
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        seasonId,
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
        const existingOutcome = db.prepare(`
          SELECT id FROM crazy_prediction_outcomes
          WHERE prediction_type = 'season' AND prediction_id = ?
        `).get(predictionId) as { id: number } | undefined;

        if (existingOutcome) {
          db.prepare(`
            UPDATE crazy_prediction_outcomes
            SET actually_happened = 1, marked_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(existingOutcome.id);
        } else {
          db.prepare(`
            INSERT INTO crazy_prediction_outcomes (prediction_type, prediction_id, actually_happened)
            VALUES ('season', ?, 1)
          `).run(predictionId);
        }
      }
    }

    // Calculate scores for season predictions
    await calculateSeasonScores(parseInt(seasonId));

    const results = db.prepare('SELECT * FROM season_results WHERE season_id = ?').get(seasonId);
    res.json(results);
  } catch (error) {
    console.error('Enter season results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSeasonResults = (req: AuthRequest, res: Response) => {
  try {
    const { seasonId } = req.params;

    const results = db.prepare('SELECT * FROM season_results WHERE season_id = ?').get(seasonId) as SeasonResult | undefined;

    if (!results) {
      return res.status(404).json({ error: 'Results not found' });
    }

    res.json(results);
  } catch (error) {
    console.error('Get season results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Scoring functions
async function calculateRaceScores(raceId: number) {
  const results = db.prepare('SELECT * FROM race_results WHERE race_id = ?').get(raceId) as RaceResult | undefined;

  if (!results) {
    return;
  }

  const predictions = db.prepare('SELECT * FROM race_predictions WHERE race_id = ?').all(raceId) as any[];

  for (const prediction of predictions) {
    let points = 0;

    // Pole position: 1 point
    if (prediction.pole_position_driver_id === results.pole_position_driver_id) {
      points += 1;
    }

    // Podium: 1 point per correct position (up to 3 points)
    if (prediction.podium_first_driver_id === results.podium_first_driver_id) {
      points += 1;
    }
    if (prediction.podium_second_driver_id === results.podium_second_driver_id) {
      points += 1;
    }
    if (prediction.podium_third_driver_id === results.podium_third_driver_id) {
      points += 1;
    }

    // Midfield hero: 1 point
    if (prediction.midfield_hero_driver_id === results.midfield_hero_driver_id) {
      points += 1;
    }

    // Sprint pole: 1 point
    if (prediction.sprint_pole_driver_id && prediction.sprint_pole_driver_id === results.sprint_pole_driver_id) {
      points += 1;
    }

    // Sprint winner: 1 point
    if (prediction.sprint_winner_driver_id && prediction.sprint_winner_driver_id === results.sprint_winner_driver_id) {
      points += 1;
    }

    // Sprint midfield hero: 1 point
    if (prediction.sprint_midfield_hero_driver_id && prediction.sprint_midfield_hero_driver_id === results.sprint_midfield_hero_driver_id) {
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
    db.prepare('UPDATE race_predictions SET points_earned = ? WHERE id = ?').run(points, prediction.id);
  }
}

async function calculateSeasonScores(seasonId: number) {
  const results = db.prepare('SELECT * FROM season_results WHERE season_id = ?').get(seasonId) as SeasonResult | undefined;

  if (!results) {
    return;
  }

  const predictions = db.prepare('SELECT * FROM season_predictions WHERE season_id = ?').all(seasonId) as any[];

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
          (actual: any) => actual.driver_id === pairing.driver_id && actual.team_id === pairing.team_id
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
          (actual: any) => actual.driver_id === pairing.driver_id && actual.team_id === pairing.team_id
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
    db.prepare('UPDATE season_predictions SET points_earned = ? WHERE id = ?').run(points, prediction.id);
  }
}

async function isCrazyPredictionValidated(type: string, predictionId: number): Promise<boolean> {
  // Get all validations for this prediction
  const validations = db.prepare(`
    SELECT is_validated
    FROM crazy_prediction_validations
    WHERE prediction_type = ? AND prediction_id = ?
  `).all(type, predictionId) as { is_validated: number }[];

  // No vote = auto-accept, so if no validations, it's accepted
  if (validations.length === 0) {
    return true;
  }

  // At least one validation must be positive
  return validations.some(v => v.is_validated === 1);
}

async function didCrazyPredictionHappen(type: string, predictionId: number): Promise<boolean> {
  const outcome = db.prepare(`
    SELECT actually_happened
    FROM crazy_prediction_outcomes
    WHERE prediction_type = ? AND prediction_id = ?
  `).get(type, predictionId) as { actually_happened: number } | undefined;

  return outcome?.actually_happened === 1;
}

export const recalculateAllScores = async (req: AuthRequest, res: Response) => {
  try {
    // Recalculate all race scores
    const raceResults = db.prepare('SELECT race_id FROM race_results').all() as { race_id: number }[];

    for (const result of raceResults) {
      await calculateRaceScores(result.race_id);
    }

    // Recalculate all season scores
    const seasonResults = db.prepare('SELECT season_id FROM season_results').all() as { season_id: number }[];

    for (const result of seasonResults) {
      await calculateSeasonScores(result.season_id);
    }

    res.json({ message: 'All scores recalculated successfully' });
  } catch (error) {
    console.error('Recalculate scores error:', error);
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
    console.error('Refresh season data error:', error);
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
    console.error('Refresh race results error:', error);
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
    const cacheRecords = db.prepare(`
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
    console.error('Get cache status error:', error);
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
    console.error('Clear season cache error:', error);
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
    f1ApiService.clearCache();

    res.json({
      success: true,
      message: 'Successfully cleared all cached F1 API data'
    });
  } catch (error: any) {
    console.error('Clear all cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
};
