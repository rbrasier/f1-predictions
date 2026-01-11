import { Router } from 'express';
import {
  enterRaceResults,
  getRaceResults,
  enterSeasonResults,
  getSeasonResults,
  recalculateAllScores,
  raceResultValidation,
  seasonResultValidation,
  refreshSeasonData,
  refreshRaceResults,
  getCacheStatus,
  clearSeasonCache,
  clearAllCache
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

// F1 API Data Management
router.get('/f1-data/refresh/:year', refreshSeasonData);
router.get('/f1-data/refresh/:year/:round', refreshRaceResults);
router.get('/f1-data/cache-status', getCacheStatus);
router.delete('/f1-data/cache/:year', clearSeasonCache);
router.delete('/f1-data/cache', clearAllCache);

export default router;
