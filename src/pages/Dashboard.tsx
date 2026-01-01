import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CycleHeader } from '@/components/dashboard/CycleHeader';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { CreateCycleDialog } from '@/components/dashboard/CreateCycleDialog';
import { CreateGoalDialog } from '@/components/dashboard/CreateGoalDialog';
import { MilestonePlannerDialog } from '@/components/dashboard/MilestonePlannerDialog';
import { TacticsManagerDialog } from '@/components/dashboard/TacticsManagerDialog';
import { WeekView } from '@/components/dashboard/WeekView';
import { WeeklyReviewDialog, ReplanDialog } from '@/components/dashboard/WeeklyReviewDialog';
import { GoalCoachChat } from '@/components/coach/GoalCoachChat';
import { useCycles } from '@/hooks/useCycles';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useTaskInstances } from '@/hooks/useTaskInstances';
import { useWeekReviews } from '@/hooks/useWeekReviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronDown, TrendingUp, ClipboardCheck, RefreshCw, Archive, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [createCycleOpen, setCreateCycleOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [milestonePlannerGoal, setMilestonePlannerGoal] = useState<Goal | null>(null);
  const [tacticsManagerGoal, setTacticsManagerGoal] = useState<Goal | null>(null);
  
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const [replanOpen, setReplanOpen] = useState(false);
  const [deleteCycleId, setDeleteCycleId] = useState<string | null>(null);
  const [archiveCycleId, setArchiveCycleId] = useState<string | null>(null);
  
  const { cycles, isLoading: cyclesLoading, getActiveCycle, getCurrentWeekNumber, deleteCycle, archiveCycle } = useCycles();
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

  const handleManageTactics = (goal: Goal) => {
    setTacticsManagerGoal(goal);
  };

  const handleDeleteCycle = async () => {
    if (!deleteCycleId) return;
    try {
      await deleteCycle.mutateAsync(deleteCycleId);
      toast({ title: 'Cycle deleted', description: 'The cycle and all its data have been removed.' });
      setDeleteCycleId(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete cycle', variant: 'destructive' });
    }
  };

  const handleArchiveCycle = async () => {
    if (!archiveCycleId) return;
    try {
      await archiveCycle.mutateAsync(archiveCycleId);
      toast({ title: 'Cycle archived', description: 'The cycle has been archived.' });
      setArchiveCycleId(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive cycle', variant: 'destructive' });
    }
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
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <h3 className="font-semibold">{cycle.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {cycle.start_date} – {cycle.end_date}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-block text-xs bg-muted px-2 py-1 rounded">
                    {cycle.status}
                  </span>
                  <div className="flex gap-1">
                    {cycle.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchiveCycleId(cycle.id)}
                        title="Archive cycle"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    {cycle.status === 'planning' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCycleId(cycle.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete cycle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
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
                  onManageTactics={handleManageTactics}
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
                <div className="nixie-display text-3xl font-bold">
                  {weekStats.percentage}%
                </div>
                <div className="flex-1">
                  <div className="nixie-progress h-3">
                    <div className="nixie-progress-bar" style={{ width: `${weekStats.percentage}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
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
      {tacticsManagerGoal && (
        <TacticsManagerDialog
          open={!!tacticsManagerGoal}
          onOpenChange={(open) => !open && setTacticsManagerGoal(null)}
          goal={tacticsManagerGoal}
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

      {/* Delete Cycle Confirmation */}
      <AlertDialog open={!!deleteCycleId} onOpenChange={(open) => !open && setDeleteCycleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cycle? This will permanently remove all goals, milestones, and tasks associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCycle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Cycle Confirmation */}
      <AlertDialog open={!!archiveCycleId} onOpenChange={(open) => !open && setArchiveCycleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Archive this cycle? It will be hidden from your main view but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveCycle}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Goal Coach */}
      <GoalCoachChat cycleId={activeCycle?.id} />
    </DashboardLayout>
  );
}
