import { Router } from 'express';
import {
  submitRacePrediction,
  getMyRacePrediction,
  getAllRacePredictions,
  getLastRoundResults,
  racePredictionValidation
} from '../controllers/racePredictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:raceId/predictions', authenticate, racePredictionValidation, submitRacePrediction);
router.get('/:raceId/predictions/me', authenticate, getMyRacePrediction);
router.get('/:raceId/predictions', authenticate, getAllRacePredictions);
router.get('/last-round/:seasonYear', authenticate, getLastRoundResults);

export default router;
