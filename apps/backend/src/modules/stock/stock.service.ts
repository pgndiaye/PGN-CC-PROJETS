import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

export interface OrderLineRef {
  productName: string;
  qty: number;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.stockItem.findMany({ orderBy: { productName: 'asc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.stockItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Stock item ${id} not found.`);
    return item;
  }

  create(dto: CreateStockItemDto) {
    return this.prisma.stockItem.create({ data: dto });
  }

  async update(id: string, dto: UpdateStockItemDto) {
    await this.findOne(id);
    return this.prisma.stockItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.stockItem.delete({ where: { id } });
  }

  async adjust(id: string, dto: AdjustStockDto) {
    await this.findOne(id);
    return this.prisma.stockItem.update({
      where: { id },
      data: { qty: { increment: dto.delta } },
    });
  }

  async decrementByOrderLines(lines: OrderLineRef[]): Promise<void> {
    for (const line of lines) {
      const item = await this.prisma.stockItem.findFirst({
        where: { productName: { equals: line.productName, mode: 'insensitive' } },
      });
      if (item) {
        await this.prisma.stockItem.update({
          where: { id: item.id },
          data: { qty: { decrement: line.qty } },
        });
      }
    }
  }
}
