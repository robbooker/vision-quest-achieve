import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Target, Trophy, Plus, Minus } from 'lucide-react';
import { useGoalSprint } from '@/hooks/useGoalSprint';
import { GOAL_SPRINT, GOALS_PER_DAY, STRENGTH_MAX_SETS, getStrengthDescription, getStrengthTitle, getSprintDayNumber, isSprintActive, formatDateStr, GoalSection } from '@/data/goalSprint';
import { format, addDays, subDays } from 'date-fns';

const SECTION_LABELS: Record<GoalSection, string> = {
  morning: '🌅 Morning',
  general: '⚡ Anytime',
  afternoon: '🌆 Afternoon',
};

export function GoalSprintWidget() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { completedKeys, toggleGoal, updateSets, strengthSets, isLoading, stats } = useGoalSprint(selectedDate);
  
  const dayNumber = getSprintDayNumber(selectedDate);
  const isToday = formatDateStr(selectedDate) === formatDateStr(new Date());
  const dateStr = formatDateStr(selectedDate);
  const inRange = dateStr >= GOAL_SPRINT.startDate && dateStr <= GOAL_SPRINT.endDate;

  // Build goals list for the selected date
  const goals = GOAL_SPRINT.goals.map((g) => {
    if (g.key === 'strength') {
      return {
        ...g,
        title: getStrengthTitle(selectedDate),
        description: getStrengthDescription(selectedDate),
      };
    }
    return g;
  });

  const completedCount = goals.filter(g => completedKeys.has(g.key)).length;
  const dayProgress = Math.round((completedCount / GOALS_PER_DAY) * 100);

  const canGoBack = formatDateStr(subDays(selectedDate, 1)) >= GOAL_SPRINT.startDate;
  const canGoForward = formatDateStr(addDays(selectedDate, 1)) <= GOAL_SPRINT.endDate;

  // Group by section
  const sections: GoalSection[] = ['morning', 'general', 'afternoon'];

  return (
    <Card className="h-full border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Goal Sprint
            <Badge variant="outline" className="text-xs">
              Day {dayNumber}/14
            </Badge>
          </CardTitle>
          {completedCount === GOALS_PER_DAY && inRange && (
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
              <Trophy className="h-3 w-3 mr-1" />
              Perfect Day!
            </Badge>
          )}
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canGoBack}
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canGoForward}
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedCount}/{GOALS_PER_DAY} goals</span>
            <span>{dayProgress}%</span>
          </div>
          <Progress value={dayProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {!inRange ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            This date is outside the sprint window.
          </p>
        ) : (
          sections.map((section) => {
            const sectionGoals = goals.filter(g => g.section === section);
            if (sectionGoals.length === 0) return null;
            return (
              <div key={section}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-1.5 px-1">
                  {SECTION_LABELS[section]}
                </p>
                <div className="space-y-1.5">
                  {sectionGoals.map((goal) => {
                    const isComplete = completedKeys.has(goal.key);

                    // Strength gets counter UI
                    if (goal.key === 'strength') {
                      return (
                        <div
                          key={goal.key}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            isComplete
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isComplete ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                              {goal.emoji} {goal.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {goal.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={isLoading || updateSets.isPending || strengthSets <= 0}
                                onClick={() => updateSets.mutate({ sets: strengthSets - 1 })}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold min-w-[4rem] text-center">
                                {strengthSets}/{STRENGTH_MAX_SETS} sets
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={isLoading || updateSets.isPending || strengthSets >= STRENGTH_MAX_SETS}
                                onClick={() => updateSets.mutate({ sets: strengthSets + 1 })}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Normal checkbox goal
                    return (
                      <button
                        key={goal.key}
                        onClick={() => toggleGoal.mutate({ goalKey: goal.key, completed: !isComplete })}
                        disabled={isLoading || toggleGoal.isPending}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                          isComplete
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-card hover:bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isComplete ? 'text-green-700 dark:text-green-400 line-through' : 'text-foreground'}`}>
                            {goal.emoji} {goal.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {goal.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Sprint-wide stats */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sprint progress</span>
            <span>{stats.totalCompleted}/{stats.totalPossible} ({stats.percentage}%)</span>
          </div>
          <Progress value={stats.percentage} className="h-1.5 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
