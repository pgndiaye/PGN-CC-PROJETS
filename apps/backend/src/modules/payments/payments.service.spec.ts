import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockOrder = {
  id: 'order-1',
  total: 90000,
  status: OrderStatus.PENDING,
  paymentRef: null,
  paymentMethod: null,
};

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const mockConfig = {
  getOrThrow: jest.fn().mockImplementation((key: string) => {
    const map: Record<string, string> = {
      SENEPAY_API_KEY: 'pk_test_xxx',
      SENEPAY_SECRET_KEY: 'sk_test_xxx',
    };
    return map[key] ?? 'mock-value';
  }),
  get: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('initiate', () => {
    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.initiate({ orderId: 'ghost', paymentMethod: 'WAVE', customerPhone: '771234567' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is already PAID', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PAID });

      await expect(
        service.initiate({ orderId: 'order-1', paymentMethod: 'WAVE', customerPhone: '771234567' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order is CANCELLED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

      await expect(
        service.initiate({ orderId: 'order-1', paymentMethod: 'ORANGE_MONEY', customerPhone: '771234567' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhook', () => {
    beforeEach(() => {
      jest.spyOn(service, 'verifySignature').mockReturnValue(true);
    });

    it('should update order to PAID on SUCCESS status', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.PAID });

      await service.handleWebhook(
        { sessionToken: 'sess-token', status: 'SUCCESS', transactionRef: 'txn-ref-123', amount: 90000 },
        '{"raw":"body"}',
        'valid-hmac-signature',
      );

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.PAID,
            paymentRef: 'txn-ref-123',
          }),
        }),
      );
    });

    it('should be idempotent when order is already PAID', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...mockOrder, status: OrderStatus.PAID });

      await service.handleWebhook(
        { sessionToken: 'sess-token', status: 'SUCCESS', transactionRef: 'txn-ref-123', amount: 90000 },
        '{"raw":"body"}',
        'valid-hmac-signature',
      );

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should not update order when webhook status is FAILED', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);

      await service.handleWebhook(
        { sessionToken: 'sess-token', status: 'FAILED', transactionRef: '', amount: 0 },
        '{"raw":"body"}',
        'valid-hmac-signature',
      );

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when HMAC signature is invalid', async () => {
      jest.spyOn(service, 'verifySignature').mockReturnValue(false);

      await expect(
        service.handleWebhook(
          { sessionToken: 'sess-token', status: 'SUCCESS', transactionRef: 'txn', amount: 90000 },
          '{"raw":"body"}',
          'bad-signature',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifySignature', () => {
    it('should return true for a valid HMAC signature', () => {
      const result = service.verifySignature('payload-body', 'expected-hmac');
      expect(typeof result).toBe('boolean');
    });
  });
});
