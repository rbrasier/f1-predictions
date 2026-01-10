import { Router } from 'express';
import { getLeaderboard, getUserBreakdown, exportToExcel } from '../controllers/leaderboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getLeaderboard);
router.get('/export', authenticate, exportToExcel);
router.get('/:userId', authenticate, getUserBreakdown);

export default router;
