import { format } from "date-fns";
import { Calendar, Clock, ExternalLink, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarEventData {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  htmlLink?: string;
}

interface TodayScheduleProps {
  events: CalendarEventData[];
  isLoading: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onAddEvent?: () => void;
  showTomorrow?: boolean;
  onToggleDay?: () => void;
}

export function TodaySchedule({ events, isLoading, isConnected, onConnect, onAddEvent, showTomorrow = false, onToggleDay }: TodayScheduleProps) {
  const scheduleLabel = showTomorrow ? "Tomorrow's Schedule" : "Today's Schedule";
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {scheduleLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              Connect your Google Calendar to see today's events
            </p>
            <Button variant="outline" size="sm" onClick={onConnect}>
              Connect Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {scheduleLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Separate all-day events
  const allDayEvents = sortedEvents.filter(e => e.allDay);
  const timedEvents = sortedEvents.filter(e => !e.allDay);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {scheduleLabel}
              {events.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({events.length} event{events.length !== 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {onToggleDay && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleDay}>
                {showTomorrow ? "Today" : "Tomorrow"}
              </Button>
            )}
            {onAddEvent && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddEvent}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No events scheduled for today
          </p>
        ) : (
          <div className="space-y-2">
            {allDayEvents.length > 0 && (
              <div className="mb-3">
                {allDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/50 text-sm"
                  >
                    <span className="text-xs text-muted-foreground font-medium">All day</span>
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
              </div>
            )}
            
            {timedEvents.map((event) => {
              const startTime = format(new Date(event.start), "h:mm a");
              const endTime = format(new Date(event.end), "h:mm a");
              
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 py-1.5 group"
                >
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[70px]">
                    <Clock className="h-3 w-3" />
                    {startTime}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {startTime} - {endTime}
                    </p>
                  </div>
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}