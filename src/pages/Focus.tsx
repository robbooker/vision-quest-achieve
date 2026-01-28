import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Target } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { SessionSetup } from '@/components/focus/SessionSetup';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { SessionComplete } from '@/components/focus/SessionComplete';
import { FocusHistory } from '@/components/focus/FocusHistory';
import { AmbientSounds } from '@/components/focus/AmbientSounds';
import { AudioErrorBoundary } from '@/components/focus/AudioErrorBoundary';
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
    pillar?: string;
  }) => {
    try {
      await createSession.mutateAsync({
        objective: data.objective,
        planned_duration_minutes: data.duration,
        linked_goal_id: data.linkedGoalId || null,
        linked_task_id: data.linkedTaskId || null,
        linked_big_ten_task_id: data.linkedBigTenTaskId || null,
        pillar: data.pillar || null,
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

  const handleExtendSession = async (additionalMinutes: number) => {
    if (!activeSession) return;

    try {
      const newDuration = activeSession.planned_duration_minutes + additionalMinutes;
      await updateSession.mutateAsync({
        id: activeSession.id,
        planned_duration_minutes: newDuration,
      });
      toast({
        title: `Extended by ${additionalMinutes} minutes`,
        description: `New planned duration: ${newDuration} minutes`,
      });
    } catch (error) {
      toast({
        title: 'Failed to extend session',
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
        {/* Main Content - Full width, no sidebar */}
        <div className="max-w-2xl mx-auto space-y-6">
          {viewState === 'setup' && (
            <>
              <SessionSetup
                onStart={handleStartSession}
                isStarting={createSession.isPending}
                sessions={sessions}
                todayMinutes={todayMinutes}
                todayCount={todayCompletedCount}
                streak={streak}
                onUpdateSession={handleUpdateSession}
                onResumeSession={() => setViewState('active')}
              />
              
              {/* Ambient Sounds - available anytime */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <AudioErrorBoundary fallback={<div className="text-sm text-muted-foreground">Audio temporarily unavailable</div>}>
                    <AmbientSounds 
                      isBreakMode={false}
                      shouldStop={false}
                    />
                  </AudioErrorBoundary>
                </CardContent>
              </Card>
            </>
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
                  onExtend={handleExtendSession}
                />
                
                {/* Ambient Sounds */}
                <div className="mt-6 pt-6 border-t">
                  <AudioErrorBoundary fallback={<div className="text-sm text-muted-foreground">Audio temporarily unavailable</div>}>
                    <AmbientSounds 
                      isBreakMode={false}
                      shouldStop={false}
                    />
                  </AudioErrorBoundary>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audio persists during break - shown separately */}
          {viewState === 'break' && (
            <Card className="mb-4">
              <CardContent className="pt-4 pb-4">
                <AudioErrorBoundary fallback={<div className="text-sm text-muted-foreground">Audio temporarily unavailable</div>}>
                  <AmbientSounds 
                    isBreakMode={true}
                    shouldStop={false}
                  />
                </AudioErrorBoundary>
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
                sessions={sessions}
                todayMinutes={todayMinutes}
                todayCount={todayCompletedCount}
                streak={streak}
                onUpdateSession={handleUpdateSession}
                onResumeSession={() => setViewState('active')}
              />
            </>
          )}
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
