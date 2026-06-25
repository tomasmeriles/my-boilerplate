import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '~/api/notifications/notifications.api';
import type { AppNotification } from '~/api/notifications/notifications.types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly?: boolean) => [...notificationKeys.all, 'list', { unreadOnly }] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

export function useNotifications(unreadOnly?: boolean) {
  return useQuery<AppNotification[]>({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: () => notificationsApi.list(unreadOnly),
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
