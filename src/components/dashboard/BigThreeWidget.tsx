import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useBigThree, BigThreeProject, BigThreePhase } from '@/hooks/useBigThree';
import { Layers, Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function AddProjectForm({ position, onAdd }: { position: number; onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle('');
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Project title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" variant="outline" className="h-8 shrink-0">
        <Plus className="h-3 w-3" />
      </Button>
    </form>
  );
}

function AddInlineForm({ placeholder, onAdd }: { placeholder: string; onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <Plus className="h-3 w-3" /> {placeholder}
      </button>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle('');
    setOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
      <Input
        placeholder={placeholder}
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-7 text-xs"
        autoFocus
        onBlur={() => { if (!title.trim()) setOpen(false); }}
      />
      <Button type="submit" size="sm" variant="ghost" className="h-7 px-2">
        <Plus className="h-3 w-3" />
      </Button>
    </form>
  );
}

function PhaseSection({ phase, onToggleTask, onAddTask, onDeleteTask }: {
  phase: BigThreePhase;
  onToggleTask: (id: string, completed: boolean) => void;
  onAddTask: (phaseId: string, title: string) => void;
  onDeleteTask: (id: string) => void;
}) {
  return (
    <AccordionItem value={phase.id} className="border-b-0">
      <AccordionTrigger className="py-2 text-sm hover:no-underline">
        <span className="flex items-center gap-2">
          <span className="font-medium">{phase.title}</span>
          <span className="text-xs text-muted-foreground">
            {phase.tasks.filter(t => t.completed).length}/{phase.tasks.length}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-2">
        {phase.description && (
          <p className="text-xs text-muted-foreground mb-2">{phase.description}</p>
        )}
        <div className="space-y-1">
          {phase.tasks.map(task => (
            <div key={task.id} className="flex items-start gap-2 group">
              <Checkbox
                checked={task.completed}
                onCheckedChange={checked => onToggleTask(task.id, !!checked)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
                {task.description && (
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                )}
              </div>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <AddInlineForm
          placeholder="Add task..."
          onAdd={title => onAddTask(phase.id, title)}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

function ProjectCard({ project, onToggleTask, onAddTask, onDeleteTask, onAddPhase }: {
  project: BigThreeProject;
  onToggleTask: (id: string, completed: boolean) => void;
  onAddTask: (phaseId: string, title: string) => void;
  onDeleteTask: (id: string) => void;
  onAddPhase: (projectId: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalTasks = project.phases.reduce((sum, ph) => sum + ph.tasks.length, 0);
  const completedTasks = project.phases.reduce((sum, ph) => sum + ph.tasks.filter(t => t.completed).length, 0);
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{project.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />}
      </button>

      {expanded && (
        <div className="pt-1">
          {project.description && (
            <p className="text-xs text-muted-foreground mb-2">{project.description}</p>
          )}
          {project.phases.length > 0 ? (
            <Accordion type="multiple" className="space-y-0">
              {project.phases.map(phase => (
                <PhaseSection
                  key={phase.id}
                  phase={phase}
                  onToggleTask={onToggleTask}
                  onAddTask={onAddTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </Accordion>
          ) : (
            <p className="text-xs text-muted-foreground">No phases yet</p>
          )}
          <AddInlineForm
            placeholder="Add phase..."
            onAdd={title => onAddPhase(project.id, title)}
          />
        </div>
      )}
    </div>
  );
}

export function BigThreeWidget() {
  const { projects, isLoading, addProject, addPhase, addTask, toggleTask, deleteTask } = useBigThree();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            The Big 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAddTask = (phaseId: string, title: string) => {
    const phase = projects.flatMap(p => p.phases).find(ph => ph.id === phaseId);
    addTask.mutate({
      phase_id: phaseId,
      title,
      position: phase ? phase.tasks.length : 0,
    });
  };

  const handleAddPhase = (projectId: string, title: string) => {
    const project = projects.find(p => p.id === projectId);
    addPhase.mutate({
      project_id: projectId,
      title,
      position: project ? project.phases.length : 0,
    });
  };

  const handleToggleTask = (id: string, completed: boolean) => {
    toggleTask.mutate({ id, completed });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate(id);
  };

  const handleAddProject = (title: string) => {
    addProject.mutate({ title, position: projects.length + 1 });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          The Big 3
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onAddPhase={handleAddPhase}
              />
            ))}
          </div>
        ) : null}
        {projects.length < 3 && (
          <div className={projects.length > 0 ? 'mt-3' : ''}>
            <AddProjectForm position={projects.length + 1} onAdd={handleAddProject} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
