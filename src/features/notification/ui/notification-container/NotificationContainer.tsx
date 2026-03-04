import { useNotificationStore } from "../../model/notification.store";
import Notification from "../notification/Notification";

const NotificationContainer = () => {
  const notifications = useNotificationStore((state) => state.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <div className="pointer-events-auto" key={notification.id}>
          <Notification {...notification} onClick={notification.onClick} />
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
