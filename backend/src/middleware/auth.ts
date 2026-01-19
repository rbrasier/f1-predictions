import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT payload structure
export interface JWTPayload {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as JWTPayload;

    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  if (!user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
