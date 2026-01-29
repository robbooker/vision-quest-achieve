import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNutritionStats } from '@/hooks/useNutritionStats';
import { Utensils, Flame, Beef, Calendar, GlassWater, Droplets } from 'lucide-react';

export function NutritionSummaryCard() {
  const { data: stats, isLoading } = useNutritionStats(7);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Nutrition Summary
          </CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.daysLogged === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Nutrition Summary
          </CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Utensils className="h-8 w-8 mb-2 opacity-50" />
            <p>No nutrition data logged yet.</p>
            <p className="text-sm">Log meals on the Today page to track your nutrition.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgWaterOz = Math.round(stats.avgWaterMl / 29.5735);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          Nutrition Summary
        </CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Flame className="h-3.5 w-3.5" />
              Avg Calories
            </div>
            <p className="text-2xl font-bold">
              {stats.avgCalories.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Beef className="h-3.5 w-3.5" />
              Avg Protein
            </div>
            <p className="text-2xl font-bold">
              {stats.avgProtein}g
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <GlassWater className="h-3.5 w-3.5 text-blue-500" />
              Avg Water
            </div>
            <p className="text-2xl font-bold">
              {(stats.avgWaterMl / 1000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground">
              ~{avgWaterOz}oz
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Droplets className="h-3.5 w-3.5 text-blue-500" />
              Hydration Goal
            </div>
            <p className="text-2xl font-bold">
              {stats.daysHydrationGoalMet} <span className="text-sm font-normal text-muted-foreground">/ 7 days</span>
            </p>
            <p className="text-xs text-muted-foreground">
              3L+ per day
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Flame className="h-3.5 w-3.5" />
              Logging Streak
            </div>
            <p className="text-2xl font-bold">
              {stats.loggingStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Days Logged
            </div>
            <p className="text-2xl font-bold">
              {stats.daysLogged} <span className="text-sm font-normal text-muted-foreground">/ 7</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
