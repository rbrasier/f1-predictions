import { Router } from 'express';
import {
  submitRacePrediction,
  getMyRacePrediction,
  getAllRacePredictions,
  racePredictionValidation
} from '../controllers/racePredictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:raceId/predictions', authenticate, racePredictionValidation, submitRacePrediction);
router.get('/:raceId/predictions/me', authenticate, getMyRacePrediction);
router.get('/:raceId/predictions', authenticate, getAllRacePredictions);

export default router;
