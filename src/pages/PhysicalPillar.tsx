import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw, Heart, Moon, Utensils, Activity, FlaskConical } from 'lucide-react';
import { usePrimedAssessments } from '@/hooks/usePrimedAssessment';
import { PILLARS, LEVEL_NAMES, getBehaviorsForPillarAndLevel, LEVEL_DESCRIPTIONS, PillarLevel } from '@/data/primedBehaviors';
import { PhysicalSleepSection } from '@/components/primed/PhysicalSleepSection';
import { PhysicalNutritionSection } from '@/components/primed/PhysicalNutritionSection';
import { PhysicalMovementSection } from '@/components/primed/PhysicalMovementSection';
import { PhysicalBloodworkSection } from '@/components/primed/PhysicalBloodworkSection';
import { formatDistanceToNow } from 'date-fns';

export default function PhysicalPillar() {
  const navigate = useNavigate();
  const { currentAssessment, isLoadingCurrent } = usePrimedAssessments();
  
  const pillarInfo = PILLARS.physical;
  const level = (currentAssessment?.physical_level || 0) as PillarLevel;
  const nextLevel = level < 3 ? (level + 1) as PillarLevel : null;
  const nextLevelBehaviors = nextLevel !== null ? getBehaviorsForPillarAndLevel('physical', nextLevel) : [];

  const handleReassess = () => {
    navigate('/primed', { state: { reassessPillar: 'physical' } });
  };

  if (isLoadingCurrent) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Physical Pillar | P.R.I.M.E.D.</title>
        <meta name="description" content="Track your physical health: sleep, nutrition, movement, and bloodwork analytics." />
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/primed')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground"
              style={{ backgroundColor: pillarInfo.color }}
            >
              {pillarInfo.letter}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {pillarInfo.name}
                <Badge variant={level === 0 ? "destructive" : level === 3 ? "default" : "secondary"}>
                  Level {level} - {LEVEL_NAMES[level]}
                </Badge>
              </h1>
              {currentAssessment && (
                <p className="text-sm text-muted-foreground">
                  Last assessed: {formatDistanceToNow(new Date(currentAssessment.assessed_at), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleReassess}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-Assess Physical
          </Button>
        </div>

        {/* Level Progress Card */}
        {nextLevel !== null && nextLevelBehaviors.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Next Level: {LEVEL_NAMES[nextLevel]}
              </CardTitle>
              <CardDescription>{LEVEL_DESCRIPTIONS[nextLevel]}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {nextLevelBehaviors.map((behavior) => (
                  <li key={behavior.key} className="flex items-start gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full border border-muted-foreground/50 mt-0.5 flex-shrink-0" />
                    <span>{behavior.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {level === 3 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">You've reached Significance!</p>
                  <p className="text-sm text-muted-foreground">
                    Continue maintaining optimal physical health and inspiring others.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sleep Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Moon className="h-5 w-5" />
                Sleep & Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhysicalSleepSection />
            </CardContent>
          </Card>

          {/* Nutrition Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Utensils className="h-5 w-5" />
                Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhysicalNutritionSection />
            </CardContent>
          </Card>

          {/* Movement Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                Movement & Daily Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhysicalMovementSection />
            </CardContent>
          </Card>

          {/* Bloodwork Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="h-5 w-5" />
                Bloodwork
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhysicalBloodworkSection />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
