import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { ConfigService } from '../../../config/services/config.service';
import { RegisterPushDto } from '../dto/register-push.dto';

interface PushPayload {
  title: string;
  body: string;
}

@Injectable()
export class PushSubscriptionsService
  extends TransactionalService
  implements OnModuleInit
{
  private readonly logger = new Logger(PushSubscriptionsService.name);
  private enabled = false;

  constructor(private readonly config: ConfigService) {
    super();
  }

  onModuleInit() {
    const publicKey = this.config.get('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get('VAPID_PRIVATE_KEY');
    const email = this.config.get('VAPID_CONTACT_EMAIL');

    if (publicKey && privateKey && email) {
      webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
      this.enabled = true;
      this.logger.log('Web Push enabled');
    } else {
      this.logger.warn(
        'VAPID keys not configured - push notifications disabled',
      );
    }
  }

  async register(userId: string, dto: RegisterPushDto): Promise<void> {
    await this.db.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { p256dh: dto.p256dh, auth: dto.auth },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
    });
  }

  async unregister(userId: string, endpoint: string): Promise<void> {
    await this.db.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;

    // Use this.prisma directly — sendToUser is a fire-and-forget side effect that must
    // never inherit an outer transaction context (the tx may already be committed by the
    // time this runs, causing P2028 "Transaction already closed").
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const staleEndpoints: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          );
        } catch (err: any) {
          // 410 Gone = subscription expired, clean it up
          if (err?.statusCode === 410) {
            staleEndpoints.push(sub.endpoint);
          } else {
            this.logger.error(
              `Push send failed for ${sub.endpoint}: ${err?.message}`,
            );
          }
        }
      }),
    );

    if (staleEndpoints.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } },
      });
    }
  }
}
