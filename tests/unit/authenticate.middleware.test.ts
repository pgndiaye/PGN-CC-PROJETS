import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import authenticate from '../../src/middleware/authenticate.js';

process.env['JWT_ACCESS_SECRET'] = 'test-access-secret';

function makeRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function makeReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
  } as unknown as Request;
}

beforeEach(() => vi.clearAllMocks());

describe('authenticate middleware', () => {
  it('should call next() and attach req.user when Bearer token is valid', () => {
    const token = jwt.sign({ sub: 'uuid-1', email: 'a@b.com' }, 'test-access-secret', { expiresIn: '15m' });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: 'uuid-1', email: 'a@b.com' });
  });

  it('should respond 401 when Authorization header is absent', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond 401 when Authorization scheme is not Bearer', () => {
    const req = makeReq('Basic dXNlcjpwYXNz');
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond 401 when JWT is malformed', () => {
    const req = makeReq('Bearer not.a.jwt');
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond 401 when JWT signature does not match JWT_ACCESS_SECRET', () => {
    const token = jwt.sign({ sub: 'uuid-1', email: 'a@b.com' }, 'wrong-secret', { expiresIn: '15m' });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond 401 when JWT is expired', () => {
    const token = jwt.sign({ sub: 'uuid-1', email: 'a@b.com' }, 'test-access-secret', { expiresIn: -1 });
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
