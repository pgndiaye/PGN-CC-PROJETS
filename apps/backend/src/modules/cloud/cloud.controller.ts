import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CloudService } from './cloud.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RenewSubscriptionDto } from './dto/renew-subscription.dto';

@Controller('cloud')
@UseGuards(JwtAuthGuard)
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Get()
  findAll(
    @Query('clientId') clientId?: string,
    @Query('expiring') expiringDays?: string,
  ) {
    return this.cloudService.findAll({
      clientId,
      expiringWithinDays: expiringDays ? parseInt(expiringDays, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cloudService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  create(@Body() dto: CreateSubscriptionDto) {
    return this.cloudService.create(dto);
  }

  @Patch(':id/renew')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  renew(@Param('id') id: string, @Body() dto: RenewSubscriptionDto) {
    return this.cloudService.renew(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.cloudService.remove(id);
  }
}
