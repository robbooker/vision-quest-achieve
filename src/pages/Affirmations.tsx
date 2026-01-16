import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Plus, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAffirmations } from '@/hooks/useAffirmations';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const LINES_COUNT = 15;

export default function Affirmations() {
  const [lines, setLines] = useState<string[]>(Array(LINES_COUNT).fill(''));
  const [setNumber, setSetNumber] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const { submitAffirmations, deleteSubmission, stats, savedAffirmations, submissions } = useAffirmations();

  // Count filled lines
  const filledLines = lines.filter(line => line.trim().length > 0).length;
  const isComplete = filledLines === LINES_COUNT;

  const handleLineChange = useCallback((index: number, value: string) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = value;
      return newLines;
    });
  }, []);

  const handleSubmitAndSave = useCallback(async () => {
    if (!isComplete) return;
    
    try {
      await submitAffirmations.mutateAsync({
        affirmations: lines,
        saveContent: true,
      });
      toast.success('Affirmations saved!');
      setLines(Array(LINES_COUNT).fill(''));
      setSetNumber(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to save affirmations');
    }
  }, [lines, isComplete, submitAffirmations]);

  const handleSubmitAndDelete = useCallback(async () => {
    if (!isComplete) return;
    
    try {
      await submitAffirmations.mutateAsync({
        affirmations: lines,
        saveContent: false,
      });
      toast.success('Affirmations submitted (content deleted)');
      setLines(Array(LINES_COUNT).fill(''));
      setSetNumber(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to submit affirmations');
    }
  }, [lines, isComplete, submitAffirmations]);

  const handleNewSet = useCallback(() => {
    setLines(Array(LINES_COUNT).fill(''));
    setSetNumber(prev => prev + 1);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-mono">Affirmations</h1>
          </div>
          <Link to="/blog/affirmations">
            <Button variant="outline" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Learn More
            </Button>
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            Write your affirmation 15 times. Example: "I, [Your Name], will [your goal]."
          </p>
          <p className="mt-1">
            Set #{setNumber} • {filledLines}/{LINES_COUNT} lines completed
          </p>
        </div>

        {/* Lined Paper Area */}
        <div className="legal-pad-container">
          <div className="legal-pad p-4 min-h-[500px]">
            {lines.map((line, index) => (
              <div key={index} className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 w-6 text-right pr-2">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => handleLineChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && index < LINES_COUNT - 1) {
                      e.preventDefault();
                      const nextInput = document.querySelector(`input[data-line="${index + 1}"]`) as HTMLInputElement;
                      nextInput?.focus();
                    }
                  }}
                  data-line={index}
                  className="w-full bg-transparent border-0 border-b border-primary/20 py-2 pl-8 pr-2 focus:outline-none focus:border-primary/50 font-mono text-sm text-[hsl(220,30%,20%)] dark:text-[hsl(45,30%,85%)] placeholder:text-[hsl(220,10%,50%)] dark:placeholder:text-[hsl(45,30%,45%)]"
                  placeholder={index === 0 ? "I, [Name], will..." : ""}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Privacy Options:</p>
          <p>
            You might want to keep your goals and affirmations private. If you wish to do so, click "Submit and Delete." 
            Otherwise, click "Submit and Save" to keep a record.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSubmitAndDelete}
            disabled={!isComplete || submitAffirmations.isPending}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Submit and Delete
          </Button>
          <Button
            onClick={handleSubmitAndSave}
            disabled={!isComplete || submitAffirmations.isPending}
            className="flex-1 gap-2"
          >
            <Check className="h-4 w-4" />
            Submit and Save
          </Button>
        </div>

        {/* New Set Button */}
        <Button
          onClick={handleNewSet}
          variant="ghost"
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Start a New Set (Different Goal)
        </Button>

        {/* Stats Display */}
        {(stats.totalDays > 0 || stats.currentStreak > 0) && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Your Progress</h3>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total Days: </span>
                <span className="font-bold text-foreground">{stats.totalDays}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Streak: </span>
                <span className="font-bold text-primary">{stats.currentStreak} days</span>
              </div>
            </div>
          </div>
        )}

        {/* Submission History */}
        {submissions.length > 0 && (
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Submission History ({submissions.length})</span>
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {submissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="flex items-center justify-between bg-muted/30 rounded-lg p-3 text-sm"
                >
                  <div className="flex-1">
                    <span className="text-foreground font-medium">
                      {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {submission.content_saved ? '(saved)' : '(content deleted)'}
                    </span>
                    {submission.saved_affirmations && submission.saved_affirmations[0] && (
                      <p className="text-muted-foreground text-xs mt-1 truncate max-w-[300px]">
                        "{submission.saved_affirmations[0]}"
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await deleteSubmission.mutateAsync(submission.id);
                        toast.success('Submission deleted');
                      } catch {
                        toast.error('Failed to delete submission');
                      }
                    }}
                    disabled={deleteSubmission.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </DashboardLayout>
  );
}