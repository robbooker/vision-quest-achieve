import { useState } from 'react';
import { useSprints, SprintTask, SprintArea } from '@/hooks/useSprints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, CheckCircle2, Circle, Clock, ArrowRight, 
  MoreHorizontal, SkipForward 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS: { key: SprintTask['status']; label: string; icon: React.ReactNode }[] = [
  { key: 'todo', label: 'To Do', icon: <Circle className="h-3.5 w-3.5 text-muted-foreground" /> },
  { key: 'in_progress', label: 'In Progress', icon: <Clock className="h-3.5 w-3.5 text-primary" /> },
  { key: 'done', label: 'Done', icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> },
];

function DraggableTask({ task, area, onStatusChange }: { 
  task: SprintTask; 
  area?: SprintArea;
  onStatusChange: (taskId: string, status: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card className="border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button {...listeners} {...attributes} className="mt-0.5 cursor-grab active:cursor-grabbing touch-none">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                {area && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    <span className="h-1.5 w-1.5 rounded-full mr-1 inline-block" style={{ backgroundColor: area.color || '#6366f1' }} />
                    {area.name}
                  </Badge>
                )}
                {task.week && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">W{task.week}</Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {task.status !== 'todo' && (
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                    <Circle className="h-3.5 w-3.5 mr-2" /> Move to To Do
                  </DropdownMenuItem>
                )}
                {task.status !== 'in_progress' && (
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in_progress')}>
                    <Clock className="h-3.5 w-3.5 mr-2" /> Move to In Progress
                  </DropdownMenuItem>
                )}
                {task.status !== 'done' && (
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, 'done')}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Done
                  </DropdownMenuItem>
                )}
                {task.status !== 'skipped' && (
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, 'skipped')}>
                    <SkipForward className="h-3.5 w-3.5 mr-2" /> Skip
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DroppableColumn({ status, children, count }: { 
  status: string; 
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const col = COLUMNS.find(c => c.key === status)!;

  return (
    <div className="flex-1 min-w-[250px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        {col.icon}
        <span className="text-sm font-medium">{col.label}</span>
        <Badge variant="secondary" className="text-xs ml-auto">{count}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[120px] rounded-lg p-2 transition-colors ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/30'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function SprintKanban() {
  const { activeSprint, useSprintDetails, updateTaskStatus } = useSprints();
  const { areas, tasks, isLoading } = useSprintDetails(activeSprint?.id ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState<string | 'all'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!activeSprint || isLoading) return null;

  const handleStatusChange = (taskId: string, status: string) => {
    updateTaskStatus.mutate({ taskId, status });
  };
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    
    const taskId = String(active.id);
    const newStatus = String(over.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (task && COLUMNS.some(c => c.key === newStatus) && task.status !== newStatus) {
      handleStatusChange(taskId, newStatus);
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const filteredTasks = filterArea === 'all' ? tasks : tasks.filter(t => t.area_of_focus_id === filterArea);

  return (
    <div className="space-y-4">
      {/* Area filter chips */}
      {areas.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filterArea === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilterArea('all')}
          >
            All
          </Button>
          {areas.map(area => (
            <Button
              key={area.id}
              variant={filterArea === area.id ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterArea(area.id)}
            >
              <span className="h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: area.color || '#6366f1' }} />
              {area.name}
            </Button>
          ))}
        </div>
      )}

      {/* Kanban columns */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
            return (
              <DroppableColumn key={col.key} status={col.key} count={colTasks.length}>
                {colTasks.map(task => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    area={areas.find(a => a.id === task.area_of_focus_id)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <Card className="border shadow-lg rotate-2">
              <CardContent className="p-3">
                <p className="text-sm font-medium">{activeTask.title}</p>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
