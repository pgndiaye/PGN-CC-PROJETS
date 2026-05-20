import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  clientId: string;

  @IsString()
  serialNumber: string;

  @IsInt()
  @Min(1)
  @Max(36)
  planMonths: number;

  @IsDateString()
  @IsOptional()
  activatedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
