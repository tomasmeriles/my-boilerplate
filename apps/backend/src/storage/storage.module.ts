import { Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { CacheHost } from '../common/cache/services/cache-host.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/services/config.service';
import { RedisModule } from '../redis/redis.module';
import { S3_CLIENT } from './constants/storage.constants';
import { ImageProcessingService } from './services/image-processing.service';
import { StorageService } from './services/storage.service';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): S3Client => {
        const endpoint = config.get('S3_ENDPOINT');
        return new S3Client({
          region: config.get('S3_REGION'),
          credentials: {
            accessKeyId: config.get('S3_ACCESS_KEY_ID'),
            secretAccessKey: config.get('S3_SECRET_ACCESS_KEY'),
          },
          ...(endpoint ? { endpoint } : {}),
          forcePathStyle: config.get('S3_FORCE_PATH_STYLE'),
        });
      },
    },
    CacheHost,
    StorageService,
    ImageProcessingService,
  ],
  exports: [CacheHost, StorageService, ImageProcessingService],
})
export class StorageModule {}
