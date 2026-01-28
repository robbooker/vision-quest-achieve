import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCycles } from '@/hooks/useCycles';
import { useGoals } from '@/hooks/useGoals';
import { useDailyTactics } from '@/hooks/useDailyTactics';
import { useTacticLogs } from '@/hooks/useTacticLogs';
import { useTodaySchedules } from '@/hooks/useGoalSchedules';
import { useResetPreference } from '@/hooks/useResetPreference';
import { HabitItem } from '@/components/dashboard/HabitItem';
import { DailyScoreLogger } from '@/components/dashboard/DailyScoreLogger';
import { QuickTaskList } from '@/components/dashboard/QuickTaskList';
import { DailyPnLLogger } from '@/components/dashboard/DailyPnLLogger';
import { CompactResetCard } from '@/components/reset/CompactResetCard';
import { PrimedWeeklySummaryWidget } from '@/components/primed/PrimedWeeklySummaryWidget';

import { TodaySchedule, CalendarEventData } from '@/components/dashboard/TodaySchedule';
import { AddCalendarEventDialog } from '@/components/dashboard/AddCalendarEventDialog';
import { EditCalendarEventDialog } from '@/components/dashboard/EditCalendarEventDialog';
import { useCalendarConnection, useCalendarEvents } from '@/hooks/useCalendar';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Repeat,
  Clock,
  CheckCircle2,
  Circle,
  Thermometer,
  MoreHorizontal,
  Bird
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSickDays } from '@/hooks/useSickDays';
import { useToast } from '@/hooks/use-toast';

