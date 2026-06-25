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

  // Key format: abilities:{userId}
  // One entry per user, covering all of their tenant memberships at once -
  // there is no per-tenant variant to avoid resolving "which tenant" from
  // anything other than the resource being accessed.
  private key(userId: string): string {
    return `abilities:${userId}`;
  }

  async get(userId: string): Promise<PackedAbility[] | null> {
    try {
      const raw = await this.redis.get(this.key(userId));
      if (!raw) return null;
      return JSON.parse(raw) as PackedAbility[];
    } catch (err) {
      this.logger.warn(`Redis GET failed: ${String(err)}`);
      return null;
    }
  }

  async set(userId: string, rules: PackedAbility[]): Promise<void> {
    try {
      await this.redis.set(
        this.key(userId),
        JSON.stringify(rules),
        'EX',
        ABILITY_CACHE_TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn(`Redis SET failed: ${String(err)}`);
    }
  }

  /**
   * Invalidates the cached abilities for a user.
   * Call this on logout or when any of the user's roles/memberships change.
   */
  async del(userId: string): Promise<void> {
    try {
      await this.redis.del(this.key(userId));
    } catch (err) {
      this.logger.warn(`Redis DEL failed: ${String(err)}`);
    }
  }
}
