import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastNotificationProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function ToastNotification({
  title,
  message,
  icon,
  onClose,
  className,
}: ToastNotificationProps) {
  return (
    <div
      className={cn(
        // Toast bread shape - rounded top like bread, flat bottom
        "relative w-80 p-4 rounded-t-[40%] rounded-b-md",
        // Warm toast colors with gradient
        "bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400",
        "dark:from-amber-600 dark:via-amber-700 dark:to-amber-800",
        // Border like crust
        "border-2 border-amber-500 dark:border-amber-900",
        // Shadow for depth
        "shadow-lg shadow-amber-900/20",
        // Animation
        "animate-toast-pop",
        className
      )}
    >
      {/* Grain texture overlay */}
      <div 
        className="absolute inset-0 rounded-t-[40%] rounded-b-md opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Butter pat accent */}
      <div className="absolute top-3 left-4 w-6 h-4 bg-yellow-300 dark:bg-yellow-400 rounded-sm transform -rotate-6 shadow-sm" />
      
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-500/30 transition-colors"
        >
          <X className="h-4 w-4 text-amber-900 dark:text-amber-100" />
        </button>
      )}
      
      {/* Content */}
      <div className="relative flex items-start gap-3 mt-2 ml-8">
        {icon && (
          <div className="flex-shrink-0 p-1.5 bg-amber-100/50 dark:bg-amber-900/50 rounded-full">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
            {title}
          </p>
          {message && (
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5 line-clamp-2">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
