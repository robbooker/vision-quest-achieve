import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSleepStats } from '@/hooks/useSleepStats';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';

export function PhysicalSleepSection() {
  const { data: stats, isLoading } = useSleepStats(14);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!stats || stats.daysLogged === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No sleep data yet.</p>
        <p className="text-xs mt-1">Connect Oura or log sleep manually in Settings.</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = [...stats.entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: format(parseISO(entry.date), 'M/d'),
      score: entry.sleepScore,
      readiness: entry.readinessScore,
    }));

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.avgSleepScore || '-'}</p>
          <p className="text-xs text-muted-foreground">Avg Sleep</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.avgReadinessScore || '-'}</p>
          <p className="text-xs text-muted-foreground">Avg Readiness</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.highScoreStreak}</p>
          <p className="text-xs text-muted-foreground">85+ Streak</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.daysLogged}</p>
          <p className="text-xs text-muted-foreground">Days Logged</p>
        </div>
      </div>

      {/* Sleep Score Trend Chart */}
      {chartData.length > 0 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[50, 100]} 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <ReferenceLine y={85} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Sleep"
              />
              <Line 
                type="monotone" 
                dataKey="readiness" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={1.5}
                dot={{ r: 2 }}
                name="Readiness"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Source badges */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sources:</span>
        {stats.daysWithOura > 0 && <Badge variant="outline" className="text-xs">Oura: {stats.daysWithOura}</Badge>}
        {stats.daysWithManual > 0 && <Badge variant="outline" className="text-xs">Manual: {stats.daysWithManual}</Badge>}
      </div>
    </div>
  );
}
