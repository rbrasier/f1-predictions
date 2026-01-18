import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { SeasonPrediction, SeasonPredictionRequest } from '../types';
import gridData from '../utils/gridData';
import { logger } from '../utils/logger';

export const seasonPredictionValidation = [
  body('drivers_championship_order')
    .isArray({ min: 22, max: 22 })
    .withMessage('Must provide exactly 22 drivers in order'),
  body('constructors_championship_order')
    .isArray({ min: 11, max: 11 })
    .withMessage('Must provide exactly 11 teams in order'),
  body('mid_season_sackings')
    .isArray()
    .withMessage('Mid season sackings must be an array'),
  body('audi_vs_cadillac')
    .isIn(['audi', 'cadillac'])
    .withMessage('Must choose either audi or cadillac'),
  body('first_career_race_winner')
    .isArray()
    .withMessage('First career race winner must be an array'),
  body('grid_2027')
    .isArray({ min: 22, max: 22 })
    .withMessage('Must provide exactly 22 driver-team pairings for 2027'),
  body('grid_2028')
    .isArray({ min: 22, max: 22 })
    .withMessage('Must provide exactly 22 driver-team pairings for 2028')
];

export const submitSeasonPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const { seasonId } = req.params;
    const seasonYear = parseInt(seasonId);
    const userId = req.user!.id;

    if (isNaN(seasonYear)) {
      logger.error('Invalid season year:', seasonId);
      return res.status(400).json({ error: 'Invalid year' });
    }

    const {
      drivers_championship_order,
      constructors_championship_order,
      mid_season_sackings,
      audi_vs_cadillac,
      crazy_prediction,
      first_career_race_winner,
      grid_2027,
      grid_2028
    } = req.body as SeasonPredictionRequest;

    // Get season info from grid-data.json
    const seasonData = gridData[seasonId];
    if (!seasonData) {
      logger.error('Season not found in gridData:', seasonId);
      return res.status(404).json({ error: 'Season not found' });
    }

    // Check deadline
    const now = new Date();
    const deadline = new Date(seasonData.prediction_deadline);

    if (now > deadline) {
      logger.error('Deadline passed:', { now, deadline });
      return res.status(400).json({ error: 'Prediction deadline has passed' });
    }

    // Check if prediction already exists
    const existing = await db.prepare(`
      SELECT id FROM season_predictions WHERE user_id = $1 AND season_year = $2
    `).get(userId, seasonYear) as { id: number } | undefined;

    const driversJson = JSON.stringify(drivers_championship_order);
    const constructorsJson = JSON.stringify(constructors_championship_order);
    const sackingsJson = JSON.stringify(mid_season_sackings || []);
    const grid2027Json = JSON.stringify(grid_2027);
    const grid2028Json = JSON.stringify(grid_2028);

    if (existing) {
      // Update existing prediction
      await db.prepare(`
        UPDATE season_predictions
        SET drivers_championship_order = $1,
            constructors_championship_order = $2,
            mid_season_sackings = $3,
            audi_vs_cadillac = $4,
            crazy_prediction = $5,
            first_career_race_winner = $6,
            grid_2027 = $7,
            grid_2028 = $8,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `).run(
        driversJson,
        constructorsJson,
        sackingsJson,
        audi_vs_cadillac,
        crazy_prediction || null,
        JSON.stringify(first_career_race_winner || []),
        grid2027Json,
        grid2028Json,
        existing.id
      );

      const updated = await db.prepare('SELECT * FROM season_predictions WHERE id = $1').get(existing.id) as SeasonPrediction;
      res.json(updated);
    } else {
      // Create new prediction
      const result = await db.prepare(`
        INSERT INTO season_predictions (
          user_id, season_year, drivers_championship_order, constructors_championship_order,
          mid_season_sackings, audi_vs_cadillac, crazy_prediction, first_career_race_winner,
          grid_2027, grid_2028
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `).run(
        userId,
        seasonYear,
        driversJson,
        constructorsJson,
        sackingsJson,
        audi_vs_cadillac,
        crazy_prediction || null,
        JSON.stringify(first_career_race_winner || []),
        grid2027Json,
        grid2028Json
      );

      const created = result.rows[0] as SeasonPrediction;
      res.status(201).json(created);
    }
  } catch (error) {
    logger.error('Submit season prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMySeasonPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { seasonId } = req.params;
    const seasonYear = parseInt(seasonId);
    const userId = req.user!.id;

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const prediction = await db.prepare(`
      SELECT * FROM season_predictions
      WHERE user_id = $1 AND season_year = $2
    `).get(userId, seasonYear) as SeasonPrediction | undefined;

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    logger.error('Get my season prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllSeasonPredictions = async (req: AuthRequest, res: Response) => {
  try {
    const { seasonId } = req.params;
    const seasonYear = parseInt(seasonId);
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    let query = `
      SELECT sp.*, u.display_name
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
      WHERE sp.season_year = $1 ${leagueId ? 'AND ul.league_id = $2' : ''}
      ORDER BY u.display_name
    `;

    const params = leagueId ? [seasonYear, leagueId] : [seasonYear];
    const predictions = await db.prepare(query).all(...params) as (SeasonPrediction & { display_name: string })[];

    res.json(predictions);
  } catch (error) {
    logger.error('Get all season predictions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSeasonResults = async (req: AuthRequest, res: Response) => {
  try {
    const { seasonYear } = req.params;
    const year = parseInt(seasonYear);
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;

    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid season year' });
    }

    // Check if season results have been entered
    const seasonResults = await db.prepare(`
      SELECT * FROM season_results
      WHERE season_year = $1
    `).get(year) as any;

    if (!seasonResults) {
      return res.status(404).json({ error: 'Season results not entered yet' });
    }

    // Get all predictions for this season with user info
    let predictionsQuery = `
      SELECT
        sp.*,
        u.display_name,
        u.id as user_id
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
      WHERE sp.season_year = $1 ${leagueId ? 'AND ul.league_id = $2' : ''}
      ORDER BY sp.points_earned DESC, u.display_name
    `;

    const predictionsParams = leagueId ? [year, leagueId] : [year];
    const predictions = await db.prepare(predictionsQuery).all(...predictionsParams) as any[];

    // Get all crazy prediction validations for this season
    const validations = await db.prepare(`
      SELECT cpv.*
      FROM crazy_prediction_validations cpv
      JOIN season_predictions sp ON cpv.prediction_id = sp.id
      WHERE cpv.prediction_type = 'season' AND sp.season_year = $1
    `).all(year) as any[];

    res.json({
      season_year: year,
      results: seasonResults,
      predictions,
      crazy_validations: validations
    });
  } catch (error) {
    logger.error('Get season results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
