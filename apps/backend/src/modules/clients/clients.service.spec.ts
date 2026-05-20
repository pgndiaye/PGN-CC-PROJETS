import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ClientsService } from './clients.service';

const mockPrisma = {
  client: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const sample = {
  id: 'cuid-abc123',
  name: 'Amadou Diallo',
  phone: '770000001',
  address: null,
  city: 'Dakar',
  type: ClientType.PARTICULIER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  describe('findAll', () => {
    it('should return all clients', async () => {
      mockPrisma.client.findMany.mockResolvedValue([sample]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sample.id);
      expect(mockPrisma.client.findMany).toHaveBeenCalledTimes(1);
    });

    it('should filter by search term when provided', async () => {
      mockPrisma.client.findMany.mockResolvedValue([sample]);
      await service.findAll('Amadou');
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.any(Object) }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a client when found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sample);
      const result = await service.findOne('cuid-abc123');
      expect(result.id).toBe('cuid-abc123');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a client', async () => {
      mockPrisma.client.create.mockResolvedValue(sample);
      const result = await service.create({
        name: 'Amadou Diallo',
        phone: '770000001',
        city: 'Dakar',
      });
      expect(result.id).toBe('cuid-abc123');
      expect(mockPrisma.client.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update and return the client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sample);
      const updated = { ...sample, city: 'Saint-Louis' };
      mockPrisma.client.update.mockResolvedValue(updated);
      const result = await service.update('cuid-abc123', { city: 'Saint-Louis' });
      expect(result.city).toBe('Saint-Louis');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing-id', { city: 'Dakar' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return the client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sample);
      mockPrisma.client.delete.mockResolvedValue(sample);
      const result = await service.remove('cuid-abc123');
      expect(result.id).toBe('cuid-abc123');
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateQrDataUrl', () => {
    it('should return a data URL for a valid client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(sample);
      const result = await service.generateQrDataUrl('cuid-abc123');
      expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.generateQrDataUrl('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
