import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrimedDashboard } from '@/components/primed/PrimedDashboard';
import { PrimedAssessment } from '@/components/primed/PrimedAssessment';

export default function Primed() {
  const [isAssessing, setIsAssessing] = useState(false);

  return (
    <DashboardLayout>
      <Helmet>
        <title>P.R.I.M.E.D. | Groovy Planning</title>
        <meta name="description" content="Map your personal development across six life domains: Physical, Relations, Income, Mental, Excellence, and Direction." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {isAssessing ? (
          <PrimedAssessment onComplete={() => setIsAssessing(false)} />
        ) : (
          <PrimedDashboard onStartAssessment={() => setIsAssessing(true)} />
        )}
      </div>
    </DashboardLayout>
  );
}
