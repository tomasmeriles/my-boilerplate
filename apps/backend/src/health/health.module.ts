import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';

@Module({
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}
