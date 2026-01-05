import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSitewideStats } from '@/hooks/useSitewideStats';
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
  Trophy
} from 'lucide-react';

export function SitewideStats() {
  const { data: stats, isLoading, error } = useSitewideStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-6">
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
              <p className="text-3xl font-bold mt-2">{stats.total_users}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Active Today</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.users_active_today}</p>
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
              <p className="text-3xl font-bold mt-2">{stats.quick_tasks_completed_today}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Tasks Done All Time</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.quick_tasks_completed_all_time}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.quick_tasks_total} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Big Ten Projects</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.big_ten_projects_total}</p>
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
              <p className="text-3xl font-bold mt-2">{stats.big_ten_tasks_completed}</p>
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
              <p className="text-3xl font-bold mt-2">{stats.focus_sessions_today}</p>
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
              <p className="text-3xl font-bold mt-2">{stats.focus_sessions_completed}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.focus_sessions_total} total
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
              <p className="text-3xl font-bold mt-2">{stats.goals_total}</p>
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
              <p className="text-3xl font-bold mt-2">{stats.tactics_created}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-chart-2" />
                <span className="text-sm text-muted-foreground">Habit Logs Today</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.tactic_logs_today}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Total Habit Logs</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.tactic_logs_total}</p>
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
              <p className="text-3xl font-bold mt-2">{stats.journal_entries_today}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground">Total Entries</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.journal_entries_total}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
