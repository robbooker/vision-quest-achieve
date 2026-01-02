import { Check, CheckCheck, Share2, UserPlus } from "lucide-react";
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

// Toast-shaped icon component
function ToastIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Toast bread shape - rounded top, flat bottom */}
      <path
        d="M4 8C4 4.5 7 3 12 3C17 3 20 4.5 20 8V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V8Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Crust outline */}
      <path
        d="M4 8C4 4.5 7 3 12 3C17 3 20 4.5 20 8V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Butter pat */}
      <rect
        x="9"
        y="10"
        width="6"
        height="4"
        rx="0.5"
        className="fill-yellow-400 dark:fill-yellow-300"
      />
    </svg>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "task_shared":
      return <Share2 className="h-4 w-4 text-primary" />;
    case "task_completed":
      return <Check className="h-4 w-4 text-green-500" />;
    case "friend_request":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    default:
      return <ToastIcon className="h-4 w-4 text-muted-foreground" />;
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
          <ToastIcon className="h-5 w-5 text-amber-700 dark:text-amber-400" />
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
