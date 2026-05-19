import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type {
  RegisterInput,
  RegisterResult,
  LoginInput,
  LoginResult,
  RefreshInput,
  TokenPair,
  LogoutInput,
  JwtAccessPayload,
} from '../types/auth';

const prisma = new PrismaClient();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_COST = 12;

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function signAccessToken(userId: string, email: string): string {
  const secret = process.env['JWT_ACCESS_SECRET']!;
  const expiresIn = getEnv('JWT_ACCESS_EXPIRES_IN', '15m');
  const payload: JwtAccessPayload = { sub: userId, email };
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

function signRefreshToken(userId: string): string {
  const secret = process.env['JWT_REFRESH_SECRET']!;
  const expiresIn = getEnv('JWT_REFRESH_EXPIRES_IN', '7d');
  return jwt.sign({ sub: userId }, secret, { expiresIn } as jwt.SignOptions);
}

function refreshTokenExpiresAt(): Date {
  const raw = getEnv('JWT_REFRESH_EXPIRES_IN', '7d');
  const match = raw.match(/^(\d+)([smhd])$/);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = match ? parseInt(match[1]!, 10) * (multipliers[match[2]!] ?? 0) : 7 * 86400;
  return new Date(Date.now() + seconds * 1000);
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    throw makeError('Invalid email address', 400);
  }

  if (!input.password || input.password.length < 8) {
    throw makeError('Password must be at least 8 characters', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw makeError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  });

  return { user };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  const invalidCreds = makeError('Invalid credentials', 401);

  if (!user) {
    throw invalidCreds;
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw invalidCreds;
  }

  const accessToken = signAccessToken(user.id, user.email);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email },
  };
}

export async function refresh(input: RefreshInput): Promise<TokenPair> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: input.refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw makeError('Invalid or expired refresh token', 401);
  }

  const secret = getEnv('JWT_REFRESH_SECRET', '');
  try {
    jwt.verify(input.refreshToken, secret);
  } catch {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw makeError('Invalid or expired refresh token', 401);
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const accessToken = signAccessToken(stored.user.id, stored.user.email);
  const newRefreshToken = signRefreshToken(stored.user.id);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: stored.user.id,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(input: LogoutInput): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: input.refreshToken },
  });
}
