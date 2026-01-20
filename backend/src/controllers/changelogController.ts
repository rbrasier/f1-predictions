import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../db/database';
import { logger } from '../utils/logger';

export interface Changelog {
  id: number;
  version: string;
  title: string;
  description: string;
  release_date: string;
  is_published: boolean;
  created_at: string;
}

/**
 * Get recent published changelog entries
 */
export const getRecentChangelog = async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    const changelogs = await db.prepare(`
      SELECT id, version, title, description, release_date, created_at
      FROM changelog
      WHERE is_published = true
      ORDER BY release_date DESC
      LIMIT $1
    `).all(limit) as Changelog[];

    res.json(changelogs);
  } catch (error) {
    logger.error('Get recent changelog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all changelog entries (admin only)
 */
export const getAllChangelog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const changelogs = await db.prepare(`
      SELECT *
      FROM changelog
      ORDER BY release_date DESC
    `).all() as Changelog[];

    res.json(changelogs);
  } catch (error) {
    logger.error('Get all changelog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create changelog entry (admin only)
 */
export const createChangelog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { version, title, description, release_date, is_published } = req.body;

    if (!version || !title || !description) {
      return res.status(400).json({ error: 'Version, title, and description are required' });
    }

    const result = await db.prepare(`
      INSERT INTO changelog (version, title, description, release_date, is_published)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `).run(
      version,
      title,
      description,
      release_date || new Date().toISOString(),
      is_published !== undefined ? is_published : true
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create changelog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update changelog entry (admin only)
 */
export const updateChangelog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { version, title, description, release_date, is_published } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (version !== undefined) {
      updates.push(`version = $${paramIndex++}`);
      values.push(version);
    }

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (release_date !== undefined) {
      updates.push(`release_date = $${paramIndex++}`);
      values.push(release_date);
    }

    if (is_published !== undefined) {
      updates.push(`is_published = $${paramIndex++}`);
      values.push(is_published);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(parseInt(id));

    await db.query(`
      UPDATE changelog
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    const updated = await db.prepare('SELECT * FROM changelog WHERE id = $1').get(parseInt(id));

    if (!updated) {
      return res.status(404).json({ error: 'Changelog entry not found' });
    }

    res.json(updated);
  } catch (error) {
    logger.error('Update changelog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete changelog entry (admin only)
 */
export const deleteChangelog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    await db.prepare('DELETE FROM changelog WHERE id = $1').run(parseInt(id));

    res.json({ message: 'Changelog entry deleted successfully' });
  } catch (error) {
    logger.error('Delete changelog error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
