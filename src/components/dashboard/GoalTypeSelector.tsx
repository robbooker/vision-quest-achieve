import { Target, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GoalType = 'standard' | 'time_mastery' | 'score';

interface GoalTypeSelectorProps {
  onSelect: (type: GoalType) => void;
  onClose: () => void;
}

const goalTypes = [
  {
    type: 'standard' as GoalType,
    title: 'Standard Goal',
    description: 'Achieve a measurable outcome (sales, pages, pounds lost)',
    icon: Target,
    example: 'Write 50,000 words, make 100 sales calls',
  },
  {
    type: 'time_mastery' as GoalType,
    title: 'Time-Mastery Goal',
    description: 'Build a skill through consistent daily practice',
    icon: Clock,
    example: 'Learn Spanish, master guitar, become a better writer',
  },
  {
    type: 'score' as GoalType,
    title: 'Score-Based Goal',
    description: 'Track daily performance on a 1-10 scale',
    icon: BarChart3,
    example: 'Daily energy level, meditation quality, focus score',
  },
];

export function GoalTypeSelector({ onSelect, onClose }: GoalTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">What type of goal would you like to set?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the best approach for what you want to achieve
        </p>
      </div>

      <div className="grid gap-3">
        {goalTypes.map((goalType) => {
          const Icon = goalType.icon;
          return (
            <button
              key={goalType.type}
              onClick={() => onSelect(goalType.type)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
                "hover:border-primary hover:bg-accent/50",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
            >
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">{goalType.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {goalType.description}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 italic">
                  e.g., {goalType.example}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          onClick={onClose}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
