import { Router } from 'express';
import { getDrivers, getTeams, getTeamPrincipals, getSeasons, getActiveSeason } from '../controllers/referenceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/drivers', authenticate, getDrivers);
router.get('/teams', authenticate, getTeams);
router.get('/team-principals', authenticate, getTeamPrincipals);
router.get('/seasons', authenticate, getSeasons);
router.get('/seasons/active', authenticate, getActiveSeason);

export default router;
