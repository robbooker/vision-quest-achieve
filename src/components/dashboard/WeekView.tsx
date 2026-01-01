import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMilestones } from '@/hooks/useMilestones';
import { Goal } from '@/hooks/useGoals';
import { Cycle } from '@/hooks/useCycles';
import { format, addWeeks } from 'date-fns';
import { Target, Calendar } from 'lucide-react';

interface WeekViewProps {
  cycle: Cycle;
  goals: Goal[];
  currentWeek: number;
}

interface GoalMilestoneData {
  goal: Goal;
  milestone: {
    target_value: number;
    week_number: number;
  } | null;
}

export function WeekView({ cycle, goals, currentWeek }: WeekViewProps) {
  // Calculate week date range
  const weekStart = addWeeks(new Date(cycle.start_date), currentWeek - 1);
  const weekEnd = addWeeks(weekStart, 1);

  // We need to fetch milestones for all goals
  // Since hooks can't be called conditionally, we'll use the first goal's hook
  // and rely on the parent component to provide milestone data
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Week {currentWeek} of 12
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals set for this cycle yet.
          </p>
        ) : (
          goals.map((goal) => (
            <WeekGoalItem key={goal.id} goal={goal} currentWeek={currentWeek} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface WeekGoalItemProps {
  goal: Goal;
  currentWeek: number;
}

function WeekGoalItem({ goal, currentWeek }: WeekGoalItemProps) {
  const { milestones, isLoading } = useMilestones(goal.id);
  
  const currentMilestone = useMemo(() => 
    milestones.find(m => m.week_number === currentWeek),
    [milestones, currentWeek]
  );

  const cumulativeTarget = useMemo(() => 
    milestones
      .filter(m => m.week_number <= currentWeek)
      .reduce((sum, m) => sum + m.target_value, 0),
    [milestones, currentWeek]
  );

  const progressPercent = goal.target_value > 0 
    ? Math.round((cumulativeTarget / goal.target_value) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="animate-pulse h-16 bg-muted rounded-lg" />
    );
  }

  if (!currentMilestone) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30">
        <Target className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium text-sm">{goal.title}</p>
          <p className="text-xs text-muted-foreground">
            No milestones planned yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{goal.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {progressPercent}% of goal
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="flex-1 h-2" />
      </div>
      <p className="text-sm text-muted-foreground">
        Target this week: <span className="font-medium text-foreground">
          {currentMilestone.target_value.toLocaleString()} {goal.metric_type}
        </span>
      </p>
    </div>
  );
}
