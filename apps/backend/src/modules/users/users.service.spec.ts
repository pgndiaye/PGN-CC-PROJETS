import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockUsers = [
  {
    id: 'cuid-1',
    email: 'admin@ezviz.sn',
    role: Role.ADMIN,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'cuid-2',
    email: 'tech@ezviz.sn',
    role: Role.TECHNICIEN,
    createdAt: new Date('2025-01-02'),
  },
];

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return a list of users without password or refreshToken', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: { id: true, email: true, role: true, createdAt: true },
      });
      result.forEach((u) => {
        expect(u).not.toHaveProperty('password');
        expect(u).not.toHaveProperty('refreshToken');
      });
    });
  });

  describe('findOne', () => {
    it('should return the user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUsers[0]);

      const result = await service.findOne('cuid-1');

      expect(result).toEqual(mockUsers[0]);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'cuid-1' },
        select: { id: true, email: true, role: true, createdAt: true },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should hash the password before storing the user', async () => {
      const dto = { email: 'new@ezviz.sn', password: 'secret123', role: Role.COMMERCIAL };
      const createdUser = { id: 'cuid-3', email: dto.email, role: dto.role, createdAt: new Date() };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);

      const callArg = mockPrisma.user.create.mock.calls[0][0];
      expect(callArg.data.email).toBe(dto.email);
      expect(callArg.data.password).not.toBe(dto.password);

      const isHashed = await bcrypt.compare(dto.password, callArg.data.password);
      expect(isHashed).toBe(true);
    });
  });

  describe('update', () => {
    it('should hash a new password when provided in the dto', async () => {
      const updatedUser = { id: 'cuid-1', email: 'admin@ezviz.sn', role: Role.ADMIN, createdAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.update('cuid-1', { password: 'newpassword' });

      const callArg = mockPrisma.user.update.mock.calls[0][0];
      expect(callArg.data.password).toBeDefined();
      expect(callArg.data.password).not.toBe('newpassword');

      const isHashed = await bcrypt.compare('newpassword', callArg.data.password as string);
      expect(isHashed).toBe(true);
    });

    it('should not include a password field when it is not in the dto', async () => {
      const updatedUser = { id: 'cuid-1', email: 'updated@ezviz.sn', role: Role.ADMIN, createdAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.update('cuid-1', { email: 'updated@ezviz.sn' });

      const callArg = mockPrisma.user.update.mock.calls[0][0];
      expect(callArg.data.password).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should delete the user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUsers[0]);
      mockPrisma.user.delete.mockResolvedValue(mockUsers[0]);

      const result = await service.remove('cuid-1');

      expect(result).toEqual(mockUsers[0]);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'cuid-1' },
        select: { id: true, email: true, role: true, createdAt: true },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
