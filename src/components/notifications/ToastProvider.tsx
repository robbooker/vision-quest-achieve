import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastNotification } from "./ToastNotification";
import { Check, Share2, UserPlus, Bell } from "lucide-react";

interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToastNotification() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastNotification must be used within ToastProvider");
  }
  return context;
}

function getToastIcon(type: string) {
  switch (type) {
    case "task_shared":
      return <Share2 className="h-4 w-4 text-amber-900 dark:text-amber-100" />;
    case "task_completed":
      return <Check className="h-4 w-4 text-amber-900 dark:text-amber-100" />;
    case "friend_request":
      return <UserPlus className="h-4 w-4 text-amber-900 dark:text-amber-100" />;
    default:
      return <Bell className="h-4 w-4 text-amber-900 dark:text-amber-100" />;
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            title={toast.title}
            message={toast.message}
            icon={getToastIcon(toast.type)}
            onClose={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
