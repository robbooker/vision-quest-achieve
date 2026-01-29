import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import { useCycles } from '@/hooks/useCycles';
import { useGoals } from '@/hooks/useGoals';
import { useBigTen } from '@/hooks/useBigTen';
import { useQuickTasks } from '@/hooks/useQuickTasks';
import { TrendingUp, BarChart3, Target, Calendar, CheckSquare, FolderKanban, ListTodo, RotateCcw, Flame, Trophy, Zap, Clock, Timer, Globe, Sparkles, Hexagon, Moon, Utensils } from 'lucide-react';
import { HabitChainCalendar } from '@/components/reports/HabitChainCalendar';
import { CumulativeProgressCard } from '@/components/reports/CumulativeProgressCard';
import { SitewideStats } from '@/components/reports/SitewideStats';
import { PillarAnalyticsSection } from '@/components/reports/PillarAnalyticsSection';
import { SleepSummaryCard } from '@/components/reports/SleepSummaryCard';
import { NutritionSummaryCard } from '@/components/reports/NutritionSummaryCard';
import { AuditStrip } from '@/components/reset/AuditStrip';
import { useResetAudits } from '@/hooks/useResetAudits';
import { useResetPreference } from '@/hooks/useResetPreference';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { format, subDays, eachWeekOfInterval, endOfWeek } from 'date-fns';
import { PieChart, Pie, Cell } from 'recharts';
import { useAffirmations } from '@/hooks/useAffirmations';

