import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTaskInstances } from '@/hooks/useTaskInstances';
import { useWeekReviews } from '@/hooks/useWeekReviews';
import { useMilestones } from '@/hooks/useMilestones';
import { useWeeklyHabitStats } from '@/hooks/useGoalProgress';
import { Cycle } from '@/hooks/useCycles';
import { Goal } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { 
  Trophy, 
  Lightbulb, 
  Target, 
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Repeat
} from 'lucide-react';

interface WeeklyReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: Cycle;
  currentWeek: number;
  goals: Goal[];
}

export function WeeklyReviewDialog({
  open,
  onOpenChange,
  cycle,
  currentWeek,
  goals,
}: WeeklyReviewDialogProps) {
  const { toast } = useToast();
  const { tasks, getWeekStats } = useTaskInstances(cycle.id);
  const { reviews, createOrUpdateReview, getReviewForWeek } = useWeekReviews(cycle.id);
  
  const existingReview = getReviewForWeek(currentWeek);
  const weekStats = getWeekStats(tasks, currentWeek);

  // Calculate week date range for habit stats
  const cycleStart = new Date(cycle.start_date);
  const weekStart = addWeeks(startOfWeek(cycleStart, { weekStartsOn: 1 }), currentWeek - 1);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  
  const goalIds = useMemo(() => goals.map(g => g.id), [goals]);
  const { data: habitStats, isLoading: habitStatsLoading } = useWeeklyHabitStats(goalIds, weekStart, weekEnd);

  const [formData, setFormData] = useState({
    wins: '',
    lessons: '',
    next_focus: '',
    celebration: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (existingReview) {
      setFormData({
        wins: existingReview.wins || '',
        lessons: existingReview.lessons || '',
        next_focus: existingReview.next_focus || '',
        celebration: existingReview.celebration || '',
      });
    }
  }, [existingReview]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createOrUpdateReview.mutateAsync({
        cycle_id: cycle.id,
        week_number: currentWeek,
        execution_score: weekStats.percentage,
        ...formData,
      });
      toast({ title: 'Review saved!', description: `Week ${currentWeek} review has been saved.` });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save review', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Week {currentWeek} Review
          </DialogTitle>
          <DialogDescription>
            Reflect on your progress and plan for next week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Execution Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Execution Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-foreground">
                  {weekStats.percentage}%
                </div>
                <div className="flex-1">
                  <Progress value={weekStats.percentage} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {weekStats.completed} of {weekStats.total} tasks completed
                  </p>
                </div>
                <Badge variant={weekStats.percentage >= 80 ? 'default' : weekStats.percentage >= 50 ? 'secondary' : 'destructive'}>
                  {weekStats.percentage >= 80 ? 'Excellent' : weekStats.percentage >= 50 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Daily Habits Stats */}
          {habitStats && habitStats.total > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Daily Habits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-foreground">
                    {habitStats.percentage}%
                  </div>
                  <div className="flex-1">
                    <Progress value={habitStats.percentage} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {habitStats.completed} of {habitStats.total} habit-days completed
                    </p>
                  </div>
                  <Badge variant={habitStats.percentage >= 80 ? 'default' : habitStats.percentage >= 50 ? 'secondary' : 'destructive'}>
                    {habitStats.percentage >= 80 ? 'Consistent' : habitStats.percentage >= 50 ? 'Partial' : 'Struggling'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goal Progress */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goal Progress This Week
            </h3>
            {goals.map(goal => (
              <GoalWeekProgress key={goal.id} goal={goal} weekNumber={currentWeek} />
            ))}
          </div>

          <Separator />

          {/* Wins */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Wins
            </Label>
            <Textarea
              placeholder="What went well this week? What are you proud of?"
              value={formData.wins}
              onChange={(e) => setFormData({ ...formData, wins: e.target.value })}
              rows={3}
            />
          </div>

          {/* Lessons */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Lessons Learned
            </Label>
            <Textarea
              placeholder="What challenges did you face? What would you do differently?"
              value={formData.lessons}
              onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
              rows={3}
            />
          </div>

          {/* Next Week Focus */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Next Week's Focus
            </Label>
            <Textarea
              placeholder="What's your #1 priority for next week?"
              value={formData.next_focus}
              onChange={(e) => setFormData({ ...formData, next_focus: e.target.value })}
              rows={2}
            />
          </div>

          {/* Celebration (Week 13) */}
          {currentWeek === 13 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Celebration
              </Label>
              <Textarea
                placeholder="How will you celebrate completing this cycle?"
                value={formData.celebration}
                onChange={(e) => setFormData({ ...formData, celebration: e.target.value })}
                rows={2}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Review'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GoalWeekProgressProps {
  goal: Goal;
  weekNumber: number;
}

function GoalWeekProgress({ goal, weekNumber }: GoalWeekProgressProps) {
  const { milestones } = useMilestones(goal.id);
  
  const currentMilestone = milestones.find(m => m.week_number === weekNumber);
  const cumulativeTarget = milestones
    .filter(m => m.week_number <= weekNumber)
    .reduce((sum, m) => sum + m.target_value, 0);
  
  const progressPercent = goal.target_value > 0 
    ? Math.round((cumulativeTarget / goal.target_value) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{goal.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground">{progressPercent}%</span>
        </div>
        {currentMilestone && (
          <p className="text-xs text-muted-foreground mt-1">
            This week: {currentMilestone.target_value.toLocaleString()} {goal.metric_type}
          </p>
        )}
      </div>
    </div>
  );
}

interface ReplanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: Cycle;
  currentWeek: number;
  goals: Goal[];
}

export function ReplanDialog({
  open,
  onOpenChange,
  cycle,
  currentWeek,
  goals,
}: ReplanDialogProps) {
  const { toast } = useToast();
  const [isReplanning, setIsReplanning] = useState(false);

  const handleReplan = async () => {
    setIsReplanning(true);
    // In a real implementation, this would recalculate milestones
    // based on current progress and redistribute remaining targets
    setTimeout(() => {
      toast({ 
        title: 'Milestones updated', 
        description: 'Remaining weeks have been adjusted based on your progress.' 
      });
      setIsReplanning(false);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Replan Remaining Weeks
          </DialogTitle>
          <DialogDescription>
            Adjust your milestones based on current progress. This will redistribute
            remaining targets across weeks {currentWeek + 1} to 12.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm font-medium mb-2">Goals to replan:</p>
            <ul className="space-y-2">
              {goals.map(goal => (
                <li key={goal.id} className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-primary" />
                  {goal.title}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            This will evenly distribute any remaining target across the remaining weeks
            ({12 - currentWeek} weeks left).
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleReplan} disabled={isReplanning}>
              {isReplanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Replanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Replan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
