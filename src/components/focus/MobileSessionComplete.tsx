import { useState } from 'react';
import { Trophy, PenLine, Frown, Smile, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Rating = 'bad' | 'good' | 'great';

interface MobileSessionCompleteProps {
  objective: string;
  plannedMinutes: number;
  actualMinutes: number;
  todayMinutes: number;
  todaySessions: number;
  streak: number;
  onSave: (notes: string, rating: Rating) => void;
  onClose: () => void;
}

export function MobileSessionComplete({
  objective,
  plannedMinutes,
  actualMinutes,
  todayMinutes,
  todaySessions,
  streak,
  onSave,
  onClose,
}: MobileSessionCompleteProps) {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<Rating>('good');

  const handleSave = () => {
    onSave(notes, rating);
    onClose();
  };

  const ratingOptions: { value: Rating; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'bad', label: 'Bad', icon: <Frown className="h-8 w-8" />, color: 'text-destructive' },
    { value: 'good', label: 'Good', icon: <Smile className="h-8 w-8" />, color: 'text-chart-3' },
    { value: 'great', label: 'Great', icon: <Star className="h-8 w-8" />, color: 'text-primary' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-between px-6 py-10 pb-safe overflow-y-auto">
      {/* Top: Celebration */}
      <div className="text-center w-full">
        <Trophy className="h-12 w-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">Session Complete!</h2>
        <p className="text-sm text-muted-foreground mt-1 truncate">{objective}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 my-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{actualMinutes}m</div>
          <div className="text-xs text-muted-foreground">Focused</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{todayMinutes}m</div>
          <div className="text-xs text-muted-foreground">Today Total</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{streak}</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
      </div>

      {/* Comparison note */}
      {actualMinutes !== plannedMinutes && (
        <div className={cn(
          "text-center text-sm py-2 px-4 rounded-md w-full max-w-xs mb-4",
          actualMinutes > plannedMinutes
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}>
          <Clock className="h-4 w-4 inline-block mr-1" />
          {actualMinutes > plannedMinutes
            ? `+${actualMinutes - plannedMinutes}m over planned!`
            : `${plannedMinutes - actualMinutes}m early`}
        </div>
      )}

      {/* Rating */}
      <div className="w-full max-w-xs space-y-3">
        <p className="text-sm text-center text-muted-foreground">How was your focus?</p>
        <div className="flex justify-center gap-4">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setRating(option.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-4 rounded-lg border-2 transition-all min-w-[72px]",
                rating === option.value
                  ? `border-primary bg-primary/10 ${option.color}`
                  : "border-transparent hover:border-muted-foreground/20 text-muted-foreground"
              )}
            >
              {option.icon}
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="w-full max-w-xs mt-4">
        <Textarea
          placeholder="Quick notes (optional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="text-base"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
        <Button
          size="lg"
          className="w-full gap-2 min-h-[56px] text-base"
          onClick={handleSave}
        >
          <PenLine className="h-5 w-5" />
          Save & Close
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full min-h-[56px] text-base"
          onClick={() => { onSave('', rating); onClose(); }}
        >
          Skip Notes
        </Button>
      </div>

      {todaySessions >= 3 && (
        <p className="text-center text-sm text-primary font-medium mt-4">
          🔥 {todaySessions} sessions today!
        </p>
      )}
    </div>
  );
}
