import { useState } from 'react';
import { Trophy, Clock, PenLine, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SessionCompleteProps {
  objective: string;
  plannedMinutes: number;
  actualMinutes: number;
  todayMinutes: number;
  todaySessions: number;
  streak: number;
  onSave: (notes: string) => void;
  onClose: () => void;
}

export function SessionComplete({
  objective,
  plannedMinutes,
  actualMinutes,
  todayMinutes,
  todaySessions,
  streak,
  onSave,
  onClose,
}: SessionCompleteProps) {
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="h-16 w-16 text-primary animate-bounce" />
              <PartyPopper className="h-8 w-8 text-chart-2 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
          <p className="text-muted-foreground mt-2">{objective}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{actualMinutes}</div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-2">{formatDuration(todayMinutes)}</div>
              <div className="text-xs text-muted-foreground">Today Total</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-3xl font-bold",
                streak >= 7 ? "text-chart-1" : streak >= 3 ? "text-chart-3" : "text-foreground"
              )}>
                {streak}
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>

          {/* Comparison */}
          {actualMinutes !== plannedMinutes && (
            <div className={cn(
              "text-center text-sm py-2 px-4 rounded-md",
              actualMinutes > plannedMinutes 
                ? "bg-chart-2/10 text-chart-2" 
                : "bg-muted text-muted-foreground"
            )}>
              <Clock className="h-4 w-4 inline-block mr-1" />
              {actualMinutes > plannedMinutes 
                ? `You focused ${actualMinutes - plannedMinutes} minutes longer than planned!` 
                : `Finished ${plannedMinutes - actualMinutes} minutes early`}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              What did you accomplish? (optional)
            </Label>
            <Textarea
              placeholder="Quick notes about this session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Skip Notes
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save & Close
            </Button>
          </div>

          {/* Encouragement */}
          {todaySessions >= 3 && (
            <p className="text-center text-sm text-chart-2">
              🔥 {todaySessions} sessions completed today! You're on fire!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
