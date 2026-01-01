import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useCycles } from '@/hooks/useCycles';
import { useGoals } from '@/hooks/useGoals';
import { useTaskInstances, TaskInstance } from '@/hooks/useTaskInstances';
import { format, isToday, isBefore, startOfDay, addDays } from 'date-fns';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus,
  Calendar,
  Target,
  MessageSquare,
  X
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
  const { tasks, isLoading: tasksLoading, updateTask, createTask } = useTaskInstances(activeCycle?.id);
  const { toast } = useToast();

  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [noteTaskId, setNoteTaskId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    goal_id: '',
    duration_minutes: 60,
  });

  // Categorize tasks
  const { todayTasks, upcomingTasks, overdueTasks } = useMemo(() => {
    const today = startOfDay(new Date());
    const threeDaysAhead = addDays(today, 3);
    
    const todayTasks: TaskInstance[] = [];
    const upcomingTasks: TaskInstance[] = [];
    const overdueTasks: TaskInstance[] = [];

    tasks.forEach(task => {
      if (task.status === 'completed' || task.status === 'skipped') return;
      
      const dueDate = task.due_date ? startOfDay(new Date(task.due_date)) : null;
      const scheduledDate = task.scheduled_start ? startOfDay(new Date(task.scheduled_start)) : null;
      const taskDate = scheduledDate || dueDate;

      if (!taskDate) {
        // Unscheduled tasks for current week
        if (task.due_week === currentWeek) {
          upcomingTasks.push(task);
        }
        return;
      }

      if (isToday(taskDate)) {
        todayTasks.push(task);
      } else if (isBefore(taskDate, today)) {
        overdueTasks.push(task);
      } else if (taskDate <= threeDaysAhead) {
        upcomingTasks.push(task);
      }
    });

    return { todayTasks, upcomingTasks, overdueTasks };
  }, [tasks, currentWeek]);

  const handleToggleComplete = async (task: TaskInstance) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask.mutateAsync({ id: task.id, status: newStatus });
      if (newStatus === 'completed') {
        toast({ title: 'Task completed!', description: task.title });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleSaveNote = async () => {
    if (!noteTaskId) return;
    try {
      await updateTask.mutateAsync({ id: noteTaskId, notes: noteText });
      toast({ title: 'Note saved' });
      setNoteTaskId(null);
      setNoteText('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' });
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.goal_id || !activeCycle) return;
    try {
      await createTask.mutateAsync({
        cycle_id: activeCycle.id,
        goal_id: newTask.goal_id,
        title: newTask.title,
        due_week: currentWeek,
        due_date: new Date().toISOString().split('T')[0],
        duration_minutes: newTask.duration_minutes,
      });
      toast({ title: 'Task added' });
      setAddTaskOpen(false);
      setNewTask({ title: '', goal_id: '', duration_minutes: 60 });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add task', variant: 'destructive' });
    }
  };

  const openNoteDialog = (task: TaskInstance) => {
    setNoteTaskId(task.id);
    setNoteText(task.notes || '');
  };

  if (cyclesLoading || tasksLoading) {
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

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Overdue ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  goals={goals}
                  onToggle={handleToggleComplete}
                  onNote={openNoteDialog}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Today's Tasks ({todayTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks scheduled for today. Add one or check upcoming tasks.
              </p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    goals={goals}
                    onToggle={handleToggleComplete}
                    onNote={openNoteDialog}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Coming Up ({upcomingTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  goals={goals}
                  onToggle={handleToggleComplete}
                  onNote={openNoteDialog}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Today */}
        {tasks.filter(t => t.status === 'completed' && t.due_date === new Date().toISOString().split('T')[0]).length > 0 && (
          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks
                .filter(t => t.status === 'completed' && t.due_date === new Date().toISOString().split('T')[0])
                .map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    goals={goals}
                    onToggle={handleToggleComplete}
                    onNote={openNoteDialog}
                  />
                ))}
            </CardContent>
          </Card>
        )}
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
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Select
                value={newTask.goal_id}
                onValueChange={(v) => setNewTask({ ...newTask, goal_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={newTask.duration_minutes.toString()}
                onValueChange={(v) => setNewTask({ ...newTask, duration_minutes: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask} disabled={!newTask.title || !newTask.goal_id}>
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={!!noteTaskId} onOpenChange={(open) => !open && setNoteTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2 flex-wrap">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setNoteText(prev => prev + (prev ? ' ' : '') + 'Blocked:')}
              >
                🚫 Blocked
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setNoteText(prev => prev + (prev ? ' ' : '') + 'Took longer than expected.')}
              >
                ⏰ Overran
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setNoteText(prev => prev + (prev ? ' ' : '') + 'Completed faster than expected.')}
              >
                ⚡ Quick
              </Badge>
            </div>
            <Textarea
              placeholder="Add a note about this task..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteTaskId(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNote}>
                Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface TaskItemProps {
  task: TaskInstance;
  goals: { id: string; title: string }[];
  onToggle: (task: TaskInstance) => void;
  onNote: (task: TaskInstance) => void;
}

function TaskItem({ task, goals, onToggle, onNote }: TaskItemProps) {
  const goal = goals.find(g => g.id === task.goal_id);
  const isCompleted = task.status === 'completed';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      isCompleted ? 'bg-muted/30' : 'bg-card hover:bg-muted/50'
    } transition-colors`}>
      <button
        onClick={() => onToggle(task)}
        className="flex-shrink-0"
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {goal && (
            <Badge variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {goal.title}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {task.duration_minutes}m
          </span>
          {task.notes && (
            <Badge variant="outline" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Note
            </Badge>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNote(task)}
        className="flex-shrink-0"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
}
