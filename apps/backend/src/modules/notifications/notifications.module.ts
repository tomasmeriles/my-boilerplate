import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '../../config/services/config.service';
import { NotificationsService } from './services/notifications.service';
import { PushSubscriptionsService } from './services/push-subscriptions.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsGateway } from './gateway/notifications.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PushSubscriptionsService,
    NotificationsGateway,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