export default function Reports() {
  const { getActiveCycle, getCurrentWeekNumber, isLoading: cyclesLoading } = useCycles();
  const activeCycle = getActiveCycle();
  const currentWeek = activeCycle ? getCurrentWeekNumber(activeCycle) : 0;
  
  const { goals } = useGoals(activeCycle?.id);
  const { projects: bigTenProjects } = useBigTen();
  const { tasks: quickTasks } = useQuickTasks();
  const { audits, getScore, getStreak, getPerfectDays, getAverageScore, getBestScore } = useResetAudits();
  const { isResetActive } = useResetPreference();
  const { sessions: focusSessions, weeklyStats: focusWeeklyStats, timeOfDayStats, streak: focusStreak } = useFocusSessions();
  const { stats: affirmationStats } = useAffirmations();

  // Big Ten stats
  const bigTenStats = useMemo(() => {
    const activeProjects = bigTenProjects.filter(p => !p.completed);
    const completedProjects = bigTenProjects.filter(p => p.completed);
    const allTasks = bigTenProjects.flatMap(p => p.tasks || []);
    const completedTasks = allTasks.filter(t => t.completed);
    
    return {
      activeCount: activeProjects.length,
      completedCount: completedProjects.length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      taskCompletionRate: allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100) 
        : 0,
    };
  }, [bigTenProjects]);

  // Quick Tasks stats - tasks completed over time (last 4 weeks)
  const quickTasksStats = useMemo(() => {
    const now = new Date();
    const fourWeeksAgo = subDays(now, 28);
    
    const completedQuickTasks = quickTasks.filter(t => t.completed && t.completed_at);
    const recentCompleted = completedQuickTasks.filter(
      t => new Date(t.completed_at!) >= fourWeeksAgo
    );
    
    // Group by week
    const weeks = eachWeekOfInterval({ start: fourWeeksAgo, end: now }, { weekStartsOn: 1 });
    const weeklyData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const tasksInWeek = recentCompleted.filter(t => {
        const completedDate = new Date(t.completed_at!);
        return completedDate >= weekStart && completedDate <= weekEnd;
      });
      
      return {
        week: `W${index + 1}`,
        label: format(weekStart, 'MMM d'),
        completed: tasksInWeek.length,
        personal: tasksInWeek.filter(t => t.category === 'personal').length,
        business: tasksInWeek.filter(t => t.category === 'business').length,
      };
    });
    
    return {
      totalActive: quickTasks.filter(t => !t.completed).length,
      totalCompleted: completedQuickTasks.length,
      recentCompleted: recentCompleted.length,
      weeklyData,
    };
  }, [quickTasks]);

  // Reset stats for the chart
  const resetChartData = useMemo(() => {
    return audits.map(audit => ({
      day: format(new Date(audit.audit_date), 'EEE'),
      date: audit.audit_date,
      score: getScore(audit),
    }));
  }, [audits, getScore]);

  const chartConfig = {
    score: { label: 'Execution Score', color: 'hsl(var(--primary))' },
    target: { label: 'Target (80%)', color: 'hsl(var(--muted-foreground))' },
    planned: { label: 'Planned', color: 'hsl(var(--primary))' },
    scheduled: { label: 'Scheduled', color: 'hsl(var(--secondary))' },
    completed: { label: 'Completed', color: 'hsl(142 76% 36%)' },
    gap: { label: 'Reality Gap', color: 'hsl(var(--destructive))' },
    progress: { label: 'Progress', color: 'hsl(var(--primary))' },
    goalTarget: { label: 'Target', color: 'hsl(var(--muted-foreground))' },
    personal: { label: 'Personal', color: 'hsl(var(--primary))' },
    business: { label: 'Business', color: 'hsl(var(--secondary))' },
    resetScore: { label: 'Score', color: 'hsl(var(--primary))' },
    focusMinutes: { label: 'Minutes', color: 'hsl(var(--primary))' },
    morning: { label: 'Morning', color: 'hsl(199 89% 48%)' },
    afternoon: { label: 'Afternoon', color: 'hsl(45 93% 47%)' },
    evening: { label: 'Evening', color: 'hsl(280 65% 60%)' },
    night: { label: 'Night', color: 'hsl(215 25% 27%)' },
  };

  if (cyclesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!activeCycle) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">
            Create a cycle and add tasks to see your reports.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">
              {activeCycle.name} • Week {currentWeek} of 6
            </p>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              My Stats
            </TabsTrigger>
            <TabsTrigger value="primed" className="flex items-center gap-2">
              <Hexagon className="h-4 w-4" />
              P.R.I.M.E.D.
            </TabsTrigger>
            <TabsTrigger value="sitewide" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Sitewide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6 mt-6">

        {/* Cumulative Progress - Top Priority for numeric goals */}
        <CumulativeProgressCard 
          goals={goals.map(g => ({ id: g.id, title: g.title, target_value: g.target_value, metric_type: g.metric_type }))}
          cycleEndDate={activeCycle?.end_date}
        />

        {/* Habit Chains Section */}
        <HabitChainCalendar />

        {/* Affirmations Section */}
        {(affirmationStats.totalDays > 0 || affirmationStats.currentStreak > 0) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Affirmations
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Days</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{affirmationStats.totalDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    days practiced
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{affirmationStats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    consecutive days
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Projects & Tasks Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Projects & Tasks</h2>
          
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Active Big 10</span>
                </div>
                <p className="text-2xl font-bold mt-1">{bigTenStats.activeCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bigTenStats.completedCount} completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Big 10 Tasks</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {bigTenStats.completedTasks}/{bigTenStats.totalTasks}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bigTenStats.taskCompletionRate}% complete
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Quick Tasks Active</span>
                </div>
                <p className="text-2xl font-bold mt-1">{quickTasksStats.totalActive}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quickTasksStats.totalCompleted} all-time completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Last 4 Weeks</span>
                </div>
                <p className="text-2xl font-bold mt-1">{quickTasksStats.recentCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  quick tasks completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Tasks Completion Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Quick Tasks Completed (Last 4 Weeks)
              </CardTitle>
              <CardDescription>Personal vs business tasks by week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={quickTasksStats.weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="personal" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="business" stackId="a" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Focus Sessions Section - Second Priority */}
        {focusSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Focused Work
            </h2>
            
            {/* Focus Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Last 7 Days</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{focusWeeklyStats.totalMinutes}m</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {focusWeeklyStats.sessionCount} sessions
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Avg Duration</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{focusWeeklyStats.avgDuration}m</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Focus Streak</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{focusStreak} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Sessions</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {focusSessions.filter(s => s.status === 'completed').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Focus Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Daily Focus Minutes (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <BarChart data={focusWeeklyStats.dailyStats} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit="m" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Time of Day Distribution
                  </CardTitle>
                  <CardDescription>When do you focus best?</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={timeOfDayStats.filter(d => d.minutes > 0)}
                          dataKey="minutes"
                          nameKey="time"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ time, minutes }) => `${time}: ${minutes}m`}
                          labelLine={false}
                        >
                          {timeOfDayStats.map((entry, index) => (
                            <Cell 
                              key={entry.time} 
                              fill={
                                entry.time === 'Morning' ? 'hsl(199 89% 48%)' :
                                entry.time === 'Afternoon' ? 'hsl(45 93% 47%)' :
                                entry.time === 'Evening' ? 'hsl(280 65% 60%)' :
                                'hsl(215 25% 27%)'
                              } 
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Sleep & Nutrition Summary Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            Health Tracking
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <SleepSummaryCard />
            <NutritionSummaryCard />
          </div>
        </div>

        {/* 7-Day Reset Section - Only show if user has reset data */}
        {(audits.length > 0 || isResetActive) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              7-Day Reset
            </h2>
            
            {/* Reset Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{getStreak()} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Perfect Days</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{getPerfectDays()}</p>
                  <p className="text-xs text-muted-foreground mt-1">8/8 score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Average Score</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{getAverageScore()}/8</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Best Score</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{getBestScore()}/8</p>
                </CardContent>
              </Card>
            </div>

            {/* Audit Strip and Chart */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    7-Day Audit Strip
                  </CardTitle>
                  <CardDescription>Your daily performance at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <AuditStrip audits={audits} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Daily Scores
                  </CardTitle>
                  <CardDescription>Rules completed each day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[150px]">
                    <BarChart data={resetChartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 8]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ReferenceLine y={8} stroke="hsl(160 88% 63%)" strokeDasharray="3 3" />
                      <Bar
                        dataKey="score"
                        radius={[4, 4, 0, 0]}
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

          </TabsContent>

          <TabsContent value="primed" className="space-y-6 mt-6">
            <PillarAnalyticsSection />
          </TabsContent>

          <TabsContent value="sitewide" className="mt-6">
            <SitewideStats />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
