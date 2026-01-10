import { Router } from 'express';
import {
  validateCrazyPrediction,
  getPendingValidations,
  getValidationsForPrediction,
  validatePredictionValidation
} from '../controllers/crazyPredictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/validate', authenticate, validatePredictionValidation, validateCrazyPrediction);
router.get('/pending', authenticate, getPendingValidations);
router.get('/:predictionType/:predictionId/validations', authenticate, getValidationsForPrediction);

export default router;
