import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAllGoalsProgress } from '@/hooks/useCumulativeProgress';

interface CumulativeProgressCardProps {
  goals: Array<{ id: string; title: string; target_value: number; metric_type: string }>;
  cycleEndDate?: string;
}

export function CumulativeProgressCard({ goals, cycleEndDate }: CumulativeProgressCardProps) {
  const { data: progressData, isLoading } = useAllGoalsProgress(goals, cycleEndDate);

  const chartConfig = {
    cumulative: { label: 'Progress', color: 'hsl(var(--primary))' },
    daily: { label: 'Daily', color: 'hsl(var(--secondary))' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cumulative Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData || progressData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Cumulative Progress
      </h2>
      
      <div className="grid gap-4">
        {progressData.map((goal) => {
          const isOnTrack = goal.projectedTotal >= goal.targetValue;
          
          // Format chart data - show last 14 data points max for readability
          const chartData = goal.dailyProgress.slice(-14).map(d => ({
            date: format(parseISO(d.date), 'MMM d'),
            cumulative: d.cumulative,
            daily: d.value,
          }));

          return (
            <Card key={goal.goalId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base truncate">{goal.goalTitle}</CardTitle>
                  <Badge variant={goal.progressPercent >= 80 ? 'default' : goal.progressPercent >= 50 ? 'secondary' : 'outline'}>
                    {goal.progressPercent}%
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {goal.daysActive} days active
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    ~{goal.dailyAverage}/day avg
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress bar */}
                <Progress value={goal.progressPercent} className="h-2" />
                
                {/* Projection badge */}
                {goal.daysRemaining > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Projected at end of cycle:</span>
                    <Badge variant={isOnTrack ? 'default' : 'destructive'}>
                      {goal.projectedTotal.toLocaleString()} {isOnTrack ? '✓' : `(need ${(goal.targetValue - goal.projectedTotal).toLocaleString()} more)`}
                    </Badge>
                  </div>
                )}

                {/* Chart */}
                {chartData.length > 1 && (
                  <ChartContainer config={chartConfig} className="h-[120px]">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }} 
                        tickLine={false} 
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[0, goal.targetValue]} 
                        tick={{ fontSize: 10 }} 
                        tickLine={false} 
                        axisLine={false}
                        width={40}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name === 'cumulative' ? 'Total' : 'Today'
                        ]}
                      />
                      <ReferenceLine 
                        y={goal.targetValue} 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeDasharray="3 3" 
                        label={{ value: 'Goal', position: 'right', fontSize: 10 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
