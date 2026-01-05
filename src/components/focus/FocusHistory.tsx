import { format } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FocusSession } from '@/hooks/useFocusSessions';

interface FocusHistoryProps {
  sessions: FocusSession[];
  todayMinutes: number;
  todayCount: number;
  streak: number;
}

export function FocusHistory({ sessions, todayMinutes, todayCount, streak }: FocusHistoryProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const todaySessions = sessions.filter(s => 
    format(new Date(s.started_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Sessions
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3 pb-3 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatDuration(todayMinutes)}</div>
            <div className="text-xs text-muted-foreground">Focused</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              streak >= 7 ? "text-chart-1" : streak >= 3 ? "text-chart-3" : "text-foreground"
            )}>
              {streak}
            </div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {/* Session List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {todaySessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No focus sessions today yet.
                <br />
                Start one to build your streak!
              </p>
            ) : (
              todaySessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {session.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5" />
                  ) : session.status === 'abandoned' ? (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  ) : (
                    <Target className="h-5 w-5 text-primary animate-pulse mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.objective}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{format(new Date(session.started_at), 'h:mm a')}</span>
                      <span>•</span>
                      <span>
                        {session.actual_duration_minutes 
                          ? `${session.actual_duration_minutes}m` 
                          : `${session.planned_duration_minutes}m planned`}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        "{session.notes}"
                      </p>
                    )}
                  </div>

                  <Badge
                    variant={session.status === 'completed' ? 'default' : 'secondary'}
                    className={cn(
                      "text-xs",
                      session.status === 'abandoned' && "bg-destructive/10 text-destructive"
                    )}
                  >
                    {session.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
