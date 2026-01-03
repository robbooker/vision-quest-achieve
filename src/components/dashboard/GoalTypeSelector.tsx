import { Target, Clock, Repeat, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export type GoalType = 'standard' | 'time_mastery' | 'habit';

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
    type: 'habit' as GoalType,
    title: 'Habit-Based Goal',
    description: 'Start, stop, or replace a habit using the Cue-Routine-Reward loop',
    icon: Repeat,
    example: 'Quit social media scrolling, start morning exercise',
    learnMore: '/blog/habit-goals',
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
            <div key={goalType.type} className="relative">
              <button
                onClick={() => onSelect(goalType.type)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border text-left transition-all w-full",
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
                  {'learnMore' in goalType && goalType.learnMore && (
                    <Link 
                      to={goalType.learnMore} 
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      Learn about this approach <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </button>
            </div>
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
