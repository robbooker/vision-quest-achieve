import { Skeleton } from '@/components/ui/skeleton';
import { useOuraMetrics, OuraMetrics } from '@/hooks/useOuraMetrics';
import { useNutritionStats } from '@/hooks/useNutritionStats';
import { format, subDays } from 'date-fns';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayVitals {
  date: Date;
  dateStr: string;
  dayLabel: string;
  sleep: boolean;
  move: boolean;
  fuel: boolean;
  hydrate: boolean;
}

const VITALS = [
  { key: 'sleep' as const, label: 'SLEEP', icon: '😴' },
  { key: 'move' as const, label: 'MOVE', icon: '🏃' },
  { key: 'fuel' as const, label: 'FUEL', icon: '🍽️' },
  { key: 'hydrate' as const, label: 'HYDRATE', icon: '💧' },
];

export function PhysicalDailyVitalsSection() {
  const { weeklyMetrics, isLoading: ouraLoading } = useOuraMetrics();
  const { data: nutritionStats, isLoading: nutritionLoading } = useNutritionStats(7);

  const isLoading = ouraLoading || nutritionLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  // Build a map of oura metrics by date
  const ouraByDate = new Map<string, OuraMetrics>();
  for (const m of weeklyMetrics || []) {
    ouraByDate.set(m.metric_date, m);
  }

  // Build a map of nutrition entries by date
  const nutritionByDate = new Map<string, { mealCount: number; totalWaterMl: number }>();
  for (const entry of nutritionStats?.entries || []) {
    nutritionByDate.set(entry.date, {
      mealCount: entry.mealCount,
      totalWaterMl: entry.totalWaterMl,
    });
  }

  // Generate last 7 days with pass/fail for each vital
  const days: DayVitals[] = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const oura = ouraByDate.get(dateStr);
    const nutrition = nutritionByDate.get(dateStr);

    // Sleep: score >= 70 OR total sleep >= 7h (25200s)
    const sleep = (oura?.sleep_score != null && oura.sleep_score >= 70) ||
      (oura?.total_sleep_seconds != null && oura.total_sleep_seconds >= 25200);

    // Move: steps >= 7500 OR activity_score >= 70
    const move = (oura?.steps != null && oura.steps >= 7500) ||
      (oura?.activity_score != null && oura.activity_score >= 70);

    // Fuel: at least 1 meal logged
    const fuel = (nutrition?.mealCount ?? 0) >= 1;

    // Hydrate: water >= 2500ml
    const hydrate = (nutrition?.totalWaterMl ?? 0) >= 2500;

    return {
      date,
      dateStr,
      dayLabel: format(date, 'EEE'),
      sleep,
      move,
      fuel,
      hydrate,
    };
  });

  // Calculate compliance rates
  const complianceStats = VITALS.map(vital => {
    const completed = days.filter(d => d[vital.key]).length;
    const rate = Math.round((completed / 7) * 100);
    return { ...vital, completed, rate };
  });

  const avgCompliance = Math.round(
    complianceStats.reduce((sum, s) => sum + s.rate, 0) / complianceStats.length
  );

  const perfectDays = days.filter(d => d.sleep && d.move && d.fuel && d.hydrate).length;

  const hasAnyData = (weeklyMetrics && weeklyMetrics.length > 0) || 
    (nutritionStats?.entries && nutritionStats.entries.length > 0);

  if (!hasAnyData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No data yet for the last 7 days.</p>
        <p className="text-xs mt-1">Sleep, activity, nutrition, and hydration data will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{avgCompliance}%</p>
          <p className="text-xs text-muted-foreground">Avg Compliance</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{perfectDays}</p>
          <p className="text-xs text-muted-foreground">Perfect Days</p>
        </div>
      </div>

      {/* Compliance by Vital */}
      <div className="grid grid-cols-2 gap-2">
        {complianceStats.map(stat => (
          <div 
            key={stat.key} 
            className="flex items-center justify-between bg-muted/30 rounded-lg p-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <span className={cn(
              "text-sm font-bold",
              stat.rate >= 80 ? "text-primary" : stat.rate < 50 ? "text-destructive" : "text-muted-foreground"
            )}>
              {stat.rate}%
            </span>
          </div>
        ))}
      </div>

      {/* 7-Day Heatmap */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Last 7 Days</p>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <div key={day.dateStr} className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{day.dayLabel}</p>
              <div className="space-y-0.5">
                {VITALS.map(vital => {
                  const completed = day[vital.key];
                  return (
                    <div 
                      key={vital.key}
                      className={cn(
                        "w-full h-4 rounded-sm flex items-center justify-center",
                        completed ? "bg-primary/80" : "bg-muted"
                      )}
                      title={`${vital.label}: ${completed ? 'Done' : 'Missed'}`}
                    >
                      {completed ? (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      ) : (
                        <X className="h-2.5 w-2.5 text-muted-foreground/50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
          {VITALS.map(v => (
            <span key={v.key}>{v.icon} {v.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
