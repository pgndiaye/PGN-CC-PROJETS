import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Role } from '@prisma/client';

const mockUser = {
  id: 'cuid-123',
  email: 'admin@ezviz.sn',
  password: '',
  role: Role.ADMIN,
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
  get: jest.fn().mockReturnValue('15m'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    mockUser.password = await bcrypt.hash('password123', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwt.sign.mockReturnValue('signed-token');
    mockConfig.getOrThrow.mockReturnValue('test-secret');
    mockConfig.get.mockReturnValue('15m');
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.validateUser('admin@ezviz.sn', 'password123');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should return null when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('ghost@ezviz.sn', 'password123');
      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.validateUser('admin@ezviz.sn', 'wrongpass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return accessToken, refreshToken, and user', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);
      const result = await service.login({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockUser.id } }),
      );
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when stored hash does not match', async () => {
      mockJwt.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshToken: await bcrypt.hash('different-token', 10),
      });
      await expect(service.refresh('my-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear the refreshToken in DB', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);
      await service.logout(mockUser.id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: null },
      });
    });
  });
});
