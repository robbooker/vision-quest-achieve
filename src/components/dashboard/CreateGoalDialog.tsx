import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGoals } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  existingGoalsCount: number;
}

export function CreateGoalDialog({
  open,
  onOpenChange,
  cycleId,
  existingGoalsCount,
}: CreateGoalDialogProps) {
  const [title, setTitle] = useState('');
  const [metricType, setMetricType] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [why, setWhy] = useState('');
  
  const { createGoal } = useGoals(cycleId);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your goal.',
        variant: 'destructive',
      });
      return;
    }

    if (!metricType.trim()) {
      toast({
        title: 'Metric type required',
        description: 'How will you measure success? (e.g., "pages", "hours", "sales")',
        variant: 'destructive',
      });
      return;
    }

    if (!targetValue || isNaN(Number(targetValue))) {
      toast({
        title: 'Target value required',
        description: 'Please enter a numeric target value.',
        variant: 'destructive',
      });
      return;
    }

    if (existingGoalsCount >= 3) {
      toast({
        title: 'Maximum goals reached',
        description: 'You can have a maximum of 3 goals per cycle. Focus is key!',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createGoal.mutateAsync({
        cycle_id: cycleId,
        title: title.trim(),
        metric_type: metricType.trim(),
        target_value: Number(targetValue),
        why: why.trim() || undefined,
      });

      toast({
        title: 'Goal created',
        description: `"${title}" has been added to your cycle.`,
      });

      setTitle('');
      setMetricType('');
      setTargetValue('');
      setWhy('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Goal {existingGoalsCount + 1}</DialogTitle>
          <DialogDescription>
            Define a transformational goal for this 12-week cycle. Be specific about what success looks like.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">What do you want to achieve?</Label>
            <Input
              id="title"
              placeholder="e.g., Complete my first novel draft"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                placeholder="e.g., 50000"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metricType">Metric (unit)</Label>
              <Input
                id="metricType"
                placeholder="e.g., words, hours, calls"
                value={metricType}
                onChange={(e) => setMetricType(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="why">Why is this important to you?</Label>
            <Textarea
              id="why"
              placeholder="Your motivation and the deeper reason behind this goal..."
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will help you stay motivated when things get tough.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createGoal.isPending}>
            {createGoal.isPending ? 'Creating...' : 'Add Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
