import { useNotificationStore } from "../../model/notification.store";
import { cn } from "@/lib/utils";
import { IoIosClose } from "react-icons/io";
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiInfo } from "react-icons/fi";
import { BiMessageRounded } from "react-icons/bi";
import type { Notification as NotificationType } from "../../lib/types/notification.types";

interface NotificationProps extends NotificationType {
  onClick?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ id, type, title, message, onClick }) => {
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  const icons = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
    chat: BiMessageRounded,
  };

  const colors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-500',
    error: 'bg-red-500/10 border-red-500/20 text-red-500',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    chat: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
  };

  const Icon = icons[type];

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm cursor-pointer hover:shadow-lg transition-all",
        colors[type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        {message && <p className="text-xs mt-1 opacity-80">{message}</p>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNotification(id);
        }}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <IoIosClose className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Notification;
