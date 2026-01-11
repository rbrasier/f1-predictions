import { Router } from 'express';
import { getRaces, getRace, getNextRace, getUpcomingRaces } from '../controllers/raceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getRaces);
router.get('/next', authenticate, getNextRace);
router.get('/upcoming', authenticate, getUpcomingRaces);
router.get('/:raceId', authenticate, getRace);

export default router;
