import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMilestones } from '@/hooks/useMilestones';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { useCalendarConnection, useCalendarEvents, useUserPreferences, useCalendarAvailability } from '@/hooks/useCalendar';
import { Goal } from '@/hooks/useGoals';
import { Cycle } from '@/hooks/useCycles';
import { format, addWeeks, startOfDay, endOfDay, addDays } from 'date-fns';
import { Target, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface WeekViewProps {
  cycle: Cycle;
  goals: Goal[];
  currentWeek: number;
}

export function WeekView({ cycle, goals, currentWeek }: WeekViewProps) {
  const weekStart = addWeeks(new Date(cycle.start_date), currentWeek - 1);
  const weekEnd = addWeeks(weekStart, 1);

  // Calendar integration
  const { isConnected, isLoading: connectionLoading, connect, isConnecting } = useCalendarConnection();
  const { preferences, isLoading: prefsLoading } = useUserPreferences();
  
  // Fetch calendar events for the week
  const timeMin = startOfDay(weekStart).toISOString();
  const timeMax = endOfDay(addDays(weekEnd, -1)).toISOString();
  const { events, isLoading: eventsLoading, error: eventsError } = useCalendarEvents(
    isConnected ? timeMin : '',
    isConnected ? timeMax : ''
  );

  // Calculate busy hours for the week
  const busyHours = useMemo(() => {
    if (!events.length) return 0;
    return events
      .filter(e => !e.allDay)
      .reduce((total, event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
  }, [events]);

  // Calculate work hours for the week
  const workHoursPerDay = preferences.work_end_hour - preferences.work_start_hour;
  const totalWorkHours = workHoursPerDay * 5; // 5 work days
  const availableHours = Math.max(0, totalWorkHours - busyHours);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Week {currentWeek} of 6
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Status */}
        {connectionLoading ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking calendar connection...</span>
          </div>
        ) : !isConnected ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-dashed">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Connect calendar to see availability
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={connect} disabled={isConnecting}>
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        ) : eventsLoading ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading calendar events...</span>
          </div>
        ) : eventsError ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              {eventsError === 'RECONNECT_REQUIRED' 
                ? 'Calendar needs to be reconnected' 
                : 'Failed to load calendar'}
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Week Availability</span>
              </div>
              <Badge variant="secondary">
                {events.length} events
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {availableHours.toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">
                  {busyHours.toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground">Busy</p>
              </div>
            </div>
          </div>
        )}

        {/* Goals for this week */}
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals set for this cycle yet.
          </p>
        ) : (
          goals.map((goal) => (
            <WeekGoalItem key={goal.id} goal={goal} currentWeek={currentWeek} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface WeekGoalItemProps {
  goal: Goal;
  currentWeek: number;
}

function WeekGoalItem({ goal, currentWeek }: WeekGoalItemProps) {
  const { milestones, isLoading: milestonesLoading } = useMilestones(goal.id);
  
  // Detect score-based goals
  const isScoreBased = goal.metric_type.toLowerCase().includes('score');
  
  // For score-based goals, use actual logged progress
  const { actualValue, progressPercent: actualProgress, isLoading: progressLoading } = 
    useGoalProgress(goal.id, goal.target_value, goal.metric_type);
  
  const currentMilestone = useMemo(() => 
    milestones.find(m => m.week_number === currentWeek),
    [milestones, currentWeek]
  );

  const cumulativeTarget = useMemo(() => 
    milestones
      .filter(m => m.week_number <= currentWeek)
      .reduce((sum, m) => sum + m.target_value, 0),
    [milestones, currentWeek]
  );

  // Use appropriate progress calculation based on goal type
  const milestoneProgress = goal.target_value > 0 
    ? Math.round((cumulativeTarget / goal.target_value) * 100)
    : 0;
  const displayProgress = isScoreBased ? actualProgress : milestoneProgress;

  const isLoading = milestonesLoading || (isScoreBased && progressLoading);

  if (isLoading) {
    return (
      <div className="animate-pulse h-16 bg-muted rounded-lg" />
    );
  }

  // For score-based goals, we don't need milestones - show actual progress
  if (isScoreBased) {
    return (
      <div className="space-y-2 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{goal.title}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.min(displayProgress, 100)}% of goal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={Math.min(displayProgress, 100)} className="flex-1 h-2" />
        </div>
        <p className="text-sm text-muted-foreground">
          Avg score: <span className="font-medium text-foreground">
            {actualValue.toFixed(1)}
          </span> / target {goal.target_value}
        </p>
      </div>
    );
  }

  if (!currentMilestone) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30">
        <Target className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium text-sm">{goal.title}</p>
          <p className="text-xs text-muted-foreground">
            No milestones planned yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{goal.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {displayProgress}% of goal
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={displayProgress} className="flex-1 h-2" />
      </div>
      <p className="text-sm text-muted-foreground">
        Target this week: <span className="font-medium text-foreground">
          {currentMilestone.target_value.toLocaleString()} {goal.metric_type}
        </span>
      </p>
    </div>
  );
}
