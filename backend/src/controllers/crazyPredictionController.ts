import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { CrazyPredictionValidation } from '../types';
import { logger } from '../utils/logger';

export const validatePredictionValidation = [
  body('prediction_type').isIn(['season', 'race']).withMessage('Type must be season or race'),
  body('prediction_id').isInt().withMessage('Prediction ID is required'),
  body('is_validated').isBoolean().withMessage('Validation status is required')
];

export const validateCrazyPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const { prediction_type, prediction_id, is_validated } = req.body;

    // Check if user is trying to validate their own prediction
    let predictionOwnerId: number | undefined;

    if (prediction_type === 'season') {
      const pred = await db.prepare('SELECT user_id FROM season_predictions WHERE id = $1').get(prediction_id) as { user_id: number } | undefined;
      predictionOwnerId = pred?.user_id;
    } else {
      const pred = await db.prepare('SELECT user_id FROM race_predictions WHERE id = $1').get(prediction_id) as { user_id: number } | undefined;
      predictionOwnerId = pred?.user_id;
    }

    if (!predictionOwnerId) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (predictionOwnerId === userId) {
      return res.status(400).json({ error: 'Cannot validate your own prediction' });
    }

    // Check if user has already validated this prediction
    const existing = await db.prepare(`
      SELECT id FROM crazy_prediction_validations
      WHERE prediction_type = $1 AND prediction_id = $2 AND validator_user_id = $3
    `).get(prediction_type, prediction_id, userId) as { id: number } | undefined;

    if (existing) {
      // Update existing validation
      await db.prepare(`
        UPDATE crazy_prediction_validations
        SET is_validated = $1, validated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `).run(is_validated, existing.id);

      const updated = await db.prepare('SELECT * FROM crazy_prediction_validations WHERE id = $1').get(existing.id);
      res.json(updated);
    } else {
      // Create new validation
      const result = await db.prepare(`
        INSERT INTO crazy_prediction_validations (prediction_type, prediction_id, validator_user_id, is_validated)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `).run(prediction_type, prediction_id, userId, is_validated);

      const created = result.rows[0];
      res.status(201).json(created);
    }
  } catch (error) {
    logger.error('Validate crazy prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingValidations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId as string) : undefined;

    // Get season predictions with crazy predictions that need validation
    let seasonQuery = `
      SELECT
        sp.id,
        sp.user_id,
        sp.season_year,
        sp.crazy_prediction,
        u.display_name,
        sp.season_year as year,
        'season' as prediction_type,
        (SELECT COUNT(*) FROM crazy_prediction_validations
         WHERE prediction_type = 'season'
         AND prediction_id = sp.id
         AND validator_user_id = $1) as already_validated
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
      WHERE sp.crazy_prediction IS NOT NULL
      AND sp.user_id != $2 ${leagueId ? 'AND ul.league_id = $3' : ''}
    `;

    const seasonParams = leagueId ? [userId, userId, leagueId] : [userId, userId];
    const seasonPredictions = await db.prepare(seasonQuery).all(...seasonParams) as any[];

    // Get race predictions with crazy predictions that need validation
    let raceQuery = `
      SELECT
        rp.id,
        rp.user_id,
        rp.season_year,
        rp.round_number,
        rp.crazy_prediction,
        u.display_name,
        'race' as prediction_type,
        (SELECT COUNT(*) FROM crazy_prediction_validations
         WHERE prediction_type = 'race'
         AND prediction_id = rp.id
         AND validator_user_id = $1) as already_validated
      FROM race_predictions rp
      JOIN users u ON rp.user_id = u.id
      ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
      WHERE rp.crazy_prediction IS NOT NULL
      AND rp.user_id != $2 ${leagueId ? 'AND ul.league_id = $3' : ''}
    `;

    const raceParams = leagueId ? [userId, userId, leagueId] : [userId, userId];
    const racePredictions = await db.prepare(raceQuery).all(...raceParams) as any[];

    const allPredictions = [...seasonPredictions, ...racePredictions];

    res.json(allPredictions);
  } catch (error) {
    logger.error('Get pending validations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getValidationsForPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionType, predictionId } = req.params;

    if (predictionType !== 'season' && predictionType !== 'race') {
      return res.status(400).json({ error: 'Invalid prediction type' });
    }

    const validations = await db.prepare(`
      SELECT cpv.*, u.display_name
      FROM crazy_prediction_validations cpv
      JOIN users u ON cpv.validator_user_id = u.id
      WHERE cpv.prediction_type = $1 AND cpv.prediction_id = $2
      ORDER BY cpv.validated_at DESC
    `).all(predictionType, predictionId) as (CrazyPredictionValidation & { display_name: string })[];

    res.json(validations);
  } catch (error) {
    logger.error('Get validations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Vote on whether a crazy prediction is legit (for email feature)
 * Uses existing crazy_prediction_validations table
 */
export const voteOnCrazyPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;
    const { is_validated } = req.body;
    const userId = req.user!.id;

    if (typeof is_validated !== 'boolean') {
      return res.status(400).json({ error: 'is_validated must be a boolean' });
    }

    // Check if prediction exists
    const prediction = await db.prepare(
      'SELECT id, user_id FROM race_predictions WHERE id = $1'
    ).get(parseInt(predictionId));

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    // Users cannot vote on their own predictions
    if (prediction.user_id === userId) {
      return res.status(400).json({ error: 'Cannot vote on your own prediction' });
    }

    // Check if user already voted
    const existing = await db.prepare(`
      SELECT id FROM crazy_prediction_validations
      WHERE prediction_type = 'race' AND prediction_id = $1 AND validator_user_id = $2
    `).get(parseInt(predictionId), userId);

    if (existing) {
      // Update existing vote
      await db.prepare(`
        UPDATE crazy_prediction_validations
        SET is_validated = $1, validated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `).run(is_validated, existing.id);
    } else {
      // Insert new vote
      await db.prepare(`
        INSERT INTO crazy_prediction_validations (prediction_type, prediction_id, validator_user_id, is_validated)
        VALUES ('race', $1, $2, $3)
      `).run(parseInt(predictionId), userId, is_validated);
    }

    res.json({ success: true, message: 'Vote recorded' });
  } catch (error) {
    logger.error('Vote on crazy prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get votes for a crazy prediction
 * Uses existing crazy_prediction_validations table
 */
export const getCrazyPredictionVotes = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;

    const votes = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_validated = true) as legit_votes,
        COUNT(*) FILTER (WHERE is_validated = false) as not_legit_votes,
        COUNT(*) as total_votes
      FROM crazy_prediction_validations
      WHERE prediction_type = 'race' AND prediction_id = $1
    `, [parseInt(predictionId)]);

    res.json(votes.rows[0]);
  } catch (error) {
    logger.error('Get crazy prediction votes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Confirm whether a crazy prediction came true (after race results)
 * Uses existing crazy_prediction_outcomes table
 */
export const confirmCrazyPredictionOutcome = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;
    const { actually_happened } = req.body;

    if (typeof actually_happened !== 'boolean') {
      return res.status(400).json({ error: 'actually_happened must be a boolean' });
    }

    // Check if prediction exists
    const prediction = await db.prepare(
      'SELECT id FROM race_predictions WHERE id = $1'
    ).get(parseInt(predictionId));

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    // Check if outcome already exists
    const existing = await db.prepare(`
      SELECT id FROM crazy_prediction_outcomes
      WHERE prediction_type = 'race' AND prediction_id = $1
    `).get(parseInt(predictionId));

    if (existing) {
      // Update existing outcome
      await db.prepare(`
        UPDATE crazy_prediction_outcomes
        SET actually_happened = $1, marked_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `).run(actually_happened, existing.id);
    } else {
      // Insert new outcome
      await db.prepare(`
        INSERT INTO crazy_prediction_outcomes (prediction_type, prediction_id, actually_happened)
        VALUES ('race', $1, $2)
      `).run(parseInt(predictionId), actually_happened);
    }

    res.json({ success: true, message: 'Outcome recorded' });
  } catch (error) {
    logger.error('Confirm crazy prediction outcome error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get outcome for a crazy prediction
 * Uses existing crazy_prediction_outcomes table
 */
export const getCrazyPredictionConfirmations = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;

    const outcome = await db.prepare(`
      SELECT actually_happened, marked_at
      FROM crazy_prediction_outcomes
      WHERE prediction_type = 'race' AND prediction_id = $1
    `).get(parseInt(predictionId));

    res.json(outcome || { actually_happened: null, marked_at: null });
  } catch (error) {
    logger.error('Get crazy prediction outcome error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
