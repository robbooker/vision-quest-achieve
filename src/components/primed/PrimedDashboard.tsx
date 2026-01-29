import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PrimedRadarChart } from './PrimedRadarChart';
import { PillarDetailCard } from './PillarDetailCard';
import { PillarDetailSheet } from './PillarDetailSheet';
import { PILLAR_ORDER, FOUNDATION_PILLARS, ADVANCED_PILLARS, isFoundationComplete, PillarKey, PillarLevel } from '@/data/primedBehaviors';
import { usePrimedAssessments } from '@/hooks/usePrimedAssessment';
import { usePrimedProgress } from '@/hooks/usePrimedProgress';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Hexagon } from 'lucide-react';

interface PrimedDashboardProps {
  onStartAssessment: () => void;
  onReassessPillar?: (pillar: PillarKey) => void;
}

export function PrimedDashboard({ onStartAssessment, onReassessPillar }: PrimedDashboardProps) {
  const { currentAssessment, isLoadingCurrent } = usePrimedAssessments();
  const { pillarProgress, getProgressForPillar } = usePrimedProgress();
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handlePillarClick = (pillar: PillarKey) => {
    setSelectedPillar(pillar);
    setSheetOpen(true);
  };

  const handleReassessPillar = (pillar: PillarKey) => {
    setSheetOpen(false);
    onReassessPillar?.(pillar);
  };

  if (isLoadingCurrent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentAssessment) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Hexagon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Welcome to P.R.I.M.E.D.</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Map your personal development across six life domains. 
              Complete your first assessment to see where you stand and identify your growth priorities.
            </p>
          </div>
          <Button onClick={onStartAssessment} size="lg">
            Begin Your Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  const foundationComplete = isFoundationComplete({
    physical_level: currentAssessment.physical_level,
    relations_level: currentAssessment.relations_level,
    mental_level: currentAssessment.mental_level,
  });

  const getPillarLevel = (pillar: PillarKey): PillarLevel => {
    return currentAssessment[`${pillar}_level` as keyof typeof currentAssessment] as PillarLevel;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">P.R.I.M.E.D. Assessment</h2>
          <p className="text-sm text-muted-foreground">
            Last assessed: {formatDistanceToNow(new Date(currentAssessment.assessed_at), { addSuffix: true })}
          </p>
        </div>
        <Button variant="outline" onClick={onStartAssessment}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-Assess
        </Button>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardContent className="pt-6">
          <PrimedRadarChart assessment={currentAssessment} className="h-72 md:h-80" />
        </CardContent>
      </Card>

      {/* Foundation Pillars */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          Foundation Pillars
          {foundationComplete && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              ✓ Complete
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FOUNDATION_PILLARS.map(pillar => (
            <PillarDetailCard
              key={pillar}
              pillar={pillar}
              level={getPillarLevel(pillar)}
              progress={getProgressForPillar(pillar)}
              onClick={() => handlePillarClick(pillar)}
            />
          ))}
        </div>
      </div>

      {/* Advanced Pillars */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Advanced Pillars</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADVANCED_PILLARS.map(pillar => (
            <PillarDetailCard
              key={pillar}
              pillar={pillar}
              level={getPillarLevel(pillar)}
              isLocked={!foundationComplete}
              isFoundationIncomplete={!foundationComplete}
              progress={getProgressForPillar(pillar)}
              onClick={() => handlePillarClick(pillar)}
            />
          ))}
        </div>
      </div>

      {/* Pillar Detail Sheet */}
      <PillarDetailSheet
        pillar={selectedPillar}
        level={selectedPillar ? getPillarLevel(selectedPillar) : 0}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onReassess={handleReassessPillar}
      />
    </div>
  );
}
