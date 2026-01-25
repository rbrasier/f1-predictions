import { Router } from 'express';
import {
  validateCrazyPrediction,
  getPendingValidations,
  getValidationsForPrediction,
  validatePredictionValidation,
  voteOnCrazyPrediction,
  getCrazyPredictionVotes,
  confirmCrazyPredictionOutcome,
  getCrazyPredictionConfirmations
} from '../controllers/crazyPredictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/validate', authenticate, validatePredictionValidation, validateCrazyPrediction);
router.get('/pending', authenticate, getPendingValidations);
router.get('/:predictionType/:predictionId/validations', authenticate, getValidationsForPrediction);

// Vote on crazy predictions (for email feature)
router.post('/predictions/:predictionId/vote', authenticate, voteOnCrazyPrediction);
router.get('/predictions/:predictionId/votes', authenticate, getCrazyPredictionVotes);

// Confirm outcomes after race (for email feature)
router.post('/predictions/:predictionId/confirm', authenticate, confirmCrazyPredictionOutcome);
router.get('/predictions/:predictionId/confirmations', authenticate, getCrazyPredictionConfirmations);

export default router;
