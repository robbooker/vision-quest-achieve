import { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { useGoals } from '@/hooks/useGoals';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PRIMED_PILLARS = [
  { value: 'physical', label: 'Physical' },
  { value: 'relations', label: 'Relations' },
  { value: 'income', label: 'Income' },
  { value: 'mental', label: 'Mental' },
  { value: 'excellence', label: 'Excellence' },
  { value: 'direction', label: 'Direction' },
  { value: 'spiritual', label: 'Spiritual' },
];

const FOCUS_OPTIONS = [
  'Meditation',
  'Fitness: Walk',
  'Fitness',
  'Gratitude',
  'Mindfully journal',
  'Prep for meeting',
  'Wind down for bed',
  'Wake up routine',
  'Settle emotional state',
  'other',
];

interface LogPastSessionDialogProps {
  onLog: (data: {
    objective: string;
    duration_minutes: number;
    started_at: string;
    pillar?: string;
    linked_goal_id?: string;
    rating?: 'bad' | 'good' | 'great';
    notes?: string;
  }) => Promise<unknown>;
  isLogging: boolean;
}

export function LogPastSessionDialog({ onLog, isLogging }: LogPastSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [pillar, setPillar] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [rating, setRating] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { goals } = useGoals();
  const objective = selectedFocus === 'other' ? customObjective : selectedFocus;

  const resetForm = () => {
    setSelectedFocus('');
    setCustomObjective('');
    setDuration('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
    setPillar('');
    setLinkedGoalId('');
    setRating('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!objective.trim() || !duration) return;
    const durationMin = parseInt(duration);
    if (isNaN(durationMin) || durationMin <= 0) return;

    const startedAt = new Date(`${date}T${time}:00`).toISOString();

    try {
      await onLog({
        objective: objective.trim(),
        duration_minutes: durationMin,
        started_at: startedAt,
        pillar: pillar || undefined,
        linked_goal_id: linkedGoalId || undefined,
        rating: rating as 'bad' | 'good' | 'great' || undefined,
        notes: notes || undefined,
      });
      toast.success('Past session logged');
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Failed to log session');
    }
  };

  const canSubmit = objective.trim().length > 0 && duration && parseInt(duration) > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <History className="h-3.5 w-3.5" />
          Log Past Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Past Session</DialogTitle>
          <DialogDescription>Record a focus session you completed but forgot to track.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Objective */}
          <div className="space-y-1.5">
            <Label>What did you focus on?</Label>
            <Select value={selectedFocus} onValueChange={setSelectedFocus}>
              <SelectTrigger>
                <SelectValue placeholder="Select focus activity" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {FOCUS_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option === 'other' ? 'Something else...' : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFocus === 'other' && (
              <Input
                placeholder="Describe what you focused on..."
                value={customObjective}
                onChange={(e) => setCustomObjective(e.target.value)}
              />
            )}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              placeholder="e.g. 30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
              max={480}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Pillar */}
          <div className="space-y-1.5">
            <Label>PRIMED Pillar (optional)</Label>
            <Select value={pillar || 'none'} onValueChange={(v) => setPillar(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {PRIMED_PILLARS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked Goal */}
          {goals.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Goal (optional)</Label>
              <Select value={linkedGoalId || 'none'} onValueChange={(v) => setLinkedGoalId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {goals.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-1.5">
            <Label>Rating (optional)</Label>
            <div className="flex gap-2">
              {(['bad', 'good', 'great'] as const).map(r => (
                <Button
                  key={r}
                  variant={rating === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRating(rating === r ? '' : r)}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any notes about the session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit || isLogging}
          >
            {isLogging ? 'Logging...' : 'Log Session'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
