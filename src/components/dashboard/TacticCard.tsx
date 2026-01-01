import { Tactic } from '@/hooks/useTactics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2 } from 'lucide-react';
import { useTerminalMode } from '@/hooks/useTerminalMode';
import { cn } from '@/lib/utils';

interface TacticCardProps {
  tactic: Tactic;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (tactic: Tactic) => void;
  onDelete: (id: string) => void;
}

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  specific_weeks: 'Specific Weeks',
};

const terminalFrequencyLabels: Record<string, string> = {
  daily: 'D',
  weekly: 'W',
  specific_weeks: 'SW',
};

export function TacticCard({ tactic, onToggle, onEdit, onDelete }: TacticCardProps) {
  const dueWeeks = tactic.due_weeks as number[] | null;
  const { isTerminal, labels } = useTerminalMode();

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 border",
        tactic.is_active ? 'bg-card' : 'bg-muted/50 opacity-60',
        isTerminal ? 'rounded-none border-dashed' : 'rounded-lg'
      )}
    >
      <Switch
        checked={tactic.is_active}
        onCheckedChange={(checked) => onToggle(tactic.id, checked)}
        aria-label={`Toggle ${tactic.title}`}
      />

      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          !tactic.is_active && 'line-through',
          isTerminal && tactic.is_active && 'terminal-positive'
        )}>
          {tactic.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="secondary" className={cn("text-xs", isTerminal && "rounded-none")}>
            {isTerminal 
              ? terminalFrequencyLabels[tactic.frequency] || tactic.frequency.toUpperCase()
              : frequencyLabels[tactic.frequency] || tactic.frequency
            }
          </Badge>
          <span className={cn("text-xs text-muted-foreground", isTerminal && "terminal-orange")}>
            {tactic.target_count}x / {tactic.frequency === 'daily' ? 'D' : 'W'}
          </span>
          {dueWeeks && dueWeeks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {isTerminal ? `[W${dueWeeks.join(',')}]` : `(Weeks: ${dueWeeks.join(', ')})`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tactic)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(tactic.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
