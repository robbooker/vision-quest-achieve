import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useIndicators, useIndicatorLogs } from '@/hooks/useIndicators';
import { Goal } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format, startOfDay, isToday } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DailyScoreLoggerProps {
  goals: Goal[];
}

export function DailyScoreLogger({ goals }: DailyScoreLoggerProps) {
  const [scores, setScores] = useState<Record<string, { value: number; notes: string }>>({});

  // Get all score-based goals (those with indicators that have target_value as a score)
  const scoreGoals = goals.filter(g => g.metric_type.toLowerCase().includes('score'));
  
  if (scoreGoals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Log Today's Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoreGoals.map(goal => (
          <GoalScoreRow 
            key={goal.id} 
            goal={goal}
            value={scores[goal.id]?.value ?? 5}
            notes={scores[goal.id]?.notes ?? ''}
            onChange={(value, notes) => setScores(prev => ({
              ...prev,
              [goal.id]: { value, notes }
            }))}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface GoalScoreRowProps {
  goal: Goal;
  value: number;
  notes: string;
  onChange: (value: number, notes: string) => void;
}

function GoalScoreRow({ goal, value, notes, onChange }: GoalScoreRowProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { indicators, createIndicator, isLoading: indicatorsLoading } = useIndicators(goal.id);
  const [saving, setSaving] = useState(false);
  const [indicatorReady, setIndicatorReady] = useState(false);
  const [showAdjustWarning, setShowAdjustWarning] = useState(false);
  const [pendingAdjust, setPendingAdjust] = useState<{ value: number; notes: string } | null>(null);
  
  // Find or use the first indicator for this goal
  const indicator = indicators.find(i => i.type === 'lag') || indicators[0];
  const { logs, createLog, isLoading: logsLoading } = useIndicatorLogs(indicator?.id);
  
  // Check if already logged today
  const todayLog = logs.find(log => isToday(new Date(log.logged_at)));
  const hasLoggedToday = !!todayLog;
  
  // Auto-create indicator if none exists for score-based goal
  useEffect(() => {
    if (!indicatorsLoading && indicators.length === 0 && user && !indicatorReady) {
      createIndicator.mutateAsync({
        goal_id: goal.id,
        type: 'lag',
        name: 'Daily Score',
        unit: 'score',
        target_value: 10,
      }).then(() => {
        setIndicatorReady(true);
      }).catch(() => {
        // Indicator might already exist, refetch will handle it
      });
    } else if (indicators.length > 0) {
      setIndicatorReady(true);
    }
  }, [indicatorsLoading, indicators.length, user, goal.id, createIndicator, indicatorReady]);

  const handleSave = async () => {
    if (!indicator) {
      toast({ 
        title: 'Setting up indicator...', 
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    
    setSaving(true);
    try {
      await createLog.mutateAsync({
        indicator_id: indicator.id,
        value,
        notes: notes || undefined,
      });
      toast({ title: 'Score logged!', description: `${goal.title}: ${value}/10` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to log score', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSliderChange = (newValue: number) => {
    if (hasLoggedToday) {
      setPendingAdjust({ value: newValue, notes });
      setShowAdjustWarning(true);
    } else {
      onChange(newValue, notes);
    }
  };

  const handleConfirmAdjust = () => {
    if (pendingAdjust) {
      onChange(pendingAdjust.value, pendingAdjust.notes);
      setShowAdjustWarning(false);
      setPendingAdjust(null);
    }
  };

  if (indicatorsLoading || (!indicatorReady && indicators.length === 0)) {
    return (
      <div className="p-3 rounded-lg border bg-muted/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Setting up score tracking...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`p-3 rounded-lg border ${hasLoggedToday ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{goal.title}</p>
            {hasLoggedToday && (
              <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                Scored
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground w-8 text-center">
              {hasLoggedToday ? todayLog.value : value}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        </div>
        <Slider
          value={[hasLoggedToday ? todayLog.value : value]}
          onValueChange={([v]) => handleSliderChange(v)}
          min={1}
          max={10}
          step={1}
          className="mb-3"
          disabled={saving}
        />
        <div className="flex gap-2">
          <Textarea
            placeholder="Optional note..."
            value={hasLoggedToday ? (todayLog.notes || '') : notes}
            onChange={(e) => {
              if (hasLoggedToday) {
                setPendingAdjust({ value: todayLog.value, notes: e.target.value });
                setShowAdjustWarning(true);
              } else {
                onChange(value, e.target.value);
              }
            }}
            rows={1}
            className="text-sm resize-none flex-1"
            disabled={saving}
          />
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={saving || hasLoggedToday}
            variant={hasLoggedToday ? 'secondary' : 'default'}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasLoggedToday ? (
              '✓'
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={showAdjustWarning} onOpenChange={setShowAdjustWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Adjust Today's Score?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You already logged a score of {todayLog?.value}/10 for "{goal.title}" today. 
              Adjusting will create a new log entry. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAdjust(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAdjust}>
              Adjust Score
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
