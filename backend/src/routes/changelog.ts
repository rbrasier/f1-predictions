import { Router } from 'express';
import {
  getRecentChangelog,
  getAllChangelog,
  createChangelog,
  updateChangelog,
  deleteChangelog
} from '../controllers/changelogController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public route to get recent changelog entries
router.get('/recent', getRecentChangelog);

// Admin routes for managing changelog
router.get('/all', authenticate, requireAdmin, getAllChangelog);
router.post('/', authenticate, requireAdmin, createChangelog);
router.put('/:id', authenticate, requireAdmin, updateChangelog);
router.delete('/:id', authenticate, requireAdmin, deleteChangelog);

export default router;
