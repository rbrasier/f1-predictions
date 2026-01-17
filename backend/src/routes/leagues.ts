import { Router } from 'express';
import {
  createLeague,
  getUserLeagues,
  getDefaultLeague,
  joinLeague,
  setDefaultLeague,
  getLeagueUsers,
  joinWorldLeague,
  leaveLeague,
  getLeagueByInviteCode,
  createLeagueValidation,
  joinLeagueValidation
} from '../controllers/leaguesController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route - no authentication required
router.get('/invite/:inviteCode', getLeagueByInviteCode);

// All other routes require authentication
router.post('/', authenticate, createLeagueValidation, createLeague);
router.get('/', authenticate, getUserLeagues);
router.get('/default', authenticate, getDefaultLeague);
router.post('/join', authenticate, joinLeagueValidation, joinLeague);
router.post('/world/join', authenticate, joinWorldLeague);
router.put('/:leagueId/set-default', authenticate, setDefaultLeague);
router.get('/:leagueId/users', authenticate, getLeagueUsers);
router.delete('/:leagueId/leave', authenticate, leaveLeague);

export default router;
