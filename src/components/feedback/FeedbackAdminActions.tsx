import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Feedback, FeedbackStatus, FeedbackPriority, useFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';
import { ListTodo, CheckCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { FeedbackReplyDialog } from './FeedbackReplyDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FeedbackAdminActionsProps {
  feedback: Feedback;
}

export function FeedbackAdminActions({ feedback }: FeedbackAdminActionsProps) {
  const { updateStatus, updatePriority, updateAdminNotes, addToTaskList } = useFeedback();
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState(feedback.admin_notes || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = async (status: FeedbackStatus) => {
    try {
      await updateStatus.mutateAsync({ feedbackId: feedback.id, status });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (priority: FeedbackPriority) => {
    try {
      await updatePriority.mutateAsync({ feedbackId: feedback.id, priority });
      toast.success('Priority updated');
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateAdminNotes.mutateAsync({ feedbackId: feedback.id, adminNotes });
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const handleAddToTasks = async () => {
    try {
      await addToTaskList.mutateAsync(feedback);
      toast.success('Added to your task list');
    } catch (error) {
      toast.error('Failed to add to task list');
    }
  };

  const handleMarkAsDone = async () => {
    try {
      await updateStatus.mutateAsync({ feedbackId: feedback.id, status: 'completed' });
      toast.success('Marked as completed');
    } catch (error) {
      toast.error('Failed to mark as completed');
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border-t pt-4 mt-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span className="text-sm font-medium">Admin Actions</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 mt-4">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToTasks}
              disabled={feedback.added_to_tasks || addToTaskList.isPending}
            >
              <ListTodo className="h-4 w-4 mr-1" />
              {feedback.added_to_tasks ? 'Added to Tasks' : 'Add to Task List'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsDone}
              disabled={feedback.status === 'completed' || updateStatus.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark as Done
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyDialog(true)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Reply to User
            </Button>
          </div>

          {/* Status and Priority selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={feedback.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="wont_do">Won't Do</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={feedback.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Admin notes */}
          <div className="space-y-2">
            <Label>Admin Notes (private)</Label>
            <Textarea
              placeholder="Add internal notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveNotes}
              disabled={updateAdminNotes.isPending || adminNotes === (feedback.admin_notes || '')}
            >
              Save Notes
            </Button>
          </div>
        </CollapsibleContent>
      </div>

      <FeedbackReplyDialog
        feedback={feedback}
        open={showReplyDialog}
        onOpenChange={setShowReplyDialog}
      />
    </Collapsible>
  );
}
