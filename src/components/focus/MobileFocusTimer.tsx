import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, CheckCircle, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import gpLogo from '@/assets/gp-logo.png';

interface MobileFocusTimerProps {
  plannedMinutes: number;
  objective: string;
  onComplete: (actualMinutes: number) => void;
  onCancel: () => void;
  onExtend: (additionalMinutes: number) => void;
  startTime: Date;
}

export function MobileFocusTimer({ plannedMinutes, objective, onComplete, onCancel, onExtend, startTime }: MobileFocusTimerProps) {
  const navigate = useNavigate();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
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
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  // Play sound when timer completes
  useEffect(() => {
    if (elapsedSeconds >= totalPlannedSeconds && elapsedSeconds > 0 && !completionSoundPlayedRef.current) {
      completionSoundPlayedRef.current = true;
      try {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAAPh6i+eCIiQJ6rwS0MCmGXwqYnFheLrmYxCT+Zz5oxHiZlnLpGFhJqq6F5SEFyn7WTNx0nls2LUjhdtLRzKCxJpMd8IBg9w79GFgY+sb5oJho/');
        audioRef.current.play().catch(() => {});
      } catch (e) {
        console.log('Audio not supported');
      }
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

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-between px-6 py-10 pb-safe">
      {/* Centered logo */}
      <div className="w-full flex justify-center mb-4">
        <button onClick={() => navigate('/today')}>
          <img src={gpLogo} alt="Home" className="h-8 w-auto" />
        </button>
      </div>
      {/* Top: Objective */}
      <div className="text-center w-full">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Focusing on</p>
        <h2 className="text-lg font-semibold truncate">{objective}</h2>
      </div>

      {/* Center: Time */}
      <div className="flex flex-col items-center gap-4 w-full">
        <span className={cn(
          "text-7xl font-mono font-bold tabular-nums",
          isOvertime && "text-destructive"
        )}>
          {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsedSeconds - totalPlannedSeconds : remainingSeconds)}
        </span>
        <span className="text-sm text-muted-foreground">
          {isOvertime ? 'overtime' : 'remaining'}
        </span>

        {isPaused && (
          <span className="text-primary text-sm font-medium animate-pulse">PAUSED</span>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
        </div>

        <p className="text-xs text-muted-foreground">
          {formatTime(elapsedSeconds)} elapsed · {plannedMinutes}m planned
        </p>
      </div>

      {/* Bottom: Controls */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          size="lg"
          className="w-full gap-2 min-h-[56px] text-base"
          onClick={handleComplete}
        >
          <CheckCircle className="h-5 w-5" />
          End Session
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2 min-h-[56px] text-base"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>

        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            onClick={() => onExtend(10)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Plus className="h-3 w-3" /> 10 min
          </button>

          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
