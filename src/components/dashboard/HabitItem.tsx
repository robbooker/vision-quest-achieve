import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Minus, Plus, Flame } from 'lucide-react';
import { Tactic } from '@/hooks/useTactics';
import { TacticLog } from '@/hooks/useTacticLogs';

interface HabitItemProps {
  tactic: Tactic;
  log: TacticLog | undefined;
  streak: number;
  goalTitle: string;
  onToggle: (tacticId: string, newCount: number) => void;
}

export function HabitItem({ tactic, log, streak, goalTitle, onToggle }: HabitItemProps) {
  const currentCount = log?.completed_count ?? 0;
  const isComplete = currentCount >= tactic.target_count;
  const isMultiple = tactic.target_count > 1;

  const handleIncrement = () => {
    onToggle(tactic.id, currentCount + 1);
  };

  const handleDecrement = () => {
    onToggle(tactic.id, Math.max(currentCount - 1, 0));
  };

  const handleToggle = () => {
    onToggle(tactic.id, isComplete ? 0 : 1);
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      isComplete ? 'bg-green-500/10 border-green-500/30' : 'bg-card hover:bg-muted/50'
    } transition-colors`}>
      {/* Check/Counter Control */}
      {isMultiple ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDecrement}
            disabled={currentCount === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className={`min-w-[3rem] text-center font-medium ${isComplete ? 'text-green-600' : ''}`}>
            {currentCount}/{tactic.target_count}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleIncrement}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          onClick={handleToggle}
          className="flex-shrink-0"
        >
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
          )}
        </button>
      )}
      
      {/* Habit Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${isComplete ? 'text-green-700 dark:text-green-400' : ''}`}>
          {tactic.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {goalTitle}
          </Badge>
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1 text-orange-500 flex-shrink-0">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-medium">{streak}</span>
        </div>
      )}
    </div>
  );
}
