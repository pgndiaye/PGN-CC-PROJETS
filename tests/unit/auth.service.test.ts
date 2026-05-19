import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('@prisma/client', () => {
  const user = {
    findUnique: vi.fn(),
    create: vi.fn(),
  };
  const refreshToken = {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  };
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({ user, refreshToken })),
  };
});

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import { PrismaClient } from '@prisma/client';
import { register, login, refresh, logout } from '../../src/services/auth.service.js';

const prisma = new PrismaClient() as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  refreshToken: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

const bcryptMock = bcrypt as unknown as {
  hash: ReturnType<typeof vi.fn>;
  compare: ReturnType<typeof vi.fn>;
};

process.env['JWT_ACCESS_SECRET'] = 'test-access-secret';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthService', () => {
  describe('register', () => {
    it('should create a user and return id, email, createdAt', async () => {
      const now = new Date();
      prisma.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 'uuid-1', email: 'test@example.com', createdAt: now });

      const result = await register({ email: 'test@example.com', password: 'password123' });

      expect(result.user.id).toBe('uuid-1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.createdAt).toBe(now);
    });

    it('should hash the password before storing (passwordHash !== plaintext)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({ id: 'uuid-1', email: 'test@example.com', createdAt: new Date() });

      await register({ email: 'test@example.com', password: 'plaintext' });

      expect(bcryptMock.hash).toHaveBeenCalledWith('plaintext', 12);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ passwordHash: 'hashed-password' }) })
      );
    });

    it('should throw 409 when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@example.com' });

      const err = await register({ email: 'test@example.com', password: 'password123' }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(409);
    });

    it('should throw 400 when email format is invalid', async () => {
      const err = await register({ email: 'not-an-email', password: 'password123' }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(400);
    });

    it('should throw 400 when password is fewer than 8 characters', async () => {
      const err = await register({ email: 'test@example.com', password: 'short' }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(400);
      expect((err as Error).message).toMatch(/8 characters/);
    });

    it('should store email in lowercase regardless of input casing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 'uuid-1', email: 'test@example.com', createdAt: new Date() });

      await register({ email: 'TEST@EXAMPLE.COM', password: 'password123' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'test@example.com' }) })
      );
    });
  });

  describe('login', () => {
    const mockUser = { id: 'uuid-1', email: 'test@example.com', passwordHash: 'hashed' };

    it('should return accessToken and refreshToken on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.id).toBe('uuid-1');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should persist a RefreshToken record in the database on login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      await login({ email: 'test@example.com', password: 'password123' });

      expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'uuid-1' }) })
      );
    });

    it('should throw 401 with generic message when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false);

      const err = await login({ email: 'test@example.com', password: 'wrong' }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(401);
      expect((err as Error).message).toBe('Invalid credentials');
    });

    it('should throw 401 with generic message when email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const err = await login({ email: 'nobody@example.com', password: 'password123' }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(401);
      expect((err as Error).message).toBe('Invalid credentials');
    });

    it('should compare email case-insensitively', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      await login({ email: 'TEST@EXAMPLE.COM', password: 'password123' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });
  });

  describe('refresh', () => {
    const userId = 'uuid-1';
    const userEmail = 'test@example.com';

    function makeRefreshToken(): string {
      return jwt.sign({ sub: userId }, 'test-refresh-secret', { expiresIn: '7d' });
    }

    it('should return a new accessToken and a new refreshToken', async () => {
      const token = makeRefreshToken();
      const futureDate = new Date(Date.now() + 7 * 86400 * 1000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token, userId, expiresAt: futureDate,
        user: { id: userId, email: userEmail },
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await refresh({ refreshToken: token });

      // Both tokens must be non-empty JWTs
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      // A new refresh token record must have been persisted
      expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
    });

    it('should delete the old refresh token on rotation', async () => {
      const token = makeRefreshToken();
      const futureDate = new Date(Date.now() + 7 * 86400 * 1000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token, userId, expiresAt: futureDate,
        user: { id: userId, email: userEmail },
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await refresh({ refreshToken: token });

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
    });

    it('should throw 401 when refresh token is not found in the database', async () => {
      const token = makeRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      const err = await refresh({ refreshToken: token }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });

    it('should throw 401 when refresh token record is expired (expiresAt in the past)', async () => {
      const token = makeRefreshToken();
      const pastDate = new Date(Date.now() - 1000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token, userId, expiresAt: pastDate,
        user: { id: userId, email: userEmail },
      });

      const err = await refresh({ refreshToken: token }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });

    it('should throw 401 when refresh token JWT signature is invalid', async () => {
      const forgedToken = jwt.sign({ sub: userId }, 'wrong-secret', { expiresIn: '7d' });
      const futureDate = new Date(Date.now() + 7 * 86400 * 1000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token: forgedToken, userId, expiresAt: futureDate,
        user: { id: userId, email: userEmail },
      });
      prisma.refreshToken.delete.mockResolvedValue({});

      const err = await refresh({ refreshToken: forgedToken }).catch((e) => e);
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });

  describe('logout', () => {
    it('should delete the refresh token record from the database', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await logout({ refreshToken: 'some-token' });

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'some-token' } });
    });
  });
});
