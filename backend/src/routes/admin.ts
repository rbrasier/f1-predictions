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
  clearAllCache,
  importRaceResults,
  importSeasonStandings,
  bulkImportSeason,
  populateDriverImages,
  sendPreRaceSampleEmails,
  sendPostRaceSampleEmails,
  releaseEmails,
  getEmailLog,
  getBackups,
  downloadBackup,
  triggerBackup
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Race results
router.post('/races/:year/:round/results', raceResultValidation, enterRaceResults);
router.get('/races/:year/:round/results', getRaceResults);

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

// F1 Data Import (auto-populate from API)
router.post('/f1-data/import-race/:year/:round', importRaceResults);
router.post('/f1-data/import-standings/:year', importSeasonStandings);
router.post('/f1-data/import-season/:year', bulkImportSeason);
router.post('/f1-data/populate-driver-images/:year', populateDriverImages);

// Email Management
router.post('/emails/sample-pre-race/:year/:round', sendPreRaceSampleEmails);
router.post('/emails/sample-post-race/:year/:round', sendPostRaceSampleEmails);
router.post('/emails/release', releaseEmails);
router.get('/emails/log/:year/:round/:type', getEmailLog);

// Backups
router.get('/backups', getBackups);
router.get('/backups/:id/download', downloadBackup);
router.post('/backups/trigger', triggerBackup);

export default router;
