import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Share2, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Users,
  User
} from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { useSharedTasks, SharedTask } from '@/hooks/useSharedTasks';
import { useFriendships, Friend } from '@/hooks/useFriendships';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { FriendManagement } from './FriendManagement';

interface SortableSharedTaskItemProps {
  task: SharedTask;
  isEditing: boolean;
  editTitle: string;
  isCompleting: boolean;
  isExiting: boolean;
  friends: Friend[];
  onEditTitleChange: (value: string) => void;
  onToggleComplete: (task: SharedTask) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (task: SharedTask) => void;
  onDelete: (id: string) => void;
  onUpdateShares: (taskId: string, sharedWith: string[]) => void;
}

function SortableSharedTaskItem({
  task,
  isEditing,
  editTitle,
  isCompleting,
  isExiting,
  friends,
  onEditTitleChange,
  onToggleComplete,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onUpdateShares,
}: SortableSharedTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !task.is_owner });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [selectedFriends, setSelectedFriends] = useState<string[]>(task.shared_with);

  const toggleFriend = (friendId: string) => {
    const newSelection = selectedFriends.includes(friendId)
      ? selectedFriends.filter(id => id !== friendId)
      : [...selectedFriends, friendId];
    setSelectedFriends(newSelection);
    onUpdateShares(task.id, newSelection);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 sm:gap-3 py-3 px-2 sm:px-3 rounded-md group hover:bg-muted/50 transition-colors",
        task.completed && "opacity-60",
        isDragging && "opacity-50 bg-muted shadow-lg z-10",
        isCompleting && "task-completing",
        isExiting && "task-exit"
      )}
    >
      {task.is_owner && !task.completed && !isCompleting && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {(!task.is_owner || task.completed || isCompleting) && <div className="w-4" />}
      
      <Checkbox
        checked={task.completed || isCompleting}
        onCheckedChange={() => onToggleComplete(task)}
        className={cn("h-5 w-5 rounded-sm border-2", isCompleting && "task-checkbox")}
        disabled={isCompleting}
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
            task.completed && "line-through text-muted-foreground",
            isCompleting && "task-text text-muted-foreground"
          )}>
            {task.title}
          </span>
          
          {/* Owner indicator */}
          <Badge variant={task.is_owner ? "default" : "secondary"} className="text-xs shrink-0">
            {task.is_owner ? (
              <><User className="h-3 w-3 mr-1" />You</>
            ) : (
              <><Share2 className="h-3 w-3 mr-1" />Shared</>
            )}
          </Badge>

          {/* Share selector for owned tasks */}
          {task.is_owner && friends.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                  <Users className="h-4 w-4" />
                  {task.shared_with.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                      {task.shared_with.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <p className="text-xs font-medium mb-2">Share with:</p>
                <div className="space-y-1">
                  {friends.map(friend => (
                    <label
                      key={friend.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friend.user_id)}
                        onCheckedChange={() => toggleFriend(friend.user_id)}
                      />
                      <span className="text-sm truncate">
                        {friend.display_name || friend.email}
                      </span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {task.is_owner && (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-7 sm:w-7" onClick={() => onStartEdit(task)}>
                  <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-7 sm:w-7 text-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SharedTaskList() {
  const { activeTasks, completedTasks, isLoading, createTask, updateTask, deleteTask, updateShares, reorderTasks } = useSharedTasks();
  const { friends } = useFriendships();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);

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
        sharedWith: selectedFriends,
      });
      setNewTaskTitle('');
      setSelectedFriends([]);
      toast({ title: 'Shared task added' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add task', variant: 'destructive' });
    }
  };

  const handleToggleComplete = async (task: SharedTask) => {
    if (!task.completed) {
      setCompletingId(task.id);
      
      setTimeout(() => {
        setExitingId(task.id);
      }, 400);
      
      setTimeout(async () => {
        try {
          await updateTask.mutateAsync({
            id: task.id,
            completed: true,
          });
          toast({ title: 'Task completed!' });
        } catch {
          toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
        } finally {
          setCompletingId(null);
          setExitingId(null);
        }
      }, 650);
    } else {
      try {
        await updateTask.mutateAsync({
          id: task.id,
          completed: false,
        });
      } catch {
        toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
      }
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
    } catch {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteTask.mutateAsync(deleteId);
      setDeleteId(null);
      toast({ title: 'Task deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleUpdateShares = async (taskId: string, sharedWith: string[]) => {
    try {
      await updateShares.mutateAsync({ taskId, sharedWith });
    } catch {
      toast({ title: 'Error', description: 'Failed to update shares', variant: 'destructive' });
    }
  };

  const startEdit = (task: SharedTask) => {
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
    
    const ownedActiveTasks = activeTasks.filter(t => t.is_owner);
    const oldIndex = ownedActiveTasks.findIndex(t => t.id === active.id);
    const newIndex = ownedActiveTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reorderedTasks = arrayMove(ownedActiveTasks, oldIndex, newIndex);
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }));
    
    try {
      await reorderTasks.mutateAsync(updates);
    } catch {
      toast({ title: 'Error', description: 'Failed to reorder tasks', variant: 'destructive' });
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Shared Tasks
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
    <>
      <Card className={cn(isMobile && "mb-24")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              Shared Tasks ({activeTasks.length})
            </CardTitle>
            <FriendManagement />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add task form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Add a shared task..."
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
            
            {/* Friend selection for new task */}
            {friends.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {friends.map(friend => (
                  <Button
                    key={friend.id}
                    type="button"
                    variant={selectedFriends.includes(friend.user_id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFriendSelection(friend.user_id)}
                  >
                    <User className="h-3 w-3 mr-1" />
                    {friend.display_name || friend.email}
                  </Button>
                ))}
              </div>
            )}
            
            {friends.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add friends to share tasks with them!
              </p>
            )}
          </div>

          {/* Active tasks with drag and drop */}
          {activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No shared tasks yet. Add one!
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {activeTasks.map(task => (
                    <SortableSharedTaskItem
                      key={task.id}
                      task={task}
                      isEditing={editingId === task.id}
                      editTitle={editTitle}
                      isCompleting={completingId === task.id}
                      isExiting={exitingId === task.id}
                      friends={friends}
                      onEditTitleChange={setEditTitle}
                      onToggleComplete={handleToggleComplete}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={cancelEdit}
                      onStartEdit={startEdit}
                      onDelete={setDeleteId}
                      onUpdateShares={handleUpdateShares}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Completed tasks toggle */}
          {completedTasks.length > 0 && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-[hsl(165_91%_63%)] hover:text-[hsl(165_91%_70%)] hover:bg-[hsl(165_91%_63%/0.1)]"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <span className="font-mono text-sm">COMPLETED ({completedTasks.length})</span>
                {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showCompleted && (
                <div className="space-y-1 mt-2">
                  {completedTasks.map(task => (
                    <SortableSharedTaskItem
                      key={task.id}
                      task={task}
                      isEditing={editingId === task.id}
                      editTitle={editTitle}
                      isCompleting={false}
                      isExiting={false}
                      friends={friends}
                      onEditTitleChange={setEditTitle}
                      onToggleComplete={handleToggleComplete}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={cancelEdit}
                      onStartEdit={startEdit}
                      onDelete={setDeleteId}
                      onUpdateShares={handleUpdateShares}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this shared task for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
