import { useState, useEffect, useRef } from 'react';
import { Coffee, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BREAK_PRESETS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
];

interface BreakTimerProps {
  onClose: () => void;
  onBreakComplete: () => void;
}

export function BreakTimer({ onClose, onBreakComplete }: BreakTimerProps) {
  const [breakMinutes, setBreakMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (breakMinutes !== null && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            // Break complete
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Break Over! ☕', {
                body: 'Time to get back to focused work!',
                icon: '/icon-192.png',
              });
            }
            onBreakComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [breakMinutes, remainingSeconds, onBreakComplete]);

  const startBreak = (minutes: number) => {
    setBreakMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4">
        {breakMinutes === null ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Take a break?</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              {BREAK_PRESETS.map(preset => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => startBreak(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coffee className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Break time remaining</p>
                <p className="text-2xl font-mono font-bold">{formatTime(remainingSeconds)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Play className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
