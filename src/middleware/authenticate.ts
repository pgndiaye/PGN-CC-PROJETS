import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtAccessPayload } from '../types/auth.js';

export default function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const raw = jwt.verify(token, process.env['JWT_ACCESS_SECRET']!) as jwt.JwtPayload;
    if (typeof raw['sub'] !== 'string' || typeof raw['email'] !== 'string') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.user = { id: raw['sub'], email: raw['email'] };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
