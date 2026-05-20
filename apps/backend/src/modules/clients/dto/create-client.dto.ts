import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ClientType } from '@prisma/client';

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsEnum(ClientType)
  @IsOptional()
  type?: ClientType;
}
