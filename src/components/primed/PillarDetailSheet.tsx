import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PILLARS, LEVEL_NAMES, PillarKey, PillarLevel, getBehaviorsForPillarAndLevel, LEVEL_DESCRIPTIONS } from '@/data/primedBehaviors';
import { Plus, Target, Repeat, Clock, FileText, Check, ArrowLeft, ArrowUp, Circle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCycles } from '@/hooks/useCycles';
import { CreateGoalDialog } from '@/components/dashboard/CreateGoalDialog';
import { format, subDays } from 'date-fns';

interface PillarDetailSheetProps {
  pillar: PillarKey | null;
  level: PillarLevel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PillarDetailSheet({ pillar, level, open, onOpenChange }: PillarDetailSheetProps) {
  const { user } = useAuth();
  const { getActiveCycle } = useCycles();
  const activeCycle = getActiveCycle();
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  const pillarInfo = pillar ? PILLARS[pillar] : null;
  
  // Get next level requirements
  const nextLevel = level < 3 ? (level + 1) as PillarLevel : null;
  const nextLevelBehaviors = pillar && nextLevel !== null ? getBehaviorsForPillarAndLevel(pillar, nextLevel) : [];

  // Fetch goals for this pillar
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['pillar-goals', user?.id, pillar, activeCycle?.id],
    queryFn: async () => {
      if (!user?.id || !pillar) return [];
      const { data } = await supabase
        .from('goals')
        .select('id, title, target_value, metric_type')
        .eq('user_id', user.id)
        .eq('pillar', pillar);
      return data || [];
    },
    enabled: !!user?.id && !!pillar && open,
  });

  // Fetch habits (tactics) for this pillar's goals
  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['pillar-habits', user?.id, pillar, goals?.map(g => g.id)],
    queryFn: async () => {
      if (!user?.id || !goals?.length) return [];
      const goalIds = goals.map(g => g.id);
      const { data } = await supabase
        .from('goal_tactics')
        .select('id, title, is_active, goal_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('goal_id', goalIds);
      return data || [];
    },
    enabled: !!user?.id && !!goals?.length && open,
  });

  // Fetch recent focus sessions for this pillar (last 7 days)
  const { data: focusSessions, isLoading: focusLoading } = useQuery({
    queryKey: ['pillar-focus', user?.id, pillar],
    queryFn: async () => {
      if (!user?.id || !pillar) return [];
      const sevenDaysAgo = subDays(new Date(), 7);
      const { data } = await supabase
        .from('focus_sessions')
        .select('id, objective, actual_duration_minutes, completed_at, status')
        .eq('user_id', user.id)
        .eq('pillar', pillar)
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id && !!pillar && open,
  });

  // Fetch quick tasks for this pillar
  const { data: quickTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['pillar-tasks', user?.id, pillar],
    queryFn: async () => {
      if (!user?.id || !pillar) return [];
      const { data } = await supabase
        .from('quick_tasks')
        .select('id, title, completed, due_date')
        .eq('user_id', user.id)
        .eq('pillar', pillar)
        .eq('completed', false)
        .order('position', { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id && !!pillar && open,
  });

  // Fetch notes for this pillar
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['pillar-notes', user?.id, pillar],
    queryFn: async () => {
      if (!user?.id || !pillar) return [];
      const { data } = await supabase
        .from('lists')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .eq('pillar', pillar)
        .order('updated_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id && !!pillar && open,
  });

  const isLoading = goalsLoading || habitsLoading || focusLoading || tasksLoading || notesLoading;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return format(date, 'MMM d');
  };

  if (!pillar || !pillarInfo) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground"
                style={{ backgroundColor: pillarInfo.color }}
              >
                {pillarInfo.letter}
              </div>
              <div className="flex-1">
                <SheetTitle className="text-xl">{pillarInfo.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={level === 0 ? "destructive" : level === 3 ? "default" : "secondary"}>
                    Level {level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{LEVEL_NAMES[level]}</span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="p-6 space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  {/* Next Level Requirements */}
                  {nextLevel !== null && nextLevelBehaviors.length > 0 && (
                    <Alert className="border-primary/30 bg-primary/5">
                      <ArrowUp className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">
                            To reach Level {nextLevel} ({LEVEL_NAMES[nextLevel]}):
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {LEVEL_DESCRIPTIONS[nextLevel]}
                          </p>
                          <ul className="space-y-1.5">
                            {nextLevelBehaviors.map((behavior) => (
                              <li key={behavior.key} className="flex items-start gap-2 text-xs">
                                <Circle className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <span>{behavior.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {level === 3 && (
                    <Alert className="border-primary/30 bg-primary/5">
                      <Check className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        <p className="font-semibold text-sm">You've reached Significance!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Continue maintaining this pillar and mentoring others.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                  {/* Goals Section */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Goals ({goals?.length || 0})
                      </h3>
                      <Button size="sm" onClick={() => setShowCreateGoal(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Goal
                      </Button>
                    </div>
                    {goals && goals.length > 0 ? (
                      <div className="space-y-2">
                        {goals.map((goal) => (
                          <Card key={goal.id}>
                            <CardContent className="p-3">
                              <p className="font-medium text-sm">{goal.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Target: {goal.target_value} {goal.metric_type}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No goals in this pillar yet</p>
                    )}
                  </section>

                  {/* Habits Section */}
                  <section>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Repeat className="h-4 w-4" />
                      Active Habits ({habits?.length || 0})
                    </h3>
                    {habits && habits.length > 0 ? (
                      <div className="space-y-2">
                        {habits.map((habit) => (
                          <div key={habit.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                            <Check className="h-4 w-4 text-primary" />
                            <span>{habit.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No active habits for this pillar</p>
                    )}
                  </section>

                  {/* Focus Sessions Section */}
                  <section>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4" />
                      Recent Focus ({focusSessions?.length || 0} this week)
                    </h3>
                    {focusSessions && focusSessions.length > 0 ? (
                      <div className="space-y-2">
                        {focusSessions.slice(0, 5).map((session) => (
                          <div key={session.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                            <span className="truncate flex-1">{session.objective}</span>
                            <div className="flex items-center gap-2 text-muted-foreground ml-2">
                              <span>{formatDuration(session.actual_duration_minutes || 0)}</span>
                              <span className="text-xs">{formatRelativeDate(session.completed_at!)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No focus sessions this week</p>
                    )}
                  </section>

                  {/* Quick Tasks Section */}
                  <section>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Check className="h-4 w-4" />
                      Open Tasks ({quickTasks?.length || 0})
                    </h3>
                    {quickTasks && quickTasks.length > 0 ? (
                      <div className="space-y-2">
                        {quickTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                            <div className="w-4 h-4 rounded border border-muted-foreground/50" />
                            <span>{task.title}</span>
                            {task.due_date && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {format(new Date(task.due_date), 'MMM d')}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No open tasks for this pillar</p>
                    )}
                  </section>

                  {/* Notes Section */}
                  <section>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4" />
                      Notes ({notes?.length || 0})
                    </h3>
                    {notes && notes.length > 0 ? (
                      <div className="space-y-2">
                        {notes.map((note) => (
                          <div key={note.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                            <span className="truncate">{note.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeDate(note.updated_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No notes for this pillar</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Goal Creation Dialog with pre-filled pillar */}
      <CreateGoalDialog 
        open={showCreateGoal} 
        onOpenChange={setShowCreateGoal}
        defaultPillar={pillar}
      />
    </>
  );
}
