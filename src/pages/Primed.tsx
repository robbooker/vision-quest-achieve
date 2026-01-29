import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrimedDashboard } from '@/components/primed/PrimedDashboard';
import { PrimedAssessment } from '@/components/primed/PrimedAssessment';
import { SinglePillarAssessment } from '@/components/primed/SinglePillarAssessment';
import { PillarKey } from '@/data/primedBehaviors';

type AssessmentMode = 'none' | 'full' | 'single';

export default function Primed() {
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('none');
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | null>(null);

  const handleStartFullAssessment = () => {
    setAssessmentMode('full');
    setSelectedPillar(null);
  };

  const handleStartSingleAssessment = (pillar: PillarKey) => {
    setAssessmentMode('single');
    setSelectedPillar(pillar);
  };

  const handleComplete = () => {
    setAssessmentMode('none');
    setSelectedPillar(null);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>P.R.I.M.E.D. | Groovy Planning</title>
        <meta name="description" content="Map your personal development across six life domains: Physical, Relations, Income, Mental, Excellence, and Direction." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {assessmentMode === 'full' ? (
          <PrimedAssessment onComplete={handleComplete} />
        ) : assessmentMode === 'single' && selectedPillar ? (
          <SinglePillarAssessment 
            pillar={selectedPillar} 
            onComplete={handleComplete}
            onBack={handleComplete}
          />
        ) : (
          <PrimedDashboard 
            onStartAssessment={handleStartFullAssessment}
            onReassessPillar={handleStartSingleAssessment}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
