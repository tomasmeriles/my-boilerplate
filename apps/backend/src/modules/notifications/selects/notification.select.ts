import { NotificationType } from '@prisma/client';

export const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  data: true,
  readAt: true,
  createdAt: true,
} as const;

export type NotificationPayload = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any | null;
  readAt: Date | null;
  createdAt: Date;
};
