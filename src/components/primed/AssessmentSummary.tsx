import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PrimedRadarChart } from './PrimedRadarChart';
import { PILLARS, PILLAR_ORDER, LEVEL_NAMES, isFoundationComplete, PillarKey, PillarLevel } from '@/data/primedBehaviors';
import { ChevronLeft, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { PrimedAssessment } from '@/hooks/usePrimedAssessment';

interface AssessmentSummaryProps {
  levels: Record<PillarKey, PillarLevel>;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function AssessmentSummary({ levels, onBack, onSave, isSaving }: AssessmentSummaryProps) {
  // Create a mock assessment object for the radar chart
  const mockAssessment: PrimedAssessment = {
    id: '',
    user_id: '',
    assessed_at: new Date().toISOString(),
    physical_level: levels.physical,
    relations_level: levels.relations,
    income_level: levels.income,
    mental_level: levels.mental,
    excellence_level: levels.excellence,
    direction_level: levels.direction,
    ai_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const foundationComplete = isFoundationComplete({
    physical_level: levels.physical,
    relations_level: levels.relations,
    mental_level: levels.mental,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Assessment Summary</h2>
        <p className="text-muted-foreground">Review your P.R.I.M.E.D. levels before saving</p>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardContent className="pt-6">
          <PrimedRadarChart assessment={mockAssessment} className="h-64" />
        </CardContent>
      </Card>

      {/* Foundation Status */}
      {foundationComplete ? (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Foundation Complete!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-300">
            Your Physical, Mental, and Relations pillars are at Level 1 or higher. 
            You can set goals in all six domains.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">Foundation Incomplete</AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-300">
            Physical, Mental, and Relations should reach Level 1 before focusing on Income, Excellence, or Direction.
            You can still set goals anywhere, but the system will remind you to build your foundation first.
          </AlertDescription>
        </Alert>
      )}

      {/* Level Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PILLAR_ORDER.map(pillar => {
          const level = levels[pillar];
          const pillarInfo = PILLARS[pillar];
          const isFoundationPillar = pillarInfo.isFoundation;
          const needsWork = isFoundationPillar && level < 1;

          return (
            <Card 
              key={pillar} 
              className={needsWork ? 'border-amber-500/50' : ''}
            >
              <CardContent className="py-4 text-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground mx-auto mb-2"
                  style={{ backgroundColor: pillarInfo.color }}
                >
                  {pillarInfo.letter}
                </div>
                <p className="font-medium text-sm">{pillarInfo.name}</p>
                <Badge 
                  variant={level === 0 ? "destructive" : level === 3 ? "default" : "secondary"}
                  className="mt-1"
                >
                  Lv {level} - {LEVEL_NAMES[level]}
                </Badge>
                {needsWork && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Foundation priority
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Edit
        </Button>
        
        <Button onClick={onSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Assessment'}
        </Button>
      </div>
    </div>
  );
}
