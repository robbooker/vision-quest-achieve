import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSitewideStats } from '@/hooks/useSitewideStats';
import { AnimatedCounter } from './AnimatedCounter';
import { ProgressRing } from './ProgressRing';
import { 
  Users, 
  CheckSquare, 
  Target, 
  BookOpen, 
  Flame, 
  Clock, 
  FolderKanban,
  ListTodo,
  Zap,
  Trophy,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export function SitewideStats() {
  const { data: stats, isLoading, error } = useSitewideStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Unable to load sitewide statistics.
      </div>
    );
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculated insights
  const taskCompletionRate = stats.quick_tasks_total > 0 
    ? (stats.quick_tasks_completed_all_time / stats.quick_tasks_total) * 100 
    : 0;
  const focusCompletionRate = stats.focus_sessions_total > 0 
    ? (stats.focus_sessions_completed / stats.focus_sessions_total) * 100 
    : 0;
  const avgFocusPerSession = stats.focus_sessions_completed > 0 
    ? stats.focus_minutes_total / stats.focus_sessions_completed 
    : 0;
  const avgGoalsPerCycle = stats.cycles_total > 0 
    ? stats.goals_total / stats.cycles_total 
    : 0;
  const avgHabitsLogged = stats.tactics_created > 0 
    ? stats.tactic_logs_total / stats.tactics_created 
    : 0;
  const focusHours = Math.round(stats.focus_minutes_total / 60);

  return (
    <div className="space-y-8">
      {/* Hero Highlights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Total Focus Time</p>
            <p className="text-4xl font-bold text-primary">
              <AnimatedCounter value={focusHours} suffix=" hrs" />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              across {stats.focus_sessions_completed.toLocaleString()} sessions
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
          <CardContent className="pt-6 text-center">
            <CheckSquare className="h-8 w-8 text-chart-2 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
            <p className="text-4xl font-bold text-chart-2">
              <AnimatedCounter value={stats.quick_tasks_completed_all_time + stats.big_ten_tasks_completed} />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              by {stats.total_users.toLocaleString()} users
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-chart-1/10 to-chart-1/5 border-chart-1/20">
          <CardContent className="pt-6 text-center">
            <Flame className="h-8 w-8 text-chart-1 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Habits Tracked</p>
            <p className="text-4xl font-bold text-chart-1">
              <AnimatedCounter value={stats.tactic_logs_total} />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              from {stats.tactics_created.toLocaleString()} habits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rates with Progress Rings */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Completion Rates
          </h3>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center">
              <ProgressRing 
                value={stats.quick_tasks_completed_all_time} 
                max={stats.quick_tasks_total} 
                size={100}
                strokeWidth={10}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">Task Completion</p>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing 
                value={stats.focus_sessions_completed} 
                max={stats.focus_sessions_total} 
                size={100}
                strokeWidth={10}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">Focus Sessions</p>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing 
                value={stats.big_ten_projects_completed} 
                max={stats.big_ten_projects_total} 
                size={100}
                strokeWidth={10}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">Big Ten Projects</p>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing 
                value={stats.users_active_today} 
                max={stats.total_users} 
                size={100}
                strokeWidth={10}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">Active Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Insights */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Insights
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Avg Focus per Session</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedCounter value={avgFocusPerSession} suffix=" min" decimals={0} />
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Avg Goals per Cycle</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedCounter value={avgGoalsPerCycle} decimals={1} />
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Avg Logs per Habit</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedCounter value={avgHabitsLogged} decimals={1} />
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Focus per User</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedCounter 
                  value={stats.total_users > 0 ? stats.focus_minutes_total / stats.total_users : 0} 
                  suffix=" min" 
                  decimals={0} 
                />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Engagement */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          User Engagement
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.total_users} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Active Today</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.users_active_today} />
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tasks & Projects */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Tasks & Projects
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Tasks Done Today</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.quick_tasks_completed_today} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Tasks Done All Time</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.quick_tasks_completed_all_time} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.quick_tasks_total.toLocaleString()} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Big Ten Projects</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.big_ten_projects_total} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.big_ten_projects_completed} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-chart-2" />
                <span className="text-sm text-muted-foreground">Big Ten Tasks Done</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.big_ten_tasks_completed} />
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Focus Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Focus Sessions
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Sessions Today</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.focus_sessions_today} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatMinutes(stats.focus_minutes_today)} focused
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Total Focus Time</span>
              </div>
              <p className="text-3xl font-bold mt-2">{formatMinutes(stats.focus_minutes_total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Sessions Completed</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.focus_sessions_completed} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.focus_sessions_total.toLocaleString()} total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Habits & Goals */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Habits & Goals
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Goals</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.goals_total} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                across {stats.cycles_total} cycles
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-chart-1" />
                <span className="text-sm text-muted-foreground">Habits Created</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.tactics_created} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-chart-2" />
                <span className="text-sm text-muted-foreground">Habit Logs Today</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.tactic_logs_today} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Total Habit Logs</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.tactic_logs_total} />
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Journal */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Journal
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Entries Today</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.journal_entries_today} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Total Entries</span>
              </div>
              <p className="text-3xl font-bold mt-2">
                <AnimatedCounter value={stats.journal_entries_total} />
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
