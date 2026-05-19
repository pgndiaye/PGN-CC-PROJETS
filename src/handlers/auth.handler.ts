import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';

type AppError = Error & { statusCode?: number };

function handleError(res: Response, err: unknown): void {
  const e = err as AppError;
  const status = e.statusCode ?? 500;
  res.status(status).json({ error: e.message ?? 'Internal server error' });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (typeof email !== 'string' || !email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }
  if (typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'password is required' });
    return;
  }

  try {
    const result = await authService.register({ email, password });
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  try {
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken?: unknown };

  if (typeof refreshToken !== 'string' || !refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  try {
    const result = await authService.refresh({ refreshToken });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken?: unknown };

  if (typeof refreshToken !== 'string' || !refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  try {
    await authService.logout({ refreshToken });
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
}
