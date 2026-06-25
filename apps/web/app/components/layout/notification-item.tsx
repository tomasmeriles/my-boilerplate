import { Bell } from 'lucide-react';
import { cn } from '~/lib/utils';
import { fromNow } from '~/lib/datetime';
import type { AppNotification } from '~/api/notifications/notifications.types';

interface NotificationItemProps {
  notification: AppNotification;
  onRead: () => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const Icon = Bell;

  const handleClick = () => {
    if (!notification.readAt) {
      onRead();
    }
  };

  const title = notification.title;
  const message = notification.message;

  return (
    <div
      className={cn(
        'cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50',
        !notification.readAt && 'bg-muted/30',
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">
            {title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {message}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {fromNow(notification.createdAt)}
          </p>
        </div>
        {!notification.readAt && (
          <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </div>
  );
}
