import { BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface JournalEmptyStateProps {
  hasYesterdayActivity: boolean;
  onCreateEntry: () => void;
  isCreating: boolean;
}

export const JournalEmptyState = ({ 
  hasYesterdayActivity, 
  onCreateEntry, 
  isCreating 
}: JournalEmptyStateProps) => {
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Your Visual Journal</CardTitle>
        <CardDescription>
          Capture your daily accomplishments with AI-generated art
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Each day, your completed tasks and habits are transformed into a unique piece of art that represents your productivity.</p>
          <p>You can customize the art style and themes in Settings to make each entry personal to you.</p>
        </div>
        
        {hasYesterdayActivity ? (
          <Button 
            onClick={onCreateEntry} 
            disabled={isCreating}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Yesterday\'s Journal Entry'}
          </Button>
        ) : (
          <p className="text-sm text-center text-muted-foreground italic">
            Complete some tasks or habits, and your first journal entry will be available tomorrow!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
