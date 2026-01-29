import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNutritionStats } from '@/hooks/useNutritionStats';
import { useFoodFrequency } from '@/hooks/useFoodFrequency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function PhysicalNutritionSection() {
  const { data: stats, isLoading: statsLoading } = useNutritionStats(14);
  const { data: foodData, isLoading: foodLoading } = useFoodFrequency(30);
  const [showFoods, setShowFoods] = useState(false);

  const isLoading = statsLoading || foodLoading;

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

  // Prepare chart data for calories and protein
  const chartData = [...stats.entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: format(parseISO(entry.date), 'M/d'),
      calories: entry.totalCalories,
      protein: entry.totalProtein,
    }));

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.avgCalories || '-'}</p>
          <p className="text-xs text-muted-foreground">Avg Cals</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.avgProtein || '-'}g</p>
          <p className="text-xs text-muted-foreground">Avg Protein</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.loggingStreak}</p>
          <p className="text-xs text-muted-foreground">Log Streak</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{stats.daysLogged}</p>
          <p className="text-xs text-muted-foreground">Days Logged</p>
        </div>
      </div>

      {/* Protein Chart */}
      {chartData.length > 0 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                }}
              />
              <ReferenceLine y={150} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: '150g', position: 'right', fontSize: 10 }} />
              <Bar 
                dataKey="protein" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Protein (g)"
              />
            </BarChart>
          </ResponsiveContainer>
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
