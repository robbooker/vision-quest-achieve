import { useState } from 'react';
import { Play, Target, Link2, Clock, Timer, Flame, CheckCircle, Pencil, Hexagon, History } from 'lucide-react';
import { LogPastSessionDialog } from './LogPastSessionDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useGoals } from '@/hooks/useGoals';
import { useBigTen } from '@/hooks/useBigTen';
import { useQuickTasks } from '@/hooks/useQuickTasks';
import { EditSessionDialog } from './EditSessionDialog';
import { isToday, format, subDays, isAfter } from 'date-fns';
import type { FocusSession } from '@/hooks/useFocusSessions';

const PRIMED_PILLARS = [
  { value: 'physical', label: 'Physical' },
  { value: 'relations', label: 'Relations' },
  { value: 'income', label: 'Income' },
  { value: 'mental', label: 'Mental' },
  { value: 'excellence', label: 'Excellence' },
  { value: 'direction', label: 'Direction' },
  { value: 'spiritual', label: 'Spiritual' },
];

const DURATION_PRESETS = [
  { value: 5, label: '5 min', description: 'Quick' },
  { value: 10, label: '10 min', description: 'Short' },
  { value: 30, label: '30 min', description: 'Deep Work' },
  { value: 45, label: '45 min', description: 'Extended' },
];

const FOCUS_OPTIONS = [
  'Meditation',
  'Fitness: Walk',
  'Fitness',
  'Gratitude',
  'Mindfully journal',
  'Prep for meeting',
  'Wind down for bed',
  'Wake up routine',
  'Settle emotional state',
  'other',
];

interface SessionSetupProps {
  onStart: (data: {
    objective: string;
    duration: number;
    linkedGoalId?: string;
    linkedTaskId?: string;
    linkedBigTenTaskId?: string;
    pillar?: string;
  }) => void;
  isStarting: boolean;
  sessions?: FocusSession[];
  todayMinutes?: number;
  todayCount?: number;
  streak?: number;
  onUpdateSession?: (
    id: string,
    data: { status: 'completed' | 'abandoned'; rating: 'bad' | 'good' | 'great' | null; notes: string | null; pillar?: string | null }
  ) => void;
  onResumeSession?: () => void;
  onLogPastSession?: (data: {
    objective: string;
    duration_minutes: number;
    started_at: string;
    pillar?: string;
    linked_goal_id?: string;
    rating?: 'bad' | 'good' | 'great';
    notes?: string;
  }) => Promise<unknown>;
  isLoggingPast?: boolean;
}

