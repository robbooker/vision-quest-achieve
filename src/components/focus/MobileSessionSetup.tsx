import { useState } from 'react';
import { Play, Clock, Flame, History, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LogPastSessionDialog } from './LogPastSessionDialog';
import { useNavigate } from 'react-router-dom';
import gpLogo from '@/assets/gp-logo.png';
import { EditSessionDialog } from './EditSessionDialog';
import { isToday, format } from 'date-fns';
import type { FocusSession } from '@/hooks/useFocusSessions';

const DURATION_PRESETS = [
  { value: 5, label: '5m' },
  { value: 10, label: '10m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
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

interface MobileSessionSetupProps {
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

export function MobileSessionSetup({
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
}: MobileSessionSetupProps) {
  const navigate = useNavigate();
  const [selectedFocus, setSelectedFocus] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);

  const objective = selectedFocus === 'other' ? customObjective : selectedFocus;
  const canStart = objective.trim().length > 0;

  const todaySessions = sessions.filter(s => isToday(new Date(s.started_at)));
  const activeSession = sessions.find(s => s.status === 'active');

  const handleDurationSelect = (value: number) => {
    setDuration(value);
    setCustomDuration('');
  };

  const handleStart = () => {
    if (!objective.trim()) return;
    const effectivePillar = objective.trim().toLowerCase() === 'meditation' ? 'spiritual' : undefined;
    onStart({
      objective: objective.trim(),
      duration,
      pillar: effectivePillar,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col px-6 py-8 pb-safe overflow-y-auto">
      {/* Centered logo */}
      <div className="w-full flex justify-center mb-6">
        <button onClick={() => navigate('/today')}>
          <img src={gpLogo} alt="Home" className="h-8 w-auto" />
        </button>
      </div>
      {/* Stats strip */}
      <div className="flex justify-center gap-6 mb-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{todayMinutes}m</div>
          <div className="text-xs text-muted-foreground">Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{todayCount}</div>
          <div className="text-xs text-muted-foreground">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            {streak > 0 && <Flame className="h-4 w-4 text-chart-1" />}
            {streak}
          </div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
      </div>

      {/* Active session banner */}
      {activeSession && (
        <button
          onClick={onResumeSession}
          className="w-full p-3 rounded-lg bg-primary/10 border border-primary/20 mb-6 text-left"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-medium text-sm">{activeSession.objective}</span>
            <Badge variant="outline" className="ml-auto text-primary border-primary text-xs">
              Active
            </Badge>
          </div>
        </button>
      )}

      {/* Focus selection */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label className="text-sm">What will you focus on?</Label>
          <Select value={selectedFocus} onValueChange={setSelectedFocus}>
            <SelectTrigger className="min-h-[48px]">
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
              className="min-h-[48px]"
            />
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="text-sm">Duration</Label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_PRESETS.map(preset => (
              <Button
                key={preset.value}
                variant={duration === preset.value && !customDuration ? 'default' : 'outline'}
                className="min-h-[48px] text-base"
                onClick={() => handleDurationSelect(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Custom"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value);
                const parsed = parseInt(e.target.value);
                if (!isNaN(parsed) && parsed > 0) setDuration(parsed);
              }}
              className="w-24 min-h-[44px]"
              min={1}
              max={240}
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col gap-3 mt-6">
        <Button
          size="lg"
          className="w-full gap-2 min-h-[56px] text-base"
          onClick={handleStart}
          disabled={!canStart || isStarting}
        >
          <Play className="h-5 w-5" />
          Start Focus Session
        </Button>

        <div className="flex items-center justify-center gap-4">
          {onLogPastSession && (
            <LogPastSessionDialog onLog={onLogPastSession} isLogging={isLoggingPast} />
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <History className="h-3 w-3" />
            Today's sessions
            <ChevronDown className={cn("h-3 w-3 transition-transform", showHistory && "rotate-180")} />
          </button>
        </div>

        {/* Collapsible today history */}
        {showHistory && (
          <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
            {todaySessions.filter(s => s.status !== 'active').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No completed sessions yet</p>
            ) : (
              todaySessions
                .filter(s => s.status !== 'active')
                .map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{session.objective}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {session.actual_duration_minutes || session.planned_duration_minutes}m
                    </span>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
