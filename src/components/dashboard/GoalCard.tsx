import { Goal } from '@/hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, MoreVertical, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
}

const goalColors = [
  'bg-blue-500/10 text-blue-700 border-blue-500/20',
  'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'bg-violet-500/10 text-violet-700 border-violet-500/20',
];

export function GoalCard({ goal, index, onEdit, onDelete }: GoalCardProps) {
  const colorClass = goalColors[index % goalColors.length];

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-y-0 left-0 w-1 ${colorClass.split(' ')[0].replace('/10', '')}`} />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 ${colorClass}`}>
              <Target className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-xs">
              Goal {index + 1}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            {goal.target_value} {goal.metric_type}
          </span>
        </div>
        
        {goal.why && (
          <div className="text-sm">
            <span className="text-muted-foreground">Why: </span>
            <span className="text-foreground">{goal.why}</span>
          </div>
        )}

        {/* Progress placeholder - will be calculated from milestones/tasks later */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>0%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div className="h-full w-0 rounded-full bg-primary transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
