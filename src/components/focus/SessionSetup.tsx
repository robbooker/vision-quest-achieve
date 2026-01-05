import { useState } from 'react';
import { Play, Target, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGoals } from '@/hooks/useGoals';
import { useBigTen } from '@/hooks/useBigTen';
import { useQuickTasks } from '@/hooks/useQuickTasks';

const DURATION_PRESETS = [
  { value: 25, label: '25 min', description: 'Pomodoro' },
  { value: 45, label: '45 min', description: 'Deep Work' },
  { value: 60, label: '60 min', description: '1 Hour' },
  { value: 90, label: '90 min', description: 'Ultra Focus' },
];

interface SessionSetupProps {
  onStart: (data: {
    objective: string;
    duration: number;
    linkedGoalId?: string;
    linkedTaskId?: string;
    linkedBigTenTaskId?: string;
  }) => void;
  isStarting: boolean;
}

export function SessionSetup({ onStart, isStarting }: SessionSetupProps) {
  const [objective, setObjective] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [linkType, setLinkType] = useState<'none' | 'goal' | 'task' | 'bigten'>('none');
  const [linkedId, setLinkedId] = useState('');

  const { goals } = useGoals();
  const { projects } = useBigTen();
  const { tasks: quickTasks } = useQuickTasks();

  const pendingQuickTasks = quickTasks.filter(t => !t.completed);
  // Extract all tasks from projects
  const allBigTenTasks = projects.flatMap(p => p.tasks || []);
  const pendingBigTenTasks = allBigTenTasks.filter(t => !t.completed);

  const handleDurationSelect = (value: number) => {
    setDuration(value);
    setCustomDuration('');
  };

  const handleCustomDuration = (value: string) => {
    setCustomDuration(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      setDuration(parsed);
    }
  };

  const handleStart = () => {
    if (!objective.trim()) return;

    onStart({
      objective: objective.trim(),
      duration,
      linkedGoalId: linkType === 'goal' ? linkedId : undefined,
      linkedTaskId: linkType === 'task' ? linkedId : undefined,
      linkedBigTenTaskId: linkType === 'bigten' ? linkedId : undefined,
    });
  };

  const canStart = objective.trim().length > 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Start Focus Session
        </CardTitle>
        <CardDescription>
          Set your objective and duration for distraction-free work
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Objective */}
        <div className="space-y-2">
          <Label htmlFor="objective">What will you focus on?</Label>
          <Input
            id="objective"
            placeholder="e.g., Write the introduction for my blog post"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Duration Presets */}
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DURATION_PRESETS.map(preset => (
              <Button
                key={preset.value}
                variant={duration === preset.value && !customDuration ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3"
                onClick={() => handleDurationSelect(preset.value)}
              >
                <span className="font-semibold">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="number"
              placeholder="Custom minutes"
              value={customDuration}
              onChange={(e) => handleCustomDuration(e.target.value)}
              className="w-32"
              min={1}
              max={240}
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </div>

        {/* Link to Goal/Task */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Link to (optional)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Select value={linkType} onValueChange={(v) => { setLinkType(v as typeof linkType); setLinkedId(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No link</SelectItem>
                <SelectItem value="goal">Cycle Goal</SelectItem>
                <SelectItem value="task">Quick Task</SelectItem>
                <SelectItem value="bigten">Big 10 Task</SelectItem>
              </SelectContent>
            </Select>

            {linkType === 'goal' && goals.length > 0 && (
              <Select value={linkedId} onValueChange={setLinkedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {linkType === 'task' && pendingQuickTasks.length > 0 && (
              <Select value={linkedId} onValueChange={setLinkedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {pendingQuickTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {linkType === 'bigten' && pendingBigTenTasks.length > 0 && (
              <Select value={linkedId} onValueChange={setLinkedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {pendingBigTenTasks.map(task => {
                    const project = projects.find(p => p.id === task.project_id);
                    return (
                      <SelectItem key={task.id} value={task.id}>
                        {project?.title}: {task.title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Start Button */}
        <Button
          size="lg"
          className="w-full gap-2 text-lg py-6"
          onClick={handleStart}
          disabled={!canStart || isStarting}
        >
          <Play className="h-5 w-5" />
          Start Focus Session
        </Button>
      </CardContent>
    </Card>
  );
}
