import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Feedback, useFeedback } from '@/hooks/useFeedback';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDistanceToNow } from 'date-fns';
import { Bug, Lightbulb, MessageSquare, ThumbsUp, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { FeedbackAdminActions } from './FeedbackAdminActions';

interface FeedbackCardProps {
  feedback: Feedback;
}

const categoryConfig = {
  bug_report: { label: 'Bug', icon: Bug, variant: 'destructive' as const },
  feature_request: { label: 'Feature', icon: Lightbulb, variant: 'default' as const },
  general_feedback: { label: 'Feedback', icon: MessageSquare, variant: 'secondary' as const },
};

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  under_review: { label: 'Under Review', className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
  planned: { label: 'Planned', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
  in_progress: { label: 'In Progress', className: 'bg-purple-500/20 text-purple-700 dark:text-purple-400' },
  completed: { label: 'Completed', className: 'bg-green-500/20 text-green-700 dark:text-green-400' },
  wont_do: { label: "Won't Do", className: 'bg-muted text-muted-foreground line-through' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
  high: { label: 'High', className: 'bg-red-500/20 text-red-700 dark:text-red-400' },
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const { toggleVote, deleteFeedback, userId } = useFeedback();
  const { isAdmin } = useUserRole();
  
  const category = categoryConfig[feedback.category];
  const status = statusConfig[feedback.status];
  const priority = priorityConfig[feedback.priority];
  const CategoryIcon = category.icon;
  
  const isOwner = feedback.user_id === userId;

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Header with category, status, priority */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={category.variant} className="gap-1">
              <CategoryIcon className="h-3 w-3" />
              {category.label}
            </Badge>
            <Badge variant="outline" className={status.className}>
              {feedback.status === 'completed' ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {status.label}
            </Badge>
            {isAdmin && (
              <Badge variant="outline" className={priority.className}>
                {priority.label} Priority
              </Badge>
            )}
            {isOwner && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Your submission
              </Badge>
            )}
          </div>

          {/* Title and description */}
          <div>
            <h3 className="font-semibold text-lg">{feedback.title}</h3>
            {feedback.description && (
              <p className="text-muted-foreground mt-1">{feedback.description}</p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-2">
              {/* Vote button */}
              <Button
                variant={feedback.user_voted ? "default" : "outline"}
                size="sm"
                onClick={() => toggleVote.mutate(feedback.id)}
                disabled={toggleVote.isPending}
                className="gap-1"
              >
                <ThumbsUp className="h-4 w-4" />
                {feedback.vote_count || 0}
              </Button>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && <FeedbackAdminActions feedback={feedback} />}

          {/* Delete button for admin */}
          {isAdmin && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this feedback?')) {
                    deleteFeedback.mutate(feedback.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
