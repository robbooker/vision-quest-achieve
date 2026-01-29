import { Skeleton } from '@/components/ui/skeleton';
import { useOuraMetrics } from '@/hooks/useOuraMetrics';
import { cn } from '@/lib/utils';
import { Footprints, Flame, Activity, TrendingUp, Timer, AlertCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export function PhysicalActivitySection() {
  const { weeklyMetrics, isLoading, todayMetrics, isOuraConnected } = useOuraMetrics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!isOuraConnected) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Connect your Oura Ring to see activity data.</p>
        <p className="text-xs mt-1">Go to Settings → Oura Ring to connect.</p>
      </div>
    );
  }

  const hasActivityData = weeklyMetrics?.some(m => m.activity_score !== null || m.steps !== null);

  if (!hasActivityData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity data yet.</p>
        <p className="text-xs mt-1">Sync your Oura Ring to load activity metrics.</p>
      </div>
    );
  }

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayMetrics = weeklyMetrics?.find(m => m.metric_date === dateStr);
    return {
      date: format(date, 'EEE'),
      fullDate: dateStr,
      steps: dayMetrics?.steps ?? null,
      activityScore: dayMetrics?.activity_score ?? null,
      activeCalories: dayMetrics?.active_calories ?? null,
      highMins: dayMetrics?.high_activity_minutes ?? 0,
      medMins: dayMetrics?.medium_activity_minutes ?? 0,
      lowMins: dayMetrics?.low_activity_minutes ?? 0,
    };
  });

  // Use today's metrics if available, otherwise fall back to yesterday's
  const todayHasActivity = todayMetrics?.activity_score !== null || todayMetrics?.steps !== null;
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const yesterdayMetrics = weeklyMetrics?.find(m => m.metric_date === yesterdayStr);
  
  const displayMetrics = todayHasActivity ? todayMetrics : yesterdayMetrics;
  const isShowingYesterday = !todayHasActivity && !!yesterdayMetrics?.activity_score;

  const avgSteps = weeklyMetrics
    ?.filter(m => m.steps !== null)
    .reduce((sum, m, _, arr) => sum + (m.steps || 0) / arr.length, 0) || 0;

  const avgScore = weeklyMetrics
    ?.filter(m => m.activity_score !== null)
    .reduce((sum, m, _, arr) => sum + (m.activity_score || 0) / arr.length, 0) || 0;

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return '--';
    const km = meters / 1000;
    if (km >= 1) return `${km.toFixed(1)} km`;
    return `${meters} m`;
  };

  return (
    <div className="space-y-4">
      {/* Date indicator if showing yesterday's data */}
      {isShowingYesterday && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block">
          Showing yesterday's activity (today's not yet available)
        </div>
      )}

      {/* Today's/Yesterday's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Activity Score</span>
          </div>
          <p className={cn("text-2xl font-bold", getScoreColor(displayMetrics?.activity_score))}>
            {displayMetrics?.activity_score ?? '--'}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Footprints className="h-4 w-4" />
            <span className="text-xs">Steps</span>
          </div>
          <p className="text-2xl font-bold">
            {displayMetrics?.steps?.toLocaleString() ?? '--'}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="h-4 w-4" />
            <span className="text-xs">Active Calories</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {displayMetrics?.active_calories ?? '--'}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Distance</span>
          </div>
          <p className="text-2xl font-bold">
            {formatDistance(displayMetrics?.equivalent_walking_distance_meters)}
          </p>
        </div>
      </div>

      {/* Activity Minutes Breakdown */}
      {(displayMetrics?.high_activity_minutes || displayMetrics?.medium_activity_minutes || displayMetrics?.low_activity_minutes) && (
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Activity Minutes {isShowingYesterday ? '(Yesterday)' : 'Today'}
          </p>
          <div className="flex gap-2">
            <div className="flex-1 text-center">
              <div className="h-2 bg-destructive rounded-full mb-1" />
              <p className="text-sm font-semibold">{displayMetrics?.high_activity_minutes ?? 0}m</p>
              <p className="text-[10px] text-muted-foreground">High</p>
            </div>
            <div className="flex-1 text-center">
              <div className="h-2 bg-accent rounded-full mb-1" />
              <p className="text-sm font-semibold">{displayMetrics?.medium_activity_minutes ?? 0}m</p>
              <p className="text-[10px] text-muted-foreground">Medium</p>
            </div>
            <div className="flex-1 text-center">
              <div className="h-2 bg-primary rounded-full mb-1" />
              <p className="text-sm font-semibold">{displayMetrics?.low_activity_minutes ?? 0}m</p>
              <p className="text-[10px] text-muted-foreground">Low</p>
            </div>
          </div>
        </div>
      )}

      {/* Inactivity Alerts */}
      {displayMetrics?.inactivity_alerts !== null && displayMetrics?.inactivity_alerts > 0 && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">{displayMetrics.inactivity_alerts} inactivity alert{displayMetrics.inactivity_alerts > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* 7-Day Steps Trend */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">7-Day Steps Trend (Avg: {Math.round(avgSteps).toLocaleString()})</p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [value?.toLocaleString() ?? '--', 'Steps']}
              />
              <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.steps && entry.steps >= 10000 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Activity Score Trend */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">7-Day Activity Score (Avg: {Math.round(avgScore)})</p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [value ?? '--', 'Score']}
              />
              <Line 
                type="monotone" 
                dataKey="activityScore" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
