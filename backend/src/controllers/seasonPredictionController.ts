import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { SeasonPrediction, SeasonPredictionRequest } from '../types';
import gridData from '../utils/gridData';

export const seasonPredictionValidation = [
  body('drivers_championship_order')
    .isArray({ min: 20, max: 20 })
    .withMessage('Must provide exactly 20 drivers in order'),
  body('constructors_championship_order')
    .isArray({ min: 10, max: 10 })
    .withMessage('Must provide exactly 10 teams in order'),
  body('mid_season_sackings')
    .isArray()
    .withMessage('Mid season sackings must be an array'),
  body('audi_vs_cadillac')
    .isIn(['audi', 'cadillac'])
    .withMessage('Must choose either audi or cadillac'),
  body('first_career_race_winner')
    .isString()
    .notEmpty()
    .withMessage('Must select a driver for first career race winner'),
  body('grid_2027')
    .isArray({ min: 20, max: 20 })
    .withMessage('Must provide exactly 20 driver-team pairings for 2027'),
  body('grid_2028')
    .isArray({ min: 20, max: 20 })
    .withMessage('Must provide exactly 20 driver-team pairings for 2028')
];

export const submitSeasonPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { year } = req.params;
    const seasonYear = parseInt(year);
    const userId = req.user!.id;

    if (isNaN(seasonYear)) {
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
    const seasonData = gridData[year];
    if (!seasonData) {
      return res.status(404).json({ error: 'Season not found' });
    }

    // Check deadline
    const now = new Date();
    const deadline = new Date(seasonData.prediction_deadline);

    if (now > deadline) {
      return res.status(400).json({ error: 'Prediction deadline has passed' });
    }

    // Check if prediction already exists
    const existing = db.prepare(`
      SELECT id FROM season_predictions WHERE user_id = ? AND season_year = ?
    `).get(userId, seasonYear) as { id: number } | undefined;

    const driversJson = JSON.stringify(drivers_championship_order);
    const constructorsJson = JSON.stringify(constructors_championship_order);
    const sackingsJson = JSON.stringify(mid_season_sackings || []);
    const grid2027Json = JSON.stringify(grid_2027);
    const grid2028Json = JSON.stringify(grid_2028);

    if (existing) {
      // Update existing prediction
      db.prepare(`
        UPDATE season_predictions
        SET drivers_championship_order = ?,
            constructors_championship_order = ?,
            mid_season_sackings = ?,
            audi_vs_cadillac = ?,
            crazy_prediction = ?,
            first_career_race_winner = ?,
            grid_2027 = ?,
            grid_2028 = ?,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        driversJson,
        constructorsJson,
        sackingsJson,
        audi_vs_cadillac,
        crazy_prediction || null,
        first_career_race_winner,
        grid2027Json,
        grid2028Json,
        existing.id
      );

      const updated = db.prepare('SELECT * FROM season_predictions WHERE id = ?').get(existing.id) as SeasonPrediction;
      res.json(updated);
    } else {
      // Create new prediction
      const result = db.prepare(`
        INSERT INTO season_predictions (
          user_id, season_year, drivers_championship_order, constructors_championship_order,
          mid_season_sackings, audi_vs_cadillac, crazy_prediction, first_career_race_winner,
          grid_2027, grid_2028
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        seasonYear,
        driversJson,
        constructorsJson,
        sackingsJson,
        audi_vs_cadillac,
        crazy_prediction || null,
        first_career_race_winner,
        grid2027Json,
        grid2028Json
      );

      const created = db.prepare('SELECT * FROM season_predictions WHERE id = ?').get(result.lastInsertRowid) as SeasonPrediction;
      res.status(201).json(created);
    }
  } catch (error) {
    console.error('Submit season prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMySeasonPrediction = (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);
    const userId = req.user!.id;

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const prediction = db.prepare(`
      SELECT * FROM season_predictions
      WHERE user_id = ? AND season_year = ?
    `).get(userId, seasonYear) as SeasonPrediction | undefined;

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Get my season prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllSeasonPredictions = (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year);

    if (isNaN(seasonYear)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const predictions = db.prepare(`
      SELECT sp.*, u.display_name
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.season_year = ?
      ORDER BY u.display_name
    `).all(seasonYear) as (SeasonPrediction & { display_name: string })[];

    res.json(predictions);
  } catch (error) {
    console.error('Get all season predictions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
