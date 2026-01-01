import { useState } from 'react';
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
import { Tactic, CreateTacticInput } from '@/hooks/useTactics';

interface TacticFormProps {
  tactic?: Tactic;
  onSubmit: (data: CreateTacticInput | Partial<Tactic>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TacticForm({ tactic, onSubmit, onCancel, isLoading }: TacticFormProps) {
  const [title, setTitle] = useState(tactic?.title ?? '');
  const [frequency, setFrequency] = useState(tactic?.frequency ?? 'weekly');
  const [targetCount, setTargetCount] = useState(tactic?.target_count ?? 1);
  const [dueWeeks, setDueWeeks] = useState<number[]>(
    (tactic?.due_weeks as number[]) ?? []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data: CreateTacticInput | Partial<Tactic> = {
      title: title.trim(),
      frequency,
      target_count: targetCount,
      due_weeks: frequency === 'specific_weeks' ? dueWeeks : null,
    };

    if (tactic) {
      onSubmit({ id: tactic.id, ...data });
    } else {
      onSubmit(data as CreateTacticInput);
    }
  };

  const toggleWeek = (week: number) => {
    setDueWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week].sort((a, b) => a - b)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tactic</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Start with a verb: Write, Call, Run..."
          required
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="specific_weeks">Specific Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target">Target (times per {frequency === 'daily' ? 'day' : 'week'})</Label>
          <Input
            id="target"
            type="number"
            min={1}
            max={100}
            value={targetCount}
            onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      {frequency === 'specific_weeks' && (
        <div className="space-y-2">
          <Label>Select Weeks</Label>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
              <Button
                key={week}
                type="button"
                variant={dueWeeks.includes(week) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleWeek(week)}
                className="h-8"
              >
                W{week}
              </Button>
            ))}
          </div>
          {dueWeeks.length === 0 && (
            <p className="text-xs text-muted-foreground">Select at least one week</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isLoading ||
            !title.trim() ||
            (frequency === 'specific_weeks' && dueWeeks.length === 0)
          }
        >
          {tactic ? 'Update' : 'Add'} Tactic
        </Button>
      </div>
    </form>
  );
}
