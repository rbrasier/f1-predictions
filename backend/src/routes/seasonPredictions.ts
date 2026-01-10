import { Router } from 'express';
import {
  submitSeasonPrediction,
  getMySeasonPrediction,
  getAllSeasonPredictions,
  seasonPredictionValidation
} from '../controllers/seasonPredictionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:seasonId/predictions', authenticate, seasonPredictionValidation, submitSeasonPrediction);
router.get('/:seasonId/predictions/me', authenticate, getMySeasonPrediction);
router.get('/:seasonId/predictions', authenticate, getAllSeasonPredictions);

export default router;
