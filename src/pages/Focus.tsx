import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Target, Timer, Flame } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionSetup } from '@/components/focus/SessionSetup';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { SessionComplete } from '@/components/focus/SessionComplete';
import { FocusHistory } from '@/components/focus/FocusHistory';
import { AmbientSounds } from '@/components/focus/AmbientSounds';
import { BreakTimer } from '@/components/focus/BreakTimer';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useToast } from '@/hooks/use-toast';

type ViewState = 'setup' | 'active' | 'complete' | 'break';

export default function Focus() {
  const { toast } = useToast();
  const [viewState, setViewState] = useState<ViewState>('setup');
  const [completedSessionData, setCompletedSessionData] = useState<{
    objective: string;
    plannedMinutes: number;
    actualMinutes: number;
  } | null>(null);

  const {
    sessions,
    activeSession,
    todayMinutes,
    todayCompletedCount,
    streak,
    createSession,
    completeSession,
    abandonSession,
    updateSession,
    isLoading,
  } = useFocusSessions();

  // If there's an active session on load, show the timer
  useEffect(() => {
    if (activeSession && viewState === 'setup') {
      setViewState('active');
    }
  }, [activeSession, viewState]);

  const handleStartSession = async (data: {
    objective: string;
    duration: number;
    linkedGoalId?: string;
    linkedTaskId?: string;
    linkedBigTenTaskId?: string;
  }) => {
    try {
      await createSession.mutateAsync({
        objective: data.objective,
        planned_duration_minutes: data.duration,
        linked_goal_id: data.linkedGoalId || null,
        linked_task_id: data.linkedTaskId || null,
        linked_big_ten_task_id: data.linkedBigTenTaskId || null,
      });
      setViewState('active');
      toast({
        title: 'Focus session started',
        description: 'Good luck! Stay focused.',
      });
    } catch (error) {
      toast({
        title: 'Failed to start session',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteSession = async (actualMinutes: number) => {
    if (!activeSession) return;

    setCompletedSessionData({
      objective: activeSession.objective,
      plannedMinutes: activeSession.planned_duration_minutes,
      actualMinutes,
    });
    setViewState('complete');
  };

  const handleSaveNotes = async (notes: string, rating: 'bad' | 'good' | 'great') => {
    if (!activeSession || !completedSessionData) return;

    try {
      await completeSession.mutateAsync({
        id: activeSession.id,
        actual_duration_minutes: completedSessionData.actualMinutes,
        notes: notes || null,
        rating,
      });
      toast({
        title: 'Session saved!',
        description: `Great work! ${completedSessionData.actualMinutes} minutes of focused work.`,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleCloseComplete = () => {
    setCompletedSessionData(null);
    setViewState('break');
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;

    try {
      await abandonSession.mutateAsync(activeSession.id);
      setViewState('setup');
      toast({
        title: 'Session cancelled',
        description: 'No worries, you can start a new session anytime.',
      });
    } catch (error) {
      toast({
        title: 'Failed to cancel session',
        variant: 'destructive',
      });
    }
  };

  const handleBreakComplete = () => {
    setViewState('setup');
    toast({
      title: 'Break over!',
      description: 'Ready for another focus session?',
    });
  };

  const handleUpdateSession = async (
    id: string, 
    data: { status: 'completed' | 'abandoned'; rating: 'bad' | 'good' | 'great' | null; notes: string | null }
  ) => {
    try {
      await updateSession.mutateAsync({
        id,
        status: data.status,
        rating: data.rating,
        notes: data.notes,
      });
      toast({
        title: 'Session updated',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Failed to update session',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Focus | Groovy Planning</title>
        <meta name="description" content="Deep focus work sessions with timer, ambient sounds, and progress tracking" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Focus Mode
            </h1>
            <p className="text-muted-foreground mt-1">
              Distraction-free deep work sessions
            </p>
          </div>

          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{todayMinutes}m</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{todayCompletedCount}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {streak > 0 && <Flame className="h-5 w-5 text-chart-1" />}
                {streak}
              </div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {viewState === 'setup' && (
              <SessionSetup
                onStart={handleStartSession}
                isStarting={createSession.isPending}
              />
            )}

            {viewState === 'active' && activeSession && (
              <Card>
                <CardContent className="pt-6">
                  <FocusTimer
                    plannedMinutes={activeSession.planned_duration_minutes}
                    objective={activeSession.objective}
                    startTime={new Date(activeSession.started_at)}
                    onComplete={handleCompleteSession}
                    onCancel={handleCancelSession}
                  />
                  
                  {/* Ambient Sounds */}
                  <div className="mt-6 pt-6 border-t">
                    <AmbientSounds 
                      isBreakMode={false}
                      shouldStop={false}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio persists during break - shown separately */}
            {viewState === 'break' && (
              <Card className="mb-4">
                <CardContent className="pt-4 pb-4">
                  <AmbientSounds 
                    isBreakMode={true}
                    shouldStop={false}
                  />
                </CardContent>
              </Card>
            )}

            {viewState === 'break' && (
              <>
                <BreakTimer
                  onClose={() => setViewState('setup')}
                  onBreakComplete={handleBreakComplete}
                />
                <SessionSetup
                  onStart={handleStartSession}
                  isStarting={createSession.isPending}
                />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FocusHistory
              sessions={sessions}
              todayMinutes={todayMinutes}
              todayCount={todayCompletedCount}
              streak={streak}
              onUpdateSession={handleUpdateSession}
              onResumeSession={() => setViewState('active')}
            />

            {/* Tips Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Focus Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Start with 25-minute sessions (Pomodoro)</p>
                <p>• Take short breaks between sessions</p>
                <p>• Link sessions to goals for tracking</p>
                <p>• Use ambient sounds to block distractions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {viewState === 'complete' && completedSessionData && (
        <SessionComplete
          objective={completedSessionData.objective}
          plannedMinutes={completedSessionData.plannedMinutes}
          actualMinutes={completedSessionData.actualMinutes}
          todayMinutes={todayMinutes + completedSessionData.actualMinutes}
          todaySessions={todayCompletedCount + 1}
          streak={streak}
          onSave={handleSaveNotes}
          onClose={handleCloseComplete}
        />
      )}
    </DashboardLayout>
  );
}
