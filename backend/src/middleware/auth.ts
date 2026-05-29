import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-grid-secret-key-9999!';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'SUPPLIER' | 'CONSUMER' | 'TRADER';
  };
}

export const portalStatusError = (status: string): string | null => {
  switch (status) {
    case 'PENDING':
      return 'Your registration is pending admin approval. You will be able to sign in after verification.';
    case 'REJECTED':
      return 'Your registration was rejected. Please contact support or register again with correct details.';
    case 'BLOCKED':
      return 'Your account has been blocked. Please contact support.';
    default:
      return status === 'VERIFIED'
        ? null
        : 'Your account is not authorized to access the portal.';
  }
};

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token missing' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
};

export const requireVerifiedPortalUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  const user = await db.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const deniedMessage = portalStatusError(user.status);
  if (deniedMessage) {
    res.status(403).json({ error: deniedMessage });
    return;
  }

  next();
};
