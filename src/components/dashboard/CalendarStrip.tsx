import { format } from "date-fns";
import { Calendar, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[200px]">
        <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-3">Connect calendar to see events</p>
        <Button variant="outline" size="sm" onClick={onConnect}>
          Connect Calendar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Schedule</span>
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
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
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Schedule</span>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Events List */}
      <ScrollArea className="flex-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No events {showTomorrow ? 'tomorrow' : 'today'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timedEvents.map((event) => {
              const startTime = format(new Date(event.start), "h:mm a");
              const endTime = format(new Date(event.end), "h:mm a");
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left min-h-[44px]"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{startTime} – {endTime}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
