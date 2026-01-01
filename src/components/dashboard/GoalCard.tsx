import { Goal } from '@/hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, MoreVertical, Trash2, Edit, CalendarCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMilestones } from '@/hooks/useMilestones';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onPlanMilestones?: (goal: Goal) => void;
}

const goalColors = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'bg-chart-3/10 text-chart-3 border-chart-3/20',
];

const borderColors = [
  'bg-primary',
  'bg-chart-2',
  'bg-chart-3',
];

export function GoalCard({ goal, index, onEdit, onDelete, onPlanMilestones }: GoalCardProps) {
  const colorClass = goalColors[index % goalColors.length];
  const borderColor = borderColors[index % borderColors.length];
  const { milestones, isLoading } = useMilestones(goal.id);
  const hasMilestones = milestones.length === 12;

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-y-0 left-0 w-1 ${borderColor}`} />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 ${colorClass}`}>
              <Target className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-xs">
              Goal {index + 1}
            </Badge>
            {!isLoading && (
              <Badge variant={hasMilestones ? 'default' : 'secondary'} className="text-xs">
                {hasMilestones ? 'Planned' : 'Not planned'}
              </Badge>
            )}
          </div>
          
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
        
        <CardTitle className="text-lg mt-2">{goal.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Target</span>
          <span className="font-medium">
            {goal.target_value.toLocaleString()} {goal.metric_type}
          </span>
        </div>
        
        {goal.why && (
          <div className="text-sm">
            <span className="text-muted-foreground">Why: </span>
            <span className="text-foreground">{goal.why}</span>
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
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>0%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div className="h-full w-0 rounded-full bg-primary transition-all" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
