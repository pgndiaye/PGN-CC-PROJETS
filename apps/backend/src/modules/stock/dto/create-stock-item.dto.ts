import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class CreateStockItemDto {
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  qty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minQty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
