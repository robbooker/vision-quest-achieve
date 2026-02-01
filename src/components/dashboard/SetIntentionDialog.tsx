import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSetMonthlyIntention, MonthlyIntention } from '@/hooks/useMonthlyIntention';

interface SetIntentionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIntention?: MonthlyIntention | null;
}

const SUGGESTED_WORDS = [
  'Focus', 'Discipline', 'Courage', 'Presence', 'Growth', 
  'Balance', 'Patience', 'Action', 'Clarity', 'Strength',
  'Joy', 'Simplicity', 'Resilience', 'Connection', 'Mastery'
];

export const SetIntentionDialog = ({ 
  open, 
  onOpenChange, 
  existingIntention 
}: SetIntentionDialogProps) => {
  const [word, setWord] = useState('');
  const [description, setDescription] = useState('');
  
  const setIntention = useSetMonthlyIntention();
  const currentMonth = format(new Date(), 'MMMM yyyy');

  useEffect(() => {
    if (existingIntention) {
      setWord(existingIntention.word);
      setDescription(existingIntention.description || '');
    } else {
      setWord('');
      setDescription('');
    }
  }, [existingIntention, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    await setIntention.mutateAsync({ word, description });
    onOpenChange(false);
  };

  const handleSuggestionClick = (suggested: string) => {
    setWord(suggested);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Word of the Month
          </DialogTitle>
          <DialogDescription>
            Set your intention for {currentMonth}. This word will guide your daily reflections.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="word">Your Word</Label>
            <Input
              id="word"
              placeholder="e.g., Focus, Courage, Discipline..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="text-lg font-semibold uppercase tracking-wide"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Suggestions</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_WORDS.map((suggested) => (
                <Badge
                  key={suggested}
                  variant={word.toLowerCase() === suggested.toLowerCase() ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleSuggestionClick(suggested)}
                >
                  {suggested}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Why this word? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="What does this word mean to you this month? Why is it important right now?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!word.trim() || setIntention.isPending}
            >
              {setIntention.isPending ? 'Saving...' : existingIntention ? 'Update' : 'Set Intention'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
