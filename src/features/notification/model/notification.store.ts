import { create } from 'zustand';
import type { Notification } from '../lib/types/notification.types';

interface NotificationState {
  notifications: Notification[];
  timers: Map<string, ReturnType<typeof setTimeout>>;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message?: string, options?: { duration?: number; onClick?: () => void }) => void;
  error: (title: string, message?: string, options?: { duration?: number; onClick?: () => void }) => void;
  warning: (title: string, message?: string, options?: { duration?: number; onClick?: () => void }) => void;
  info: (title: string, message?: string, options?: { duration?: number; onClick?: () => void }) => void;
  chat: (title: string, message?: string, options?: { duration?: number; onClick?: () => void }) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  timers: new Map(),

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      ...notification,
      duration: notification.duration ?? 5000
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    if (newNotification.duration && newNotification.duration > 0) {
      const timer = setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);

      set((state) => ({
        timers: new Map(state.timers).set(id, timer),
      }));
    }
  },

  removeNotification: (id) => {
    const timer = get().timers.get(id);
    if (timer) {
      clearTimeout(timer);
      set((state) => {
        const newTimers = new Map(state.timers);
        newTimers.delete(id);
        return { timers: newTimers };
      });
    }

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  success: (title, message, options) => {
    get().addNotification({ type: 'success', title, message, ...options });
  },

  error: (title, message, options) => {
    get().addNotification({ type: 'error', title, message, ...options });
  },

  warning: (title, message, options) => {
    get().addNotification({ type: 'warning', title, message, ...options });
  },

  info: (title, message, options) => {
    get().addNotification({ type: 'info', title, message, ...options });
  },

  chat: (title, message, options) => {
    get().addNotification({ type: 'chat', title, message, ...options });
  },
}));
