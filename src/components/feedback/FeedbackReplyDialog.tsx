import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Feedback, useFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface FeedbackReplyDialogProps {
  feedback: Feedback;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackReplyDialog({ feedback, open, onOpenChange }: FeedbackReplyDialogProps) {
  const [message, setMessage] = useState('');
  const { replyToUser } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await replyToUser.mutateAsync({ feedback, message: message.trim() });
      toast.success('Reply sent to user');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to User</DialogTitle>
          <DialogDescription>
            Send a notification to the user about their feedback: "{feedback.title}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Reply</Label>
              <Textarea
                id="message"
                placeholder="Write your response..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={replyToUser.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {replyToUser.isPending ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
