import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import { TransactionalService } from '../../common/base/transactional-service.base';
import { Transactional } from '../../common/decorators/transactional.decorator';
import { RefreshTokenWithUser } from '../interfaces/refresh-token.interface';

@Injectable()
export class RefreshTokensService extends TransactionalService {
  generate(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async store(token: string, userId: string, expiresAt: Date): Promise<void> {
    await this.db.refreshToken.create({
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
    const record = await this.db.refreshToken.findUnique({
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
  @Transactional()
  async rotate(
    oldToken: string,
    newToken: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    const oldHash = this.hash(oldToken);
    const newHash = this.hash(newToken);

    try {
      await this.db.refreshToken.update({
        where: { tokenHash: oldHash, revokedAt: null },
        data: { revokedAt: DateTime.utc().toJSDate(), replacedBy: newHash },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        // Another concurrent request already rotated this token
        throw new UnauthorizedException('Refresh token already used');
      }
      throw err;
    }
    await this.db.refreshToken.create({
      data: { tokenHash: newHash, userId, expiresAt },
    });
  }

  async revoke(token: string): Promise<string | null> {
    const tokenHash = this.hash(token);
    const record = await this.db.refreshToken.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
    await this.db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: DateTime.utc().toJSDate() },
    });
    return record?.userId ?? null;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: DateTime.utc().toJSDate() },
    });
  }
}
