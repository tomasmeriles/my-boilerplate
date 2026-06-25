import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationType } from '@prisma/client';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import {
  notificationSelect,
  type NotificationPayload,
} from '../selects/notification.select';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationsGateway } from '../gateway/notifications.gateway';
import { PushSubscriptionsService } from './push-subscriptions.service';

@Injectable()
export class NotificationsService extends TransactionalService {
  constructor(
    private readonly gateway: NotificationsGateway,
    private readonly push: PushSubscriptionsService,
  ) {
    super();
  }

  async create(dto: CreateNotificationDto): Promise<NotificationPayload> {
    const notification = (await this.db.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data ?? Prisma.JsonNull,
      },
      select: notificationSelect,
    })) as NotificationPayload;

    this.gateway.sendToUser(dto.userId, notification);
    void this.push.sendToUser(dto.userId, {
      title: dto.title,
      body: dto.message,
    });

    return notification;
  }

  async findMany(
    userId: string,
    opts?: { unreadOnly?: boolean },
  ): Promise<NotificationPayload[]> {
    return (await this.db.notification.findMany({
      where: {
        userId,
        ...(opts?.unreadOnly ? { readAt: null } : {}),
      },
      select: notificationSelect,
      orderBy: { createdAt: 'desc' },
    })) as NotificationPayload[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.db.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}
