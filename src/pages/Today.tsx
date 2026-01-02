import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCycles } from '@/hooks/useCycles';
import { useGoals } from '@/hooks/useGoals';
import { useDailyTactics } from '@/hooks/useDailyTactics';
import { useTacticLogs } from '@/hooks/useTacticLogs';
import { HabitItem } from '@/components/dashboard/HabitItem';
import { DailyScoreLogger } from '@/components/dashboard/DailyScoreLogger';
import { QuickTaskList } from '@/components/dashboard/QuickTaskList';
import { useQuickTasks } from '@/hooks/useQuickTasks';
import { format } from 'date-fns';
import { 
  Plus,
  Calendar,
  Repeat
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function Today() {
  const { getActiveCycle, getCurrentWeekNumber, isLoading: cyclesLoading } = useCycles();
  const activeCycle = getActiveCycle();
  const currentWeek = activeCycle ? getCurrentWeekNumber(activeCycle) : 0;
  
  const { goals } = useGoals(activeCycle?.id);
  const { toast } = useToast();

  // Get all daily tactics for goals in this cycle
  const goalIds = useMemo(() => goals.map(g => g.id), [goals]);
  const { data: allTactics = [] } = useDailyTactics(goalIds);
  
  // Get today's tactic logs
  const { logs, upsertLog, getLogForTactic, getStreak } = useTacticLogs();

  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newQuickTask, setNewQuickTask] = useState({
    title: '',
    category: 'personal' as 'personal' | 'business',
  });

  // Handle habit toggle/increment
  const handleHabitToggle = async (tacticId: string, newCount: number) => {
    try {
      await upsertLog.mutateAsync({ tacticId, completedCount: newCount });
      if (newCount > 0) {
        const tactic = allTactics.find(t => t.id === tacticId);
        if (tactic && newCount >= tactic.target_count) {
          toast({ title: 'Habit completed!', description: tactic.title });
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update habit', variant: 'destructive' });
    }
  };

  const { createTask: createQuickTask } = useQuickTasks();
  
  const handleAddTask = async () => {
    if (!newQuickTask.title.trim()) return;
    try {
      await createQuickTask.mutateAsync({
        title: newQuickTask.title.trim(),
        category: newQuickTask.category,
      });
      toast({ title: 'Task added' });
      setAddTaskOpen(false);
      setNewQuickTask({ title: '', category: 'personal' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add task', variant: 'destructive' });
    }
  };

  if (cyclesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!activeCycle) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">
            Create a cycle from the dashboard to start tracking your tasks.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Today</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • Week {currentWeek}
            </p>
          </div>
          <Button onClick={() => setAddTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Daily Habits Section */}
        {allTactics.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                Daily Habits ({allTactics.filter(t => {
                  const log = getLogForTactic(t.id);
                  return log && log.completed_count >= t.target_count;
                }).length}/{allTactics.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allTactics.map(tactic => {
                const goal = goals.find(g => g.id === tactic.goal_id);
                return (
                  <HabitItem
                    key={tactic.id}
                    tactic={tactic}
                    log={getLogForTactic(tactic.id)}
                    streak={getStreak(tactic.id, tactic.target_count)}
                    goalTitle={goal?.title || 'Unknown Goal'}
                    onToggle={handleHabitToggle}
                  />
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Quick Task List */}
        <QuickTaskList />

        {/* Daily Score Logger */}
        <DailyScoreLogger goals={goals} />
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task for Today</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                placeholder="What do you need to do?"
                value={newQuickTask.title}
                onChange={(e) => setNewQuickTask({ ...newQuickTask, title: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newQuickTask.category}
                onValueChange={(v) => setNewQuickTask({ ...newQuickTask, category: v as 'personal' | 'business' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask} disabled={!newQuickTask.title.trim()}>
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
