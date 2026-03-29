import { Injectable, UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenWithUser } from '../interfaces/refresh-token.interface';

@Injectable()
export class RefreshTokensService {
  constructor(private readonly prisma: PrismaService) {}

  generate(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async store(token: string, userId: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { tokenHash: this.hash(token), userId, expiresAt },
    });
  }

  /**
   * Looks up a refresh token by hash and returns it with its user.
   * Throws UnauthorizedException if:
   *  - token not found
   *  - token expired
   *  - token revoked AND had a successor (reuse attack -> revokes all user tokens)
   *  - token revoked without successor (plain revoked, e.g. logout)
   */
  async consume(token: string): Promise<RefreshTokenWithUser> {
    const tokenHash = this.hash(token);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.revokedAt) {
      if (record.replacedBy) {
        // Token was already rotated - this is a reuse attack.
        // Revoke all tokens for this user to force re-login.
        await this.revokeAllForUser(record.userId);
      }
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (
      DateTime.fromJSDate(record.expiresAt, { zone: 'utc' }) < DateTime.utc()
    ) {
      throw new UnauthorizedException('Refresh token expired');
    }

    return record;
  }

  /**
   * Atomically revokes the old token (marking its successor) and stores the new one.
   */
  async rotate(
    oldToken: string,
    newToken: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    const oldHash = this.hash(oldToken);
    const newHash = this.hash(newToken);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { tokenHash: oldHash },
        data: { revokedAt: DateTime.utc().toJSDate(), replacedBy: newHash },
      }),
      this.prisma.refreshToken.create({
        data: { tokenHash: newHash, userId, expiresAt },
      }),
    ]);
  }

  async revoke(token: string): Promise<string | null> {
    const tokenHash = this.hash(token);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: DateTime.utc().toJSDate() },
    });
    return record?.userId ?? null;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: DateTime.utc().toJSDate() },
    });
  }
}
