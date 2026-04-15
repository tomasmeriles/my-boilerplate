import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/services/config.service';

/**
 * Global module that bootstraps the BullMQ connection once using the app's
 * REDIS_URL. Import it in AppModule - feature modules then use
 * BullModule.registerQueue() directly without worrying about the connection.
 *
 * @example
 * // In a feature module:
 * @Module({
 *   imports: [BullModule.registerQueue({ name: 'emails' })],
 *   providers: [EmailQueueService, EmailProcessor],
 * })
 * export class EmailModule {}
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get('REDIS_URL'),
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1_000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
