export type NotificationType = string;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}
