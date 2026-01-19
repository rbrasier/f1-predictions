import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { sendFeedbackNotificationEmail } from '../services/emailService';
import { Feedback, FeedbackRequest, UpdateFeedbackRequest } from '../types';

export const createFeedbackValidation = [
  body('type')
    .isIn(['bug', 'feature'])
    .withMessage('Type must be either "bug" or "feature"'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be 10-5000 characters')
];

export const voteValidation = [
  body('vote_type')
    .isIn(['upvote', 'downvote'])
    .withMessage('Vote type must be either "upvote" or "downvote"')
];

export const updateFeedbackValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'implemented', 'fixed', 'rejected'])
    .withMessage('Invalid status'),
  body('implementation_note')
    .optional()
    .isString()
    .withMessage('Implementation note must be a string'),
  body('implementation_date')
    .optional()
    .isISO8601()
    .withMessage('Implementation date must be a valid date')
];

// Submit a bug or feature request
export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { type, title, description }: FeedbackRequest = req.body;
    const userId = req.user.id;

    // Get user display name
    const userResult = await db.prepare('SELECT display_name FROM users WHERE id = $1').get(userId);
    const displayName = userResult?.display_name || 'Unknown User';

    // Insert feedback
    const result = await db.prepare(`
      INSERT INTO feedback (type, title, description, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, type, title, description, user_id, status, upvotes_count,
                downvotes_count, implementation_note, implementation_date, created_at
    `).run(type, title, description, userId);

    const feedback = result.rows[0];

    // Send email notification
    try {
      await sendFeedbackNotificationEmail({
        type,
        title,
        description,
        display_name: displayName,
        feedbackId: feedback.id
      });
    } catch (emailError) {
      logger.error('Failed to send feedback notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json(feedback);
  } catch (error) {
    logger.error('Create feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all features with vote counts
export const getFeatures = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get all features that aren't rejected, with user's vote
    const features = await db.prepare(`
      SELECT
        f.id, f.type, f.title, f.description, f.user_id, f.status,
        f.upvotes_count, f.downvotes_count, f.implementation_note,
        f.implementation_date, f.created_at,
        u.display_name,
        fv.vote_type as user_vote
      FROM feedback f
      INNER JOIN users u ON f.user_id = u.id
      LEFT JOIN feedback_votes fv ON f.id = fv.feedback_id AND fv.user_id = $1
      WHERE f.type = 'feature' AND f.status != 'rejected'
      ORDER BY f.upvotes_count DESC, f.created_at DESC
    `).all(req.user.id);

    res.json(features);
  } catch (error) {
    logger.error('Get features error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Vote on a feature
export const voteOnFeature = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const feedbackId = parseInt(req.params.id);
    const { vote_type } = req.body;
    const userId = req.user.id;

    // Check if feedback exists and is a feature
    const feedback = await db.prepare(`
      SELECT id, type FROM feedback WHERE id = $1
    `).get(feedbackId);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (feedback.type !== 'feature') {
      return res.status(400).json({ error: 'Can only vote on feature requests' });
    }

    // Check if user already voted
    const existingVote = await db.prepare(`
      SELECT id, vote_type FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2
    `).get(feedbackId, userId);

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote (toggle off)
        await db.prepare(`
          DELETE FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2
        `).run(feedbackId, userId);

        // Update count
        const countField = vote_type === 'upvote' ? 'upvotes_count' : 'downvotes_count';
        await db.prepare(`
          UPDATE feedback SET ${countField} = ${countField} - 1 WHERE id = $1
        `).run(feedbackId);

        res.json({ message: 'Vote removed', vote: null });
      } else {
        // Change vote
        await db.prepare(`
          UPDATE feedback_votes SET vote_type = $1 WHERE feedback_id = $2 AND user_id = $3
        `).run(vote_type, feedbackId, userId);

        // Update counts
        const incrementField = vote_type === 'upvote' ? 'upvotes_count' : 'downvotes_count';
        const decrementField = vote_type === 'upvote' ? 'downvotes_count' : 'upvotes_count';
        await db.prepare(`
          UPDATE feedback
          SET ${incrementField} = ${incrementField} + 1,
              ${decrementField} = ${decrementField} - 1
          WHERE id = $1
        `).run(feedbackId);

        res.json({ message: 'Vote updated', vote: vote_type });
      }
    } else {
      // New vote
      await db.prepare(`
        INSERT INTO feedback_votes (feedback_id, user_id, vote_type)
        VALUES ($1, $2, $3)
      `).run(feedbackId, userId, vote_type);

      // Update count
      const countField = vote_type === 'upvote' ? 'upvotes_count' : 'downvotes_count';
      await db.prepare(`
        UPDATE feedback SET ${countField} = ${countField} + 1 WHERE id = $1
      `).run(feedbackId);

      res.json({ message: 'Vote added', vote: vote_type });
    }
  } catch (error) {
    logger.error('Vote on feature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get changelog (implemented features)
export const getChangelog = async (req: AuthRequest, res: Response) => {
  try {
    // Get all implemented/fixed features, grouped by implementation date
    const changelog = await db.prepare(`
      SELECT
        f.id, f.type, f.title, f.description, f.user_id, f.status,
        f.upvotes_count, f.downvotes_count, f.implementation_note,
        f.implementation_date, f.created_at,
        u.display_name
      FROM feedback f
      INNER JOIN users u ON f.user_id = u.id
      WHERE f.status IN ('implemented', 'fixed') AND f.implementation_date IS NOT NULL
      ORDER BY f.implementation_date DESC, f.created_at DESC
    `).all();

    res.json(changelog);
  } catch (error) {
    logger.error('Get changelog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin: Get all feedback
export const getAllFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { type, status } = req.query;
    let query = `
      SELECT
        f.id, f.type, f.title, f.description, f.user_id, f.status,
        f.upvotes_count, f.downvotes_count, f.implementation_note,
        f.implementation_date, f.created_at,
        u.display_name
      FROM feedback f
      INNER JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && (type === 'bug' || type === 'feature')) {
      query += ` AND f.type = $${params.length + 1}`;
      params.push(type);
    }

    if (status) {
      query += ` AND f.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY
      CASE f.status
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        ELSE 3
      END,
      f.created_at DESC
    `;

    const feedback = await db.prepare(query).all(...params);
    res.json(feedback);
  } catch (error) {
    logger.error('Get all feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin: Update feedback status
export const updateFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const feedbackId = parseInt(req.params.id);
    const { status, implementation_note, implementation_date }: UpdateFeedbackRequest = req.body;

    // Check if feedback exists
    const feedback = await db.prepare(`
      SELECT id FROM feedback WHERE id = $1
    `).get(feedbackId);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (implementation_note !== undefined) {
      updates.push(`implementation_note = $${params.length + 1}`);
      params.push(implementation_note);
    }

    if (implementation_date !== undefined) {
      updates.push(`implementation_date = $${params.length + 1}`);
      params.push(implementation_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(feedbackId);
    const query = `
      UPDATE feedback
      SET ${updates.join(', ')}
      WHERE id = $${params.length}
      RETURNING id, type, title, description, user_id, status, upvotes_count,
                downvotes_count, implementation_note, implementation_date, created_at
    `;

    const result = await db.prepare(query).run(...params);
    const updatedFeedback = result.rows[0];

    res.json(updatedFeedback);
  } catch (error) {
    logger.error('Update feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