export function SessionSetup({ 
  onStart, 
  isStarting,
  sessions = [],
  todayMinutes = 0,
  todayCount = 0,
  streak = 0,
  onUpdateSession,
  onResumeSession,
  onLogPastSession,
  isLoggingPast = false,
}: SessionSetupProps) {
  console.log('[SessionSetup] Rendering with sessions:', sessions?.length);
  const [selectedFocus, setSelectedFocus] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [linkType, setLinkType] = useState<'none' | 'goal' | 'task' | 'bigten'>('none');
  const [linkedId, setLinkedId] = useState('');
  const [pillar, setPillar] = useState<string>('');
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);

  // Compute the actual objective based on selection
  const objective = selectedFocus === 'other' ? customObjective : selectedFocus;

  const { goals } = useGoals();
  const { projects } = useBigTen();
  const { tasks: quickTasks } = useQuickTasks();

  const pendingQuickTasks = quickTasks.filter(t => !t.completed);
  const allBigTenTasks = projects.flatMap(p => p.tasks || []);
  const pendingBigTenTasks = allBigTenTasks.filter(t => !t.completed);

  // Filter today's sessions
  const todaySessions = sessions.filter(s => isToday(new Date(s.started_at)));
  const activeSession = sessions.find(s => s.status === 'active');

  const handleDurationSelect = (value: number) => {
    setDuration(value);
    setCustomDuration('');
  };

  const handleCustomDuration = (value: string) => {
    setCustomDuration(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      setDuration(parsed);
    }
  };

  const handleStart = () => {
    if (!objective.trim()) return;

    // Auto-tag Meditation sessions to Spiritual pillar
    const effectivePillar = objective.trim().toLowerCase() === 'meditation' && !pillar
      ? 'spiritual'
      : pillar;

    onStart({
      objective: objective.trim(),
      duration,
      linkedGoalId: linkType === 'goal' ? linkedId : undefined,
      linkedTaskId: linkType === 'task' ? linkedId : undefined,
      linkedBigTenTaskId: linkType === 'bigten' ? linkedId : undefined,
      pillar: effectivePillar || undefined,
    });
  };

  const handleSessionClick = (session: FocusSession) => {
    if (session.status === 'active' && onResumeSession) {
      onResumeSession();
    }
  };

  const canStart = objective.trim().length > 0;

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'great': return 'text-chart-2';
      case 'good': return 'text-primary';
      case 'bad': return 'text-chart-1';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <>
      <Card className="mx-auto p-0 sm:p-0">
        {/* Tab Navigation - Small box links at top */}
        <div className="flex gap-2 p-3 sm:p-4 pb-0">
          <Tabs defaultValue="session" className="w-full">
            <TabsList className="h-auto p-1 bg-muted/50 w-auto inline-flex gap-1">
              <TabsTrigger 
                value="session" 
                className="px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                <Target className="h-3.5 w-3.5 mr-1.5" />
                Session
              </TabsTrigger>
              <TabsTrigger 
                value="today" 
                className="px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Today
              </TabsTrigger>
              <TabsTrigger 
                value="tips" 
                className="px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                <Timer className="h-3.5 w-3.5 mr-1.5" />
                Tips
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                Past
              </TabsTrigger>
            </TabsList>

            <CardContent className="pt-4 px-3 sm:px-6">
              <TabsContent value="session" className="mt-0 space-y-6">
                {/* Objective */}
                <div className="space-y-2">
                  <Label>What will you focus on?</Label>
                  <Select value={selectedFocus} onValueChange={setSelectedFocus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus activity" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {FOCUS_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>
                          {option === 'other' ? 'Something else...' : option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedFocus === 'other' && (
                    <Input
                      placeholder="Describe what you'll focus on..."
                      value={customObjective}
                      onChange={(e) => setCustomObjective(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Duration Presets */}
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DURATION_PRESETS.map(preset => (
                      <Button
                        key={preset.value}
                        variant={duration === preset.value && !customDuration ? 'default' : 'outline'}
                        className="flex flex-col h-auto py-2"
                        onClick={() => handleDurationSelect(preset.value)}
                      >
                        <span className="font-semibold text-sm">{preset.label}</span>
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Custom"
                      value={customDuration}
                      onChange={(e) => handleCustomDuration(e.target.value)}
                      className="w-24"
                      min={1}
                      max={240}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>

                {/* Link to Goal/Task */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Link to (optional)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={linkType} onValueChange={(v) => { setLinkType(v as typeof linkType); setLinkedId(''); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No link</SelectItem>
                        <SelectItem value="goal">Cycle Goal</SelectItem>
                        <SelectItem value="task">Quick Task</SelectItem>
                        <SelectItem value="bigten">Big 10 Task</SelectItem>
                      </SelectContent>
                    </Select>

                    {linkType === 'goal' && goals.length > 0 && (
                      <Select value={linkedId} onValueChange={setLinkedId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {goals.map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {linkType === 'task' && pendingQuickTasks.length > 0 && (
                      <Select value={linkedId} onValueChange={setLinkedId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          {pendingQuickTasks.map(task => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {linkType === 'bigten' && pendingBigTenTasks.length > 0 && (
                      <Select value={linkedId} onValueChange={setLinkedId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          {pendingBigTenTasks.map(task => {
                            const project = projects.find(p => p.id === task.project_id);
                            return (
                              <SelectItem key={task.id} value={task.id}>
                                {project?.title}: {task.title}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* PRIMED Pillar */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hexagon className="h-4 w-4" />
                    PRIMED Pillar (optional)
                  </Label>
                  <Select value={pillar || 'none'} onValueChange={(v) => setPillar(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pillar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {PRIMED_PILLARS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Button */}
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleStart}
                  disabled={!canStart || isStarting}
                >
                  <Play className="h-5 w-5" />
                  Start Focus Session
                </Button>

                {onLogPastSession && (
                  <div className="flex justify-center">
                    <LogPastSessionDialog onLog={onLogPastSession} isLogging={isLoggingPast} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="today" className="mt-0">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xl font-bold text-primary">{todayMinutes}m</div>
                    <div className="text-xs text-muted-foreground">Focused</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xl font-bold">{todayCount}</div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xl font-bold flex items-center justify-center gap-1">
                      {streak > 0 && <Flame className="h-4 w-4 text-chart-1" />}
                      {streak}
                    </div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>

                {/* Active Session */}
                {activeSession && (
                  <div 
                    className="p-3 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors mb-3"
                    onClick={() => handleSessionClick(activeSession)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-medium text-sm">{activeSession.objective}</span>
                      </div>
                      <Badge variant="outline" className="text-primary border-primary">
                        Active
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Today's Sessions List */}
                {todaySessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sessions yet today. Start your first focus session!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {todaySessions
                      .filter(s => s.status !== 'active')
                      .slice(0, 5)
                      .map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className={`h-4 w-4 flex-shrink-0 ${
                              session.status === 'completed' ? 'text-chart-2' : 'text-muted-foreground'
                            }`} />
                            <span className="text-sm truncate">{session.objective}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.status === 'completed' && (
                              <Badge variant="secondary" className="text-xs">
                                {session.actual_duration_minutes || session.planned_duration_minutes}m
                              </Badge>
                            )}
                            <span className={`text-xs ${getRatingColor(session.rating)}`}>
                              {session.rating ? session.rating.charAt(0).toUpperCase() + session.rating.slice(1) : ''}
                            </span>
                            {onUpdateSession && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSession(session);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tips" className="mt-0">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Start with 25-minute sessions (Pomodoro)
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Take short breaks between sessions
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Link sessions to goals for tracking
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Use ambient sounds to block distractions
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Set a clear, specific objective
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                {/* Past Sessions - last 7 days excluding today */}
                {(() => {
                  if (!sessions || sessions.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No past sessions in the last 7 days.
                      </p>
                    );
                  }
                  
                  const pastSessions = sessions
                    .filter(s => !isToday(new Date(s.started_at)) && isAfter(new Date(s.started_at), subDays(new Date(), 7)))
                    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
                  
                  if (pastSessions.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No past sessions in the last 7 days.
                      </p>
                    );
                  }

                  // Group sessions by date
                  const groupedByDate: { [date: string]: FocusSession[] } = {};
                  pastSessions.forEach(session => {
                    const dateKey = format(new Date(session.started_at), 'yyyy-MM-dd');
                    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
                    groupedByDate[dateKey].push(session);
                  });

                  return (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {Object.entries(groupedByDate).map(([dateKey, dateSessions]) => (
                        <div key={dateKey}>
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            {format(new Date(dateKey), 'EEEE, MMM d')}
                          </div>
                          <div className="space-y-2">
                            {dateSessions.map((session) => (
                              <div
                                key={session.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <CheckCircle className={`h-4 w-4 flex-shrink-0 ${
                                    session.status === 'completed' ? 'text-chart-2' : 'text-muted-foreground'
                                  }`} />
                                  <span className="text-sm truncate">{session.objective}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {session.pillar && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {session.pillar}
                                    </Badge>
                                  )}
                                  {session.status === 'completed' && (
                                    <Badge variant="secondary" className="text-xs">
                                      {session.actual_duration_minutes || session.planned_duration_minutes}m
                                    </Badge>
                                  )}
                                  {onUpdateSession && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSession(session);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </TabsContent>
            </CardContent>
          </Tabs>
        </div>
      </Card>

      {/* Edit Session Dialog */}
      {editingSession && onUpdateSession && (
        <EditSessionDialog
          session={editingSession}
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
          onSave={(data) => {
            onUpdateSession(editingSession.id, data);
            setEditingSession(null);
          }}
        />
      )}
    </>
  );
}
