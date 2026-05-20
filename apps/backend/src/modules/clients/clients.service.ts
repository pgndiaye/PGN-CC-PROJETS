import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const QR_BASE_URL = 'https://app.ezvizsenegal.sn/clients';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    return this.prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client "${id}" not found`);
    }

    return client;
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }

  async generateQrDataUrl(id: string) {
    await this.findOne(id);
    const url = `${QR_BASE_URL}/${id}`;
    const qrDataUrl = await QRCode.toDataURL(url);
    return { qrDataUrl };
  }
}
