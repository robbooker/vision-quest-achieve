import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import gpLogo from '@/assets/gp-logo.png';

const DURATION_PRESETS = [
  { value: 10, label: '10m' },
  { value: 30, label: '30m' },
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
  sessions?: any[];
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
  onResumeSession,
}: MobileSessionSetupProps) {
  const navigate = useNavigate();
  const [selectedFocus, setSelectedFocus] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');

  const objective = selectedFocus === 'other' ? customObjective : selectedFocus;
  const canStart = objective.trim().length > 0;

  const activeSession = sessions.find((s: any) => s.status === 'active');

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
            <SelectContent className="bg-background z-[70]">
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
          <div className="grid grid-cols-2 gap-3">
            {DURATION_PRESETS.map(preset => (
              <Button
                key={preset.value}
                variant={duration === preset.value && !customDuration ? 'default' : 'outline'}
                className="h-14 text-lg"
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

      {/* Start button */}
      <div className="mt-6">
        <Button
          size="lg"
          className="w-full gap-2 min-h-[56px] text-base"
          onClick={handleStart}
          disabled={!canStart || isStarting}
        >
          <Play className="h-5 w-5" />
          Start Focus Session
        </Button>
      </div>
    </div>
  );
}
