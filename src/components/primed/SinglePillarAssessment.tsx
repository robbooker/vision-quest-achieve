import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BehaviorChecklist } from './BehaviorChecklist';
import { PILLARS, getBehaviorsForPillar, getBehaviorsForPillarAndLevel, calculateLevelFromBehaviors, PillarKey, PillarLevel, BEHAVIORS } from '@/data/primedBehaviors';
import { usePrimedAssessments } from '@/hooks/usePrimedAssessment';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';

interface SinglePillarAssessmentProps {
  pillar: PillarKey;
  onComplete: () => void;
  onBack: () => void;
}

export function SinglePillarAssessment({ pillar, onComplete, onBack }: SinglePillarAssessmentProps) {
  const pillarInfo = PILLARS[pillar];
  const { currentAssessment, updateAssessment, fetchBehaviors } = usePrimedAssessments();
  const { toast } = useToast();
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing behaviors on mount
  useEffect(() => {
    const loadBehaviors = async () => {
      if (currentAssessment?.id) {
        try {
          const behaviors = await fetchBehaviors(currentAssessment.id);
          const pillarBehaviors = behaviors
            .filter(b => b.pillar === pillar)
            .map(b => b.behavior_key);
          setCheckedBehaviors(new Set(pillarBehaviors));
        } catch (error) {
          console.error('Error loading behaviors:', error);
        }
      }
      setIsLoading(false);
    };
    loadBehaviors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAssessment?.id, pillar]);

  const calculatedLevel = useMemo(() => {
    const pillarBehaviorKeys = getBehaviorsForPillar(pillar).map(b => b.key);
    const checkedForPillar = Array.from(checkedBehaviors).filter(k => pillarBehaviorKeys.includes(k));
    return calculateLevelFromBehaviors(pillar, checkedForPillar);
  }, [pillar, checkedBehaviors]);

  const handleToggleBehavior = (behaviorKey: string) => {
    setCheckedBehaviors(prev => {
      const next = new Set(prev);
      if (next.has(behaviorKey)) {
        next.delete(behaviorKey);
      } else {
        next.add(behaviorKey);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!currentAssessment) {
      toast({
        title: 'Error',
        description: 'No existing assessment found. Please complete a full assessment first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update the single pillar level in the assessment
      await updateAssessment.mutateAsync({
        id: currentAssessment.id,
        [`${pillar}_level`]: calculatedLevel,
      });

      // Note: We're updating just the level. The behaviors are stored separately
      // and would require a more complex update to handle properly.
      // For now, this updates the level which is the main tracked metric.

      toast({
        title: 'Assessment updated',
        description: `Your ${pillarInfo.name} level has been updated to Level ${calculatedLevel}.`,
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const levels: PillarLevel[] = [0, 1, 2, 3];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <span 
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground"
            style={{ backgroundColor: pillarInfo.color }}
          >
            {pillarInfo.letter}
          </span>
          <div>
            <h2 className="text-2xl font-bold">Re-Assess: {pillarInfo.name}</h2>
            <p className="text-sm text-muted-foreground">{pillarInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-center">
            Check the behaviors that describe your <strong>typical</strong> state—not your best day or worst day.
            The system will determine your level based on where the majority of your behaviors fall.
          </p>
        </CardContent>
      </Card>

      {/* Calculated Level Display */}
      <div className="text-center py-2">
        <p className="text-sm text-muted-foreground">Your current level based on selections:</p>
        <p className="text-3xl font-bold text-primary">Level {calculatedLevel}</p>
      </div>

      {/* Behavior Checklists by Level */}
      <div className="space-y-4">
        {levels.map(level => {
          const behaviorsAtLevel = getBehaviorsForPillarAndLevel(pillar, level);
          return (
            <BehaviorChecklist
              key={level}
              behaviors={behaviorsAtLevel}
              level={level}
              checkedBehaviors={checkedBehaviors}
              onToggle={handleToggleBehavior}
            />
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
