import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../redis/constants/redis.constants';

@Injectable()
export class CacheHost {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async wrap<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }

    const result = await fn();
    await this.redis.set(key, JSON.stringify(result), 'EX', ttl);
    return result;
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
