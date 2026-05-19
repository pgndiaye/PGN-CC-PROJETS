import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserPayload, AuthTokens, UserRole } from '@ezviz/types';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; role: Role } | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<AuthTokens & { user: { id: string; email: string; role: Role } }> {
    const payload: UserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return { accessToken, refreshToken, user };
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    let payload: UserPayload;

    try {
      payload = this.jwtService.verify<UserPayload>(token, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role as UserRole } satisfies UserPayload,
      {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      },
    );

    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
  }
}
