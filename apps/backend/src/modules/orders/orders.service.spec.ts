import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StockService } from '../stock/stock.service';

const mockClient = { id: 'client-1', name: 'Acme Corp' };

const mockUser = { id: 'user-1', role: Role.COMMERCIAL };

const mockOrderLine = {
  id: 'line-1',
  orderId: 'order-1',
  productName: 'Camera X',
  productType: 'camera',
  qty: 2,
  unitPrice: 45000,
  subtotal: 90000,
  createdAt: new Date(),
};

const mockOrder = {
  id: 'order-1',
  clientId: 'client-1',
  createdById: 'user-1',
  total: 90000,
  status: OrderStatus.PENDING,
  paymentMethod: null,
  paymentRef: null,
  notes: null,
  lines: [mockOrderLine],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  client: { findUnique: jest.fn() },
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockStock = {
  decrementByOrderLines: jest.fn().mockResolvedValue(undefined),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StockService, useValue: mockStock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an order with computed total and subtotals', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.create(
        {
          clientId: 'client-1',
          lines: [{ productName: 'Camera X', productType: 'camera', qty: 2, unitPrice: 45000 }],
        },
        mockUser.id,
      );

      expect(result.total).toBe(90000);
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            total: 90000,
            clientId: 'client-1',
            createdById: 'user-1',
          }),
        }),
      );
    });

    it('should call decrementByOrderLines fire-and-forget after order creation', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      await service.create(
        { clientId: 'client-1', lines: [{ productName: 'Camera X', qty: 1, unitPrice: 45000 }] },
        mockUser.id,
      );

      expect(mockStock.decrementByOrderLines).toHaveBeenCalledTimes(1);
    });

    it('should not throw if stock decrement fails', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockStock.decrementByOrderLines.mockRejectedValue(new Error('stock unavailable'));

      await expect(
        service.create(
          { clientId: 'client-1', lines: [{ productName: 'Camera X', qty: 1, unitPrice: 45000 }] },
          mockUser.id,
        ),
      ).resolves.toBeDefined();
    });

    it('should throw BadRequestException when lines array is empty', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      await expect(
        service.create({ clientId: 'client-1', lines: [] }, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when clientId does not exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { clientId: 'non-existent', lines: [{ productName: 'X', qty: 1, unitPrice: 1000 }] },
          mockUser.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('order-1');
    });

    it('should order results by createdAt descending', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      await service.findAll({});
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('should filter by clientId when provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      await service.findAll({ clientId: 'client-1' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId: 'client-1' }),
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.findAll({ status: OrderStatus.PAID });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: OrderStatus.PAID }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single order with lines', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1');

      expect(result.id).toBe('order-1');
      expect(result.lines).toHaveLength(1);
    });

    it('should include client object in the response', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      await service.findOne('order-1');
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ include: expect.objectContaining({ client: true }) }),
      );
    });

    it('should throw NotFoundException for unknown order id', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update status, paymentMethod, and notes', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentMethod: PaymentMethod.ORANGE_MONEY,
      });

      const result = await service.update('order-1', {
        status: OrderStatus.PAID,
        paymentMethod: PaymentMethod.ORANGE_MONEY,
      });

      expect(result.status).toBe(OrderStatus.PAID);
      expect(result.paymentMethod).toBe(PaymentMethod.ORANGE_MONEY);
    });

    it('should throw NotFoundException when updating non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost-id', { status: OrderStatus.PAID })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-cancel an order by setting status to CANCELLED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

      const result = await service.remove('order-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.CANCELLED }),
        }),
      );
    });

    it('should throw NotFoundException when cancelling non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost-id')).rejects.toThrow(NotFoundException);
    });
  });
});
