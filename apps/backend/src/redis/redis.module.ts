import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/services/config.service';
import { REDIS_CLIENT } from './redis.constants';

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
          enableOfflineQueue: false,
          maxRetriesPerRequest: null,
          retryStrategy: (times) =>
            times > 5 ? null : Math.min(times * 200, 2_000),
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
