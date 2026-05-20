import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stock: StockService,
  ) {}

  async create(dto: CreateOrderDto, createdById: string) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('An order must have at least one line.');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client ${dto.clientId} not found.`);
    }

    const lines = dto.lines.map((l) => ({
      productName: l.productName,
      productType: l.productType,
      qty: l.qty,
      unitPrice: l.unitPrice,
      subtotal: l.qty * l.unitPrice,
    }));

    const total = lines.reduce((sum, l) => sum + l.subtotal, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          clientId: dto.clientId,
          createdById,
          total,
          notes: dto.notes,
          lines: { create: lines },
        },
        include: { lines: true },
      });
    });

    this.stock.decrementByOrderLines(lines).catch(() => {
      // non-fatal: stock decrement failure must not roll back the order
    });

    return order;
  }

  async findAll(filters: { clientId?: string; status?: OrderStatus }) {
    return this.prisma.order.findMany({
      where: {
        ...(filters.clientId ? { clientId: filters.clientId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true, client: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found.`);
    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: dto,
      include: { lines: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: { lines: true },
    });
  }
}
