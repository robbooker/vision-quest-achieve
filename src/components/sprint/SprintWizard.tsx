import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSprints, DraftArea, DraftTask, SprintTemplate } from '@/hooks/useSprints';
import { useToast } from '@/hooks/use-toast';
import { 
  Rocket, ChevronRight, ChevronLeft, CheckCircle2, Plus, Trash2, GripVertical,
  Zap, Target, FileText
} from 'lucide-react';

const AREA_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

function generateId() {
  return crypto.randomUUID();
}

interface WizardState {
  step: number;
  selectedTemplate: SprintTemplate | null;
  name: string;
  goal: string;
  durationWeeks: number;
  areas: DraftArea[];
  tasks: DraftTask[];
}

export function SprintWizard({ onComplete }: { onComplete: () => void }) {
  const { templates, templatesLoading, launchSprint } = useSprints();
  const { toast } = useToast();

  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedTemplate: null,
    name: '',
    goal: '',
    durationWeeks: 8,
    areas: [],
    tasks: [],
  });

  const [newAreaName, setNewAreaName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Step 1: Pick template
  const handleSelectTemplate = (template: SprintTemplate) => {
    const tasks: DraftTask[] = (template.default_tasks || []).map((t: any, i: number) => ({
      draft_id: generateId(),
      title: t.title,
      description: t.description || '',
      week: t.week ?? null,
      day_range: t.day_range || '',
      sort_order: t.sort_order ?? i,
      area_draft_id: '', // assigned in step 3
      template_task_order: i,
    }));

    setState(s => ({
      ...s,
      step: 2,
      selectedTemplate: template,
      name: template.name,
      durationWeeks: template.duration_weeks,
      tasks,
    }));
  };

  // Step 2: metadata + areas
  const handleAddArea = () => {
    if (!newAreaName.trim() || state.areas.length >= 3) return;
    const color = AREA_COLORS[state.areas.length % AREA_COLORS.length];
    setState(s => ({
      ...s,
      areas: [...s.areas, { draft_id: generateId(), name: newAreaName.trim(), color, sort_order: s.areas.length }],
    }));
    setNewAreaName('');
  };

  const handleRemoveArea = (draftId: string) => {
    setState(s => ({
      ...s,
      areas: s.areas.filter(a => a.draft_id !== draftId),
      tasks: s.tasks.map(t => t.area_draft_id === draftId ? { ...t, area_draft_id: '' } : t),
    }));
  };

  // Step 3: task editor
  const handleTaskAreaChange = (taskDraftId: string, areaDraftId: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.draft_id === taskDraftId ? { ...t, area_draft_id: areaDraftId } : t),
    }));
  };

  const handleTaskTitleChange = (taskDraftId: string, title: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.draft_id === taskDraftId ? { ...t, title } : t),
    }));
  };

  const handleTaskDescChange = (taskDraftId: string, description: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.draft_id === taskDraftId ? { ...t, description } : t),
    }));
  };

  const handleTaskWeekChange = (taskDraftId: string, week: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.draft_id === taskDraftId ? { ...t, week: week ? parseInt(week) : null } : t),
    }));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    setState(s => ({
      ...s,
      tasks: [...s.tasks, {
        draft_id: generateId(),
        title: newTaskTitle.trim(),
        description: '',
        week: null,
        day_range: '',
        sort_order: s.tasks.length,
        area_draft_id: s.areas[0]?.draft_id || '',
        template_task_order: null,
      }],
    }));
    setNewTaskTitle('');
  };

  const handleRemoveTask = (draftId: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.filter(t => t.draft_id !== draftId),
    }));
  };

  // Validation
  const canProceedToStep3 = state.name.trim() && state.areas.length >= 1;
  const allTasksAssigned = state.tasks.length > 0 && state.tasks.every(t => t.area_draft_id);
  const canLaunch = allTasksAssigned && state.tasks.every(t => t.title.trim());

  // Step 4: Launch
  const handleLaunch = async () => {
    try {
      await launchSprint.mutateAsync({
        name: state.name,
        goal: state.goal,
        durationWeeks: state.durationWeeks,
        templateId: state.selectedTemplate?.id ?? null,
        areas: state.areas,
        tasks: state.tasks,
      });
      toast({ title: '🚀 Sprint launched!', description: `${state.name} is now active.` });
      onComplete();
    } catch (error) {
      toast({ title: 'Launch failed', description: 'Something went wrong.', variant: 'destructive' });
    }
  };

  const weekOptions = useMemo(() => 
    Array.from({ length: state.durationWeeks }, (_, i) => i + 1),
    [state.durationWeeks]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
              state.step === s ? 'border-primary bg-primary text-primary-foreground' :
              state.step > s ? 'border-primary bg-primary/10 text-primary' :
              'border-muted-foreground/30 text-muted-foreground'
            }`}>
              {state.step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 4 && <div className={`w-8 h-0.5 ${state.step > s ? 'bg-primary' : 'bg-muted-foreground/20'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Template */}
      {state.step === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Choose a Template</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick a starting point or go blank</p>
          </div>
          {templatesLoading ? (
            <p className="text-center text-muted-foreground">Loading templates...</p>
          ) : (
            <div className="grid gap-3">
              {templates.map(t => (
                <Card
                  key={t.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleSelectTemplate(t)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {t.name.includes('Blank') ? <FileText className="h-5 w-5 text-primary" /> :
                       t.name.includes('Quick') ? <Zap className="h-5 w-5 text-primary" /> :
                       <Target className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                    <Badge variant="secondary">{t.duration_weeks}w</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Sprint Details + Areas */}
      {state.step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Sprint Details</h2>
            <p className="text-sm text-muted-foreground mt-1">Name your sprint and choose 1–3 areas of focus</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Sprint Name</Label>
              <Input
                value={state.name}
                onChange={(e) => setState(s => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Q1 Performance Sprint"
              />
            </div>
            <div>
              <Label>Goal (optional)</Label>
              <Textarea
                value={state.goal}
                onChange={(e) => setState(s => ({ ...s, goal: e.target.value }))}
                placeholder="What do you want to accomplish?"
                rows={2}
              />
            </div>
            <div>
              <Label>Duration</Label>
              <Select
                value={String(state.durationWeeks)}
                onValueChange={(v) => setState(s => ({ ...s, durationWeeks: parseInt(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 12].map(w => (
                    <SelectItem key={w} value={String(w)}>{w} weeks</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Areas of Focus (1–3)</Label>
              <div className="space-y-2 mt-2">
                {state.areas.map(area => (
                  <div key={area.draft_id} className="flex items-center gap-2 p-2 rounded-lg border">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: area.color }} />
                    <span className="flex-1 text-sm font-medium">{area.name}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveArea(area.draft_id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {state.areas.length < 3 && (
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleAddArea(); }}>
                    <Input
                      placeholder="e.g. Health, Career, Learning"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" type="submit" disabled={!newAreaName.trim()} className="h-8">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 1 }))}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setState(s => ({ ...s, step: 3 }))} disabled={!canProceedToStep3}>
              Tasks <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Task Editor */}
      {state.step === 3 && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Review & Assign Tasks</h2>
            <p className="text-sm text-muted-foreground mt-1">Edit tasks and assign each to an area of focus</p>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {state.tasks.map((task, idx) => (
              <Card key={task.draft_id} className={`transition-colors ${!task.area_draft_id ? 'border-destructive/50' : ''}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={task.title}
                        onChange={(e) => handleTaskTitleChange(task.draft_id, e.target.value)}
                        className="h-8 text-sm font-medium"
                        placeholder="Task title"
                      />
                      <Input
                        value={task.description}
                        onChange={(e) => handleTaskDescChange(task.draft_id, e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Description (optional)"
                      />
                      <div className="flex gap-2">
                        <Select
                          value={task.area_draft_id || undefined}
                          onValueChange={(v) => handleTaskAreaChange(task.draft_id, v)}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Assign area..." />
                          </SelectTrigger>
                          <SelectContent>
                            {state.areas.map(a => (
                              <SelectItem key={a.draft_id} value={a.draft_id}>
                                <span className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                                  {a.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={task.week ? String(task.week) : undefined}
                          onValueChange={(v) => handleTaskWeekChange(task.draft_id, v)}
                        >
                          <SelectTrigger className="h-7 text-xs w-24">
                            <SelectValue placeholder="Week" />
                          </SelectTrigger>
                          <SelectContent>
                            {weekOptions.map(w => (
                              <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveTask(task.draft_id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleAddTask(); }}>
            <Input
              placeholder="Add a custom task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="h-8 text-sm"
            />
            <Button size="sm" type="submit" disabled={!newTaskTitle.trim()} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </form>

          {!allTasksAssigned && state.tasks.length > 0 && (
            <p className="text-xs text-destructive text-center">
              Every task must be assigned to an area of focus before launching.
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 2 }))}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setState(s => ({ ...s, step: 4 }))} disabled={!canLaunch}>
              Review <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Launch Summary */}
      {state.step === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Ready to Launch</h2>
            <p className="text-sm text-muted-foreground mt-1">Review your sprint before starting</p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{state.name}</CardTitle>
              {state.goal && <CardDescription>{state.goal}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{state.durationWeeks} weeks</Badge>
                <Badge variant="secondary">{state.tasks.length} tasks</Badge>
                <Badge variant="secondary">{state.areas.length} areas</Badge>
              </div>

              {state.areas.map(area => {
                const areaTasks = state.tasks.filter(t => t.area_draft_id === area.draft_id);
                return (
                  <div key={area.draft_id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: area.color }} />
                      <span className="text-sm font-medium">{area.name}</span>
                      <Badge variant="outline" className="text-xs">{areaTasks.length} tasks</Badge>
                    </div>
                    <div className="space-y-1 ml-5">
                      {areaTasks.map(t => (
                        <p key={t.draft_id} className="text-sm text-muted-foreground">
                          • {t.title} {t.week ? <span className="text-xs">(Week {t.week})</span> : null}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 3 }))}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={handleLaunch} disabled={launchSprint.isPending}>
              <Rocket className="h-4 w-4 mr-2" />
              {launchSprint.isPending ? 'Launching...' : 'Launch Sprint'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
