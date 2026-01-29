import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Plus, Trash2, Check, X, CheckCircle2, Rocket, Mountain } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BigTenProject, BigTenTask, BigTenCategory } from '@/hooks/useBigTen';
import { PILLARS, PillarKey } from '@/data/primedBehaviors';

interface BigTenCardProps {
  project?: BigTenProject;
  position: number;
  showAddButton?: boolean;
  showCategoryPicker?: boolean;
  onCreateProject: (title: string, position: number) => void;
  onUpdateProject: (id: string, title?: string, target_date?: string | null, completed?: boolean, category?: BigTenCategory | null, pillar?: string | null) => void;
  onDeleteProject: (id: string) => void;
  onCreateTask: (project_id: string, title: string, position: number) => void;
  onUpdateTask: (id: string, title?: string, completed?: boolean) => void;
  onDeleteTask: (id: string) => void;
}

export function BigTenCard({
  project,
  position,
  showAddButton = true,
  showCategoryPicker = false,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: BigTenCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(project?.title || '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [exitingTaskId, setExitingTaskId] = useState<string | null>(null);

  const tasks = project?.tasks || [];
  const canAddTask = tasks.length < 5;

  const handleCreateProject = () => {
    onCreateProject('New Project', position);
  };

  const handleSaveTitle = () => {
    if (project && editedTitle.trim()) {
      onUpdateProject(project.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (project) {
      onUpdateProject(project.id, undefined, date ? format(date, 'yyyy-MM-dd') : null);
    }
  };

  const handleCategoryChange = (category: BigTenCategory) => {
    if (project) {
      onUpdateProject(project.id, undefined, undefined, undefined, category, undefined);
    }
  };

  const handlePillarChange = (pillar: string) => {
    if (project) {
      onUpdateProject(project.id, undefined, undefined, undefined, undefined, pillar === 'none' ? null : pillar);
    }
  };

  const handleAddTask = () => {
    if (project && newTaskTitle.trim()) {
      const nextPosition = tasks.length + 1;
      onCreateTask(project.id, newTaskTitle.trim(), nextPosition);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = (task: BigTenTask) => {
    // If completing (not uncompleting), run animation first
    if (!task.completed) {
      setCompletingTaskId(task.id);
      
      setTimeout(() => {
        setExitingTaskId(task.id);
      }, 400);
      
      setTimeout(() => {
        onUpdateTask(task.id, undefined, true);
        setCompletingTaskId(null);
        setExitingTaskId(null);
        
        // Check if all tasks will be completed after this one
        // (excluding this task which is being completed)
        const incompleteTasks = tasks.filter(t => !t.completed && t.id !== task.id);
        if (incompleteTasks.length === 0 && tasks.length > 0 && project) {
          // All tasks complete - auto-archive the project after a brief delay
          setTimeout(() => {
            onUpdateProject(project.id, undefined, undefined, true);
          }, 300);
        }
      }, 650);
    } else {
      onUpdateTask(task.id, undefined, false);
    }
  };

  const handleSaveTaskTitle = (taskId: string) => {
    if (editedTaskTitle.trim()) {
      onUpdateTask(taskId, editedTaskTitle.trim());
    }
    setEditingTaskId(null);
  };

  // Empty card state - only show if showAddButton is true
  if (!project) {
    if (!showAddButton) return null;
    return (
      <Card
        className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer min-h-[200px] flex items-center justify-center"
        onClick={handleCreateProject}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">Add a Big 10 Project</span>
        </div>
      </Card>
    );
  }

  const handleCompleteProject = () => {
    onUpdateProject(project.id, undefined, undefined, true);
  };

  const categoryIcon = project.category === 'opportunity' 
    ? <Rocket className="h-4 w-4 text-primary" />
    : project.category === 'challenge'
    ? <Mountain className="h-4 w-4 text-orange-600 dark:text-orange-400" />
    : null;

  return (
    <Card className="min-h-[200px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="text-lg font-semibold"
              />
              <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {categoryIcon}
              <h3
                className={cn(
                  'text-lg font-semibold cursor-pointer hover:text-primary transition-colors',
                  project.completed && 'line-through text-muted-foreground'
                )}
                onClick={() => {
                  if (!project.completed) {
                    setEditedTitle(project.title);
                    setIsEditingTitle(true);
                  }
                }}
              >
                {project.title}
              </h3>
              {!project.completed && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={handleCompleteProject}
                  title="Mark as complete"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDeleteProject(project.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Category picker for uncategorized projects */}
        {showCategoryPicker && !project.category && (
          <div className="flex gap-2 pb-2 border-b border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border-primary/30 hover:bg-primary/10"
              onClick={() => handleCategoryChange('opportunity')}
            >
              <Rocket className="h-4 w-4" />
              Opportunity
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border-orange-500/30 hover:bg-orange-500/10"
              onClick={() => handleCategoryChange('challenge')}
            >
              <Mountain className="h-4 w-4" />
              Challenge
            </Button>
          </div>
        )}

        {/* Tasks list */}
        <div className="space-y-2 flex-1">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={cn(
                "flex items-center gap-2 group",
                completingTaskId === task.id && "task-completing",
                exitingTaskId === task.id && "task-exit"
              )}
            >
              <Checkbox
                checked={task.completed || completingTaskId === task.id}
                onCheckedChange={() => handleToggleTask(task)}
                className={cn(completingTaskId === task.id && "task-checkbox")}
                disabled={completingTaskId === task.id}
              />
              {editingTaskId === task.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editedTaskTitle}
                    onChange={(e) => setEditedTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTaskTitle(task.id);
                      if (e.key === 'Escape') setEditingTaskId(null);
                    }}
                    autoFocus
                    className="h-7 text-sm"
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveTaskTitle(task.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    className={cn(
                      'text-sm flex-1 cursor-pointer hover:text-primary transition-colors',
                      task.completed && 'line-through text-muted-foreground',
                      completingTaskId === task.id && 'task-text text-muted-foreground'
                    )}
                    onClick={() => {
                      if (completingTaskId !== task.id) {
                        setEditedTaskTitle(task.title);
                        setEditingTaskId(task.id);
                      }
                    }}
                  >
                    {task.title}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {/* Add task input */}
          {isAddingTask ? (
            <div className="flex items-center gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task description..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') setIsAddingTask(false);
                }}
                autoFocus
                className="h-8 text-sm"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAddTask}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsAddingTask(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : canAddTask ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add task
            </Button>
          ) : null}
        </div>

        {/* PRIMED Pillar selector */}
        <div className="pt-2 border-t border-border">
          <Select
            value={project.pillar || 'none'}
            onValueChange={handlePillarChange}
          >
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue placeholder="Assign to PRIMED pillar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No pillar</SelectItem>
              {(Object.keys(PILLARS) as PillarKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                      style={{ backgroundColor: PILLARS[key].color }}
                    >
                      {PILLARS[key].letter}
                    </span>
                    {PILLARS[key].name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target date */}
        <div className="pt-2 border-t border-border">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start text-sm',
                  !project.target_date && 'text-muted-foreground'
                )}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {project.target_date
                  ? format(new Date(project.target_date), 'PPP')
                  : 'Set target date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={project.target_date ? new Date(project.target_date) : undefined}
                onSelect={handleDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
