import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSleepStats } from '@/hooks/useSleepStats';
import { useOuraMetrics } from '@/hooks/useOuraMetrics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { Moon, Bed, Clock, TrendingUp, Sparkles, Brain, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PhysicalSleepSection() {
  const { data: stats, isLoading } = useSleepStats(14);
  const { weeklyMetrics, todayMetrics, formatSleepDuration } = useOuraMetrics();

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

  // Get last 14 days of data for detailed analysis
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = stats.entries.find(e => e.date === dateStr);
    const metrics = weeklyMetrics?.find(m => m.metric_date === dateStr);
    
    return {
      date: format(date, 'M/d'),
      fullDate: dateStr,
      score: entry?.sleepScore ?? null,
      readiness: entry?.readinessScore ?? null,
      durationHours: metrics?.total_sleep_seconds ? metrics.total_sleep_seconds / 3600 : null,
      deepSleep: metrics?.deep_sleep_seconds ? metrics.deep_sleep_seconds / 3600 : null,
      remSleep: metrics?.rem_sleep_seconds ? metrics.rem_sleep_seconds / 3600 : null,
      lightSleep: metrics?.light_sleep_seconds ? metrics.light_sleep_seconds / 3600 : null,
      hrv: metrics?.hrv_balance ?? null,
      rhr: metrics?.resting_heart_rate ?? null,
      napMinutes: metrics?.nap_duration_minutes ?? null,
    };
  });

  // Calculate additional metrics
  const daysWithDuration = last14Days.filter(d => d.durationHours !== null);
  const avgDuration = daysWithDuration.length > 0
    ? daysWithDuration.reduce((sum, d) => sum + (d.durationHours || 0), 0) / daysWithDuration.length
    : 0;

  const daysWithDeep = last14Days.filter(d => d.deepSleep !== null);
  const avgDeepSleep = daysWithDeep.length > 0
    ? daysWithDeep.reduce((sum, d) => sum + (d.deepSleep || 0), 0) / daysWithDeep.length
    : 0;

  const daysWithRem = last14Days.filter(d => d.remSleep !== null);
  const avgRemSleep = daysWithRem.length > 0
    ? daysWithRem.reduce((sum, d) => sum + (d.remSleep || 0), 0) / daysWithRem.length
    : 0;

  const daysWithHrv = last14Days.filter(d => d.hrv !== null);
  const avgHrv = daysWithHrv.length > 0
    ? Math.round(daysWithHrv.reduce((sum, d) => sum + (d.hrv || 0), 0) / daysWithHrv.length)
    : null;

  // Count naps in the period
  const napDays = last14Days.filter(d => d.napMinutes !== null && d.napMinutes > 0);
  const totalNapMinutes = napDays.reduce((sum, d) => sum + (d.napMinutes || 0), 0);

  // Last night's data
  const lastNight = todayMetrics;

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDurationColor = (hours: number | null) => {
    if (!hours) return 'text-muted-foreground';
    if (hours >= 7) return 'text-green-500';
    if (hours >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-5">
      {/* Last Night Summary */}
      {lastNight && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium">Last Night</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className={cn("text-2xl font-bold", getScoreColor(lastNight.sleep_score))}>
                {lastNight.sleep_score ?? '--'}
              </p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div>
              <p className={cn("text-2xl font-bold", getDurationColor(lastNight.total_sleep_seconds ? lastNight.total_sleep_seconds / 3600 : null))}>
                {formatSleepDuration(lastNight.total_sleep_seconds)}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div>
              <p className={cn("text-2xl font-bold", getScoreColor(lastNight.readiness_score))}>
                {lastNight.readiness_score ?? '--'}
              </p>
              <p className="text-xs text-muted-foreground">Readiness</p>
            </div>
          </div>
          
          {/* Sleep Stages (if available) */}
          {(lastNight.deep_sleep_seconds || lastNight.rem_sleep_seconds || lastNight.light_sleep_seconds) && (
            <div className="mt-3 pt-3 border-t border-indigo-500/20">
              <p className="text-xs text-muted-foreground mb-2">Sleep Stages</p>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 bg-purple-500/20 rounded p-2 text-center">
                  <p className="font-semibold text-purple-400">
                    {lastNight.deep_sleep_seconds ? `${Math.round(lastNight.deep_sleep_seconds / 60)}m` : '--'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Deep</p>
                </div>
                <div className="flex-1 bg-blue-500/20 rounded p-2 text-center">
                  <p className="font-semibold text-blue-400">
                    {lastNight.rem_sleep_seconds ? `${Math.round(lastNight.rem_sleep_seconds / 60)}m` : '--'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">REM</p>
                </div>
                <div className="flex-1 bg-slate-500/20 rounded p-2 text-center">
                  <p className="font-semibold text-slate-400">
                    {lastNight.light_sleep_seconds ? `${Math.round(lastNight.light_sleep_seconds / 60)}m` : '--'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Light</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Biometrics */}
          {(lastNight.hrv_balance || lastNight.resting_heart_rate) && (
            <div className="mt-3 pt-3 border-t border-indigo-500/20 flex gap-4 justify-center text-sm">
              {lastNight.hrv_balance && (
                <div className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-indigo-400" />
                  <span>HRV: <strong className={lastNight.hrv_balance < 70 ? 'text-yellow-500' : ''}>{lastNight.hrv_balance}</strong></span>
                </div>
              )}
              {lastNight.resting_heart_rate && (
                <div className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-red-400" />
                  <span>RHR: <strong>{lastNight.resting_heart_rate}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 14-Day Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.avgSleepScore || '-'}</p>
          <p className="text-xs text-muted-foreground">Avg Sleep Score</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className={cn("text-2xl font-bold", getDurationColor(avgDuration))}>
            {avgDuration > 0 ? `${avgDuration.toFixed(1)}h` : '-'}
          </p>
          <p className="text-xs text-muted-foreground">Avg Duration</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.highScoreStreak}</p>
          <p className="text-xs text-muted-foreground">85+ Streak</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{avgHrv ?? '-'}</p>
          <p className="text-xs text-muted-foreground">Avg HRV</p>
        </div>
      </div>

      {/* Sleep Stages Averages */}
      {(avgDeepSleep > 0 || avgRemSleep > 0) && (
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">14-Day Sleep Stage Averages</span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-400">Deep</span>
                <span className="font-semibold">{avgDeepSleep > 0 ? `${Math.round(avgDeepSleep * 60)}m` : '--'}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${Math.min((avgDeepSleep / 1.5) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-400">REM</span>
                <span className="font-semibold">{avgRemSleep > 0 ? `${Math.round(avgRemSleep * 60)}m` : '--'}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min((avgRemSleep / 2) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nap Summary */}
      {napDays.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
          <Bed className="h-4 w-4 text-indigo-400" />
          <span className="text-sm">
            <strong>{napDays.length}</strong> nap{napDays.length > 1 ? 's' : ''} logged ({totalNapMinutes}m total) in last 14 days
          </span>
        </div>
      )}

      {/* Sleep Score Trend Chart */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          14-Day Sleep Score Trend
        </p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last14Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                name="Sleep Score"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="readiness" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={1.5}
                dot={{ r: 2 }}
                name="Readiness"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sleep Duration Trend */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          14-Day Sleep Duration
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last14Days}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 10]} 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => value ? [`${value.toFixed(1)}h`, 'Duration'] : ['--', 'Duration']}
              />
              <ReferenceLine y={7} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
              <Bar dataKey="durationHours" radius={[4, 4, 0, 0]}>
                {last14Days.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.durationHours && entry.durationHours >= 7 
                      ? 'hsl(var(--primary))' 
                      : entry.durationHours && entry.durationHours >= 6
                        ? 'hsl(45 100% 50%)'
                        : 'hsl(var(--destructive) / 0.7)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source badges */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sources:</span>
        {stats.daysWithOura > 0 && <Badge variant="outline" className="text-xs">Oura: {stats.daysWithOura}</Badge>}
        {stats.daysWithManual > 0 && <Badge variant="outline" className="text-xs">Manual: {stats.daysWithManual}</Badge>}
      </div>
    </div>
  );
}
