import { apiClient } from '~/lib/axios';
import type { AppNotification } from './notifications.types';

export interface PushSubscriptionDto {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    apiClient
      .get<AppNotification[]>('/notifications', {
        params: unreadOnly ? { unreadOnly } : {},
      })
      .then((r) => r.data),

  getUnreadCount: () =>
    apiClient
      .get<{ count: number }>('/notifications/unread-count')
      .then((r) => r.data.count),

  markAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then(() => {}),

  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all').then(() => {}),

  registerPush: (dto: PushSubscriptionDto) =>
    apiClient.post('/notifications/push-subscriptions', dto).then(() => {}),

  unregisterPush: (endpoint: string) =>
    apiClient
      .delete('/notifications/push-subscriptions', { data: { endpoint } })
      .then(() => {}),
};
