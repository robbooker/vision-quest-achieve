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
  User,
  GripVertical
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuickTasks, QuickTask } from '@/hooks/useQuickTasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SortableTaskItemProps {
  task: QuickTask;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (value: string) => void;
  onToggleComplete: (task: QuickTask) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (task: QuickTask) => void;
  onDelete: (id: string) => void;
}

function SortableTaskItem({
  task,
  isEditing,
  editTitle,
  onEditTitleChange,
  onToggleComplete,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 sm:gap-3 py-3 px-2 sm:px-3 rounded-md group hover:bg-muted/50 transition-colors",
        task.completed && "opacity-60",
        isDragging && "opacity-50 bg-muted shadow-lg z-10"
      )}
    >
      {!task.completed && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task)}
        className="h-5 w-5 rounded-sm border-2"
      />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit(task.id);
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onSaveEdit(task.id)}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className={cn(
            "flex-1 text-sm leading-snug",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </span>
          
          <Badge variant="outline" className="text-xs shrink-0 hidden sm:flex">
            {task.category === 'personal' ? (
              <><User className="h-3 w-3 mr-1" />Personal</>
            ) : (
              <><Briefcase className="h-3 w-3 mr-1" />Business</>
            )}
          </Badge>

          {/* Mobile: show icon only */}
          <Badge variant="outline" className="text-xs shrink-0 flex sm:hidden p-1.5">
            {task.category === 'personal' ? (
              <User className="h-3.5 w-3.5" />
            ) : (
              <Briefcase className="h-3.5 w-3.5" />
            )}
          </Badge>
          
          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-7 sm:w-7" onClick={() => onStartEdit(task)}>
              <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-7 sm:w-7 text-destructive" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function QuickTaskList() {
  const { activeTasks, completedTasks, isLoading, createTask, updateTask, deleteTask, reorderTasks } = useQuickTasks();
  const { toast } = useToast();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'personal' | 'business'>('personal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'personal' | 'business'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = filteredActiveTasks.findIndex(t => t.id === active.id);
    const newIndex = filteredActiveTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reorderedTasks = arrayMove(filteredActiveTasks, oldIndex, newIndex);
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }));
    
    try {
      await reorderTasks.mutateAsync(updates);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reorder tasks', variant: 'destructive' });
    }
  };

  const filteredActiveTasks = activeTasks.filter(t => filter === 'all' || t.category === filter);
  const filteredCompletedTasks = completedTasks.filter(t => filter === 'all' || t.category === filter);

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
        {/* Add task form - mobile optimized */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a quick task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
              }}
              className="flex-1 min-w-0 h-11 text-base"
            />
            <Button 
              size="icon" 
              onClick={handleAddTask} 
              disabled={!newTaskTitle.trim()}
              className="h-11 w-11 shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={newTaskCategory === 'personal' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-9"
              onClick={() => setNewTaskCategory('personal')}
            >
              <User className="h-4 w-4 mr-1.5" />
              Personal
            </Button>
            <Button
              type="button"
              variant={newTaskCategory === 'business' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-9"
              onClick={() => setNewTaskCategory('business')}
            >
              <Briefcase className="h-4 w-4 mr-1.5" />
              Business
            </Button>
          </div>
        </div>

        {/* Active tasks with drag and drop */}
        {filteredActiveTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks yet. Add one above!
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredActiveTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {filteredActiveTasks.map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isEditing={editingId === task.id}
                    editTitle={editTitle}
                    onEditTitleChange={setEditTitle}
                    onToggleComplete={handleToggleComplete}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={cancelEdit}
                    onStartEdit={startEdit}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isEditing={editingId === task.id}
                    editTitle={editTitle}
                    onEditTitleChange={setEditTitle}
                    onToggleComplete={handleToggleComplete}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={cancelEdit}
                    onStartEdit={startEdit}
                    onDelete={setDeleteId}
                  />
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