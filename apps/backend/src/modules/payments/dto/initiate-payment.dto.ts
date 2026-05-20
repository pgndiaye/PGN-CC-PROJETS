import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export type MobileMoneyMethod = 'WAVE' | 'ORANGE_MONEY';

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(['WAVE', 'ORANGE_MONEY'])
  paymentMethod: MobileMoneyMethod;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;
}
