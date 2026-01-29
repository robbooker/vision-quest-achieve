import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSitewideStats } from '@/hooks/useSitewideStats';
import { useSitewideTrends } from '@/hooks/useSitewideTrends';
import { AnimatedCounter } from './AnimatedCounter';
import { ProgressRing } from './ProgressRing';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
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
  BarChart3,
  Activity,
  Sparkles,
  Calendar,
  Moon,
  Utensils,
  Info
} from 'lucide-react';

const chartConfig = {
  tasks: {
    label: 'Tasks',
    color: 'hsl(var(--chart-2))',
  },
  focus: {
    label: 'Focus Time',
    color: 'hsl(var(--chart-1))',
  },
  sessions: {
    label: 'Sessions',
    color: 'hsl(var(--primary))',
  },
  habits: {
    label: 'Habits',
    color: 'hsl(var(--chart-3))',
  },
  journal: {
    label: 'Journal',
    color: 'hsl(var(--chart-4))',
  },
  users: {
    label: 'Active Users',
    color: 'hsl(var(--chart-5))',
  },
  signups: {
    label: 'New Users',
    color: 'hsl(var(--primary))',
  },
};

export function SitewideStats() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useSitewideStats();
  const { data: trends, isLoading: trendsLoading } = useSitewideTrends(14);

  const isLoading = statsLoading || trendsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (statsError || !stats) {
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

  // Prepare chart data
  const taskTrendData = trends?.daily_tasks?.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    tasks: d.count || 0,
  })) || [];

  const focusTrendData = trends?.daily_focus?.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    minutes: d.minutes || 0,
    sessions: d.sessions || 0,
  })) || [];

  const userActivityData = trends?.daily_active_users?.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    users: d.count || 0,
  })) || [];

  const combinedActivityData = trends?.daily_tasks?.map(d => {
    const date = d.date;
    const focus = trends?.daily_focus?.find(f => f.date === date);
    const habits = trends?.daily_habits?.find(h => h.date === date);
    return {
      date: format(parseISO(date), 'MMM d'),
      tasks: d.count || 0,
      focus: focus?.minutes || 0,
      habits: habits?.total_completions || 0,
    };
  }) || [];

  // Category breakdown for pie chart
  const categoryData = [
    { name: 'Tasks', value: stats.quick_tasks_completed_all_time, fill: 'hsl(var(--chart-2))' },
    { name: 'Focus Sessions', value: stats.focus_sessions_completed, fill: 'hsl(var(--chart-1))' },
    { name: 'Habit Logs', value: stats.tactic_logs_total, fill: 'hsl(var(--chart-3))' },
    { name: 'Journal Entries', value: stats.journal_entries_total, fill: 'hsl(var(--chart-4))' },
  ];

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
      {/* Hero Stats with Gradients */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 shadow-lg shadow-primary/10">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Focus Time</p>
            <p className="text-4xl font-bold text-primary">
              <AnimatedCounter value={focusHours} suffix="h" />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.focus_sessions_completed.toLocaleString()} sessions
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-chart-2/20 via-chart-2/10 to-transparent border-chart-2/30 shadow-lg shadow-chart-2/10">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-chart-2/20 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="h-6 w-6 text-chart-2" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
            <p className="text-4xl font-bold text-chart-2">
              <AnimatedCounter value={stats.quick_tasks_completed_all_time + stats.big_ten_tasks_completed} />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.total_users.toLocaleString()} users
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-chart-1/20 via-chart-1/10 to-transparent border-chart-1/30 shadow-lg shadow-chart-1/10">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-chart-1/20 flex items-center justify-center mx-auto mb-3">
              <Flame className="h-6 w-6 text-chart-1" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Habits Tracked</p>
            <p className="text-4xl font-bold text-chart-1">
              <AnimatedCounter value={stats.tactic_logs_total} />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.tactics_created.toLocaleString()} habits
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/20 via-chart-4/10 to-transparent border-chart-4/30 shadow-lg shadow-chart-4/10">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-chart-4/20 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-chart-4" />
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-sm text-muted-foreground">Active Today</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">
                  <p className="text-xs">
                    Users who updated a task, started a focus session, created a journal entry, or logged a habit today.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-4xl font-bold text-chart-4">
              <AnimatedCounter value={stats.users_active_today} />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              of {stats.total_users.toLocaleString()} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Completion Trend - Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-chart-2" />
            Task Completion Trend (14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={taskTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="tasks" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                fill="url(#taskGradient)" 
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Focus Time Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-chart-1" />
              Focus Time by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart data={focusTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`${value} min`, 'Focus Time']}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="url(#focusGradient)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-chart-5" />
              Daily Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <LineChart data={userActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--chart-5))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-5))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown Pie Chart and Completion Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Activity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rates with Progress Rings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-chart-3" />
              Completion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <ProgressRing 
                  value={stats.quick_tasks_completed_all_time} 
                  max={stats.quick_tasks_total} 
                  size={90}
                  strokeWidth={10}
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">Tasks</p>
              </div>
              <div className="flex flex-col items-center">
                <ProgressRing 
                  value={stats.focus_sessions_completed} 
                  max={stats.focus_sessions_total} 
                  size={90}
                  strokeWidth={10}
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">Focus</p>
              </div>
              <div className="flex flex-col items-center">
                <ProgressRing 
                  value={stats.big_ten_projects_completed} 
                  max={stats.big_ten_projects_total} 
                  size={90}
                  strokeWidth={10}
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">Projects</p>
              </div>
              <div className="flex flex-col items-center">
                <ProgressRing 
                  value={stats.users_active_today} 
                  max={stats.total_users} 
                  size={90}
                  strokeWidth={10}
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Combined Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <ComposedChart data={combinedActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="tasks" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Tasks" />
              <Line type="monotone" dataKey="habits" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Habits" dot={false} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Calculated Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <p className="text-sm text-muted-foreground">Avg Focus per Session</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedCounter value={avgFocusPerSession} suffix=" min" decimals={0} />
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-chart-2/10 to-transparent border border-chart-2/20">
              <p className="text-sm text-muted-foreground">Avg Goals per Cycle</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedCounter value={avgGoalsPerCycle} decimals={1} />
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-chart-3/10 to-transparent border border-chart-3/20">
              <p className="text-sm text-muted-foreground">Avg Logs per Habit</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedCounter value={avgHabitsLogged} decimals={1} />
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-chart-4/10 to-transparent border border-chart-4/20">
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

      {/* Detailed Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks & Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="h-5 w-5 text-chart-2" />
              Tasks & Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Tasks Today (UTC)</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.quick_tasks_completed_today} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-3" />
                <span className="text-sm">All Time Tasks</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.quick_tasks_completed_all_time} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="text-sm">Big Ten Projects</span>
              </div>
              <span className="text-xl font-bold">
                {stats.big_ten_projects_completed} / <AnimatedCounter value={stats.big_ten_projects_total} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Focus & Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-chart-1" />
              Focus & Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Sessions Today (UTC)</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.focus_sessions_today} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-chart-3" />
                <span className="text-sm">Total Focus Time</span>
              </div>
              <span className="text-xl font-bold">{formatMinutes(stats.focus_minutes_total)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-chart-1" />
                <span className="text-sm">Total Habit Logs</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.tactic_logs_total} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Goals & Cycles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-chart-3" />
              Goals & Cycles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total Goals</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.goals_total} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-chart-4" />
                <span className="text-sm">Total Cycles</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.cycles_total} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-chart-1" />
                <span className="text-sm">Habits Created</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.tactics_created} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Journal & Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-chart-4" />
              Journal & Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Journal Entries</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.journal_entries_total} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-chart-5" />
                <span className="text-sm">Total Users</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.total_users} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm">Active Today (UTC)</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.users_active_today} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sleep & Nutrition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="h-5 w-5 text-chart-5" />
              Sleep & Nutrition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Sleep Entries</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.sleep_entries_total} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-chart-3" />
                <span className="text-sm">Sleep Today (UTC)</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.sleep_entries_today} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Meal Entries</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.nutrition_entries_total} />
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-chart-1" />
                <span className="text-sm">Meals Today (UTC)</span>
              </div>
              <span className="text-xl font-bold">
                <AnimatedCounter value={stats.nutrition_entries_today} />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
