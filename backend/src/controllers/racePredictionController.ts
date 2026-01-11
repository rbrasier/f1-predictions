import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { RacePrediction, RacePredictionRequest, Race } from '../types';

export const racePredictionValidation = [
  body('pole_position_driver_id').isInt().withMessage('Pole position driver is required'),
  body('podium_first_driver_id').isInt().withMessage('First place driver is required'),
  body('podium_second_driver_id').isInt().withMessage('Second place driver is required'),
  body('podium_third_driver_id').isInt().withMessage('Third place driver is required'),
  body('midfield_hero_driver_id').isInt().withMessage('Midfield hero driver is required')
];

export const submitRacePrediction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { raceId } = req.params;
    const userId = req.user!.id;

    const {
      pole_position_driver_id,
      podium_first_driver_id,
      podium_second_driver_id,
      podium_third_driver_id,
      midfield_hero_driver_id,
      crazy_prediction,
      sprint_pole_driver_id,
      sprint_winner_driver_id,
      sprint_midfield_hero_driver_id
    } = req.body as RacePredictionRequest;

    // Check if race exists and deadline hasn't passed
    const race = db.prepare(`
      SELECT fp1_start, is_sprint_weekend
      FROM races WHERE id = ?
    `).get(raceId) as Race | undefined;

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    // Check deadline (honor system, but we'll enforce it)
    const now = new Date();
    const deadline = new Date(race.fp1_start);

    if (now > deadline) {
      return res.status(400).json({ error: 'Prediction deadline has passed' });
    }

    // Validate podium - all three must be different
    if (
      podium_first_driver_id === podium_second_driver_id ||
      podium_first_driver_id === podium_third_driver_id ||
      podium_second_driver_id === podium_third_driver_id
    ) {
      return res.status(400).json({ error: 'Podium drivers must all be different' });
    }

    // Check if prediction already exists
    const existing = db.prepare(`
      SELECT id FROM race_predictions WHERE user_id = ? AND race_id = ?
    `).get(userId, raceId) as { id: number } | undefined;

    if (existing) {
      // Update existing prediction
      db.prepare(`
        UPDATE race_predictions
        SET pole_position_driver_id = ?,
            podium_first_driver_id = ?,
            podium_second_driver_id = ?,
            podium_third_driver_id = ?,
            midfield_hero_driver_id = ?,
            crazy_prediction = ?,
            sprint_pole_driver_id = ?,
            sprint_winner_driver_id = ?,
            sprint_midfield_hero_driver_id = ?,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        pole_position_driver_id,
        podium_first_driver_id,
        podium_second_driver_id,
        podium_third_driver_id,
        midfield_hero_driver_id,
        crazy_prediction || null,
        sprint_pole_driver_id || null,
        sprint_winner_driver_id || null,
        sprint_midfield_hero_driver_id || null,
        existing.id
      );

      const updated = db.prepare('SELECT * FROM race_predictions WHERE id = ?').get(existing.id) as RacePrediction;
      res.json(updated);
    } else {
      // Create new prediction
      const result = db.prepare(`
        INSERT INTO race_predictions (
          user_id, race_id, pole_position_driver_id, podium_first_driver_id,
          podium_second_driver_id, podium_third_driver_id, midfield_hero_driver_id,
          crazy_prediction, sprint_pole_driver_id, sprint_winner_driver_id,
          sprint_midfield_hero_driver_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        raceId,
        pole_position_driver_id,
        podium_first_driver_id,
        podium_second_driver_id,
        podium_third_driver_id,
        midfield_hero_driver_id,
        crazy_prediction || null,
        sprint_pole_driver_id || null,
        sprint_winner_driver_id || null,
        sprint_midfield_hero_driver_id || null
      );

      const created = db.prepare('SELECT * FROM race_predictions WHERE id = ?').get(result.lastInsertRowid) as RacePrediction;
      res.status(201).json(created);
    }
  } catch (error) {
    console.error('Submit race prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyRacePrediction = (req: AuthRequest, res: Response) => {
  try {
    const { raceId } = req.params;
    const userId = req.user!.id;

    const prediction = db.prepare(`
      SELECT * FROM race_predictions
      WHERE user_id = ? AND race_id = ?
    `).get(userId, raceId) as RacePrediction | undefined;

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Get my race prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllRacePredictions = (req: AuthRequest, res: Response) => {
  try {
    const { raceId } = req.params;

    const predictions = db.prepare(`
      SELECT
        rp.*,
        u.display_name,
        d1.name as p1_driver_name,
        t1.name as p1_team_name,
        d2.name as p2_driver_name,
        t2.name as p2_team_name,
        d3.name as p3_driver_name,
        t3.name as p3_team_name,
        d4.name as pole_driver_name,
        d5.name as midfield_hero_name
      FROM race_predictions rp
      JOIN users u ON rp.user_id = u.id
      LEFT JOIN drivers d1 ON rp.podium_first_driver_id = d1.id
      LEFT JOIN drivers d2 ON rp.podium_second_driver_id = d2.id
      LEFT JOIN drivers d3 ON rp.podium_third_driver_id = d3.id
      LEFT JOIN drivers d4 ON rp.pole_position_driver_id = d4.id
      LEFT JOIN drivers d5 ON rp.midfield_hero_driver_id = d5.id
      LEFT JOIN teams t1 ON d1.team_id = t1.id
      LEFT JOIN teams t2 ON d2.team_id = t2.id
      LEFT JOIN teams t3 ON d3.team_id = t3.id
      WHERE rp.race_id = ?
      ORDER BY u.display_name
    `).all(raceId) as (RacePrediction & { display_name: string })[];

    res.json(predictions);
  } catch (error) {
    console.error('Get all race predictions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
