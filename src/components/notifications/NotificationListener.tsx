import { useSharedTasksRealtime } from "@/hooks/useSharedTasksRealtime";
import { useToastNotification } from "./ToastProvider";

export function NotificationListener() {
  const { showToast } = useToastNotification();
  
  useSharedTasksRealtime((notification) => {
    showToast({
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });
  });

  return null;
}
