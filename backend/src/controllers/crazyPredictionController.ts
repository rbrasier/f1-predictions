import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { CrazyPredictionValidation } from '../types';

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
      const pred = db.prepare('SELECT user_id FROM season_predictions WHERE id = ?').get(prediction_id) as { user_id: number } | undefined;
      predictionOwnerId = pred?.user_id;
    } else {
      const pred = db.prepare('SELECT user_id FROM race_predictions WHERE id = ?').get(prediction_id) as { user_id: number } | undefined;
      predictionOwnerId = pred?.user_id;
    }

    if (!predictionOwnerId) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (predictionOwnerId === userId) {
      return res.status(400).json({ error: 'Cannot validate your own prediction' });
    }

    // Check if user has already validated this prediction
    const existing = db.prepare(`
      SELECT id FROM crazy_prediction_validations
      WHERE prediction_type = ? AND prediction_id = ? AND validator_user_id = ?
    `).get(prediction_type, prediction_id, userId) as { id: number } | undefined;

    if (existing) {
      // Update existing validation
      db.prepare(`
        UPDATE crazy_prediction_validations
        SET is_validated = ?, validated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(is_validated ? 1 : 0, existing.id);

      const updated = db.prepare('SELECT * FROM crazy_prediction_validations WHERE id = ?').get(existing.id);
      res.json(updated);
    } else {
      // Create new validation
      const result = db.prepare(`
        INSERT INTO crazy_prediction_validations (prediction_type, prediction_id, validator_user_id, is_validated)
        VALUES (?, ?, ?, ?)
      `).run(prediction_type, prediction_id, userId, is_validated ? 1 : 0);

      const created = db.prepare('SELECT * FROM crazy_prediction_validations WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(created);
    }
  } catch (error) {
    console.error('Validate crazy prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingValidations = (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get season predictions with crazy predictions that need validation
    const seasonPredictions = db.prepare(`
      SELECT
        sp.id,
        sp.user_id,
        sp.season_id,
        sp.crazy_prediction,
        u.display_name,
        s.year,
        'season' as prediction_type,
        (SELECT COUNT(*) FROM crazy_prediction_validations
         WHERE prediction_type = 'season'
         AND prediction_id = sp.id
         AND validator_user_id = ?) as already_validated
      FROM season_predictions sp
      JOIN users u ON sp.user_id = u.id
      JOIN seasons s ON sp.season_id = s.id
      WHERE sp.crazy_prediction IS NOT NULL
      AND sp.user_id != ?
    `).all(userId, userId) as any[];

    // Get race predictions with crazy predictions that need validation
    const racePredictions = db.prepare(`
      SELECT
        rp.id,
        rp.user_id,
        rp.race_id,
        rp.crazy_prediction,
        u.display_name,
        r.name as race_name,
        r.round_number,
        'race' as prediction_type,
        (SELECT COUNT(*) FROM crazy_prediction_validations
         WHERE prediction_type = 'race'
         AND prediction_id = rp.id
         AND validator_user_id = ?) as already_validated
      FROM race_predictions rp
      JOIN users u ON rp.user_id = u.id
      JOIN races r ON rp.race_id = r.id
      WHERE rp.crazy_prediction IS NOT NULL
      AND rp.user_id != ?
    `).all(userId, userId) as any[];

    const allPredictions = [...seasonPredictions, ...racePredictions];

    res.json(allPredictions);
  } catch (error) {
    console.error('Get pending validations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getValidationsForPrediction = (req: AuthRequest, res: Response) => {
  try {
    const { predictionType, predictionId } = req.params;

    if (predictionType !== 'season' && predictionType !== 'race') {
      return res.status(400).json({ error: 'Invalid prediction type' });
    }

    const validations = db.prepare(`
      SELECT cpv.*, u.display_name
      FROM crazy_prediction_validations cpv
      JOIN users u ON cpv.validator_user_id = u.id
      WHERE cpv.prediction_type = ? AND cpv.prediction_id = ?
      ORDER BY cpv.validated_at DESC
    `).all(predictionType, predictionId) as (CrazyPredictionValidation & { display_name: string })[];

    res.json(validations);
  } catch (error) {
    console.error('Get validations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
