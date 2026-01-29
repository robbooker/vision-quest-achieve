import { format } from "date-fns";
import { Calendar, Clock, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface CalendarEventData {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  htmlLink?: string;
}

interface CalendarStripProps {
  events: CalendarEventData[];
  isLoading: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onAddEvent?: () => void;
  showTomorrow?: boolean;
  onToggleDay?: () => void;
  onEventClick?: (event: CalendarEventData) => void;
}

export function CalendarStrip({ 
  events, 
  isLoading, 
  isConnected, 
  onConnect, 
  onAddEvent, 
  showTomorrow = false, 
  onToggleDay,
  onEventClick 
}: CalendarStripProps) {
  if (!isConnected) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Connect calendar to see events</span>
        </div>
        <Button variant="outline" size="sm" onClick={onConnect}>
          Connect
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Separate all-day events and timed events
  const timedEvents = sortedEvents.filter(e => !e.allDay);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Schedule</span>
      </div>
      
      <div className="flex-1 min-w-0">
        {events.length === 0 ? (
          <span className="text-sm text-muted-foreground">No events today</span>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex items-center gap-4">
              {timedEvents.slice(0, 5).map((event) => {
                const startTime = format(new Date(event.start), "h:mm a");
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="flex items-center gap-2 flex-shrink-0 hover:bg-muted/50 rounded px-2 py-1 -my-1 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{startTime}</span>
                    <span className="text-sm truncate max-w-[200px]">{event.title}</span>
                  </button>
                );
              })}
              {timedEvents.length > 5 && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  +{timedEvents.length - 5} more
                </span>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onAddEvent && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddEvent}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {onToggleDay && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs gap-1" 
            onClick={onToggleDay}
          >
            {showTomorrow ? "TODAY" : "TOMORROW"}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
