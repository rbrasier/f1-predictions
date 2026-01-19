import { Router } from 'express';
import {
  createFeedback,
  getFeatures,
  voteOnFeature,
  getChangelog,
  getAllFeedback,
  updateFeedback,
  createFeedbackValidation,
  voteValidation,
  updateFeedbackValidation
} from '../controllers/feedbackController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route - changelog is public
router.get('/changelog', getChangelog);

// Authenticated routes
router.post('/', authenticate, createFeedbackValidation, createFeedback);
router.get('/features', authenticate, getFeatures);
router.post('/:id/vote', authenticate, voteValidation, voteOnFeature);

// Admin routes
router.get('/admin/all', authenticate, getAllFeedback);
router.patch('/admin/:id', authenticate, updateFeedbackValidation, updateFeedback);

export default router;
