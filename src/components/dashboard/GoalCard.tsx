import { Goal } from '@/hooks/useGoals';
import { Badge } from '@/components/ui/badge';
import { Target, MoreVertical, Trash2, Edit, CalendarCheck, Zap, Clock, Repeat, Star, Play, StopCircle, Brain, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMilestones } from '@/hooks/useMilestones';
import { useTactics } from '@/hooks/useTactics';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { useGoalSchedules } from '@/hooks/useGoalSchedules';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onPlanMilestones?: (goal: Goal) => void;
  onManageTactics?: (goal: Goal) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function GoalCard({ goal, index, onEdit, onDelete, onPlanMilestones, onManageTactics }: GoalCardProps) {
  const { milestones, isLoading } = useMilestones(goal.id);
  const { tactics, isLoading: tacticsLoading } = useTactics(goal.id);
  const { actualValue, progressPercent, isLoading: progressLoading } = useGoalProgress(
    goal.id, 
    goal.target_value, 
    goal.metric_type
  );
  const { schedules, isLoading: schedulesLoading } = useGoalSchedules(goal.id);
  
  const isTimeMastery = goal.goal_type === 'time_mastery';
  const isHabit = goal.goal_type === 'habit';
  const isWoop = goal.goal_type === 'woop';
  // Support both old 12-week cycles and new 6-week cycles
  const hasMilestones = milestones.length >= 6 || (isTimeMastery && milestones.length >= 3);
  const activeTactics = tactics.filter(t => t.is_active);
  
  // Detect score-based goals and check if exceeding target
  const isScoreBased = goal.metric_type.toLowerCase().includes('score');
  const isExceedingTarget = isScoreBased && actualValue > goal.target_value;

  const getGoalIcon = () => {
    if (isTimeMastery) return Clock;
    if (isHabit) return Repeat;
    if (isWoop) return Brain;
    return Target;
  };

  const getHabitDirectionIcon = () => {
    if (goal.habit_direction === 'start') return Play;
    if (goal.habit_direction === 'stop') return StopCircle;
    return Repeat;
  };

  const GoalIcon = getGoalIcon();
  const HabitDirectionIcon = getHabitDirectionIcon();

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
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="rounded p-1.5 bg-accent/20 text-accent">
          <GoalIcon className="h-4 w-4" />
        </div>
        {isTimeMastery && (
          <Badge variant="outline" className="text-xs uppercase tracking-wide border-primary/50 text-primary">
            Time-Mastery
          </Badge>
        )}
        {isWoop && (
          <Badge variant="outline" className="text-xs uppercase tracking-wide border-violet-500/50 text-violet-600 dark:text-violet-400">
            WOOP
          </Badge>
        )}
        {isHabit && (
          <Badge variant="outline" className="text-xs uppercase tracking-wide border-amber-500/50 text-amber-600 dark:text-amber-400 gap-1">
            <HabitDirectionIcon className="h-3 w-3" />
            {goal.habit_direction?.toUpperCase()}
          </Badge>
        )}
        {isHabit && goal.is_keystone_habit && (
          <Badge variant="outline" className="text-xs uppercase tracking-wide border-amber-500/50 text-amber-500 gap-1">
            <Star className="h-3 w-3" />
            Keystone
          </Badge>
        )}
        {isExceedingTarget && !progressLoading && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="text-xs uppercase tracking-wide bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 gap-1">
                <TrendingUp className="h-3 w-3" />
                Exceeding
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Averaging {actualValue.toFixed(1)}/10, exceeding target of {goal.target_value}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {!isLoading && !isHabit && !isWoop && (
          <Badge variant={hasMilestones ? 'default' : 'secondary'} className="text-xs uppercase tracking-wide">
            {hasMilestones ? 'Planned' : 'Not planned'}
          </Badge>
        )}
      </div>
      
      {/* Title in bold typewriter style */}
      <h3 className="text-lg font-bold mb-4 pr-16 leading-6">{goal.title}</h3>
      
      {/* Time-Mastery schedule display */}
      {isTimeMastery && !schedulesLoading && schedules.length > 0 && (
        <div className="text-sm mb-4 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {schedules[0]?.duration_minutes}min/day on {schedules.map(s => DAYS_OF_WEEK[s.day_of_week]).join(', ')}
          </span>
        </div>
      )}

      {/* Target value in nixie tube style - only for standard goals */}
      {!isTimeMastery && (
        <div className="nixie-display text-sm mb-4">
          {goal.target_value.toLocaleString()} {goal.metric_type}
        </div>
      )}
      
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

      {/* Habit-based goal loop display */}
      {isHabit && (goal.habit_cue || goal.habit_new_routine || goal.habit_reward) && (
        <div className="space-y-2 mb-4 text-sm">
          {goal.habit_cue && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground uppercase shrink-0">Cue:</span>
              <span className="text-foreground">{goal.habit_cue.length > 50 ? goal.habit_cue.slice(0, 50) + '...' : goal.habit_cue}</span>
            </div>
          )}
          {goal.implementation_intention && (
            <div className="rounded bg-primary/10 p-2 text-xs italic text-muted-foreground">
              "{goal.implementation_intention}"
            </div>
          )}
        </div>
      )}

      {/* WOOP goal display */}
      {isWoop && (
        <div className="space-y-2 mb-4 text-sm">
          {goal.outcome_visualization && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground uppercase shrink-0">Outcome:</span>
              <span className="text-foreground">{goal.outcome_visualization.length > 80 ? goal.outcome_visualization.slice(0, 80) + '...' : goal.outcome_visualization}</span>
            </div>
          )}
          {goal.primary_obstacle && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground uppercase shrink-0">Obstacle:</span>
              <span className="text-foreground">{goal.primary_obstacle.length > 80 ? goal.primary_obstacle.slice(0, 80) + '...' : goal.primary_obstacle}</span>
            </div>
          )}
          {goal.implementation_intention && (
            <div className="rounded bg-violet-500/10 p-2 text-xs italic text-muted-foreground">
              "{goal.implementation_intention}"
            </div>
          )}
        </div>
      )}

      {!hasMilestones && !isLoading && onPlanMilestones && !isTimeMastery && !isHabit && (
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

      {/* Time-Mastery milestones display */}
      {isTimeMastery && hasMilestones && (
        <div className="pt-2 space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Milestones</div>
          <div className="space-y-1.5">
            {milestones.map((milestone, i) => (
              <div key={milestone.id} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">W{milestone.week_number}:</span>
                <span className="text-foreground">{milestone.description || `Target: ${milestone.target_value}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard goal progress display */}
      {!isTimeMastery && hasMilestones && (
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 uppercase tracking-wide">
            <span>Progress</span>
            <span className="nixie-display py-1 px-2 text-xs">
              {progressLoading ? '...' : `${progressPercent}%`}
            </span>
          </div>
          <div className="nixie-progress h-2">
            <div 
              className="nixie-progress-bar transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          {!progressLoading && actualValue > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Actual: {actualValue} {goal.metric_type}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
