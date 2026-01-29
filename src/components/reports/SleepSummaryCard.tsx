import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSleepStats } from '@/hooks/useSleepStats';
import { Moon, Activity, Flame, Calendar } from 'lucide-react';

export function SleepSummaryCard() {
  const { data: stats, isLoading } = useSleepStats(7);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Sleep Summary
          </CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.daysLogged === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Sleep Summary
          </CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Moon className="h-8 w-8 mb-2 opacity-50" />
            <p>No sleep data logged yet.</p>
            <p className="text-sm">Connect Oura or log sleep manually on the Today page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Sleep Summary
        </CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Moon className="h-3.5 w-3.5" />
              Avg Sleep Score
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(stats.avgSleepScore)}`}>
              {stats.avgSleepScore}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Activity className="h-3.5 w-3.5" />
              Avg Readiness
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(stats.avgReadinessScore)}`}>
              {stats.avgReadinessScore}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Flame className="h-3.5 w-3.5" />
              85+ Streak
            </div>
            <p className="text-2xl font-bold">
              {stats.highScoreStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Days Logged
            </div>
            <p className="text-2xl font-bold">
              {stats.daysLogged} <span className="text-sm font-normal text-muted-foreground">/ 7</span>
            </p>
            {stats.daysWithOura > 0 && stats.daysWithManual > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {stats.daysWithOura} Oura, {stats.daysWithManual} manual
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
