import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cycle } from '@/hooks/useCycles';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { addWeeks, differenceInWeeks, format } from 'date-fns';
import { AlertTriangle, Calendar, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface CycleMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: Cycle;
}

export function CycleMigrationDialog({ open, onOpenChange, cycle }: CycleMigrationDialogProps) {
  const [migrating, setMigrating] = useState(false);
  const [choice, setChoice] = useState<'convert' | 'continue' | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startDate = new Date(cycle.start_date);
  const endDate = new Date(cycle.end_date);
  const cycleDuration = differenceInWeeks(endDate, startDate);
  const isLegacy12Week = cycleDuration >= 10; // Allow some tolerance

  const newEndDate = addWeeks(startDate, 6);
  const currentWeek = Math.min(
    Math.max(1, differenceInWeeks(new Date(), startDate) + 1),
    cycleDuration
  );

  const handleConvert = async () => {
    setMigrating(true);
    try {
      // Update cycle end date to 6 weeks from start
      const { error: cycleError } = await supabase
        .from('cycles')
        .update({ end_date: format(newEndDate, 'yyyy-MM-dd') })
        .eq('id', cycle.id);

      if (cycleError) throw cycleError;

      // Delete milestones for weeks 7-12
      const { error: milestonesError } = await supabase
        .from('milestones')
        .delete()
        .eq('goal_id', cycle.id)
        .gte('week_number', 7);

      // Also update any task instances for weeks > 6
      const { error: tasksError } = await supabase
        .from('task_instances')
        .delete()
        .eq('cycle_id', cycle.id)
        .gt('due_week', 6);

      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['task-instances'] });

      toast({
        title: 'Cycle converted!',
        description: 'Your cycle has been converted to the 6-week format.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert cycle. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleContinue = () => {
    toast({
      title: 'Continuing with 12-week cycle',
      description: 'Your existing cycle will continue as planned.',
    });
    onOpenChange(false);
  };

  if (!isLegacy12Week) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Cycle Format Update
          </DialogTitle>
          <DialogDescription>
            We've updated to a 6-week sprint model for better focus. Would you like to convert your existing cycle?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Cycle</span>
              <Badge variant="secondary">Week {currentWeek} of {cycleDuration}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setChoice('convert')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                choice === 'convert' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-primary/10 text-primary">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Convert to 6-week sprint</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    End date becomes {format(newEndDate, 'MMM d, yyyy')}. 
                    {currentWeek > 6 && ' Tasks after week 6 will be removed.'}
                  </p>
                  {currentWeek > 6 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>You're past week 6 - cycle will end immediately</span>
                    </div>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={() => setChoice('continue')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                choice === 'continue' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-muted text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Keep 12-week cycle</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Continue with your current timeline. New cycles will use the 6-week format.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Decide Later
          </Button>
          <Button
            onClick={choice === 'convert' ? handleConvert : handleContinue}
            disabled={!choice || migrating}
          >
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : choice === 'convert' ? (
              'Convert Cycle'
            ) : (
              'Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}