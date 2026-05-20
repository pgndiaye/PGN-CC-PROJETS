import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { CloudService } from './cloud.service';

const mockPrisma = {
  cloudSubscription: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockClientsService = {
  findOne: jest.fn(),
};

const now = new Date('2026-05-20T12:00:00Z');
const futureDate = new Date('2026-11-20T12:00:00Z');
const pastDate = new Date('2025-11-20T12:00:00Z');

const sampleClient = { id: 'client-1', name: 'Amadou Diallo' };

const sampleSub = {
  id: 'sub-1',
  clientId: 'client-1',
  serialNumber: 'SN-ABC123',
  planMonths: 6,
  activatedAt: now,
  expiresAt: futureDate,
  notes: null,
  createdAt: now,
  updatedAt: now,
  client: sampleClient,
};

describe('CloudService', () => {
  let service: CloudService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClientsService, useValue: mockClientsService },
      ],
    }).compile();

    service = module.get<CloudService>(CloudService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findAll', () => {
    it('should return all subscriptions with isActive computed', async () => {
      mockPrisma.cloudSubscription.findMany.mockResolvedValue([sampleSub]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should mark expired subscriptions as inactive', async () => {
      const expired = { ...sampleSub, expiresAt: pastDate };
      mockPrisma.cloudSubscription.findMany.mockResolvedValue([expired]);
      const result = await service.findAll();
      expect(result[0].isActive).toBe(false);
    });

    it('should filter by clientId when provided', async () => {
      mockPrisma.cloudSubscription.findMany.mockResolvedValue([sampleSub]);
      await service.findAll({ clientId: 'client-1' });
      expect(mockPrisma.cloudSubscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ clientId: 'client-1' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('should return subscription with isActive computed', async () => {
      mockPrisma.cloudSubscription.findUnique.mockResolvedValue(sampleSub);
      const result = await service.findOne('sub-1');
      expect(result.id).toBe('sub-1');
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.cloudSubscription.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create subscription and compute expiresAt', async () => {
      mockClientsService.findOne.mockResolvedValue(sampleClient);
      mockPrisma.cloudSubscription.create.mockResolvedValue(sampleSub);
      const result = await service.create({
        clientId: 'client-1',
        serialNumber: 'SN-ABC123',
        planMonths: 6,
      });
      expect(result.id).toBe('sub-1');
      expect(mockClientsService.findOne).toHaveBeenCalledWith('client-1');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockClientsService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.create({ clientId: 'bad-id', serialNumber: 'SN-X', planMonths: 6 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('renew', () => {
    it('should extend expiry from current expiresAt when active', async () => {
      mockPrisma.cloudSubscription.findUnique.mockResolvedValue(sampleSub);
      const extended = { ...sampleSub, expiresAt: new Date('2027-05-20T12:00:00Z') };
      mockPrisma.cloudSubscription.update.mockResolvedValue(extended);
      const result = await service.renew('sub-1', { additionalMonths: 6 });
      expect(mockPrisma.cloudSubscription.update).toHaveBeenCalledTimes(1);
      const updateCall = mockPrisma.cloudSubscription.update.mock.calls[0][0];
      const newExpiry: Date = updateCall.data.expiresAt;
      expect(newExpiry > futureDate).toBe(true);
      expect(result.id).toBe('sub-1');
    });

    it('should throw NotFoundException when subscription not found', async () => {
      mockPrisma.cloudSubscription.findUnique.mockResolvedValue(null);
      await expect(service.renew('missing', { additionalMonths: 3 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete and return the subscription', async () => {
      mockPrisma.cloudSubscription.findUnique.mockResolvedValue(sampleSub);
      mockPrisma.cloudSubscription.delete.mockResolvedValue(sampleSub);
      const result = await service.remove('sub-1');
      expect(result.id).toBe('sub-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.cloudSubscription.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
