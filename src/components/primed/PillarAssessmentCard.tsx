import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BehaviorChecklist } from './BehaviorChecklist';
import { PILLARS, getBehaviorsForPillar, getBehaviorsForPillarAndLevel, calculateLevelFromBehaviors, PillarKey, PillarLevel, Behavior } from '@/data/primedBehaviors';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PillarAssessmentCardProps {
  pillar: PillarKey;
  checkedBehaviors: Set<string>;
  onToggleBehavior: (behaviorKey: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepNumber: number;
  totalSteps: number;
}

export function PillarAssessmentCard({
  pillar,
  checkedBehaviors,
  onToggleBehavior,
  onNext,
  onBack,
  isFirst,
  isLast,
  stepNumber,
  totalSteps,
}: PillarAssessmentCardProps) {
  const pillarInfo = PILLARS[pillar];
  
  const calculatedLevel = useMemo(() => {
    const pillarBehaviorKeys = getBehaviorsForPillar(pillar).map(b => b.key);
    const checkedForPillar = Array.from(checkedBehaviors).filter(k => pillarBehaviorKeys.includes(k));
    return calculateLevelFromBehaviors(pillar, checkedForPillar);
  }, [pillar, checkedBehaviors]);

  const levels: PillarLevel[] = [0, 1, 2, 3];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span 
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground"
            style={{ backgroundColor: pillarInfo.color }}
          >
            {pillarInfo.letter}
          </span>
          <h2 className="text-2xl font-bold">{pillarInfo.name}</h2>
        </div>
        <p className="text-muted-foreground">{pillarInfo.description}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Step {stepNumber} of {totalSteps}
        </p>
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
              onToggle={onToggleBehavior}
            />
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isFirst}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <Button onClick={onNext}>
          {isLast ? 'Review & Save' : 'Next'}
          {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
