import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHealthMeasurements } from '@/hooks/useHealthMeasurements';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ReferenceArea,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { Scale, Heart, TrendingDown, TrendingUp, Minus, Clock, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PhysicalBiometricsSection() {
  const { 
    weightHistory, 
    bpHistory, 
    latestWeight, 
    weightChange,
    avgSystolic,
    avgDiastolic,
    bpScatterData,
    timeOfDayStats,
    isLoading 
  } = useHealthMeasurements(60);

  const [bpView, setBpView] = useState<'trend' | 'patterns'>('trend');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const hasData = weightHistory.length > 0 || bpHistory.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No weight or blood pressure data yet.</p>
        <p className="text-xs mt-1">Log measurements from the Today page.</p>
      </div>
    );
  }

  // Prepare weight chart data
  const weightChartData = weightHistory.map(m => ({
    date: format(new Date(m.measured_at), 'M/d'),
    weight: m.primary_value,
  }));

  // Prepare BP chart data
  const bpChartData = bpHistory.slice(0, 14).reverse().map(m => ({
    date: format(new Date(m.measured_at), 'M/d h:mma'),
    shortDate: format(new Date(m.measured_at), 'M/d'),
    systolic: m.primary_value,
    diastolic: m.secondary_value,
    notes: m.notes,
  }));

  const getBPStatus = (sys: number | null, dia: number | null) => {
    if (!sys || !dia) return null;
    if (sys < 120 && dia < 80) return { label: 'Normal', variant: 'default' as const };
    if (sys < 130 && dia < 80) return { label: 'Elevated', variant: 'secondary' as const };
    if (sys < 140 || dia < 90) return { label: 'Stage 1', variant: 'destructive' as const };
    return { label: 'Stage 2', variant: 'destructive' as const };
  };

  const bpStatus = getBPStatus(avgSystolic, avgDiastolic);

  // Calculate weight goal progress (if tracking toward a target)
  const minWeight = weightHistory.length > 0 ? Math.min(...weightHistory.map(w => w.primary_value)) : null;
  const maxWeight = weightHistory.length > 0 ? Math.max(...weightHistory.map(w => w.primary_value)) : null;

  // Format hour for scatter plot
  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };

  // Custom tooltip for scatter plot
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-2 text-xs shadow-md">
          <p className="font-medium">{data.fullTime}</p>
          <p className="text-destructive">Systolic: {data.systolic} mmHg</p>
          <p className="text-muted-foreground">Diastolic: {data.diastolic} mmHg</p>
          {data.notes && (
            <p className="text-muted-foreground mt-1 italic">"{data.notes}"</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Weight Section */}
      {weightHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Weight Trend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{latestWeight}</span>
              <span className="text-sm text-muted-foreground">lbs</span>
              {weightChange !== null && (
                <div className={cn(
                  "flex items-center gap-0.5 text-xs",
                  weightChange > 0 ? "text-destructive" : 
                  weightChange < 0 ? "text-primary" : "text-muted-foreground"
                )}>
                  {weightChange > 0 ? <TrendingUp className="h-3 w-3" /> : 
                   weightChange < 0 ? <TrendingDown className="h-3 w-3" /> : 
                   <Minus className="h-3 w-3" />}
                  {Math.abs(weightChange).toFixed(1)}
                </div>
              )}
            </div>
          </div>

          {weightChartData.length > 1 && (
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    hide 
                    domain={[
                      (minWeight || 0) - 2,
                      (maxWeight || 200) + 2
                    ]} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} lbs`, 'Weight']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {minWeight && maxWeight && minWeight !== maxWeight && (
            <p className="text-xs text-muted-foreground text-center">
              Range: {minWeight} - {maxWeight} lbs (Δ {(maxWeight - minWeight).toFixed(1)})
            </p>
          )}
        </div>
      )}

      {/* Blood Pressure Section */}
      {bpHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Blood Pressure</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{avgSystolic}/{avgDiastolic}</span>
              <span className="text-xs text-muted-foreground">avg</span>
              {bpStatus && (
                <Badge variant={bpStatus.variant} className="text-xs">
                  {bpStatus.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Tabs for Trend vs Time Patterns */}
          <Tabs value={bpView} onValueChange={(v) => setBpView(v as 'trend' | 'patterns')}>
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="trend" className="text-xs">Trend</TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs">Time Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="mt-3">
              {bpChartData.length > 1 && (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={bpChartData}>
                      <XAxis 
                        dataKey="shortDate" 
                        tick={{ fontSize: 10 }} 
                        axisLine={false} 
                        tickLine={false}
                      />
                      <YAxis 
                        hide 
                        domain={[60, 160]} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} mmHg`, 
                          name === 'systolic' ? 'Systolic' : 'Diastolic'
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.notes ? `${item.date}\n${item.notes}` : item?.date;
                        }}
                      />
                      <ReferenceLine y={120} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Bar 
                        dataKey="diastolic" 
                        fill="hsl(var(--muted-foreground) / 0.3)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="systolic" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'hsl(var(--destructive))' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="patterns" className="mt-3">
              {bpScatterData.length > 0 ? (
                <div className="space-y-3">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                        <XAxis 
                          dataKey="hour" 
                          type="number"
                          domain={[5, 23]}
                          ticks={[6, 9, 12, 15, 18, 21]}
                          tickFormatter={formatHour}
                          tick={{ fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="number"
                          domain={[60, 160]}
                          ticks={[80, 120, 140]}
                          tick={{ fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          width={25}
                        />
                        {/* Reference areas for BP zones */}
                        <ReferenceArea y1={140} y2={160} fill="hsl(var(--destructive) / 0.1)" />
                        <ReferenceArea y1={130} y2={140} fill="hsl(var(--destructive) / 0.05)" />
                        <ReferenceArea y1={120} y2={130} fill="hsl(var(--warning) / 0.1)" />
                        <ReferenceLine y={120} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                        <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                        <Tooltip content={<ScatterTooltip />} />
                        {/* Systolic dots */}
                        <Scatter 
                          name="Systolic" 
                          data={bpScatterData} 
                          fill="hsl(var(--destructive))"
                          dataKey="systolic"
                        >
                          {bpScatterData.map((_, index) => (
                            <Cell key={`sys-${index}`} fill="hsl(var(--destructive))" />
                          ))}
                        </Scatter>
                        {/* Diastolic dots */}
                        <Scatter 
                          name="Diastolic" 
                          data={bpScatterData} 
                          fill="hsl(var(--muted-foreground))"
                          dataKey="diastolic"
                        >
                          {bpScatterData.map((_, index) => (
                            <Cell key={`dia-${index}`} fill="hsl(var(--muted-foreground))" />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-muted-foreground">Systolic</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <span className="text-muted-foreground">Diastolic</span>
                    </div>
                  </div>

                  {/* Time of Day Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {timeOfDayStats.morningAvg && (
                      <div className={cn(
                        "text-center p-2 rounded bg-muted/30",
                        timeOfDayStats.lowestPeriod === 'morning' && "ring-1 ring-primary"
                      )}>
                        <p className="text-muted-foreground">Morning</p>
                        <p className="font-medium">
                          {timeOfDayStats.morningAvg.systolic}/{timeOfDayStats.morningAvg.diastolic}
                        </p>
                        <p className="text-[10px] text-muted-foreground">6am-12pm</p>
                      </div>
                    )}
                    {timeOfDayStats.afternoonAvg && (
                      <div className={cn(
                        "text-center p-2 rounded bg-muted/30",
                        timeOfDayStats.lowestPeriod === 'afternoon' && "ring-1 ring-primary"
                      )}>
                        <p className="text-muted-foreground">Afternoon</p>
                        <p className="font-medium">
                          {timeOfDayStats.afternoonAvg.systolic}/{timeOfDayStats.afternoonAvg.diastolic}
                        </p>
                        <p className="text-[10px] text-muted-foreground">12-5pm</p>
                      </div>
                    )}
                    {timeOfDayStats.eveningAvg && (
                      <div className={cn(
                        "text-center p-2 rounded bg-muted/30",
                        timeOfDayStats.lowestPeriod === 'evening' && "ring-1 ring-primary"
                      )}>
                        <p className="text-muted-foreground">Evening</p>
                        <p className="font-medium">
                          {timeOfDayStats.eveningAvg.systolic}/{timeOfDayStats.eveningAvg.diastolic}
                        </p>
                        <p className="text-[10px] text-muted-foreground">5-10pm</p>
                      </div>
                    )}
                  </div>

                  {/* Insight */}
                  {timeOfDayStats.insight && (
                    <div className="flex items-start gap-2 p-2 bg-primary/5 rounded text-xs">
                      <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{timeOfDayStats.insight}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Log blood pressure at different times to see patterns.
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Recent BP Readings with Notes */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {bpHistory.slice(0, 5).map((reading) => (
              <div 
                key={reading.id} 
                className="flex items-start justify-between text-xs bg-muted/30 rounded px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {format(new Date(reading.measured_at), 'M/d h:mm a')}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-medium">
                    {reading.primary_value}/{reading.secondary_value}
                  </span>
                  {reading.notes && (
                    <span className="text-muted-foreground text-[10px] max-w-[120px] truncate">
                      {reading.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
