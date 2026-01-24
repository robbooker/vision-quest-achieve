import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradingPnL } from '@/hooks/useTradingPnL';

interface PnLChartProps {
  data: TradingPnL[];
  view: 'cumulative' | 'daily';
  onViewChange: (view: 'cumulative' | 'daily') => void;
}

export function PnLChart({ data, view, onViewChange }: PnLChartProps) {
  const chartData = useMemo(() => {
    let cumulative = 0;
    return data.map((entry) => {
      cumulative += Number(entry.pnl_amount);
      return {
        date: entry.trade_date,
        displayDate: format(new Date(entry.trade_date), 'MMM d'),
        daily: Number(entry.pnl_amount),
        cumulative,
        trades: entry.trade_count,
      };
    });
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-1">
          {format(new Date(data.date), 'EEEE, MMM d, yyyy')}
        </p>
        <div className="space-y-1 text-sm">
          <p className={data.daily >= 0 ? 'text-emerald-500' : 'text-destructive'}>
            Daily: {formatCurrency(data.daily)}
          </p>
          <p className={data.cumulative >= 0 ? 'text-emerald-500' : 'text-destructive'}>
            Cumulative: {formatCurrency(data.cumulative)}
          </p>
          {data.trades && (
            <p className="text-muted-foreground">{data.trades} trades</p>
          )}
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">P&L Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No trading data yet. Start logging your P&L to see charts.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">P&L Chart</CardTitle>
        <Tabs value={view} onValueChange={(v) => onViewChange(v as 'cumulative' | 'daily')}>
          <TabsList className="h-8">
            <TabsTrigger value="cumulative" className="text-xs px-3">
              Cumulative
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs px-3">
              Daily
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'cumulative' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="daily" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.daily >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
