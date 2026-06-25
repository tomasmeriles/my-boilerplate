import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '~/hooks/api/use-notifications';
import { toast } from 'sonner';
import type { AppNotification } from '~/api/notifications/notifications.types';

export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    const token = getAuthToken();
    if (!token) return;

    const socket = io(`${window.location.origin}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('notification', (notification: AppNotification) => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast(notification.title, { description: notification.message });
    });

    socket.on('connect_error', (err) => {
      console.error('Notification socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);
}

function getAuthToken(): string {
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match && match[1] ? decodeURIComponent(match[1]) : '';
}
