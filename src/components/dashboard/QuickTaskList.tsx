import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  ListTodo, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  Briefcase,
  User
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuickTasks, QuickTask } from '@/hooks/useQuickTasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function QuickTaskList() {
  const { activeTasks, completedTasks, isLoading, createTask, updateTask, deleteTask } = useQuickTasks();
  const { toast } = useToast();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'personal' | 'business'>('personal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'personal' | 'business'>('all');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      await createTask.mutateAsync({
        title: newTaskTitle.trim(),
        category: newTaskCategory,
      });
      setNewTaskTitle('');
      toast({ title: 'Task added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add task', variant: 'destructive' });
    }
  };

  const handleToggleComplete = async (task: QuickTask) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        completed: !task.completed,
      });
      if (!task.completed) {
        toast({ title: 'Task completed!' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    
    try {
      await updateTask.mutateAsync({
        id,
        title: editTitle.trim(),
      });
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteTask.mutateAsync(deleteId);
      setDeleteId(null);
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const startEdit = (task: QuickTask) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const filteredActiveTasks = activeTasks.filter(t => filter === 'all' || t.category === filter);
  const filteredCompletedTasks = completedTasks.filter(t => filter === 'all' || t.category === filter);

  const TaskItem = ({ task }: { task: QuickTask }) => {
    const isEditing = editingId === task.id;
    
    return (
      <div className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-md group hover:bg-muted/50 transition-colors",
        task.completed && "opacity-60"
      )}>
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => handleToggleComplete(task)}
          className="h-5 w-5 rounded-sm border-2"
        />
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(task.id);
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(task.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <span className={cn(
              "flex-1 text-sm",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </span>
            
            <Badge variant="outline" className="text-xs">
              {task.category === 'personal' ? (
                <><User className="h-3 w-3 mr-1" />Personal</>
              ) : (
                <><Briefcase className="h-3 w-3 mr-1" />Business</>
              )}
            </Badge>
            
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(task)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(task.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary" />
            Quick Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary" />
            Quick Tasks ({filteredActiveTasks.length})
          </CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add task form */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a quick task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
            }}
            className="flex-1"
          />
          <Select value={newTaskCategory} onValueChange={(v) => setNewTaskCategory(v as 'personal' | 'business')}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Personal
                </div>
              </SelectItem>
              <SelectItem value="business">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Business
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Active tasks */}
        {filteredActiveTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks yet. Add one above!
          </p>
        ) : (
          <div className="space-y-1">
            {filteredActiveTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Completed tasks toggle */}
        {filteredCompletedTasks.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <span>Completed ({filteredCompletedTasks.length})</span>
              {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showCompleted && (
              <div className="space-y-1 mt-2">
                {filteredCompletedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 py-2 px-3 group">
                    <TaskItem task={task} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}