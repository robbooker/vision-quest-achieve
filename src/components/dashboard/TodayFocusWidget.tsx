import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { Target } from 'lucide-react';

export function TodayFocusWidget() {
  const { todaySessions, isLoading } = useFocusSessions();

  const stats = useMemo(() => {
    const completedToday = todaySessions.filter(s => s.status === 'completed');
    const totalMinutes = completedToday.reduce((acc, s) => acc + (s.actual_duration_minutes || 0), 0);
    return {
      minutes: totalMinutes,
      sessions: completedToday.length,
    };
  }, [todaySessions]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Daily focus goal (could be made configurable)
  const dailyGoal = 120; // 2 hours
  const progressPercent = Math.min((stats.minutes / dailyGoal) * 100, 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Today's Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <p className="text-4xl font-bold">{stats.minutes}m</p>
          <p className="text-sm text-muted-foreground">
            focused today • {stats.sessions} session{stats.sessions !== 1 ? 's' : ''}
          </p>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <Link 
          to="/focus" 
          className="block text-xs text-primary hover:underline text-center"
        >
          Start a focus session →
        </Link>
      </CardContent>
    </Card>
  );
}
