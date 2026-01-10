import { Router } from 'express';
import {
  enterRaceResults,
  getRaceResults,
  enterSeasonResults,
  getSeasonResults,
  recalculateAllScores,
  raceResultValidation,
  seasonResultValidation
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Race results
router.post('/races/:raceId/results', raceResultValidation, enterRaceResults);
router.get('/races/:raceId/results', getRaceResults);

// Season results
router.post('/seasons/:seasonId/results', seasonResultValidation, enterSeasonResults);
router.get('/seasons/:seasonId/results', getSeasonResults);

// Scoring
router.post('/recalculate-scores', recalculateAllScores);

export default router;
