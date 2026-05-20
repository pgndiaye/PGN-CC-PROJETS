import * as crypto from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

const SENEPAY_BASE = 'https://api.sene-pay.com/api/v1';

export interface SenePayWebhookPayload {
  sessionToken: string;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  transactionRef: string;
  amount: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async initiate(dto: InitiatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException(`Order ${dto.orderId} not found.`);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot initiate payment for order with status ${order.status}.`,
      );
    }

    const apiKey = this.config.getOrThrow<string>('SENEPAY_API_KEY');
    const secretKey = this.config.getOrThrow<string>('SENEPAY_SECRET_KEY');

    let session: { sessionToken: string; checkoutUrl: string; expiresAt?: string };

    try {
      const res = await fetch(`${SENEPAY_BASE}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': secretKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: order.total,
          currency: 'XOF',
          orderReference: order.id,
          description: `Commande EZVIZ #${order.id.slice(-6).toUpperCase()}`,
          webhookUrl: `${this.config.get<string>('API_BASE_URL', 'http://localhost:3000')}/api/v1/payments/webhook`,
          successUrl: 'ezvizsenegal://payment/success',
          cancelUrl: 'ezvizsenegal://payment/cancel',
          expiresInMinutes: 30,
          metadata: { customerPhone: dto.customerPhone, paymentMethod: dto.paymentMethod },
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        throw new Error(`SENE-PAY responded ${res.status}`);
      }

      session = await res.json() as { sessionToken: string; checkoutUrl: string; expiresAt?: string };
    } catch (err) {
      this.logger.error('SENE-PAY session creation failed', err);
      throw new ServiceUnavailableException('Payment gateway unavailable. Try again.');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: session.sessionToken },
    });

    return {
      checkoutUrl: session.checkoutUrl,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    };
  }

  async handleWebhook(payload: SenePayWebhookPayload, rawBody: string, signature: string) {
    if (!this.verifySignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    const order = await this.prisma.order.findFirst({
      where: { paymentRef: payload.sessionToken },
    });

    if (!order) {
      this.logger.warn(`Webhook received for unknown session ${payload.sessionToken}`);
      return;
    }

    if (order.status === OrderStatus.PAID) {
      return;
    }

    if (payload.status === 'SUCCESS') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paymentRef: payload.transactionRef,
          paymentMethod: PaymentMethod.WAVE,
        },
      });
      this.logger.log(`Order ${order.id} marked PAID via SENE-PAY (ref: ${payload.transactionRef})`);
    } else {
      this.logger.warn(`Payment ${payload.status} for order ${order.id}`);
    }
  }

  verifySignature(rawBody: string, receivedSignature: string): boolean {
    const secretKey = this.config.getOrThrow<string>('SENEPAY_SECRET_KEY');
    const expected = crypto
      .createHmac('sha256', secretKey)
      .update(rawBody)
      .digest('hex');
    return expected === receivedSignature;
  }
}
