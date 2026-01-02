import { Bell, Check, CheckCheck, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "task_shared":
      return <Share2 className="h-4 w-4 text-primary" />;
    case "task_completed":
      return <Check className="h-4 w-4 text-green-500" />;
    case "friend_request":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  return (
    <DropdownMenuItem
      className={cn(
        "flex items-start gap-3 p-3 cursor-pointer",
        !notification.read && "bg-accent/50"
      )}
      onClick={onRead}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.read && "font-medium")}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </DropdownMenuItem>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => {
                if (!notification.read) {
                  markAsRead.mutate(notification.id);
                }
              }}
            />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
