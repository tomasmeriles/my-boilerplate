import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/services/config.service';
import { REDIS_CLIENT } from './constants/redis.constants';
import { RedisLifecycleService } from './services/redis-lifecycle.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        return new Redis(config.get('REDIS_URL'), {
          lazyConnect: true,
          connectTimeout: 5_000,
          commandTimeout: 5_000,
          enableOfflineQueue: true,
          maxRetriesPerRequest: null,
          retryStrategy: (times) =>
            times > 5 ? null : Math.min(times * 200, 2_000),
        });
      },
    },
    RedisLifecycleService,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
