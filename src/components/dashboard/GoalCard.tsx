import { Goal } from '@/hooks/useGoals';
import { Badge } from '@/components/ui/badge';
import { Target, MoreVertical, Trash2, Edit, CalendarCheck, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMilestones } from '@/hooks/useMilestones';
import { useTactics } from '@/hooks/useTactics';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onPlanMilestones?: (goal: Goal) => void;
  onManageTactics?: (goal: Goal) => void;
}

export function GoalCard({ goal, index, onEdit, onDelete, onPlanMilestones, onManageTactics }: GoalCardProps) {
  const { milestones, isLoading } = useMilestones(goal.id);
  const { tactics, isLoading: tacticsLoading } = useTactics(goal.id);
  const hasMilestones = milestones.length === 12;
  const activeTactics = tactics.filter(t => t.is_active);

  return (
    <div className="goal-card relative">
      {/* Goal number in typewriter style */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Goal #{index + 1}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {onPlanMilestones && (
              <DropdownMenuItem onClick={() => onPlanMilestones(goal)}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                Plan Milestones
              </DropdownMenuItem>
            )}
            {onManageTactics && (
              <DropdownMenuItem onClick={() => onManageTactics(goal)}>
                <Zap className="mr-2 h-4 w-4" />
                Manage Tactics
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit?.(goal)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(goal.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded p-1.5 bg-accent/20 text-accent">
          <Target className="h-4 w-4" />
        </div>
        {!isLoading && (
          <Badge variant={hasMilestones ? 'default' : 'secondary'} className="text-xs uppercase tracking-wide">
            {hasMilestones ? 'Planned' : 'Not planned'}
          </Badge>
        )}
      </div>
      
      {/* Title in bold typewriter style */}
      <h3 className="text-lg font-bold mb-4 pr-16 leading-6">{goal.title}</h3>
      
      {/* Target value in nixie tube style */}
      <div className="nixie-display text-sm mb-4">
        {goal.target_value.toLocaleString()} {goal.metric_type}
      </div>
      
      {goal.why && (
        <div className="text-sm mb-4 italic">
          <span className="text-muted-foreground">Why: </span>
          <span>{goal.why}</span>
        </div>
      )}

      {/* Tactics preview */}
      {!tacticsLoading && activeTactics.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wide">
            <Zap className="h-3 w-3" />
            <span>{activeTactics.length} tactic{activeTactics.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {activeTactics.slice(0, 3).map((tactic) => (
              <Badge key={tactic.id} variant="secondary" className="text-xs">
                {tactic.title.length > 20 ? tactic.title.slice(0, 20) + '...' : tactic.title}
              </Badge>
            ))}
            {activeTactics.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{activeTactics.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {!hasMilestones && !isLoading && onPlanMilestones && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => onPlanMilestones(goal)}
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          Plan Weekly Milestones
        </Button>
      )}

      {hasMilestones && (
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 uppercase tracking-wide">
            <span>Progress</span>
            <span className="nixie-display py-1 px-2 text-xs">0%</span>
          </div>
          <div className="nixie-progress h-2">
            <div className="nixie-progress-bar" style={{ width: '0%' }} />
          </div>
        </div>
      )}
    </div>
  );
}
