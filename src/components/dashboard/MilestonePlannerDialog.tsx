import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMilestones, generateMilestoneDistribution, DistributionType } from '@/hooks/useMilestones';
import { Goal } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface MilestonePlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
}

export function MilestonePlannerDialog({
  open,
  onOpenChange,
  goal,
}: MilestonePlannerDialogProps) {
  const { toast } = useToast();
  const { milestones, bulkCreateMilestones, isLoading } = useMilestones(goal.id);
  const [distribution, setDistribution] = useState<DistributionType>('linear');
  const [weeklyTargets, setWeeklyTargets] = useState<number[]>(Array(12).fill(0));
  const [isSaving, setIsSaving] = useState(false);

  const totalTarget = goal.target_value;
  const currentTotal = weeklyTargets.reduce((sum, val) => sum + val, 0);
  const isValid = currentTotal === totalTarget;

  // Initialize with existing milestones or generate new distribution
  useEffect(() => {
    if (open) {
      if (milestones.length === 12) {
        setWeeklyTargets(milestones.map(m => m.target_value));
        setDistribution('custom');
      } else {
        const generated = generateMilestoneDistribution(totalTarget, 'linear');
        setWeeklyTargets(generated);
        setDistribution('linear');
      }
    }
  }, [open, milestones, totalTarget]);

  const handleDistributionChange = (value: DistributionType) => {
    setDistribution(value);
    if (value !== 'custom') {
      const generated = generateMilestoneDistribution(totalTarget, value);
      setWeeklyTargets(generated);
    }
  };

  const handleWeekChange = (weekIndex: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newTargets = [...weeklyTargets];
    newTargets[weekIndex] = numValue;
    setWeeklyTargets(newTargets);
    setDistribution('custom');
  };

  const handleSave = async () => {
    if (!isValid) {
      toast({
        title: 'Invalid total',
        description: `Weekly targets must add up to ${totalTarget}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const inputs = weeklyTargets.map((target, index) => ({
        goal_id: goal.id,
        week_number: index + 1,
        target_value: target,
      }));

      await bulkCreateMilestones.mutateAsync(inputs);
      
      toast({
        title: 'Milestones saved',
        description: 'Your 12-week plan has been created.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error saving milestones',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan Your Milestones</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {goal.title} — Target: {totalTarget.toLocaleString()} {goal.metric_type}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Distribution selector */}
          <div className="flex items-center gap-4">
            <Label htmlFor="distribution" className="whitespace-nowrap">
              Distribution:
            </Label>
            <Select value={distribution} onValueChange={handleDistributionChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear (Even Split)</SelectItem>
                <SelectItem value="ramp-up">Ramp Up (Start Slow)</SelectItem>
                <SelectItem value="ramp-down">Ramp Down (Start Fast)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekly targets grid */}
          <div className="grid grid-cols-4 gap-3">
            {weeklyTargets.map((target, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`week-${index}`} className="text-xs text-muted-foreground">
                  Week {index + 1}
                </Label>
                <Input
                  id={`week-${index}`}
                  type="number"
                  min={0}
                  value={target}
                  onChange={(e) => handleWeekChange(index, e.target.value)}
                  className="h-9"
                />
              </div>
            ))}
          </div>

          {/* Total validation */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            isValid ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
          }`}>
            {isValid ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              Total: {currentTotal.toLocaleString()} / {totalTarget.toLocaleString()} {goal.metric_type}
              {!isValid && ` (${currentTotal > totalTarget ? '+' : ''}${currentTotal - totalTarget})`}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? 'Saving...' : 'Save Milestones'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
