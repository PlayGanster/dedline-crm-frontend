export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'chat';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClick?: () => void;
}
