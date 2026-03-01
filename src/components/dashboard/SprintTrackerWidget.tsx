import { useSprints } from '@/hooks/useSprints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, Rocket, ArrowRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function SprintTrackerWidget() {
  const { activeSprint, useSprintDetails, updateTaskStatus } = useSprints();
  const { areas, tasks, isLoading } = useSprintDetails(activeSprint?.id ?? null);
  const navigate = useNavigate();

  if (!activeSprint || isLoading) return null;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const currentWeek = activeSprint.start_date
    ? Math.ceil((differenceInDays(new Date(), new Date(activeSprint.start_date)) + 1) / 7)
    : 1;

  // Get next-up tasks: in_progress first, then todo, limited to 3
  const nextUpTasks = [
    ...tasks.filter(t => t.status === 'in_progress'),
    ...tasks.filter(t => t.status === 'todo'),
  ].slice(0, 3);

  const handleToggle = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : currentStatus === 'in_progress' ? 'done' : 'in_progress';
    updateTaskStatus.mutate({ taskId, status: newStatus });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Sprint
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/sprints')}>
            Board <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{activeSprint.name} • W{currentWeek}</span>
            <span>{doneTasks}/{totalTasks}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Next up tasks */}
        {nextUpTasks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Next Up</p>
            {nextUpTasks.map(task => {
              const area = areas.find(a => a.id === task.area_of_focus_id);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleToggle(task.id, task.status)}
                >
                  {task.status === 'in_progress' ? (
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  {area && (
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: area.color || '#6366f1' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {nextUpTasks.length === 0 && totalTasks > 0 && (
          <div className="text-center py-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">All tasks done! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
