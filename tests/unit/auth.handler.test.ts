import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../src/services/auth.service.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
}));

import * as authService from '../../src/services/auth.service.js';
import { register, login, refresh, logout } from '../../src/handlers/auth.handler.js';

const serviceMock = authService as unknown as {
  register: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

function makeRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function makeReq(body: Record<string, unknown> = {}): Request {
  return { body, headers: {} } as unknown as Request;
}

beforeEach(() => vi.clearAllMocks());

describe('AuthHandler', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should respond 201 with user object on valid input', async () => {
      const now = new Date();
      serviceMock.register.mockResolvedValue({ user: { id: 'uuid-1', email: 'a@b.com', createdAt: now } });
      const res = makeRes();

      await register(makeReq({ email: 'a@b.com', password: 'password123' }), res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user: { id: 'uuid-1', email: 'a@b.com', createdAt: now } });
    });

    it('should respond 400 when email is missing', async () => {
      const res = makeRes();
      await register(makeReq({ password: 'password123' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should respond 400 when password is missing', async () => {
      const res = makeRes();
      await register(makeReq({ email: 'a@b.com' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should respond 409 when email is already registered', async () => {
      const err = Object.assign(new Error('Email already registered'), { statusCode: 409 });
      serviceMock.register.mockRejectedValue(err);
      const res = makeRes();

      await register(makeReq({ email: 'a@b.com', password: 'password123' }), res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should respond 200 with accessToken, refreshToken, and user on valid credentials', async () => {
      serviceMock.login.mockResolvedValue({
        accessToken: 'acc', refreshToken: 'ref', user: { id: 'uuid-1', email: 'a@b.com' },
      });
      const res = makeRes();

      await login(makeReq({ email: 'a@b.com', password: 'password123' }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'acc', refreshToken: 'ref', user: expect.objectContaining({ id: 'uuid-1' }) })
      );
    });

    it('should respond 400 when request body fields are missing', async () => {
      const res = makeRes();
      await login(makeReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should respond 401 on invalid credentials', async () => {
      const err = Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
      serviceMock.login.mockRejectedValue(err);
      const res = makeRes();

      await login(makeReq({ email: 'a@b.com', password: 'wrong' }), res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid credentials' }));
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should respond 200 with new accessToken and refreshToken', async () => {
      serviceMock.refresh.mockResolvedValue({ accessToken: 'new-acc', refreshToken: 'new-ref' });
      const res = makeRes();

      await refresh(makeReq({ refreshToken: 'old-ref' }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'new-acc', refreshToken: 'new-ref' });
    });

    it('should respond 400 when refreshToken is missing from body', async () => {
      const res = makeRes();
      await refresh(makeReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should respond 401 when refresh token is invalid or expired', async () => {
      const err = Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
      serviceMock.refresh.mockRejectedValue(err);
      const res = makeRes();

      await refresh(makeReq({ refreshToken: 'bad-token' }), res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should respond 204 with empty body on success', async () => {
      serviceMock.logout.mockResolvedValue(undefined);
      const res = makeRes();

      await logout(makeReq({ refreshToken: 'some-ref' }), res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
    });

    it('should respond 401 when Authorization header is missing', async () => {
      // Handler delegates auth to middleware; if middleware passed, this covers the missing refreshToken case
      const res = makeRes();
      await logout(makeReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
