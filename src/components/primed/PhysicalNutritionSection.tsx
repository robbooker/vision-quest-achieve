import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNutritionStats } from '@/hooks/useNutritionStats';
import { useFoodFrequency } from '@/hooks/useFoodFrequency';
import { useOuraMetrics } from '@/hooks/useOuraMetrics';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { ChevronDown, ChevronUp, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PhysicalNutritionSection() {
  const { data: stats, isLoading: statsLoading } = useNutritionStats(14);
  const { data: foodData, isLoading: foodLoading } = useFoodFrequency(30);
  const { weeklyMetrics, isLoading: ouraLoading } = useOuraMetrics();
  const [showFoods, setShowFoods] = useState(false);

  const isLoading = statsLoading || foodLoading || ouraLoading;

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
        <p className="text-sm">No nutrition data yet.</p>
        <p className="text-xs mt-1">Log meals on the Dashboard to track nutrition.</p>
      </div>
    );
  }

  // Prepare chart data combining nutrition with Oura activity data
  const chartData = [...stats.entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      const ouraData = weeklyMetrics?.find(m => m.metric_date === entry.date);
      const consumed = entry.totalCalories || 0;
      const burned = ouraData?.active_calories || null;
      const balance = burned !== null ? consumed - burned : null;
      
      return {
        date: format(parseISO(entry.date), 'M/d'),
        fullDate: entry.date,
        consumed,
        burned,
        balance,
        protein: entry.totalProtein,
      };
    });

  // Calculate 7-day averages for energy balance
  const recentDays = chartData.slice(-7);
  const avgConsumed = Math.round(recentDays.reduce((sum, d) => sum + d.consumed, 0) / recentDays.length) || 0;
  const daysWithBurned = recentDays.filter(d => d.burned !== null);
  const avgBurned = daysWithBurned.length > 0 
    ? Math.round(daysWithBurned.reduce((sum, d) => sum + (d.burned || 0), 0) / daysWithBurned.length) 
    : null;
  const avgBalance = avgBurned !== null ? avgConsumed - avgBurned : null;

  return (
    <div className="space-y-4">
      {/* Energy Balance Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <span className="text-xs">Consumed</span>
          </div>
          <p className="text-lg font-bold">{avgConsumed.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">cal/day</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Flame className="h-3 w-3" />
            <span className="text-xs">Burned</span>
          </div>
          <p className="text-lg font-bold">{avgBurned?.toLocaleString() || '--'}</p>
          <p className="text-[10px] text-muted-foreground">active cal/day</p>
        </div>
        <div className={cn(
          "rounded-lg p-3 text-center",
          avgBalance === null ? "bg-muted/50" :
          avgBalance > 300 ? "bg-destructive/10" :
          avgBalance < -300 ? "bg-primary/10" :
          "bg-muted/50"
        )}>
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            {avgBalance === null ? <Minus className="h-3 w-3" /> :
             avgBalance > 0 ? <TrendingUp className="h-3 w-3 text-destructive" /> :
             <TrendingDown className="h-3 w-3 text-primary" />}
            <span className="text-xs">Balance</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            avgBalance === null ? "" :
            avgBalance > 300 ? "text-destructive" :
            avgBalance < -300 ? "text-primary" : ""
          )}>
            {avgBalance !== null ? `${avgBalance > 0 ? '+' : ''}${avgBalance.toLocaleString()}` : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground">7-day avg</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold">{stats.avgProtein || '-'}g</p>
          <p className="text-[10px] text-muted-foreground">Avg Protein</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold">{stats.loggingStreak}</p>
          <p className="text-[10px] text-muted-foreground">Log Streak</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold">{stats.daysLogged}</p>
          <p className="text-[10px] text-muted-foreground">Days Logged</p>
        </div>
      </div>

      {/* Calories Consumed vs Burned Chart */}
      {chartData.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Calories: Consumed vs Active Burned</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    value?.toLocaleString() ?? '--', 
                    name === 'consumed' ? 'Consumed' : 'Active Burned'
                  ]}
                />
                <Bar 
                  dataKey="consumed" 
                  fill="hsl(var(--muted-foreground) / 0.3)" 
                  radius={[4, 4, 0, 0]}
                  name="consumed"
                />
                <Line 
                  type="monotone"
                  dataKey="burned" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  connectNulls
                  name="burned"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Food Frequency Section */}
      {foodData && foodData.foods.length > 0 && (
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-between text-sm"
            onClick={() => setShowFoods(!showFoods)}
          >
            <span>Common Foods (30 days)</span>
            {showFoods ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showFoods && (
            <div className="flex flex-wrap gap-2 pt-2">
              {foodData.foods.slice(0, 15).map((item, index) => (
                <Badge 
                  key={item.food}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    fontSize: `${Math.max(10, 14 - index * 0.3)}px`,
                    opacity: Math.max(0.6, 1 - index * 0.03),
                  }}
                >
                  {item.food} ({item.count}x)
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
