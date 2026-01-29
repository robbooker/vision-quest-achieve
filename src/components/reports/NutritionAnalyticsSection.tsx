import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { useNutritionStats } from '@/hooks/useNutritionStats';
import { 
  Utensils, 
  Flame, 
  Beef, 
  GlassWater, 
  Droplets, 
  TrendingUp, 
  Calendar,
  Target,
  Wheat,
  Droplet
} from 'lucide-react';
import { format, subDays } from 'date-fns';

const WATER_GOAL_ML = 3000;
const ML_PER_OZ = 29.5735;

export function NutritionAnalyticsSection() {
  const { data: stats, isLoading } = useNutritionStats(14); // Get 14 days for better charts

  const chartConfig = {
    calories: { label: 'Calories', color: 'hsl(25 95% 53%)' },
    protein: { label: 'Protein (g)', color: 'hsl(0 72% 51%)' },
    water: { label: 'Water (L)', color: 'hsl(199 89% 48%)' },
    carbs: { label: 'Carbs (g)', color: 'hsl(45 93% 47%)' },
    fats: { label: 'Fats (g)', color: 'hsl(280 65% 60%)' },
    goal: { label: 'Goal', color: 'hsl(var(--muted-foreground))' },
  };

  // Prepare chart data - last 7 days for display
  const chartData = useMemo(() => {
    if (!stats?.entries) return [];
    
    // Create a map of existing data
    const dataMap = new Map(stats.entries.map(e => [e.date, e]));
    
    // Generate last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const existing = dataMap.get(date);
      days.push({
        date,
        label: format(new Date(date), 'EEE'),
        fullDate: format(new Date(date), 'MMM d'),
        calories: existing?.totalCalories || 0,
        protein: existing?.totalProtein || 0,
        waterMl: existing?.totalWaterMl || 0,
        waterL: existing ? (existing.totalWaterMl / 1000) : 0,
        mealCount: existing?.mealCount || 0,
      });
    }
    return days;
  }, [stats]);

  // Calculate averages from last 7 days
  const weekStats = useMemo(() => {
    const last7 = chartData.slice(-7);
    const daysWithData = last7.filter(d => d.mealCount > 0);
    
    if (daysWithData.length === 0) {
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgWaterMl: 0,
        daysLogged: 0,
        daysHydrationMet: 0,
        totalMeals: 0,
        bestCalorieDay: null,
        bestProteinDay: null,
      };
    }

    const avgCalories = Math.round(daysWithData.reduce((a, b) => a + b.calories, 0) / daysWithData.length);
    const avgProtein = Math.round(daysWithData.reduce((a, b) => a + b.protein, 0) / daysWithData.length);
    const avgWaterMl = Math.round(daysWithData.reduce((a, b) => a + b.waterMl, 0) / daysWithData.length);
    const daysHydrationMet = daysWithData.filter(d => d.waterMl >= WATER_GOAL_ML).length;
    const totalMeals = daysWithData.reduce((a, b) => a + b.mealCount, 0);
    
    const sortedByCalories = [...daysWithData].sort((a, b) => b.calories - a.calories);
    const sortedByProtein = [...daysWithData].sort((a, b) => b.protein - a.protein);

    return {
      avgCalories,
      avgProtein,
      avgWaterMl,
      daysLogged: daysWithData.length,
      daysHydrationMet,
      totalMeals,
      bestCalorieDay: sortedByCalories[0],
      bestProteinDay: sortedByProtein[0],
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Nutrition Analytics
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!stats || stats.daysLogged === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Nutrition Analytics
        </h2>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
              <Utensils className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No nutrition data yet</p>
              <p className="text-sm">Log your meals on the Today page to see detailed analytics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgWaterOz = Math.round(weekStats.avgWaterMl / ML_PER_OZ);
  const hydrationPercent = Math.min((weekStats.avgWaterMl / WATER_GOAL_ML) * 100, 100);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Utensils className="h-5 w-5 text-primary" />
        Nutrition Analytics
      </h2>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Avg Calories</span>
            </div>
            <p className="text-2xl font-bold mt-1">{weekStats.avgCalories.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              per day (7-day avg)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Beef className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Avg Protein</span>
            </div>
            <p className="text-2xl font-bold mt-1">{weekStats.avgProtein}g</p>
            <p className="text-xs text-muted-foreground mt-1">
              per day (7-day avg)
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GlassWater className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Avg Water</span>
            </div>
            <p className="text-2xl font-bold mt-1">{(weekStats.avgWaterMl / 1000).toFixed(1)}L</p>
            <p className="text-xs text-muted-foreground mt-1">
              ~{avgWaterOz}oz / day
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Hydration Goal</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {weekStats.daysHydrationMet} <span className="text-sm font-normal text-muted-foreground">/ 7 days</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              3L+ achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Calories Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Daily Calories (Last 7 Days)
            </CardTitle>
            <CardDescription>Track your energy intake</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">{data.fullDate}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.calories.toLocaleString()} calories
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {data.mealCount} meals logged
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="calories" 
                  fill="hsl(25 95% 53%)" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Protein Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Beef className="h-4 w-4 text-red-500" />
              Daily Protein (Last 7 Days)
            </CardTitle>
            <CardDescription>Track your protein intake (g)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit="g" />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">{data.fullDate}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.protein}g protein
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={150} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: '150g', position: 'right', fontSize: 10 }} />
                <Bar 
                  dataKey="protein" 
                  fill="hsl(0 72% 51%)" 
                  radius={[4, 4, 0, 0]} 
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Water and Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Hydration Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GlassWater className="h-4 w-4 text-blue-500" />
              Daily Hydration (Last 7 Days)
            </CardTitle>
            <CardDescription>Water intake in liters • Goal: 3L/day (~101oz)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} unit="L" domain={[0, 4]} />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const oz = Math.round(data.waterMl / ML_PER_OZ);
                      const metGoal = data.waterMl >= WATER_GOAL_ML;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-medium">{data.fullDate}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.waterL.toFixed(1)}L ({oz}oz)
                          </div>
                          {metGoal && (
                            <div className="text-xs text-green-500 font-medium">
                              ✓ Goal met!
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={3} stroke="hsl(160 88% 63%)" strokeDasharray="3 3" label={{ value: '3L Goal', position: 'right', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="waterL" 
                  stroke="hsl(199 89% 48%)" 
                  strokeWidth={2}
                  fill="url(#waterGradient)" 
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Weekly Highlights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Weekly Highlights
            </CardTitle>
            <CardDescription>Your nutrition stats this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Logged</span>
                <span className="font-medium">{weekStats.daysLogged} / 7</span>
              </div>
              <Progress value={(weekStats.daysLogged / 7) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <GlassWater className="h-3.5 w-3.5 text-blue-500" />
                  Avg Hydration
                </span>
                <span className="font-medium">{Math.round(hydrationPercent)}% of 3L goal</span>
              </div>
              <Progress value={hydrationPercent} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Meals Logged</span>
                <span className="font-medium">{weekStats.totalMeals}</span>
              </div>
            </div>

            {weekStats.bestCalorieDay && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  Best Calorie Day
                </div>
                <p className="text-xs text-muted-foreground">
                  {weekStats.bestCalorieDay.fullDate}: {weekStats.bestCalorieDay.calories.toLocaleString()} cal
                </p>
              </div>
            )}

            {weekStats.bestProteinDay && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Beef className="h-3.5 w-3.5 text-red-500" />
                  Best Protein Day
                </div>
                <p className="text-xs text-muted-foreground">
                  {weekStats.bestProteinDay.fullDate}: {weekStats.bestProteinDay.protein}g
                </p>
              </div>
            )}

            {stats.loggingStreak > 0 && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-3.5 w-3.5 text-orange-500" />
                  Logging Streak
                </div>
                <p className="text-lg font-bold">{stats.loggingStreak} days</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
