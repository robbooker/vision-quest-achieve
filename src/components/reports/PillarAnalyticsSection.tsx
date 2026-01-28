import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { PILLARS, PillarKey } from '@/data/primedBehaviors';
import { usePillarAnalytics } from '@/hooks/usePillarAnalytics';
import { PrimedWeeklySummary } from '@/components/primed/PrimedWeeklySummary';
import { Clock, CheckSquare, Target, Repeat, Hexagon } from 'lucide-react';

const chartConfig = {
  minutes: { label: 'Focus Minutes', color: 'hsl(var(--primary))' },
  tasks: { label: 'Tasks', color: 'hsl(var(--secondary))' },
  focusMinutes: { label: 'Focus Time', color: 'hsl(var(--primary))' },
};

export function PillarAnalyticsSection() {
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | 'all'>('all');
  const { data, isLoading } = usePillarAnalytics(selectedPillar);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const pillarInfo = selectedPillar !== 'all' ? PILLARS[selectedPillar] : null;

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Hexagon className="h-5 w-5 text-primary" />
          P.R.I.M.E.D. Analytics
        </h2>
        <Select value={selectedPillar} onValueChange={(v) => setSelectedPillar(v as PillarKey | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by pillar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pillars</SelectItem>
            {(['physical', 'relations', 'income', 'mental', 'excellence', 'direction'] as PillarKey[]).map(pillar => (
              <SelectItem key={pillar} value={pillar}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                    style={{ backgroundColor: PILLARS[pillar].color }}
                  >
                    {PILLARS[pillar].letter}
                  </div>
                  {PILLARS[pillar].name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Focus Time</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {data.totals.focusMinutes}m
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.totals.focusSessions} sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Tasks Done</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {data.totals.tasksCompleted}/{data.totals.tasksTotal}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.totals.tasksTotal > 0 
                  ? Math.round((data.totals.tasksCompleted / data.totals.tasksTotal) * 100) 
                  : 0}% completion
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Habits Done</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {data.totals.habitsCompleted}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                last 30 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Active Goals</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {data.totals.goalsCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPillar === 'all' ? 'across all pillars' : `in ${pillarInfo?.name}`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily focus chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Focus (Last 7 Days)
            </CardTitle>
            <CardDescription>
              {selectedPillar === 'all' ? 'All pillars' : pillarInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.dailyFocusData.some(d => d.minutes > 0) ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={data.dailyFocusData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit="m" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="minutes" 
                    fill={pillarInfo?.color || 'hsl(var(--primary))'} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No focus sessions in the last 7 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly trends chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Weekly Tasks (Last 4 Weeks)
            </CardTitle>
            <CardDescription>
              {selectedPillar === 'all' ? 'All pillars' : pillarInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data && data.weeklyData.some(d => d.tasks > 0 || d.focusMinutes > 0) ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={data.weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="tasks" 
                    fill={pillarInfo?.color || 'hsl(var(--primary))'} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No task activity in the last 4 weeks
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pillar breakdown when showing all */}
      {selectedPillar === 'all' && data && data.analytics.some(a => a.focusMinutes > 0 || a.tasksCompleted > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pillar Breakdown</CardTitle>
            <CardDescription>Focus time distribution across pillars (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.analytics.map(pillarData => {
                const info = PILLARS[pillarData.pillar];
                const hasActivity = pillarData.focusMinutes > 0 || pillarData.tasksCompleted > 0;
                
                return (
                  <div 
                    key={pillarData.pillar}
                    className={`p-3 rounded-lg border ${hasActivity ? 'bg-card' : 'bg-muted/30'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.letter}
                      </div>
                      <span className="font-medium text-sm">{info.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block text-foreground font-medium">{pillarData.focusMinutes}m</span>
                        focus time
                      </div>
                      <div>
                        <span className="block text-foreground font-medium">{pillarData.tasksCompleted}</span>
                        tasks done
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly summary component */}
      <PrimedWeeklySummary />
    </div>
  );
}
