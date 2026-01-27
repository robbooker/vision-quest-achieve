import { useState, useMemo } from 'react';
import { PillarAssessmentCard } from './PillarAssessmentCard';
import { AssessmentSummary } from './AssessmentSummary';
import { PILLAR_ORDER, BEHAVIORS, calculateLevelFromBehaviors, getBehaviorsForPillar, PillarKey, PillarLevel } from '@/data/primedBehaviors';
import { usePrimedAssessments } from '@/hooks/usePrimedAssessment';
import { useToast } from '@/hooks/use-toast';

interface PrimedAssessmentProps {
  onComplete: () => void;
}

export function PrimedAssessment({ onComplete }: PrimedAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedBehaviors, setCheckedBehaviors] = useState<Set<string>>(new Set());
  const { createAssessment } = usePrimedAssessments();
  const { toast } = useToast();

  const isReviewStep = currentStep === PILLAR_ORDER.length;
  const currentPillar = isReviewStep ? null : PILLAR_ORDER[currentStep];

  // Calculate levels for all pillars
  const calculatedLevels = useMemo(() => {
    const levels: Record<PillarKey, PillarLevel> = {} as Record<PillarKey, PillarLevel>;
    
    for (const pillar of PILLAR_ORDER) {
      const pillarBehaviorKeys = getBehaviorsForPillar(pillar).map(b => b.key);
      const checkedForPillar = Array.from(checkedBehaviors).filter(k => pillarBehaviorKeys.includes(k));
      levels[pillar] = calculateLevelFromBehaviors(pillar, checkedForPillar);
    }
    
    return levels;
  }, [checkedBehaviors]);

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

  const handleNext = () => {
    if (currentStep < PILLAR_ORDER.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      // Gather all checked behaviors with their details
      const behaviorDetails = Array.from(checkedBehaviors).map(key => {
        const behavior = BEHAVIORS.find(b => b.key === key)!;
        return {
          pillar: behavior.pillar,
          level: behavior.level as PillarLevel,
          behavior_key: behavior.key,
          behavior_text: behavior.text,
        };
      });

      await createAssessment.mutateAsync({
        physical_level: calculatedLevels.physical,
        relations_level: calculatedLevels.relations,
        income_level: calculatedLevels.income,
        mental_level: calculatedLevels.mental,
        excellence_level: calculatedLevels.excellence,
        direction_level: calculatedLevels.direction,
        behaviors: behaviorDetails,
      });

      toast({
        title: 'Assessment saved',
        description: 'Your P.R.I.M.E.D. assessment has been recorded.',
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save assessment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isReviewStep) {
    return (
      <AssessmentSummary
        levels={calculatedLevels}
        onBack={handleBack}
        onSave={handleSave}
        isSaving={createAssessment.isPending}
      />
    );
  }

  return (
    <PillarAssessmentCard
      pillar={currentPillar!}
      checkedBehaviors={checkedBehaviors}
      onToggleBehavior={handleToggleBehavior}
      onNext={handleNext}
      onBack={handleBack}
      isFirst={currentStep === 0}
      isLast={currentStep === PILLAR_ORDER.length - 1}
      stepNumber={currentStep + 1}
      totalSteps={PILLAR_ORDER.length}
    />
  );
}
