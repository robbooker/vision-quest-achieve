import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CycleHeader } from '@/components/dashboard/CycleHeader';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { CreateCycleDialog } from '@/components/dashboard/CreateCycleDialog';
import { CreateGoalDialog } from '@/components/dashboard/CreateGoalDialog';
import { MilestonePlannerDialog } from '@/components/dashboard/MilestonePlannerDialog';
import { WeekView } from '@/components/dashboard/WeekView';
import { WeeklyReviewDialog, ReplanDialog } from '@/components/dashboard/WeeklyReviewDialog';
import { useCycles } from '@/hooks/useCycles';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useTaskInstances } from '@/hooks/useTaskInstances';
import { useWeekReviews } from '@/hooks/useWeekReviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronDown, TrendingUp, ClipboardCheck, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [createCycleOpen, setCreateCycleOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [milestonePlannerGoal, setMilestonePlannerGoal] = useState<Goal | null>(null);
  
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const [replanOpen, setReplanOpen] = useState(false);
  
  const { cycles, isLoading: cyclesLoading, getActiveCycle, getCurrentWeekNumber } = useCycles();
  const activeCycle = getActiveCycle();
  const currentWeek = activeCycle ? getCurrentWeekNumber(activeCycle) : 0;
  
  const { goals, isLoading: goalsLoading, deleteGoal } = useGoals(activeCycle?.id);
  const { tasks, getWeekStats } = useTaskInstances(activeCycle?.id);
  const weekStats = activeCycle ? getWeekStats(tasks, currentWeek) : { completed: 0, total: 0, percentage: 0 };
  const { toast } = useToast();

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal.mutateAsync(goalId);
      toast({
        title: 'Goal deleted',
        description: 'The goal has been removed from your cycle.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePlanMilestones = (goal: Goal) => {
    setMilestonePlannerGoal(goal);
  };

  if (cyclesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No cycles yet
  if (cycles.length === 0) {
    return (
      <DashboardLayout>
        <EmptyState type="cycle" onAction={() => setCreateCycleOpen(true)} />
        <CreateCycleDialog open={createCycleOpen} onOpenChange={setCreateCycleOpen} />
      </DashboardLayout>
    );
  }

  // Has cycles but no active one
  if (!activeCycle) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Cycles</h1>
              <p className="text-muted-foreground">
                No active cycle. Create a new one or view past cycles.
              </p>
            </div>
            <Button onClick={() => setCreateCycleOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Cycle
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <h3 className="font-semibold">{cycle.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {cycle.start_date} – {cycle.end_date}
                </p>
                <span className="inline-block text-xs bg-muted px-2 py-1 rounded">
                  {cycle.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <CreateCycleDialog open={createCycleOpen} onOpenChange={setCreateCycleOpen} />
      </DashboardLayout>
    );
  }

  // Active cycle view
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cycle selector (if multiple cycles) */}
        {cycles.length > 1 && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {activeCycle.name}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                {cycles.map((cycle) => (
                  <DropdownMenuItem key={cycle.id}>
                    {cycle.name}
                    {cycle.id === activeCycle.id && ' (Active)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={() => setCreateCycleOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Cycle header with week indicator */}
        <CycleHeader cycle={activeCycle} currentWeek={currentWeek} />

        {/* Goals section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Goals</h2>
            {goals.length > 0 && goals.length < 3 && (
              <Button variant="outline" size="sm" onClick={() => setCreateGoalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Goal ({goals.length}/3)
              </Button>
            )}
          </div>

          {goalsLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : goals.length === 0 ? (
            <EmptyState type="goal" onAction={() => setCreateGoalOpen(true)} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  onDelete={handleDeleteGoal}
                  onPlanMilestones={handlePlanMilestones}
                />
              ))}
              
              {/* Add goal card when less than 3 */}
              {goals.length < 3 && (
                <button
                  onClick={() => setCreateGoalOpen(true)}
                  className="flex flex-col items-center justify-center min-h-[180px] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
                >
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Add Goal {goals.length + 1}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Week view and execution score */}
        <div className="grid gap-4 md:grid-cols-2">
          <WeekView 
            cycle={activeCycle} 
            goals={goals} 
            currentWeek={currentWeek} 
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Execution Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-foreground">
                  {weekStats.percentage}%
                </div>
                <div className="flex-1">
                  <Progress value={weekStats.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {weekStats.completed}/{weekStats.total} tasks
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setWeeklyReviewOpen(true)}>
                  <ClipboardCheck className="h-4 w-4 mr-1" />
                  Weekly Review
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplanOpen(true)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateCycleDialog open={createCycleOpen} onOpenChange={setCreateCycleOpen} />
      {activeCycle && (
        <CreateGoalDialog
          open={createGoalOpen}
          onOpenChange={setCreateGoalOpen}
          cycleId={activeCycle.id}
          existingGoalsCount={goals.length}
        />
      )}
      {milestonePlannerGoal && (
        <MilestonePlannerDialog
          open={!!milestonePlannerGoal}
          onOpenChange={(open) => !open && setMilestonePlannerGoal(null)}
          goal={milestonePlannerGoal}
        />
      )}
      {activeCycle && (
        <WeeklyReviewDialog
          open={weeklyReviewOpen}
          onOpenChange={setWeeklyReviewOpen}
          cycle={activeCycle}
          currentWeek={currentWeek}
          goals={goals}
        />
      )}
      {activeCycle && (
        <ReplanDialog
          open={replanOpen}
          onOpenChange={setReplanOpen}
          cycle={activeCycle}
          currentWeek={currentWeek}
          goals={goals}
        />
      )}
    </DashboardLayout>
  );
}
