import express from 'express';
import { getActiveSeason, getSeasons } from '../controllers/referenceController';
import { getUpcomingRaces } from '../controllers/raceController';

const router = express.Router();

/**
 * Public endpoints - no authentication required
 * These are used for the landing page and other public-facing features
 */

// Get active season (public)
router.get('/seasons/active', (req, res) => {
  // Create a mock AuthRequest for the controller
  const mockReq = {
    ...req,
    user: undefined
  } as any;
  return getActiveSeason(mockReq, res);
});

// Get all seasons (public)
router.get('/seasons', (req, res) => {
  const mockReq = {
    ...req,
    user: undefined
  } as any;
  return getSeasons(mockReq, res);
});

// Get upcoming races (public)
router.get('/races/upcoming', async (req, res) => {
  const mockReq = {
    ...req,
    user: undefined,
    query: req.query
  } as any;
  return getUpcomingRaces(mockReq, res);
});

export default router;