export default function Today() {
  const navigate = useNavigate();
  const { getActiveCycle, getCurrentWeekNumber, isLoading: cyclesLoading } = useCycles();
  const activeCycle = getActiveCycle();
  const currentWeek = activeCycle ? getCurrentWeekNumber(activeCycle) : 0;
  
  const { goals } = useGoals(activeCycle?.id);
  const { toast } = useToast();
  
  // Reset preference
  const { isResetActive } = useResetPreference();

  // Sick days
  const { isTodaySickDay, toggleSickDay, isLoading: sickDaysLoading } = useSickDays();
  const todayIsSick = isTodaySickDay();

  // Calendar integration
  const { isConnected, isLoading: calendarConnecting, connect } = useCalendarConnection();
  const [showTomorrow, setShowTomorrow] = useState(false);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const selectedDate = showTomorrow ? tomorrow : today;
  
  const { events: calendarEvents, isLoading: eventsLoading, refetch: refetchEvents } = useCalendarEvents(
    startOfDay(selectedDate).toISOString(),
    endOfDay(selectedDate).toISOString()
  );

  // Get all daily tactics for goals in this cycle
  const goalIds = useMemo(() => goals.map(g => g.id), [goals]);
  const { data: allTactics = [] } = useDailyTactics(goalIds);
  
  // Get today's scheduled practice blocks (time-mastery goals)
  const { data: todaySchedules = [], isLoading: schedulesLoading } = useTodaySchedules();
  
  // Get today's tactic logs
  const { logs, upsertLog, getLogForTactic, getStreak } = useTacticLogs();
  
  // State for time-mastery practice completion (stored per-schedule in localStorage for now)
  const [practiceCompleted, setPracticeCompleted] = useState<Record<string, boolean>>(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const stored = localStorage.getItem(`practice_${today}`);
    return stored ? JSON.parse(stored) : {};
  });

  const handlePracticeToggle = (scheduleId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const newState = { ...practiceCompleted, [scheduleId]: !practiceCompleted[scheduleId] };
    setPracticeCompleted(newState);
    localStorage.setItem(`practice_${today}`, JSON.stringify(newState));
    
    const schedule = todaySchedules.find((s: any) => s.id === scheduleId);
    if (newState[scheduleId] && schedule?.goals?.title) {
      toast({ title: 'Practice session complete!', description: schedule.goals.title });
    }
  };

  const [addCalendarEventOpen, setAddCalendarEventOpen] = useState(false);
  const [editCalendarEventOpen, setEditCalendarEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);

  // Handle habit toggle/increment
  const handleHabitToggle = async (tacticId: string, newCount: number) => {
    try {
      const tactic = allTactics.find(t => t.id === tacticId);
      await upsertLog.mutateAsync({ 
        tacticId, 
        completedCount: newCount,
        tacticTitle: tactic?.title,
      });
      if (newCount > 0) {
        if (tactic && newCount >= tactic.target_count) {
          toast({ title: 'Habit completed!', description: tactic.title });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update habit', variant: 'destructive' });
    }
  };

  const handleCreateCalendarEvent = async (eventData: { title: string; date: Date; startTime: string; endTime: string }) => {
    const dateStr = format(eventData.date, 'yyyy-MM-dd');
    const startDateTime = new Date(`${dateStr}T${eventData.startTime}:00`).toISOString();
    const endDateTime = new Date(`${dateStr}T${eventData.endTime}:00`).toISOString();

    setIsCreatingEvent(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-create-event', {
        body: {
          action: 'create',
          title: eventData.title,
          startTime: startDateTime,
          endTime: endDateTime,
        },
      });

      if (error) throw error;

      toast({ title: 'Event added to calendar' });
      setAddCalendarEventOpen(false);
      refetchEvents();
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      toast({ title: 'Error', description: 'Failed to add event', variant: 'destructive' });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleEditEvent = (event: CalendarEventData) => {
    setEditingEvent(event);
    setEditCalendarEventOpen(true);
  };

  const handleUpdateCalendarEvent = async (eventId: string, eventData: { title: string; date: Date; startTime: string; endTime: string }) => {
    const dateStr = format(eventData.date, 'yyyy-MM-dd');
    const startDateTime = new Date(`${dateStr}T${eventData.startTime}:00`).toISOString();
    const endDateTime = new Date(`${dateStr}T${eventData.endTime}:00`).toISOString();

    setIsUpdatingEvent(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-create-event', {
        body: {
          action: 'update',
          eventId,
          title: eventData.title,
          startTime: startDateTime,
          endTime: endDateTime,
        },
      });

      if (error) throw error;

      toast({ title: 'Event updated' });
      setEditCalendarEventOpen(false);
      setEditingEvent(null);
      refetchEvents();
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      toast({ title: 'Error', description: 'Failed to update event', variant: 'destructive' });
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    setIsUpdatingEvent(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-create-event', {
        body: {
          action: 'delete',
          eventId,
        },
      });

      if (error) throw error;

      toast({ title: 'Event deleted' });
      setEditCalendarEventOpen(false);
      setEditingEvent(null);
      refetchEvents();
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  if (cyclesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!activeCycle) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Today</h1>
              <p className="text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Quick Task List - available without a cycle */}
          <QuickTaskList />

          {/* Prompt to create cycle for goal tracking */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No Active Cycle</h3>
              <p className="text-sm text-muted-foreground">
                Create a cycle from the dashboard to track habits and goals.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Today</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • Week {currentWeek}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => toggleSickDay.mutate({ date: new Date() })}
                  disabled={sickDaysLoading || toggleSickDay.isPending}
                  className="text-amber-600 dark:text-amber-400"
                >
                  <Thermometer className="h-4 w-4 mr-2" />
                  {todayIsSick ? 'Remove Sick Day' : 'Mark as Sick Day'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/birdwatching')}>
                  <Bird className="h-4 w-4 mr-2" />
                  Birdwatching
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Compact Reset Card - when reset is active */}
        {isResetActive && <CompactResetCard />}

        {/* Sick Day Banner */}
        {todayIsSick && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Thermometer className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">Sick Day Active</p>
                <p className="text-sm text-muted-foreground">All habits are optional today and won't affect your streaks</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSickDay.mutate({ date: new Date() })}
              className="border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            >
              Remove
            </Button>
          </div>
        )}

        {/* Daily Steps + Calendar Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Steps Section */}
          {(allTactics.length > 0 || todaySchedules.length > 0) ? (
            <Card className={`border-primary/20 ${todayIsSick ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-primary" />
                  Daily Steps
                  {todayIsSick && (
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                      Optional
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Time-Mastery Practice Blocks */}
                {!schedulesLoading && todaySchedules.length > 0 && (
                  <div className="space-y-2">
                    {todaySchedules.map((schedule: any) => {
                      const isComplete = practiceCompleted[schedule.id];
                      return (
                        <div 
                          key={schedule.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isComplete ? 'bg-green-500/10 border-green-500/30' : 'bg-card hover:bg-muted/50'
                          } transition-colors`}
                        >
                          <button
                            onClick={() => handlePracticeToggle(schedule.id)}
                            className="flex-shrink-0"
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isComplete ? 'text-green-700 dark:text-green-400' : ''}`}>
                              {schedule.duration_minutes} min practice
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                                <Clock className="h-3 w-3 mr-1" />
                                Time-Mastery
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {schedule.goals?.title || 'Goal'}
                              </Badge>
                            </div>
                          </div>
                          {schedule.start_time && (
                            <span className="text-xs text-muted-foreground">
                              {schedule.start_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Regular Daily Tactics */}
                {allTactics.map(tactic => {
                  const goal = goals.find(g => g.id === tactic.goal_id);
                  return (
                    <HabitItem
                      key={tactic.id}
                      tactic={tactic}
                      log={getLogForTactic(tactic.id)}
                      streak={getStreak(tactic.id, tactic.target_count)}
                      goalTitle={goal?.title || 'Unknown Goal'}
                      onToggle={handleHabitToggle}
                    />
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Repeat className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No daily steps set up yet</p>
              </CardContent>
            </Card>
          )}

          {/* Today's/Tomorrow's Schedule */}
          <TodaySchedule
            events={calendarEvents}
            isLoading={eventsLoading || calendarConnecting}
            isConnected={isConnected}
            onConnect={connect}
            onAddEvent={isConnected ? () => setAddCalendarEventOpen(true) : undefined}
            showTomorrow={showTomorrow}
            onToggleDay={() => setShowTomorrow(!showTomorrow)}
            onEditEvent={isConnected ? handleEditEvent : undefined}
            onDeleteEvent={isConnected ? handleDeleteCalendarEvent : undefined}
          />
        </div>

        {/* Task List + P&L Logger + PRIMED Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div data-tour="quick-tasks" className="md:col-span-2">
            <QuickTaskList />
          </div>
          <div className="space-y-6">
            <PrimedWeeklySummaryWidget />
            <DailyPnLLogger />
          </div>
        </div>

        {/* Daily Score Logger */}
        <DailyScoreLogger goals={goals} />
      </div>

      {/* Add Calendar Event Dialog */}
      <AddCalendarEventDialog
        open={addCalendarEventOpen}
        onOpenChange={setAddCalendarEventOpen}
        onSubmit={handleCreateCalendarEvent}
        isLoading={isCreatingEvent}
      />

      {/* Edit Calendar Event Dialog */}
      <EditCalendarEventDialog
        open={editCalendarEventOpen}
        onOpenChange={setEditCalendarEventOpen}
        event={editingEvent}
        onUpdate={handleUpdateCalendarEvent}
        onDelete={handleDeleteCalendarEvent}
        isLoading={isUpdatingEvent}
      />
    </DashboardLayout>
  );
}
