import { Router } from 'express';
import { getRaces, getRace, getNextRace } from '../controllers/raceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getRaces);
router.get('/next', authenticate, getNextRace);
router.get('/:raceId', authenticate, getRace);

export default router;
