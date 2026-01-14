import { Button } from '@/components/ui/button';
import { Calendar, Plus, Target, MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  type: 'cycle' | 'goal';
  onAction: () => void;
  onChatAction?: () => void;
}

export function EmptyState({ type, onAction, onChatAction }: EmptyStateProps) {
  if (type === 'cycle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Get Started with Goal Setting
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Create a 6-week cycle to begin planning your goals. Each cycle is a focused sprint 
          toward what matters most, followed by time to review and reset.
        </p>
        <Button onClick={onAction}>
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Cycle
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Target className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        No Goals Yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Add 1-3 transformational goals for this cycle. Focus is the key to execution.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onAction}>
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Goal Manually
        </Button>
        {onChatAction && (
          <Button onClick={onChatAction}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Add Your First Goal by Chat
          </Button>
        )}
      </div>
    </div>
  );
}
