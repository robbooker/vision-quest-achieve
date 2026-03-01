import { useState } from 'react';
import { useSprints } from '@/hooks/useSprints';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, Clock, LayoutGrid, List, Archive, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { SprintKanban } from './SprintKanban';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function SprintDashboard() {
  const { activeSprint, useSprintDetails, updateTaskStatus } = useSprints();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!activeSprint) return null;

  const { areas, tasks, isLoading } = useSprintDetails(activeSprint.id);

  if (isLoading) return null;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const daysRemaining = activeSprint.end_date ? differenceInDays(new Date(activeSprint.end_date), new Date()) : null;

  const currentWeek = activeSprint.start_date
    ? Math.ceil((differenceInDays(new Date(), new Date(activeSprint.start_date)) + 1) / 7)
    : 1;

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    updateTaskStatus.mutate({ taskId, status: newStatus });
  };

  const handleCompleteSprint = async () => {
    try {
      const { error } = await supabase
        .from('sprints')
        .update({ status: 'completed' })
        .eq('id', activeSprint.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast({ title: '🏁 Sprint completed!' });
    } catch {
      toast({ title: 'Error', description: 'Failed to complete sprint', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Sprint Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{activeSprint.name}</CardTitle>
              {activeSprint.goal && <CardDescription className="mt-1">{activeSprint.goal}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              {daysRemaining !== null && daysRemaining >= 0 && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {daysRemaining}d left
                </Badge>
              )}
              <Badge variant="secondary">Week {currentWeek}/{activeSprint.duration_weeks}</Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Archive className="h-3 w-3 mr-1" /> Complete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete this sprint?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive the sprint. {totalTasks - doneTasks} tasks are still incomplete.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCompleteSprint}>Complete Sprint</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{doneTasks}/{totalTasks} tasks</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Board / List */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board" className="gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" /> Board
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <List className="h-3.5 w-3.5" /> List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <SprintKanban />
        </TabsContent>

        <TabsContent value="list" className="mt-4 space-y-3">
          {areas.map(area => {
            const areaTasks = tasks.filter(t => t.area_of_focus_id === area.id);
            const areaComplete = areaTasks.filter(t => t.status === 'done').length;
            return (
              <Card key={area.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: area.color || '#6366f1' }} />
                    {area.name}
                    <Badge variant="secondary" className="text-xs ml-auto">{areaComplete}/{areaTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {areaTasks.map(task => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
                        task.status === 'done' ? 'opacity-60' : ''
                      }`}
                      onClick={() => handleToggleTask(task.id, task.status)}
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : task.status === 'in_progress' ? (
                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                      {task.week && (
                        <Badge variant="outline" className="text-xs">W{task.week}</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
