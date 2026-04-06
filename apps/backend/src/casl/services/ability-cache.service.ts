import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import type { PackedAbility } from '../interfaces/ability.interface';
import { REDIS_CLIENT } from '../../redis/constants/redis.constants';

/** Seconds before a cached ability set expires. */
const ABILITY_CACHE_TTL_SECONDS = 60;

@Injectable()
export class AbilityCacheService {
  private readonly logger = new Logger(AbilityCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // Key format: abilities:{userId}:{tenantId|global}
  private key(userId: string, tenantId: string | null): string {
    return `abilities:${userId}:${tenantId ?? 'global'}`;
  }

  async get(
    userId: string,
    tenantId: string | null,
  ): Promise<PackedAbility[] | null> {
    try {
      const raw = await this.redis.get(this.key(userId, tenantId));
      if (!raw) return null;
      return JSON.parse(raw) as PackedAbility[];
    } catch (err) {
      this.logger.warn(`Redis GET failed: ${String(err)}`);
      return null;
    }
  }

  async set(
    userId: string,
    tenantId: string | null,
    rules: PackedAbility[],
  ): Promise<void> {
    try {
      await this.redis.set(
        this.key(userId, tenantId),
        JSON.stringify(rules),
        'EX',
        ABILITY_CACHE_TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn(`Redis SET failed: ${String(err)}`);
    }
  }

  /**
   * Invalidates a specific (userId, tenantId) pair.
   * Call this when a user's role in a tenant changes.
   */
  async del(userId: string, tenantId: string | null): Promise<void> {
    try {
      await this.redis.del(this.key(userId, tenantId));
    } catch (err) {
      this.logger.warn(`Redis DEL failed: ${String(err)}`);
    }
  }

  /**
   * Invalidates ALL cached abilities for a user across all tenants.
   * Call this on logout or when globalRole changes.
   */
  async delAll(userId: string): Promise<void> {
    try {
      const pattern = `abilities:${userId}:*`;
      // SCAN is safe for production; avoids KEYS blocking
      const keys = await this.scanKeys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Redis DEL ALL failed: ${String(err)}`);
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, found] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...found);
    } while (cursor !== '0');
    return keys;
  }
}
