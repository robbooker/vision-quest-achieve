import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { useTaskInstances } from '@/hooks/useTaskInstances';
import { useWeekReviews } from '@/hooks/useWeekReviews';
import { useMilestones } from '@/hooks/useMilestones';
import { useBigTen } from '@/hooks/useBigTen';
import { useQuickTasks } from '@/hooks/useQuickTasks';
import { TrendingUp, BarChart3, Target, AlertTriangle, Calendar, CheckSquare, FolderKanban, ListTodo } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export default function Reports() {
  const { getActiveCycle, getCurrentWeekNumber, isLoading: cyclesLoading } = useCycles();
  const activeCycle = getActiveCycle();
  const currentWeek = activeCycle ? getCurrentWeekNumber(activeCycle) : 0;
  
  const { goals } = useGoals(activeCycle?.id);
  const { tasks, getWeekStats } = useTaskInstances(activeCycle?.id);
  const { reviews } = useWeekReviews(activeCycle?.id);
  const { projects: bigTenProjects } = useBigTen();
  const { tasks: quickTasks } = useQuickTasks();

  // Generate execution score data for all weeks
  const executionScoreData = useMemo(() => {
    if (!activeCycle) return [];
    
    return Array.from({ length: 12 }, (_, i) => {
      const weekNum = i + 1;
      const review = reviews.find(r => r.week_number === weekNum);
      const stats = getWeekStats(tasks, weekNum);
      
      return {
        week: `W${weekNum}`,
        weekNumber: weekNum,
        score: review?.execution_score ?? (weekNum <= currentWeek ? stats.percentage : null),
        target: 80, // 80% target line
      };
    });
  }, [activeCycle, reviews, tasks, currentWeek, getWeekStats]);

  // Generate hours breakdown data
  const hoursBreakdownData = useMemo(() => {
    if (!activeCycle) return [];
    
    return Array.from({ length: 12 }, (_, i) => {
      const weekNum = i + 1;
      const weekTasks = tasks.filter(t => t.due_week === weekNum);
      
      const planned = weekTasks.reduce((sum, t) => sum + t.duration_minutes, 0) / 60;
      const scheduled = weekTasks.filter(t => t.scheduled_start).reduce((sum, t) => sum + t.duration_minutes, 0) / 60;
      const completed = weekTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.duration_minutes, 0) / 60;
      
      return {
        week: `W${weekNum}`,
        weekNumber: weekNum,
        planned,
        scheduled,
        completed,
      };
    });
  }, [activeCycle, tasks]);

  // Calculate reality gap data
  const realityGapData = useMemo(() => {
    return hoursBreakdownData.map(week => ({
      ...week,
      gap: week.planned - week.scheduled,
    }));
  }, [hoursBreakdownData]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const completedWeeks = executionScoreData.filter(w => w.score !== null);
    const avgScore = completedWeeks.length > 0
      ? Math.round(completedWeeks.reduce((sum, w) => sum + (w.score || 0), 0) / completedWeeks.length)
      : 0;
    
    const totalPlanned = hoursBreakdownData.reduce((sum, w) => sum + w.planned, 0);
    const totalScheduled = hoursBreakdownData.reduce((sum, w) => sum + w.scheduled, 0);
    const totalCompleted = hoursBreakdownData.reduce((sum, w) => sum + w.completed, 0);
    const totalGap = totalPlanned - totalScheduled;
    
    return { avgScore, totalPlanned, totalScheduled, totalCompleted, totalGap };
  }, [executionScoreData, hoursBreakdownData]);

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            {activeCycle.name} • Week {currentWeek} of 12
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Avg Score</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summaryStats.avgScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Hours Completed</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalCompleted.toFixed(1)}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Hours Planned</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalPlanned.toFixed(1)}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${summaryStats.totalGap > 0 ? 'text-destructive' : 'text-green-500'}`} />
                <span className="text-sm text-muted-foreground">Reality Gap</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${summaryStats.totalGap > 0 ? 'text-destructive' : 'text-green-500'}`}>
                {summaryStats.totalGap > 0 ? '+' : ''}{summaryStats.totalGap.toFixed(1)}h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Execution Score by Week */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Execution Score by Week
              </CardTitle>
              <CardDescription>Weekly task completion percentage vs 80% target</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <LineChart data={executionScoreData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit="%" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Planned vs Scheduled vs Completed Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Hours Breakdown by Week
              </CardTitle>
              <CardDescription>Planned, scheduled, and completed hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart data={hoursBreakdownData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit="h" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="planned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="scheduled" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Milestone Attainment Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Milestone Attainment
              </CardTitle>
              <CardDescription>Goal progress vs linear target</CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No goals to display
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map(goal => (
                    <MilestoneChart key={goal.id} goal={goal} currentWeek={currentWeek} chartConfig={chartConfig} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reality Gap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Reality Gap
              </CardTitle>
              <CardDescription>Planned hours minus scheduled hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart data={realityGapData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit="h" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Bar
                    dataKey="gap"
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--destructive))"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Big 10 & Quick Tasks Section */}
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
      </div>
    </DashboardLayout>
  );
}

interface MilestoneChartProps {
  goal: { id: string; title: string; target_value: number; metric_type: string };
  currentWeek: number;
  chartConfig: any;
}

function MilestoneChart({ goal, currentWeek, chartConfig }: MilestoneChartProps) {
  const { milestones } = useMilestones(goal.id);
  
  const data = useMemo(() => {
    let cumulativeProgress = 0;
    
    return Array.from({ length: 12 }, (_, i) => {
      const weekNum = i + 1;
      const milestone = milestones.find(m => m.week_number === weekNum);
      const linearTarget = (goal.target_value / 12) * weekNum;
      
      if (milestone) {
        cumulativeProgress += milestone.target_value;
      }
      
      return {
        week: `W${weekNum}`,
        progress: weekNum <= currentWeek ? cumulativeProgress : null,
        target: linearTarget,
      };
    });
  }, [milestones, goal.target_value, currentWeek]);

  const progressPercent = goal.target_value > 0
    ? Math.round((data[currentWeek - 1]?.progress || 0) / goal.target_value * 100)
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{goal.title}</span>
        <Badge variant={progressPercent >= 80 ? 'default' : 'secondary'}>
          {progressPercent}%
        </Badge>
      </div>
      <ChartContainer config={chartConfig} className="h-[80px]">
        <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis dataKey="week" tick={false} axisLine={false} />
          <YAxis domain={[0, goal.target_value]} hide />
          <Area
            type="monotone"
            dataKey="target"
            fill="hsl(var(--muted))"
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            fillOpacity={0.3}
          />
          <Line
            type="monotone"
            dataKey="progress"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
