import { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
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
  GripVertical,
  Share2,
  Users,
  Target,
  Calendar
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { useSharedTasks, SharedTask } from '@/hooks/useSharedTasks';
import { useFriendships, Friend } from '@/hooks/useFriendships';
import { useCycles } from '@/hooks/useCycles';
import { useGoals } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCommandBar } from './MobileCommandBar';
import { FriendManagement } from './FriendManagement';
import { EditQuickTaskDialog } from './EditQuickTaskDialog';

type TaskCategory = 'personal' | 'business' | 'shared';

interface SortableTaskItemProps {
  task: QuickTask;
  isEditing: boolean;
  editTitle: string;
  isCompleting: boolean;
  isExiting: boolean;
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
  isCompleting,
  isExiting,
  onEditTitleChange,
  onToggleComplete,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
}: SortableTaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on checkbox, buttons, or input
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[role="checkbox"]')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col rounded-md group hover:bg-muted/50 transition-colors",
        task.completed && "opacity-60",
        isDragging && "opacity-50 bg-muted shadow-lg z-10",
        isCompleting && "task-completing",
        isExiting && "task-exit"
      )}
    >
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-2 sm:gap-3 sm:py-3 sm:px-3",
          !isEditing && "cursor-pointer sm:cursor-default"
        )}
        onClick={handleRowClick}
      >
        {/* Drag handle - desktop only */}
        {!task.completed && !isCompleting && (
          <button
            {...attributes}
            {...listeners}
            className="hidden sm:block cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {(task.completed || isCompleting) && <div className="hidden sm:block w-4 shrink-0" />}
        
        {/* Circular checkbox on mobile, square on desktop */}
        <Checkbox
          checked={task.completed || isCompleting}
          onCheckedChange={() => onToggleComplete(task)}
          className={cn(
            "shrink-0 border-2",
            "h-5 w-5 sm:h-5 sm:w-5 rounded-full sm:rounded-sm",
            isCompleting && "task-checkbox"
          )}
          disabled={isCompleting}
        />
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="h-8 flex-1 min-w-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(task.id);
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => onSaveEdit(task.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <span className={cn(
              "flex-1 text-sm leading-snug min-w-0 text-left",
              "line-clamp-2 sm:line-clamp-none",
              task.completed && "line-through text-muted-foreground",
              isCompleting && "task-text text-muted-foreground"
            )}>
              {task.title}
            </span>
            
            {/* Due date badge */}
            {task.due_date && !task.completed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) ? "destructive" : "outline"} 
                    className={cn(
                      "hidden sm:flex gap-1 text-xs shrink-0",
                      isToday(parseISO(task.due_date)) && "border-primary text-primary"
                    )}
                  >
                    <Calendar className="h-3 w-3 shrink-0" />
                    {isToday(parseISO(task.due_date)) 
                      ? 'Today' 
                      : isTomorrow(parseISO(task.due_date))
                        ? 'Tomorrow'
                        : format(parseISO(task.due_date), 'MMM d')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Due: {format(parseISO(task.due_date), 'PPP')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Goal badge */}
            {task.goal_title && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="hidden sm:flex gap-1 text-xs shrink-0 max-w-[120px]">
                    <Target className="h-3 w-3 shrink-0" />
                    <span className="truncate">{task.goal_title}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Linked to: {task.goal_title}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Desktop: show actions on hover */}
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onStartEdit(task)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(task.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Mobile: show chevron indicator for expand */}
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 sm:hidden transition-transform",
              isExpanded && "rotate-180"
            )} />
          </>
        )}
      </div>

      {/* Mobile expanded actions */}
      {isExpanded && !isEditing && (
        <div className="flex flex-col gap-2 px-2 pb-2 sm:hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Due date badge on mobile */}
          {task.due_date && !task.completed && (
            <Badge 
              variant={isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) ? "destructive" : "outline"} 
              className={cn(
                "self-start gap-1 text-xs",
                isToday(parseISO(task.due_date)) && "border-primary text-primary"
              )}
            >
              <Calendar className="h-3 w-3" />
              Due: {isToday(parseISO(task.due_date)) 
                ? 'Today' 
                : isTomorrow(parseISO(task.due_date))
                  ? 'Tomorrow'
                  : format(parseISO(task.due_date), 'MMM d')}
            </Badge>
          )}
          {/* Goal badge on mobile */}
          {task.goal_title && (
            <Badge variant="secondary" className="self-start gap-1 text-xs">
              <Target className="h-3 w-3" />
              {task.goal_title}
            </Badge>
          )}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-8 text-xs"
              onClick={() => {
                onStartEdit(task);
                setIsExpanded(false);
              }}
            >
              <Pencil className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Sync selectedFriends when task.shared_with changes (e.g., after mutation success)
  useEffect(() => {
    setSelectedFriends(task.shared_with);
  }, [task.shared_with]);

  const toggleFriend = (friendId: string) => {
    const newSelection = selectedFriends.includes(friendId)
      ? selectedFriends.filter(id => id !== friendId)
      : [...selectedFriends, friendId];
    setSelectedFriends(newSelection);
    onUpdateShares(task.id, newSelection);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on checkbox, buttons, or input
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[role="checkbox"]')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col rounded-md group hover:bg-muted/50 transition-colors",
        !task.is_owner && "border-l-2 border-l-primary/30",
        task.completed && "opacity-60",
        isDragging && "opacity-50 bg-muted shadow-lg z-10",
        isCompleting && "task-completing",
        isExiting && "task-exit"
      )}
    >
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-2 sm:gap-3 sm:py-3 sm:px-3",
          !isEditing && "cursor-pointer sm:cursor-default"
        )}
        onClick={handleRowClick}
      >
        {/* Drag handle - desktop only, owner only */}
        {task.is_owner && !task.completed && !isCompleting && (
          <button
            {...attributes}
            {...listeners}
            className="hidden sm:block cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {(!task.is_owner || task.completed || isCompleting) && <div className="hidden sm:block w-4 shrink-0" />}
        
        {/* Circular checkbox on mobile, square on desktop */}
        <Checkbox
          checked={task.completed || isCompleting}
          onCheckedChange={() => onToggleComplete(task)}
          className={cn(
            "shrink-0 border-2",
            "h-5 w-5 sm:h-5 sm:w-5 rounded-full sm:rounded-sm",
            isCompleting && "task-checkbox"
          )}
          disabled={isCompleting}
        />
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="h-8 flex-1 min-w-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(task.id);
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => onSaveEdit(task.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <span className={cn(
              "flex-1 text-sm leading-snug min-w-0 text-left",
              "line-clamp-2 sm:line-clamp-none",
              task.completed && "line-through text-muted-foreground",
              isCompleting && "task-text text-muted-foreground"
            )}>
              {task.title}
            </span>
            
            {/* Owner indicator - desktop only */}
            <Badge variant={task.is_owner ? "default" : "secondary"} className="text-xs shrink-0 hidden sm:flex">
              {task.is_owner ? (
                <><User className="h-3 w-3 mr-1" />You</>
              ) : (
                <><Share2 className="h-3 w-3 mr-1" />Shared</>
              )}
            </Badge>

            {/* Share selector for owned tasks - desktop */}
            {task.is_owner && friends.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 relative hidden sm:flex">
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
            
            {/* Desktop: show actions on hover */}
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {task.is_owner && (
                <>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onStartEdit(task)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(task.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>

            {/* Mobile: show chevron indicator for expand */}
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 sm:hidden transition-transform",
              isExpanded && "rotate-180"
            )} />
          </>
        )}
      </div>

      {/* Mobile expanded actions */}
      {isExpanded && !isEditing && (
        <div className="flex flex-wrap items-center gap-2 px-2 pb-2 sm:hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Owner badge on mobile */}
          <Badge variant={task.is_owner ? "default" : "secondary"} className="text-xs">
            {task.is_owner ? "You" : "Shared"}
          </Badge>
          
          {task.is_owner && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 h-8 text-xs"
                onClick={() => {
                  onStartEdit(task);
                  setIsExpanded(false);
                }}
              >
                <Pencil className="h-3 w-3 mr-1.5" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Delete
              </Button>
              
              {/* Share selector for mobile */}
              {friends.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs relative">
                      <Users className="h-3 w-3 mr-1.5" />
                      Share
                      {task.shared_with.length > 0 && (
                        <span className="ml-1.5 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                          {task.shared_with.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function QuickTaskList() {
  const { activeTasks: quickActiveTasks, completedTasks: quickCompletedTasks, isLoading: quickLoading, createTask: createQuickTask, updateTask: updateQuickTask, deleteTask: deleteQuickTask, reorderTasks: reorderQuickTasks } = useQuickTasks();
  const { activeTasks: sharedActiveTasks, completedTasks: sharedCompletedTasks, isLoading: sharedLoading, createTask: createSharedTask, updateTask: updateSharedTask, deleteTask: deleteSharedTask, updateShares, reorderTasks: reorderSharedTasks } = useSharedTasks();
  const { friends } = useFriendships();
  const { getActiveCycle } = useCycles();
  const activeCycle = getActiveCycle();
  const { goals } = useGoals(activeCycle?.id);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('personal');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingQuickTask, setEditingQuickTask] = useState<QuickTask | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'quick' | 'shared'>('quick');
  const [showCompleted, setShowCompleted] = useState(false);
  const [filter, setFilter] = useState<TaskCategory>('personal');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [selectedFriendsForNew, setSelectedFriendsForNew] = useState<string[]>([]);

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

  const isLoading = quickLoading || sharedLoading;

  const handleAddTask = async (title?: string, category?: TaskCategory, goalId?: string | null) => {
    const taskTitle = title || newTaskTitle;
    const taskCategory = category || newTaskCategory;
    const taskGoalId = goalId !== undefined ? goalId : selectedGoalId;
    
    if (!taskTitle.trim()) return;
    
    try {
      if (taskCategory === 'shared') {
        await createSharedTask.mutateAsync({
          title: taskTitle.trim(),
          sharedWith: selectedFriendsForNew,
        });
        setSelectedFriendsForNew([]);
      } else {
        await createQuickTask.mutateAsync({
          title: taskTitle.trim(),
          category: taskCategory,
          goal_id: taskGoalId,
        });
      }
      if (!title) {
        setNewTaskTitle('');
        setSelectedGoalId(null);
      }
      toast({ title: 'Task added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add task', variant: 'destructive' });
      throw error;
    }
  };

  const handleToggleQuickComplete = async (task: QuickTask) => {
    if (!task.completed) {
      setCompletingId(task.id);
      
      setTimeout(() => {
        setExitingId(task.id);
      }, 400);
      
      setTimeout(async () => {
        try {
          await updateQuickTask.mutateAsync({
            id: task.id,
            completed: true,
          });
          toast({ title: 'Task completed!' });
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
        } finally {
          setCompletingId(null);
          setExitingId(null);
        }
      }, 650);
    } else {
      try {
        await updateQuickTask.mutateAsync({
          id: task.id,
          completed: false,
        });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
      }
    }
  };

  const handleToggleSharedComplete = async (task: SharedTask) => {
    if (!task.completed) {
      setCompletingId(task.id);
      
      setTimeout(() => {
        setExitingId(task.id);
      }, 400);
      
      setTimeout(async () => {
        try {
          await updateSharedTask.mutateAsync({
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
        await updateSharedTask.mutateAsync({
          id: task.id,
          completed: false,
        });
      } catch {
        toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
      }
    }
  };

  const handleSaveQuickEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    
    try {
      await updateQuickTask.mutateAsync({
        id,
        title: editTitle.trim(),
      });
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleSaveSharedEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    
    try {
      await updateSharedTask.mutateAsync({
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
      if (deleteType === 'shared') {
        await deleteSharedTask.mutateAsync(deleteId);
      } else {
        await deleteQuickTask.mutateAsync(deleteId);
      }
      setDeleteId(null);
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const startQuickEdit = (task: QuickTask) => {
    setEditingQuickTask(task);
  };

  const handleSaveQuickTaskWithDueDate = async (id: string, title: string, dueDate: string | null, pillar: string | null) => {
    try {
      await updateQuickTask.mutateAsync({
        id,
        title,
        due_date: dueDate,
        pillar,
      });
      toast({ title: 'Task updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
      throw error;
    }
  };

  const startSharedEdit = (task: SharedTask) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleQuickDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = filteredQuickActiveTasks.findIndex(t => t.id === active.id);
    const newIndex = filteredQuickActiveTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reorderedTasks = arrayMove(filteredQuickActiveTasks, oldIndex, newIndex);
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }));
    
    try {
      await reorderQuickTasks.mutateAsync(updates);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reorder tasks', variant: 'destructive' });
    }
  };

  const handleSharedDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const ownedActiveTasks = sharedActiveTasks.filter(t => t.is_owner);
    const oldIndex = ownedActiveTasks.findIndex(t => t.id === active.id);
    const newIndex = ownedActiveTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reorderedTasks = arrayMove(ownedActiveTasks, oldIndex, newIndex);
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      position: index,
    }));
    
    try {
      await reorderSharedTasks.mutateAsync(updates);
    } catch {
      toast({ title: 'Error', description: 'Failed to reorder tasks', variant: 'destructive' });
    }
  };

  const handleUpdateShares = async (taskId: string, sharedWith: string[]) => {
    try {
      await updateShares.mutateAsync({ taskId, sharedWith });
    } catch {
      toast({ title: 'Error', description: 'Failed to update shares', variant: 'destructive' });
    }
  };

  const toggleFriendSelectionForNew = (friendId: string) => {
    setSelectedFriendsForNew(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredQuickActiveTasks = quickActiveTasks.filter(t => t.category === filter);
  const filteredQuickCompletedTasks = quickCompletedTasks.filter(t => t.category === filter);

  // Compute task count for header based on filter
  const taskCount = filter === 'shared' ? sharedActiveTasks.length : filteredQuickActiveTasks.length;
  const completedTaskCount = filter === 'shared' ? sharedCompletedTasks.length : filteredQuickCompletedTasks.length;

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
    <>
      <Card className={cn(isMobile && "mb-24")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              Quick Tasks ({taskCount})
            </CardTitle>
            {filter === 'shared' && <FriendManagement />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile category filter tabs */}
          {isMobile && (
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
              <button
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors",
                  filter === 'personal' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  setNewTaskCategory('personal');
                  setFilter('personal');
                }}
              >
                <User className="h-3.5 w-3.5" />
                Personal
              </button>
              <button
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors",
                  filter === 'business' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  setNewTaskCategory('business');
                  setFilter('business');
                }}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Business
              </button>
              <button
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors",
                  filter === 'shared' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  setNewTaskCategory('shared');
                  setFilter('shared');
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
                Shared
              </button>
            </div>
          )}

          {/* Add task form - desktop only */}
          {!isMobile && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={filter === 'shared' ? "Add a shared task..." : "Add a quick task..."}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask();
                  }}
                  className="flex-1 min-w-0 h-11 text-base"
                />
                <Button 
                  size="icon" 
                  onClick={() => handleAddTask()} 
                  disabled={!newTaskTitle.trim()}
                  className="h-11 w-11 shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={filter === 'personal' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => {
                    setNewTaskCategory('personal');
                    setFilter('personal');
                  }}
                >
                  <User className="h-4 w-4 mr-1.5" />
                  Personal
                </Button>
                <Button
                  type="button"
                  variant={filter === 'business' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => {
                    setNewTaskCategory('business');
                    setFilter('business');
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-1.5" />
                  Business
                </Button>
                <Button
                  type="button"
                  variant={filter === 'shared' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => {
                    setNewTaskCategory('shared');
                    setFilter('shared');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Shared
                </Button>
              </div>
              
              {/* Goal selection for personal/business tasks */}
              {filter !== 'shared' && goals.length > 0 && (
                <Select
                  value={selectedGoalId || "none"}
                  onValueChange={(value) => setSelectedGoalId(value === "none" ? null : value)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Link to goal (optional)" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal</SelectItem>
                    {goals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Friend selection for shared tasks */}
              {filter === 'shared' && friends.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {friends.map(friend => (
                    <Button
                      key={friend.id}
                      type="button"
                      variant={selectedFriendsForNew.includes(friend.user_id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFriendSelectionForNew(friend.user_id)}
                    >
                      <User className="h-3 w-3 mr-1" />
                      {friend.display_name || friend.email}
                    </Button>
                  ))}
                </div>
              )}
              
              {filter === 'shared' && friends.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add friends to share tasks with them!
                </p>
              )}
            </div>
          )}

          {/* Task list - Personal/Business */}
          {filter !== 'shared' && (
            <>
              {filteredQuickActiveTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet. Add one!
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleQuickDragEnd}
                >
                  <SortableContext
                    items={filteredQuickActiveTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {filteredQuickActiveTasks.map(task => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          isEditing={editingId === task.id}
                          editTitle={editTitle}
                          isCompleting={completingId === task.id}
                          isExiting={exitingId === task.id}
                          onEditTitleChange={setEditTitle}
                          onToggleComplete={handleToggleQuickComplete}
                          onSaveEdit={handleSaveQuickEdit}
                          onCancelEdit={cancelEdit}
                          onStartEdit={startQuickEdit}
                          onDelete={(id) => {
                            setDeleteId(id);
                            setDeleteType('quick');
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Completed quick tasks toggle */}
              {filteredQuickCompletedTasks.length > 0 && (
                <div className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-[hsl(165_91%_63%)] hover:text-[hsl(165_91%_70%)] hover:bg-[hsl(165_91%_63%/0.1)]"
                    onClick={() => setShowCompleted(!showCompleted)}
                  >
                    <span className="font-mono text-sm">COMPLETED ({filteredQuickCompletedTasks.length})</span>
                    {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  
                  {showCompleted && (
                    <div className="space-y-1 mt-2">
                      {filteredQuickCompletedTasks.map(task => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          isEditing={editingId === task.id}
                          editTitle={editTitle}
                          isCompleting={false}
                          isExiting={false}
                          onEditTitleChange={setEditTitle}
                          onToggleComplete={handleToggleQuickComplete}
                          onSaveEdit={handleSaveQuickEdit}
                          onCancelEdit={cancelEdit}
                          onStartEdit={startQuickEdit}
                          onDelete={(id) => {
                            setDeleteId(id);
                            setDeleteType('quick');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Task list - Shared */}
          {filter === 'shared' && (
            <>
              {sharedActiveTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No shared tasks yet. Add one!
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSharedDragEnd}
                >
                  <SortableContext
                    items={sharedActiveTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {sharedActiveTasks.map(task => (
                        <SortableSharedTaskItem
                          key={task.id}
                          task={task}
                          isEditing={editingId === task.id}
                          editTitle={editTitle}
                          isCompleting={completingId === task.id}
                          isExiting={exitingId === task.id}
                          friends={friends}
                          onEditTitleChange={setEditTitle}
                          onToggleComplete={handleToggleSharedComplete}
                          onSaveEdit={handleSaveSharedEdit}
                          onCancelEdit={cancelEdit}
                          onStartEdit={startSharedEdit}
                          onDelete={(id) => {
                            setDeleteId(id);
                            setDeleteType('shared');
                          }}
                          onUpdateShares={handleUpdateShares}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Completed shared tasks toggle */}
              {sharedCompletedTasks.length > 0 && (
                <div className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-[hsl(165_91%_63%)] hover:text-[hsl(165_91%_70%)] hover:bg-[hsl(165_91%_63%/0.1)]"
                    onClick={() => setShowCompleted(!showCompleted)}
                  >
                    <span className="font-mono text-sm">COMPLETED ({sharedCompletedTasks.length})</span>
                    {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  
                  {showCompleted && (
                    <div className="space-y-1 mt-2">
                      {sharedCompletedTasks.map(task => (
                        <SortableSharedTaskItem
                          key={task.id}
                          task={task}
                          isEditing={editingId === task.id}
                          editTitle={editTitle}
                          isCompleting={false}
                          isExiting={false}
                          friends={friends}
                          onEditTitleChange={setEditTitle}
                          onToggleComplete={handleToggleSharedComplete}
                          onSaveEdit={handleSaveSharedEdit}
                          onCancelEdit={cancelEdit}
                          onStartEdit={startSharedEdit}
                          onDelete={(id) => {
                            setDeleteId(id);
                            setDeleteType('shared');
                          }}
                          onUpdateShares={handleUpdateShares}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
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

        {/* Edit Quick Task Dialog */}
        <EditQuickTaskDialog
          open={!!editingQuickTask}
          onOpenChange={(open) => {
            if (!open) setEditingQuickTask(null);
          }}
          task={editingQuickTask}
          onSave={handleSaveQuickTaskWithDueDate}
        />
      </Card>

      {/* Mobile Command Bar */}
      {isMobile && (
        <MobileCommandBar 
          onAddTask={handleAddTask} 
          currentCategory={filter}
          onCategoryChange={(category) => {
            setNewTaskCategory(category);
            setFilter(category);
          }}
        />
      )}
    </>
  );
}
