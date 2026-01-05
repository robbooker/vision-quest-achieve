import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ThumbsDown, Meh, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FocusSession } from '@/hooks/useFocusSessions';

interface EditSessionDialogProps {
  session: FocusSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { status: 'completed' | 'abandoned'; rating: 'bad' | 'good' | 'great' | null; notes: string | null }) => void;
}

export function EditSessionDialog({ session, open, onOpenChange, onSave }: EditSessionDialogProps) {
  const [status, setStatus] = useState<'completed' | 'abandoned'>('completed');
  const [rating, setRating] = useState<'bad' | 'good' | 'great' | null>(null);
  const [notes, setNotes] = useState('');

  // Reset form when session changes
  useState(() => {
    if (session) {
      setStatus(session.status === 'abandoned' ? 'abandoned' : 'completed');
      setRating((session as any).rating || null);
      setNotes(session.notes || '');
    }
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && session) {
      setStatus(session.status === 'abandoned' ? 'abandoned' : 'completed');
      setRating((session as any).rating || null);
      setNotes(session.notes || '');
    }
    onOpenChange(newOpen);
  };

  const handleSave = () => {
    onSave({ status, rating, notes: notes || null });
    onOpenChange(false);
  };

  const ratingOptions = [
    { value: 'bad' as const, label: 'Bad', icon: ThumbsDown, color: 'text-destructive' },
    { value: 'good' as const, label: 'Good', icon: Meh, color: 'text-chart-3' },
    { value: 'great' as const, label: 'Great', icon: ThumbsUp, color: 'text-chart-2' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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