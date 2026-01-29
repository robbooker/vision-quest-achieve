import { format } from "date-fns";
import { Calendar, Clock, ExternalLink, Plus, MoreHorizontal, Pencil, Trash2, Hexagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useCalendarEventPillars } from "@/hooks/useCalendarEventPillars";

const PRIMED_PILLARS = [
  { value: 'physical', label: 'Physical', color: 'bg-red-500/20 text-red-700 dark:text-red-400' },
  { value: 'relations', label: 'Relations', color: 'bg-pink-500/20 text-pink-700 dark:text-pink-400' },
  { value: 'income', label: 'Income', color: 'bg-green-500/20 text-green-700 dark:text-green-400' },
  { value: 'mental', label: 'Mental', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
  { value: 'excellence', label: 'Excellence', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400' },
  { value: 'direction', label: 'Direction', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
  { value: 'spiritual', label: 'Spiritual', color: 'bg-violet-500/20 text-violet-700 dark:text-violet-400' },
];

export interface CalendarEventData {
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
  onEditEvent?: (event: CalendarEventData) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export function TodaySchedule({ events, isLoading, isConnected, onConnect, onAddEvent, showTomorrow = false, onToggleDay, onEditEvent, onDeleteEvent }: TodayScheduleProps) {
  const scheduleLabel = showTomorrow ? "Tomorrow's Schedule" : "Today's Schedule";
  const { getPillarForEvent, isManuallySet, setPillar } = useCalendarEventPillars();

  const getPillarBadge = (eventId: string, title: string) => {
    const pillar = getPillarForEvent(eventId, title);
    if (!pillar) return null;
    
    const pillarConfig = PRIMED_PILLARS.find(p => p.value === pillar);
    if (!pillarConfig) return null;
    
    const isManual = isManuallySet(eventId);
    
    return (
      <Badge 
        variant="secondary" 
        className={`text-[10px] h-4 px-1 ${pillarConfig.color} ${!isManual ? 'opacity-60' : ''}`}
        title={isManual ? 'Manually tagged' : 'Auto-detected'}
      >
        {pillarConfig.label.charAt(0)}
      </Badge>
    );
  };

  const renderPillarMenu = (eventId: string, title: string) => {
    const currentPillar = getPillarForEvent(eventId, title);
    
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          <Hexagon className="h-3 w-3 inline mr-1" />
          PRIMED Pillar
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setPillar.mutate({ calendarEventId: eventId, pillar: null })}>
          None
          {!currentPillar && ' ✓'}
        </DropdownMenuItem>
        {PRIMED_PILLARS.map((p) => (
          <DropdownMenuItem key={p.value} onClick={() => setPillar.mutate({ calendarEventId: eventId, pillar: p.value })}>
            {p.label}
            {currentPillar === p.value && ' ✓'}
          </DropdownMenuItem>
        ))}
      </>
    );
  };
  
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
                    className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/50 text-sm group"
                  >
                    <span className="text-xs text-muted-foreground font-medium">All day</span>
                    <span className="truncate flex-1">{event.title}</span>
                    {getPillarBadge(event.id, event.title)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditEvent && (
                          <DropdownMenuItem onClick={() => onEditEvent(event)}>
                            <Pencil className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDeleteEvent && (
                          <DropdownMenuItem onClick={() => onDeleteEvent(event.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                        {renderPillarMenu(event.id, event.title)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
            
            {timedEvents.map((event) => {
              const startTimeStr = format(new Date(event.start), "h:mm a");
              const endTimeStr = format(new Date(event.end), "h:mm a");
              
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 py-1.5 group"
                >
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[70px]">
                    <Clock className="h-3 w-3" />
                    {startTimeStr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm truncate">{event.title}</p>
                      {getPillarBadge(event.id, event.title)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {startTimeStr} - {endTimeStr}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditEvent && (
                          <DropdownMenuItem onClick={() => onEditEvent(event)}>
                            <Pencil className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDeleteEvent && (
                          <DropdownMenuItem onClick={() => onDeleteEvent(event.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                        {renderPillarMenu(event.id, event.title)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}