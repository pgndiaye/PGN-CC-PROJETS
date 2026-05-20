import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RenewSubscriptionDto } from './dto/renew-subscription.dto';

const CLIENT_SELECT = { id: true, name: true } as const;

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function withIsActive<T extends { expiresAt: Date }>(sub: T) {
  return { ...sub, isActive: sub.expiresAt > new Date() };
}

interface FindAllOptions {
  clientId?: string;
  expiringWithinDays?: number;
}

@Injectable()
export class CloudService {
  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
  ) {}

  async findAll(options: FindAllOptions = {}) {
    const where: Record<string, unknown> = {};

    if (options.clientId) {
      where.clientId = options.clientId;
    }

    if (options.expiringWithinDays != null) {
      const cutoff = addMonths(new Date(), 0);
      cutoff.setDate(cutoff.getDate() + options.expiringWithinDays);
      where.expiresAt = { lte: cutoff, gte: new Date() };
    }

    const subs = await this.prisma.cloudSubscription.findMany({
      where,
      include: { client: { select: CLIENT_SELECT } },
      orderBy: { expiresAt: 'asc' },
    });

    return subs.map(withIsActive);
  }

  async findOne(id: string) {
    const sub = await this.prisma.cloudSubscription.findUnique({
      where: { id },
      include: { client: { select: CLIENT_SELECT } },
    });

    if (!sub) {
      throw new NotFoundException(`CloudSubscription "${id}" not found`);
    }

    return withIsActive(sub);
  }

  async create(dto: CreateSubscriptionDto) {
    await this.clientsService.findOne(dto.clientId);

    const activatedAt = dto.activatedAt ? new Date(dto.activatedAt) : new Date();
    const expiresAt = addMonths(activatedAt, dto.planMonths);

    const sub = await this.prisma.cloudSubscription.create({
      data: {
        clientId: dto.clientId,
        serialNumber: dto.serialNumber,
        planMonths: dto.planMonths,
        activatedAt,
        expiresAt,
        notes: dto.notes,
      },
      include: { client: { select: CLIENT_SELECT } },
    });

    return withIsActive(sub);
  }

  async renew(id: string, dto: RenewSubscriptionDto) {
    const sub = await this.findOne(id);

    const base = sub.expiresAt > new Date() ? sub.expiresAt : new Date();
    const newExpiresAt = addMonths(base, dto.additionalMonths);

    const updated = await this.prisma.cloudSubscription.update({
      where: { id },
      data: { expiresAt: newExpiresAt },
      include: { client: { select: CLIENT_SELECT } },
    });

    return withIsActive(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cloudSubscription.delete({ where: { id } });
  }
}
