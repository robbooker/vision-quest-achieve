import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThumbsDown, Meh, ThumbsUp, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FocusSession } from '@/hooks/useFocusSessions';

const PRIMED_PILLARS = [
  { value: 'physical', label: 'Physical' },
  { value: 'relations', label: 'Relations' },
  { value: 'income', label: 'Income' },
  { value: 'mental', label: 'Mental' },
  { value: 'excellence', label: 'Excellence' },
  { value: 'direction', label: 'Direction' },
  { value: 'spiritual', label: 'Spiritual' },
];

interface EditSessionDialogProps {
  session: FocusSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { status: 'completed' | 'abandoned'; rating: 'bad' | 'good' | 'great' | null; notes: string | null; pillar: string | null }) => void;
}

export function EditSessionDialog({ session, open, onOpenChange, onSave }: EditSessionDialogProps) {
  const [status, setStatus] = useState<'completed' | 'abandoned'>('completed');
  const [rating, setRating] = useState<'bad' | 'good' | 'great' | null>(null);
  const [notes, setNotes] = useState('');
  const [pillar, setPillar] = useState<string | null>(null);

  // Reset form when session changes or dialog opens
  useEffect(() => {
    if (session && open) {
      setStatus(session.status === 'abandoned' ? 'abandoned' : 'completed');
      setRating((session as any).rating || null);
      setNotes(session.notes || '');
      setPillar(session.pillar || null);
    }
  }, [session, open]);


  const handleSave = () => {
    onSave({ status, rating, notes: notes || null, pillar });
    onOpenChange(false);
  };

  const ratingOptions = [
    { value: 'bad' as const, label: 'Bad', icon: ThumbsDown, color: 'text-destructive' },
    { value: 'good' as const, label: 'Good', icon: Meh, color: 'text-chart-3' },
    { value: 'great' as const, label: 'Great', icon: ThumbsUp, color: 'text-primary' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Focus Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Session info */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{session?.objective}</p>
            <p>{session?.actual_duration_minutes || session?.planned_duration_minutes} minutes</p>
          </div>

          {/* Status toggle */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('completed')}
              >
                Completed
              </Button>
              <Button
                type="button"
                variant={status === 'abandoned' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setStatus('abandoned')}
              >
                Abandoned
              </Button>
            </div>
          </div>

          {/* Rating */}
          {status === 'completed' && (
            <div className="space-y-2">
              <Label>How was this session?</Label>
              <div className="flex gap-3">
                {ratingOptions.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={rating === option.value ? 'default' : 'outline'}
                    size="lg"
                    className={cn(
                      "flex-1 flex-col h-auto py-3 gap-1",
                      rating === option.value && option.color
                    )}
                    onClick={() => setRating(option.value)}
                  >
                    <option.icon className="h-5 w-5" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* PRIMED Pillar */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hexagon className="h-4 w-4" />
              PRIMED Pillar (optional)
            </Label>
            <Select value={pillar || 'none'} onValueChange={(v) => setPillar(v === 'none' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {PRIMED_PILLARS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts about this session..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}