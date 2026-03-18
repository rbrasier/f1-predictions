import { Router } from 'express';
import {
  submitRacePrediction,
  getMyRacePrediction,
  getAllRacePredictions,
  getLastRoundResults,
  getRoundResults,
  getCompletedRounds,
  racePredictionValidation
} from '../controllers/racePredictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:raceId/predictions', authenticate, racePredictionValidation, submitRacePrediction);
router.get('/:raceId/predictions/me', authenticate, getMyRacePrediction);
router.get('/:raceId/predictions', authenticate, getAllRacePredictions);
router.get('/last-round/:seasonYear', authenticate, getLastRoundResults);
router.get('/completed-rounds/:seasonYear', authenticate, getCompletedRounds);
router.get('/round-results/:seasonYear/:roundNumber', authenticate, getRoundResults);

export default router;
