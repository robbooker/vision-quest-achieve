import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SprintWizard } from '@/components/sprint/SprintWizard';
import { SprintDashboard } from '@/components/sprint/SprintDashboard';
import { useSprints } from '@/hooks/useSprints';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Plus, Archive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function Sprints() {
  const { activeSprint, sprints, isLoading } = useSprints();
  const [showWizard, setShowWizard] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const archivedSprints = sprints.filter(s => s.status === 'completed' || s.status === 'archived');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              Sprints
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Structured execution periods with clear goals and tasks
            </p>
          </div>
          {!showWizard && !activeSprint && (
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Sprint
            </Button>
          )}
        </div>

        {showWizard ? (
          <SprintWizard onComplete={() => setShowWizard(false)} />
        ) : activeSprint ? (
          <SprintDashboard />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Rocket className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No Active Sprint</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Launch a sprint to structure your next few weeks around clear goals and tasks.
              </p>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" /> Start a Sprint
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Archived Sprints */}
        {archivedSprints.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Archive className="h-4 w-4" /> Past Sprints
            </h2>
            {archivedSprints.map(sprint => (
              <Card key={sprint.id} className="opacity-70">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{sprint.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sprint.start_date && format(new Date(sprint.start_date), 'MMM d')} – {sprint.end_date && format(new Date(sprint.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={sprint.status === 'completed' ? 'default' : 'secondary'}>
                    {sprint.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
