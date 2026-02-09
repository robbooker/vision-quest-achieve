import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNutritionHistory, DailyNutritionSummary } from '@/hooks/useNutritionHistory';
import { useNutritionStats } from '@/hooks/useNutritionStats';
import { useFoodFrequency } from '@/hooks/useFoodFrequency';
import { useNutritionSettings } from '@/hooks/useNutrition';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays, isSameMonth } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, ScatterChart, Scatter, Legend } from 'recharts';
import { ChevronLeft, ChevronRight, Flame, Beef, Droplets, Calendar, TrendingUp, Clock, Apple, Award } from 'lucide-react';

const PERIOD_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
];

const MACRO_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export function NutritionTab() {
  const [period, setPeriod] = useState(30);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { nutritionHistory, weightHistory, isLoading } = useNutritionHistory(period);
  const { data: stats } = useNutritionStats(period);
  const { data: foodFreq } = useFoodFrequency(period);
  const { data: settings } = useNutritionSettings();

  const calorieGoal = settings?.daily_calorie_goal || 2200;
  const proteinGoal = settings?.protein_goal_g || 150;

  // === CALORIE TREND DATA ===
  const calorieTrendData = useMemo(() => {
    if (!nutritionHistory.length) return [];

    // Build a map for weight by date
    const weightMap = new Map(weightHistory.map(w => [w.date, w.weight]));

    // Calculate 7-day rolling average
    return nutritionHistory.map((day, idx) => {
      const windowStart = Math.max(0, idx - 6);
      const window = nutritionHistory.slice(windowStart, idx + 1);
      const avg = Math.round(window.reduce((s, d) => s + d.totalCalories, 0) / window.length);

      return {
        date: format(parseISO(day.date), 'M/d'),
        calories: day.totalCalories,
        avg7d: avg,
        weight: weightMap.get(day.date) || null,
        goal: calorieGoal,
      };
    });
  }, [nutritionHistory, weightHistory, calorieGoal]);

  // === MACRO BREAKDOWN ===
  const macroData = useMemo(() => {
    if (!nutritionHistory.length) return [];
    const totals = nutritionHistory.reduce(
      (acc, d) => ({
        protein: acc.protein + d.totalProtein,
        carbs: acc.carbs + d.totalCarbs,
        fats: acc.fats + d.totalFats,
      }),
      { protein: 0, carbs: 0, fats: 0 }
    );
    const total = totals.protein + totals.carbs + totals.fats;
    if (total === 0) return [];
    return [
      { name: 'Protein', value: totals.protein, pct: Math.round((totals.protein / total) * 100) },
      { name: 'Carbs', value: totals.carbs, pct: Math.round((totals.carbs / total) * 100) },
      { name: 'Fats', value: totals.fats, pct: Math.round((totals.fats / total) * 100) },
    ];
  }, [nutritionHistory]);

  // === CALENDAR DATA ===
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const nutritionMap = new Map(nutritionHistory.map(d => [d.date, d]));

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const data = nutritionMap.get(dateStr);
      let status: 'none' | 'low' | 'on-target' | 'high' = 'none';
      if (data && data.totalCalories > 0) {
        if (data.totalCalories < calorieGoal * 0.8) status = 'low';
        else if (data.totalCalories > calorieGoal * 1.2) status = 'high';
        else status = 'on-target';
      }
      return { date: day, dateStr, data, status };
    });
  }, [calendarMonth, nutritionHistory, calorieGoal]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return nutritionHistory.find(d => d.date === selectedDate) || null;
  }, [selectedDate, nutritionHistory]);

  // === MEAL TIMING DATA ===
  const mealTimingData = useMemo(() => {
    const points: { hour: number; day: string; mealType: string }[] = [];
    for (const day of nutritionHistory) {
      for (const meal of day.meals) {
        if (meal.calories) {
          const hour = new Date(meal.createdAt).getHours() + new Date(meal.createdAt).getMinutes() / 60;
          points.push({
            hour: Math.round(hour * 10) / 10,
            day: format(parseISO(day.date), 'M/d'),
            mealType: meal.mealType || 'meal',
          });
        }
      }
    }
    return points;
  }, [nutritionHistory]);

  // === SCORECARD ===
  const scorecard = useMemo(() => {
    if (!stats) return null;
    const daysWithProteinGoal = (stats.entries || []).filter(e => e.totalProtein >= proteinGoal).length;
    const proteinHitRate = stats.daysLogged > 0 ? Math.round((daysWithProteinGoal / stats.daysLogged) * 100) : 0;
    const daysInDeficit = (stats.entries || []).filter(e => e.totalCalories < calorieGoal).length;
    const daysInSurplus = (stats.entries || []).filter(e => e.totalCalories >= calorieGoal).length;

    return {
      loggingStreak: stats.loggingStreak,
      avgCalories: stats.avgCalories,
      avgProtein: stats.avgProtein,
      proteinHitRate,
      hydrationCompliance: stats.daysLogged > 0 ? Math.round((stats.daysHydrationGoalMet / stats.daysLogged) * 100) : 0,
      daysInDeficit,
      daysInSurplus,
      daysLogged: stats.daysLogged,
    };
  }, [stats, proteinGoal, calorieGoal]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    'none': 'bg-muted/30',
    'low': 'bg-chart-3/30',
    'on-target': 'bg-primary/30',
    'high': 'bg-destructive/30',
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {PERIOD_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={period === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Scorecard */}
      {scorecard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Flame className="h-3 w-3" /> Avg Calories
              </div>
              <p className="text-2xl font-bold">{scorecard.avgCalories}</p>
              <p className="text-xs text-muted-foreground">/{calorieGoal} goal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Beef className="h-3 w-3" /> Protein Hit
              </div>
              <p className="text-2xl font-bold">{scorecard.proteinHitRate}%</p>
              <p className="text-xs text-muted-foreground">days ≥{proteinGoal}g</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Droplets className="h-3 w-3" /> Hydration
              </div>
              <p className="text-2xl font-bold">{scorecard.hydrationCompliance}%</p>
              <p className="text-xs text-muted-foreground">days ≥3L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Award className="h-3 w-3" /> Streak
              </div>
              <p className="text-2xl font-bold">{scorecard.loggingStreak}</p>
              <p className="text-xs text-muted-foreground">days logged</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calorie Trend + Weight */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Calorie Trend & Weight
          </CardTitle>
        </CardHeader>
        <CardContent>
          {calorieTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={calorieTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis yAxisId="cal" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis yAxisId="weight" orientation="right" tick={{ fontSize: 11 }} className="fill-muted-foreground" domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar yAxisId="cal" dataKey="calories" fill="hsl(var(--primary))" opacity={0.4} radius={[2, 2, 0, 0]} name="Calories" />
                <Line yAxisId="cal" dataKey="avg7d" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="7d Avg" />
                <Line yAxisId="cal" dataKey="goal" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Goal" />
                <Line yAxisId="weight" dataKey="weight" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Weight (lbs)" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No nutrition data for this period</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macro Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Macro Split (avg)</CardTitle>
          </CardHeader>
          <CardContent>
            {macroData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                      stroke="none"
                    >
                      {macroData.map((_, i) => (
                        <Cell key={i} fill={MACRO_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {macroData.map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MACRO_COLORS[i] }} />
                        <span>{m.name}</span>
                      </div>
                      <span className="font-medium">{m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No macro data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Meal Timing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Eating Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mealTimingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="hour"
                    type="number"
                    domain={[5, 23]}
                    ticks={[6, 9, 12, 15, 18, 21]}
                    tickFormatter={(h) => `${h > 12 ? h - 12 : h}${h >= 12 ? 'p' : 'a'}`}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis dataKey="day" type="category" tick={{ fontSize: 10 }} width={30} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                    formatter={(value: number) => {
                      const h = Math.floor(value);
                      const m = Math.round((value - h) * 60);
                      return [`${h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`, 'Time'];
                    }}
                  />
                  <Scatter data={mealTimingData} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No meal timing data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Food Frequency Heatmap */}
      {foodFreq && foodFreq.foods.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Apple className="h-4 w-4" />
              Top Foods ({period}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {foodFreq.foods.slice(0, 15).map((item) => {
                const maxCount = foodFreq.foods[0]?.count || 1;
                const intensity = Math.max(0.3, item.count / maxCount);
                return (
                  <Badge
                    key={item.food}
                    variant="secondary"
                    className="text-xs"
                    style={{ opacity: 0.4 + intensity * 0.6 }}
                  >
                    {item.food} × {item.count}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Log
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(calendarMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Offset for first day */}
            {Array.from({ length: getDay(startOfMonth(calendarMonth)) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map(({ date, dateStr, status }) => (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                className={`
                  aspect-square rounded-md text-xs font-medium flex items-center justify-center transition-colors
                  ${statusColors[status]}
                  ${selectedDate === dateStr ? 'ring-2 ring-primary' : ''}
                  ${!isSameMonth(date, calendarMonth) ? 'opacity-30' : ''}
                  hover:ring-1 hover:ring-primary/50
                `}
              >
                {format(date, 'd')}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary/30" /> On target</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-chart-3/30" /> Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/30" /> High</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted/30" /> No data</div>
          </div>

          {/* Selected day detail */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="font-medium text-sm mb-2">
                {format(parseISO(selectedDate), 'EEEE, MMMM d')}
              </h4>
              {selectedDayData ? (
                <div className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Calories: <span className="text-foreground font-medium">{selectedDayData.totalCalories}</span></span>
                    <span className="text-muted-foreground">Protein: <span className="text-foreground font-medium">{selectedDayData.totalProtein}g</span></span>
                    <span className="text-muted-foreground">Water: <span className="text-foreground font-medium">{Math.round(selectedDayData.totalWaterMl / 29.5735)}oz</span></span>
                  </div>
                  <div className="space-y-1">
                    {selectedDayData.meals
                      .filter(m => m.calories || m.protein)
                      .map(meal => (
                        <div key={meal.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            {meal.mealType && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {meal.mealType}
                              </Badge>
                            )}
                            <span>{meal.description}</span>
                          </div>
                          <span className="text-muted-foreground text-xs whitespace-nowrap ml-2">
                            {meal.calories} cal
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No meals logged this day</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
