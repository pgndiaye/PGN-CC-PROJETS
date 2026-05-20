import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderLineDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsNumber()
  @Min(1)
  qty: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines: CreateOrderLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
