import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { RacePrediction, RacePredictionRequest } from '../types';
import { f1ApiService } from '../services/f1ApiService';

export const racePredictionValidation = [
  body('pole_position_driver_api_id').isString().withMessage('Pole position driver is required'),
  body('podium_first_driver_api_id').isString().withMessage('First place driver is required'),
  body('podium_second_driver_api_id').isString().withMessage('Second place driver is required'),
  body('podium_third_driver_api_id').isString().withMessage('Third place driver is required'),
  body('midfield_hero_driver_api_id').isString().withMessage('Midfield hero driver is required')
];

export const submitRacePrediction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { raceId } = req.params;
    const userId = req.user!.id;

    // Parse raceId format: "year-round" (e.g., "2026-1")
    const [yearStr, roundStr] = raceId.split('-');
    const seasonYear = parseInt(yearStr);
    const roundNumber = parseInt(roundStr);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid race ID format. Expected: year-round (e.g., 2026-1)' });
    }

    const {
      pole_position_driver_api_id,
      podium_first_driver_api_id,
      podium_second_driver_api_id,
      podium_third_driver_api_id,
      midfield_hero_driver_api_id,
      crazy_prediction,
      sprint_pole_driver_api_id,
      sprint_winner_driver_api_id,
      sprint_midfield_hero_driver_api_id
    } = req.body as RacePredictionRequest;

    // Get race from F1 API to check deadline
    const scheduleData = await f1ApiService.fetchSchedule(seasonYear);
    const races = scheduleData?.MRData?.RaceTable?.Races || [];
    const race = races.find((r: any) => parseInt(r.round) === roundNumber);

    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }

    // Check deadline - use FirstPractice date/time as deadline
    const now = new Date();
    const fp1DateTime = race.FirstPractice?.date && race.FirstPractice?.time
      ? new Date(`${race.FirstPractice.date}T${race.FirstPractice.time}`)
      : new Date(race.date); // Fallback to race date if FP1 not available

    if (now > fp1DateTime) {
      return res.status(400).json({ error: 'Prediction deadline has passed' });
    }

    // Validate podium - all three must be different
    if (
      podium_first_driver_api_id === podium_second_driver_api_id ||
      podium_first_driver_api_id === podium_third_driver_api_id ||
      podium_second_driver_api_id === podium_third_driver_api_id
    ) {
      return res.status(400).json({ error: 'Podium drivers must all be different' });
    }

    // Check if prediction already exists
    const existing = db.prepare(`
      SELECT id FROM race_predictions
      WHERE user_id = ? AND season_year = ? AND round_number = ?
    `).get(userId, seasonYear, roundNumber) as { id: number } | undefined;

    if (existing) {
      // Update existing prediction
      db.prepare(`
        UPDATE race_predictions
        SET pole_position_driver_api_id = ?,
            podium_first_driver_api_id = ?,
            podium_second_driver_api_id = ?,
            podium_third_driver_api_id = ?,
            midfield_hero_driver_api_id = ?,
            crazy_prediction = ?,
            sprint_pole_driver_api_id = ?,
            sprint_winner_driver_api_id = ?,
            sprint_midfield_hero_driver_api_id = ?,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        pole_position_driver_api_id,
        podium_first_driver_api_id,
        podium_second_driver_api_id,
        podium_third_driver_api_id,
        midfield_hero_driver_api_id,
        crazy_prediction || null,
        sprint_pole_driver_api_id || null,
        sprint_winner_driver_api_id || null,
        sprint_midfield_hero_driver_api_id || null,
        existing.id
      );

      const updated = db.prepare('SELECT * FROM race_predictions WHERE id = ?').get(existing.id) as RacePrediction;
      res.json(updated);
    } else {
      // Create new prediction
      const result = db.prepare(`
        INSERT INTO race_predictions (
          user_id, season_year, round_number,
          pole_position_driver_api_id, podium_first_driver_api_id,
          podium_second_driver_api_id, podium_third_driver_api_id,
          midfield_hero_driver_api_id, crazy_prediction,
          sprint_pole_driver_api_id, sprint_winner_driver_api_id,
          sprint_midfield_hero_driver_api_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        seasonYear,
        roundNumber,
        pole_position_driver_api_id,
        podium_first_driver_api_id,
        podium_second_driver_api_id,
        podium_third_driver_api_id,
        midfield_hero_driver_api_id,
        crazy_prediction || null,
        sprint_pole_driver_api_id || null,
        sprint_winner_driver_api_id || null,
        sprint_midfield_hero_driver_api_id || null
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

    // Parse raceId format: "year-round" (e.g., "2026-1")
    const [yearStr, roundStr] = raceId.split('-');
    const seasonYear = parseInt(yearStr);
    const roundNumber = parseInt(roundStr);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid race ID format. Expected: year-round (e.g., 2026-1)' });
    }

    const prediction = db.prepare(`
      SELECT * FROM race_predictions
      WHERE user_id = ? AND season_year = ? AND round_number = ?
    `).get(userId, seasonYear, roundNumber) as RacePrediction | undefined;

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
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    // Parse raceId format: "year-round" (e.g., "2026-1")
    const [yearStr, roundStr] = raceId.split('-');
    const seasonYear = parseInt(yearStr);
    const roundNumber = parseInt(roundStr);

    if (isNaN(seasonYear) || isNaN(roundNumber)) {
      return res.status(400).json({ error: 'Invalid race ID format. Expected: year-round (e.g., 2026-1)' });
    }

    let query = `
      SELECT
        rp.*,
        u.display_name
      FROM race_predictions rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.season_year = ? AND rp.round_number = ?
      ORDER BY u.display_name
    `;

    if (limit && limit > 0) {
      query += ` LIMIT ${limit}`;
    }

    const predictions = db.prepare(query).all(seasonYear, roundNumber) as (RacePrediction & { display_name: string })[];

    res.json(predictions);
  } catch (error) {
    console.error('Get all race predictions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLastRoundResults = async (req: AuthRequest, res: Response) => {
  try {
    const { seasonYear } = req.params;
    const year = parseInt(seasonYear);

    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid season year' });
    }

    // Get current schedule to find last completed round
    const scheduleData = await f1ApiService.fetchSchedule(year);
    const races = scheduleData?.MRData?.RaceTable?.Races || [];

    const now = new Date();
    let lastCompletedRound = 0;

    // Find the last race that has passed
    for (const race of races) {
      const raceDate = new Date(race.date);
      if (raceDate < now) {
        lastCompletedRound = parseInt(race.round);
      }
    }

    if (lastCompletedRound === 0) {
      return res.status(404).json({ error: 'No completed races found' });
    }

    // Get race results from database
    const raceResults = db.prepare(`
      SELECT * FROM race_results
      WHERE season_year = ? AND round_number = ?
    `).get(year, lastCompletedRound) as any;

    if (!raceResults) {
      return res.status(404).json({ error: 'Race results not entered yet' });
    }

    // Get all predictions for this round with user info
    const predictions = db.prepare(`
      SELECT
        rp.*,
        u.display_name,
        u.id as user_id
      FROM race_predictions rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.season_year = ? AND rp.round_number = ?
      ORDER BY u.display_name
    `).all(year, lastCompletedRound) as any[];

    // Calculate scores for each prediction
    const predictionsWithScores = predictions.map(pred => {
      let score = 0;
      let breakdown: any = {};

      // Pole position (1 point)
      if (pred.pole_position_driver_api_id === raceResults.pole_position_driver_api_id) {
        score += 1;
        breakdown.pole = true;
      }

      // Podium first (1 point)
      if (pred.podium_first_driver_api_id === raceResults.podium_first_driver_api_id) {
        score += 1;
        breakdown.p1 = true;
      }

      // Podium second (1 point)
      if (pred.podium_second_driver_api_id === raceResults.podium_second_driver_api_id) {
        score += 1;
        breakdown.p2 = true;
      }

      // Podium third (1 point)
      if (pred.podium_third_driver_api_id === raceResults.podium_third_driver_api_id) {
        score += 1;
        breakdown.p3 = true;
      }

      // Midfield hero (1 point)
      if (pred.midfield_hero_driver_api_id === raceResults.midfield_hero_driver_api_id) {
        score += 1;
        breakdown.midfield = true;
      }

      // Sprint predictions if applicable
      if (raceResults.sprint_pole_driver_api_id) {
        if (pred.sprint_pole_driver_api_id === raceResults.sprint_pole_driver_api_id) {
          score += 1;
          breakdown.sprintPole = true;
        }
      }

      if (raceResults.sprint_winner_driver_api_id) {
        if (pred.sprint_winner_driver_api_id === raceResults.sprint_winner_driver_api_id) {
          score += 1;
          breakdown.sprintWinner = true;
        }
      }

      if (raceResults.sprint_midfield_hero_driver_api_id) {
        if (pred.sprint_midfield_hero_driver_api_id === raceResults.sprint_midfield_hero_driver_api_id) {
          score += 1;
          breakdown.sprintMidfield = true;
        }
      }

      return {
        ...pred,
        calculated_score: score,
        score_breakdown: breakdown
      };
    });

    // Sort by score (highest first)
    predictionsWithScores.sort((a, b) => b.calculated_score - a.calculated_score);

    // Get crazy prediction validations for this round
    const crazyPredIds = predictions.map(p => p.id);
    let crazyValidations: any[] = [];

    if (crazyPredIds.length > 0) {
      const placeholders = crazyPredIds.map(() => '?').join(',');
      crazyValidations = db.prepare(`
        SELECT
          cpv.*,
          u.display_name as validator_name
        FROM crazy_prediction_validations cpv
        JOIN users u ON cpv.validator_user_id = u.id
        WHERE cpv.prediction_type = 'race'
        AND cpv.prediction_id IN (${placeholders})
      `).all(...crazyPredIds) as any[];
    }

    res.json({
      round: lastCompletedRound,
      results: raceResults,
      predictions: predictionsWithScores,
      crazy_validations: crazyValidations
    });
  } catch (error) {
    console.error('Get last round results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
