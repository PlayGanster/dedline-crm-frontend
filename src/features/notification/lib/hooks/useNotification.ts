import { useNotificationStore } from '../../model/notification.store';

export const useNotification = () => {
  const { success, error, warning, info, chat, removeNotification } = useNotificationStore();

  return {
    success,
    error,
    warning,
    info,
    chat,
    dismiss: removeNotification,
  };
};
