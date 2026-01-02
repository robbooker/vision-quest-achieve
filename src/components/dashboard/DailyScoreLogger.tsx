import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useIndicators, useIndicatorLogs } from '@/hooks/useIndicators';
import { Goal } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Save, Loader2 } from 'lucide-react';

interface DailyScoreLoggerProps {
  goals: Goal[];
}

interface GoalScoreInput {
  indicatorId: string;
  goalTitle: string;
  value: number;
  notes: string;
}

export function DailyScoreLogger({ goals }: DailyScoreLoggerProps) {
  const { toast } = useToast();
  const [scores, setScores] = useState<Record<string, { value: number; notes: string }>>({});
  const [saving, setSaving] = useState(false);

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
  const { indicators } = useIndicators(goal.id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Find or use the first indicator for this goal
  const indicator = indicators.find(i => i.type === 'lag') || indicators[0];
  const { createLog } = useIndicatorLogs(indicator?.id);

  const handleSave = async () => {
    if (!indicator) {
      toast({ 
        title: 'No indicator found', 
        description: 'This goal needs an indicator to log scores.',
        variant: 'destructive'
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
      setSaved(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to log score', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${saved ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm truncate flex-1">{goal.title}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground w-8 text-center">
            {value}
          </span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => {
          onChange(v, notes);
          setSaved(false);
        }}
        min={1}
        max={10}
        step={1}
        className="mb-3"
        disabled={saved}
      />
      <div className="flex gap-2">
        <Textarea
          placeholder="Optional note..."
          value={notes}
          onChange={(e) => {
            onChange(value, e.target.value);
            setSaved(false);
          }}
          rows={1}
          className="text-sm resize-none flex-1"
          disabled={saved}
        />
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={saving || saved}
          variant={saved ? 'secondary' : 'default'}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            '✓'
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
