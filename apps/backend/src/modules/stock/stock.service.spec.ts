import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StockService } from './stock.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockItem = { id: 'item-1', productName: 'CS-H8c', productType: 'Camera', sku: 'EZV-001', qty: 10, minQty: 2, unitPrice: 45000, createdAt: new Date(), updatedAt: new Date() };

const mockPrisma = {
  stockItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('StockService', () => {
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all stock items', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([mockItem]);
      const result = await service.findAll();
      expect(result).toEqual([mockItem]);
    });
  });

  describe('findOne', () => {
    it('returns item when found', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(mockItem);
      const result = await service.findOne('item-1');
      expect(result).toEqual(mockItem);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns new item', async () => {
      mockPrisma.stockItem.create.mockResolvedValue(mockItem);
      const result = await service.create({ productName: 'CS-H8c', qty: 10, unitPrice: 45000 });
      expect(mockPrisma.stockItem.create).toHaveBeenCalled();
      expect(result).toEqual(mockItem);
    });
  });

  describe('update', () => {
    it('updates item when found', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.stockItem.update.mockResolvedValue({ ...mockItem, qty: 15 });
      const result = await service.update('item-1', { qty: 15 });
      expect(result.qty).toBe(15);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes item when found', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.stockItem.delete.mockResolvedValue(mockItem);
      const result = await service.remove('item-1');
      expect(mockPrisma.stockItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
      expect(result).toEqual(mockItem);
    });
  });

  describe('adjust', () => {
    it('increments qty by positive delta', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.stockItem.update.mockResolvedValue({ ...mockItem, qty: 15 });
      const result = await service.adjust('item-1', { delta: 5 });
      expect(mockPrisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { qty: { increment: 5 } },
      });
      expect(result.qty).toBe(15);
    });

    it('decrements qty by negative delta', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.stockItem.update.mockResolvedValue({ ...mockItem, qty: 7 });
      const result = await service.adjust('item-1', { delta: -3 });
      expect(mockPrisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { qty: { increment: -3 } },
      });
      expect(result.qty).toBe(7);
    });
  });

  describe('decrementByOrderLines', () => {
    it('decrements stock for matching items (case-insensitive)', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(mockItem);
      mockPrisma.stockItem.update.mockResolvedValue({ ...mockItem, qty: 8 });

      await service.decrementByOrderLines([{ productName: 'cs-h8c', qty: 2 }]);

      expect(mockPrisma.stockItem.findFirst).toHaveBeenCalledWith({
        where: { productName: { equals: 'cs-h8c', mode: 'insensitive' } },
      });
      expect(mockPrisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { qty: { decrement: 2 } },
      });
    });

    it('skips lines with no matching stock item (non-fatal)', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(null);
      await expect(
        service.decrementByOrderLines([{ productName: 'unknown-product', qty: 1 }]),
      ).resolves.toBeUndefined();
      expect(mockPrisma.stockItem.update).not.toHaveBeenCalled();
    });

    it('processes multiple lines independently', async () => {
      mockPrisma.stockItem.findFirst
        .mockResolvedValueOnce(mockItem)
        .mockResolvedValueOnce(null);
      mockPrisma.stockItem.update.mockResolvedValue({ ...mockItem, qty: 9 });

      await service.decrementByOrderLines([
        { productName: 'CS-H8c', qty: 1 },
        { productName: 'Unknown', qty: 3 },
      ]);

      expect(mockPrisma.stockItem.update).toHaveBeenCalledTimes(1);
    });
  });
});
