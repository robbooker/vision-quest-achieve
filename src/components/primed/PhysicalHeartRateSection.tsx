import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useHeartRateData } from '@/hooks/useHeartRateData';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Heart, TrendingUp, TrendingDown, Minus, Activity, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function PhysicalHeartRateSection() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { chartData, intradayStats, biometricTrend, isLoading } = useHeartRateData(selectedDate);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  // Get yesterday's date for fallback
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;

  // Calculate 14-day RHR/HRV trends
  const latestBiometrics = biometricTrend?.[biometricTrend.length - 1];
  const previousBiometrics = biometricTrend?.[biometricTrend.length - 2];
  
  const rhrTrend = latestBiometrics?.resting_heart_rate && previousBiometrics?.resting_heart_rate
    ? latestBiometrics.resting_heart_rate - previousBiometrics.resting_heart_rate
    : 0;
  
  const hrvTrend = latestBiometrics?.hrv_balance && previousBiometrics?.hrv_balance
    ? latestBiometrics.hrv_balance - previousBiometrics.hrv_balance
    : 0;

  const getRhrStatus = (rhr: number | null) => {
    if (!rhr) return { label: 'Unknown', color: 'text-muted-foreground' };
    if (rhr < 50) return { label: 'Athletic', color: 'text-green-500' };
    if (rhr <= 60) return { label: 'Excellent', color: 'text-green-500' };
    if (rhr <= 70) return { label: 'Good', color: 'text-yellow-500' };
    return { label: 'Elevated', color: 'text-red-500' };
  };

  const getHrvStatus = (hrv: number | null) => {
    if (!hrv) return { label: 'Unknown', color: 'text-muted-foreground' };
    if (hrv >= 85) return { label: 'Optimal', color: 'text-green-500' };
    if (hrv >= 70) return { label: 'Good', color: 'text-yellow-500' };
    return { label: 'Low', color: 'text-red-500' };
  };

  const rhrStatus = getRhrStatus(latestBiometrics?.resting_heart_rate);
  const hrvStatus = getHrvStatus(latestBiometrics?.hrv_balance);

  return (
    <div className="space-y-5">
      {/* Current Biometrics Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Resting HR</span>
            </div>
            <Badge variant="outline" className={cn("text-xs", rhrStatus.color)}>
              {rhrStatus.label}
            </Badge>
          </div>
          <div className="flex items-end gap-2">
            <span className={cn("text-3xl font-bold", rhrStatus.color)}>
              {latestBiometrics?.resting_heart_rate ?? '--'}
            </span>
            <span className="text-sm text-muted-foreground mb-1">bpm</span>
            {rhrTrend !== 0 && (
              <div className={cn("flex items-center text-xs ml-auto mb-1",
                rhrTrend > 0 ? 'text-red-400' : 'text-green-400'
              )}>
                {rhrTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(rhrTrend)}
              </div>
            )}
          </div>
          {latestBiometrics?.rhr_baseline_14d && (
            <p className="text-xs text-muted-foreground mt-1">
              14-day avg: {latestBiometrics.rhr_baseline_14d} bpm
            </p>
          )}
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-400" />
              <span className="text-xs text-muted-foreground">HRV Balance</span>
            </div>
            <Badge variant="outline" className={cn("text-xs", hrvStatus.color)}>
              {hrvStatus.label}
            </Badge>
          </div>
          <div className="flex items-end gap-2">
            <span className={cn("text-3xl font-bold", hrvStatus.color)}>
              {latestBiometrics?.hrv_balance ?? '--'}
            </span>
            <span className="text-sm text-muted-foreground mb-1">ms</span>
            {hrvTrend !== 0 && (
              <div className={cn("flex items-center text-xs ml-auto mb-1",
                hrvTrend > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {hrvTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(hrvTrend)}
              </div>
            )}
          </div>
          {latestBiometrics?.hrv_baseline_14d && (
            <p className="text-xs text-muted-foreground mt-1">
              14-day avg: {latestBiometrics.hrv_baseline_14d} ms
            </p>
          )}
        </div>
      </div>

      {/* 14-Day RHR & HRV Trend Chart */}
      {biometricTrend && biometricTrend.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            14-Day RHR & HRV Trend
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={biometricTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="metric_date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => format(new Date(v), 'M/d')}
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="rhr"
                  domain={[40, 80]} 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  orientation="left"
                />
                <YAxis 
                  yAxisId="hrv"
                  domain={[50, 100]} 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  orientation="right"
                  hide
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} ${name === 'resting_heart_rate' ? 'bpm' : 'ms'}`,
                    name === 'resting_heart_rate' ? 'RHR' : 'HRV'
                  ]}
                  labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                />
                {latestBiometrics?.rhr_baseline_14d && (
                  <ReferenceLine 
                    y={latestBiometrics.rhr_baseline_14d} 
                    yAxisId="rhr"
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="3 3" 
                    strokeOpacity={0.5}
                  />
                )}
                <Line 
                  yAxisId="rhr"
                  type="monotone" 
                  dataKey="resting_heart_rate" 
                  stroke="hsl(0 84% 60%)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="resting_heart_rate"
                  connectNulls
                />
                <Line 
                  yAxisId="hrv"
                  type="monotone" 
                  dataKey="hrv_balance" 
                  stroke="hsl(239 84% 67%)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="hrv_balance"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500 rounded" />
              <span className="text-muted-foreground">RHR (bpm)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-indigo-500 rounded" />
              <span className="text-muted-foreground">HRV (ms)</span>
            </div>
          </div>
        </div>
      )}

      {/* Intraday Heart Rate Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Intraday Heart Rate
          </p>
          <div className="flex gap-1">
            <Button 
              variant={selectedDate === yesterday ? "default" : "outline"} 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={() => setSelectedDate(yesterday)}
            >
              Yesterday
            </Button>
            <Button 
              variant={isToday ? "default" : "outline"} 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={() => setSelectedDate(today)}
            >
              Today
            </Button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <>
            {/* Stats Summary */}
            {intradayStats && (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-lg font-bold text-green-500">{intradayStats.min}</p>
                  <p className="text-[10px] text-muted-foreground">Min</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-lg font-bold">{intradayStats.avg}</p>
                  <p className="text-[10px] text-muted-foreground">Avg</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-lg font-bold text-red-500">{intradayStats.max}</p>
                  <p className="text-[10px] text-muted-foreground">Max</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-lg font-bold text-primary">{intradayStats.samples}</p>
                  <p className="text-[10px] text-muted-foreground">Samples</p>
                </div>
              </div>
            )}

            {/* Intraday Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin - 10', 'dataMax + 10']} 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bpm" 
                    stroke="hsl(0 84% 60%)" 
                    fill="url(#hrGradient)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No heart rate data for {isToday ? 'today' : 'this date'}</p>
              <p className="text-xs">Sync your Oura Ring to fetch data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
