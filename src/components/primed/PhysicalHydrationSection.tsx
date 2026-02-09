import { Skeleton } from '@/components/ui/skeleton';
import { useNutritionStats } from '@/hooks/useNutritionStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Droplets, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const HYDRATION_GOAL_ML = 3000;

export function PhysicalHydrationSection() {
  const { data: stats, isLoading } = useNutritionStats(14);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
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
        <p className="text-sm">No hydration data yet.</p>
        <p className="text-xs mt-1">Log water intake on the Dashboard to track hydration.</p>
      </div>
    );
  }

  const chartData = [...stats.entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: format(parseISO(entry.date), 'M/d'),
      fullDate: entry.date,
      waterMl: entry.totalWaterMl,
      waterL: +(entry.totalWaterMl / 1000).toFixed(1),
      metGoal: entry.totalWaterMl >= HYDRATION_GOAL_ML,
    }));

  // Only show if there's any water data
  const hasWaterData = chartData.some(d => d.waterMl > 0);
  if (!hasWaterData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No hydration data yet.</p>
        <p className="text-xs mt-1">Log water intake on the Dashboard to track hydration.</p>
      </div>
    );
  }

  const daysWithWater = chartData.filter(d => d.waterMl > 0);
  const avgWaterMl = daysWithWater.length > 0
    ? Math.round(daysWithWater.reduce((sum, d) => sum + d.waterMl, 0) / daysWithWater.length)
    : 0;
  const goalHitRate = daysWithWater.length > 0
    ? Math.round((stats.daysHydrationGoalMet / daysWithWater.length) * 100)
    : 0;
  const bestDay = daysWithWater.length > 0
    ? Math.max(...daysWithWater.map(d => d.waterMl))
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Droplets className="h-3 w-3" />
            <span className="text-xs">Avg Daily</span>
          </div>
          <p className="text-lg font-bold">{(avgWaterMl / 1000).toFixed(1)}L</p>
          <p className="text-[10px] text-muted-foreground">{avgWaterMl.toLocaleString()} ml</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Target className="h-3 w-3" />
            <span className="text-xs">Goal Hit</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            goalHitRate >= 70 ? "text-primary" : goalHitRate >= 40 ? "text-foreground" : "text-destructive"
          )}>
            {goalHitRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">{stats.daysHydrationGoalMet}/{daysWithWater.length} days</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">Best Day</span>
          </div>
          <p className="text-lg font-bold">{(bestDay / 1000).toFixed(1)}L</p>
          <p className="text-[10px] text-muted-foreground">{bestDay.toLocaleString()} ml</p>
        </div>
      </div>

      {/* Daily Water Intake Chart */}
      {chartData.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Daily Water Intake (14 days)</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}L`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} ml (${(value / 1000).toFixed(1)}L)`, 'Water']}
                />
                <ReferenceLine 
                  y={HYDRATION_GOAL_ML} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: '3L Goal', 
                    position: 'right', 
                    fontSize: 10,
                    fill: 'hsl(var(--primary))',
                  }}
                />
                <Bar 
                  dataKey="waterMl" 
                  radius={[4, 4, 0, 0]}
                  name="Water"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.metGoal 
                        ? 'hsl(var(--primary))' 
                        : 'hsl(var(--muted-foreground) / 0.3)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Bars in accent color = goal met (≥3L)
          </p>
        </div>
      )}
    </div>
  );
}
