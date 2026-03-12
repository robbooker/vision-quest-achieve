import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, CheckCircle, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  plannedMinutes: number;
  objective: string;
  onComplete: (actualMinutes: number) => void;
  onCancel: () => void;
  onExtend: (additionalMinutes: number) => void;
  startTime: Date;
}

export function FocusTimer({ plannedMinutes, objective, onComplete, onCancel, onExtend, startTime }: FocusTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionSoundPlayedRef = useRef(false);

  const totalPlannedSeconds = plannedMinutes * 60;
  const remainingSeconds = Math.max(0, totalPlannedSeconds - elapsedSeconds);
  const isOvertime = elapsedSeconds > totalPlannedSeconds;
  const progress = Math.min(100, (elapsedSeconds / totalPlannedSeconds) * 100);

  // Initialize elapsed time from start time
  useEffect(() => {
    const now = new Date();
    const initialElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    setElapsedSeconds(Math.max(0, initialElapsed));
  }, [startTime]);

  // Timer logic
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  // Play sound when timer completes (only once)
  useEffect(() => {
    // Check if we've crossed the completion threshold and haven't played the sound yet
    if (elapsedSeconds >= totalPlannedSeconds && elapsedSeconds > 0 && !completionSoundPlayedRef.current) {
      completionSoundPlayedRef.current = true;
      
      // Play completion sound
      try {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAAPh6i+eCIiQJ6rwS0MCmGXwqYnFheLrmYxCT+Zz5oxHiZlnLpGFhJqq6F5SEFyn7WTNx0nls2LUjhdtLRzKCxJpMd8IBg9w79GFgY+sb5oJho/');
        audioRef.current.play().catch(() => {});
      } catch (e) {
        console.log('Audio not supported');
      }

      // Request notification permission and show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete! 🎉', {
          body: `Great work on: ${objective}`,
          icon: '/icon-192.png',
        });
      }
    }
  }, [elapsedSeconds, totalPlannedSeconds, objective]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = useCallback(() => {
    const actualMinutes = Math.ceil(elapsedSeconds / 60);
    onComplete(actualMinutes);
  }, [elapsedSeconds, onComplete]);

  const handleExtend = (minutes: number) => {
    if (minutes > 0) {
      onExtend(minutes);
    }
  };

  const handleCustomExtend = () => {
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      onExtend(mins);
      setCustomMinutes('');
    }
  };

  // Calculate SVG circle values
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Objective Display */}
      <div className="text-center max-w-md">
        <p className="text-muted-foreground text-sm uppercase tracking-wide mb-1">Focusing on</p>
        <h2 className="text-xl font-semibold">{objective}</h2>
      </div>

      {/* Circular Timer */}
      <div className="relative">
        <svg width="280" height="280" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke={isOvertime ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Timer Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-5xl font-mono font-bold tabular-nums",
            isOvertime && "text-destructive"
          )}>
            {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsedSeconds - totalPlannedSeconds : remainingSeconds)}
          </span>
          <span className="text-muted-foreground text-sm mt-2">
            {isOvertime ? 'overtime' : 'remaining'}
          </span>
          {isPaused && (
            <span className="text-primary text-sm font-medium mt-1 animate-pulse">
              PAUSED
            </span>
          )}
        </div>
      </div>

      {/* Session Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Elapsed: {formatTime(elapsedSeconds)} / Planned: {plannedMinutes} min</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsPaused(!isPaused)}
          className="gap-2"
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={handleComplete}
          className="gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          End Session
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={onCancel}
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Extend Time */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-sm text-muted-foreground">Extend:</span>
        {[5, 10, 15, 30].map(mins => (
          <Button
            key={mins}
            variant="ghost"
            size="sm"
            onClick={() => handleExtend(mins)}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            {mins}m
          </Button>
        ))}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="1"
            max="120"
            placeholder="min"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomExtend()}
            className="w-16 h-8 text-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCustomExtend}
            disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}