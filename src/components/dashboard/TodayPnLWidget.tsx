import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Check, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTodayPnL, useUpsertPnL, useSyncTradingJournal, useRecentPnL } from '@/hooks/useTradingPnL';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';

export function TodayPnLWidget() {
  const { data: todayPnL, isLoading } = useTodayPnL();
  const { data: recentPnL = [] } = useRecentPnL(5);
  const upsertPnL = useUpsertPnL();
  const syncMutation = useSyncTradingJournal();
  
  const [amount, setAmount] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (todayPnL) {
      setAmount(todayPnL.pnl_amount.toString());
    }
  }, [todayPnL]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    const pnlValue = parseFloat(amount);
    if (isNaN(pnlValue)) return;

    upsertPnL.mutate({
      trade_date: format(new Date(), 'yyyy-MM-dd'),
      pnl_amount: pnlValue,
      trade_count: null,
    }, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const pnlValue = parseFloat(amount) || 0;
  const isProfit = pnlValue > 0;
  const isLoss = pnlValue < 0;

  const formatCurrency = (value: number, compact = false) => {
    if (compact && Math.abs(value) >= 1000) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
        notation: 'compact',
      }).format(Math.abs(value));
      return value < 0 ? `-${formatted}` : value > 0 ? `+${formatted}` : formatted;
    }
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
    return value < 0 ? `-${formatted}` : value > 0 ? `+${formatted}` : formatted;
  };

  const chartData = recentPnL.map(entry => ({
    date: entry.trade_date,
    value: Number(entry.pnl_amount),
  }));

  const hasChartData = chartData.length > 0;
  const weekTotal = chartData.reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Today's P&L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // If there's already a value saved, show the simplified display
  if (todayPnL && !hasChanges) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Today's P&L
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title="Sync from Short Scout"
            >
              <RefreshCw className={cn("h-3 w-3", syncMutation.isPending && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={cn(
                "text-3xl font-bold",
                isProfit && "text-emerald-600 dark:text-emerald-400",
                isLoss && "text-destructive"
              )}>
                {formatCurrency(pnlValue)}
              </p>
              <p className="text-xs text-muted-foreground">so far today</p>
            </div>
            
            {/* Mini sparkline chart */}
            {hasChartData && (
              <div className="flex-1 max-w-[120px]">
                <ResponsiveContainer width="100%" height={40}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                    <defs>
                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} strokeDasharray="2 2" />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      fill="url(#pnlGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Last 5 days summary */}
          {hasChartData && (
            <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
              {chartData.map((day, i) => {
                const val = day.value;
                const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div 
                    key={day.date} 
                    className={cn(
                      "flex flex-col items-center px-1.5 py-1 rounded",
                      isToday && "bg-muted"
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(day.date), 'EEE')}
                    </span>
                    <span className={cn(
                      "font-medium text-xs",
                      val > 0 && "text-emerald-600 dark:text-emerald-400",
                      val < 0 && "text-destructive",
                      val === 0 && "text-muted-foreground"
                    )}>
                      {formatCurrency(val, true)}
                    </span>
                  </div>
                );
              })}
              <div className="border-l pl-2 ml-1">
                <span className={cn(
                  "font-semibold text-xs",
                  weekTotal > 0 && "text-emerald-600 dark:text-emerald-400",
                  weekTotal < 0 && "text-destructive"
                )}>
                  {formatCurrency(weekTotal, true)}
                </span>
              </div>
            </div>
          )}

          <Link 
            to="/trading" 
            className="block text-xs text-primary hover:underline"
          >
            View full Trading Journal →
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Show input form if no value yet or editing
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Today's P&L
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            title="Sync from Short Scout"
          >
            <RefreshCw className={cn("h-3 w-3", syncMutation.isPending && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                "pl-9 font-mono",
                isProfit && "border-emerald-500/50",
                isLoss && "border-destructive/50"
              )}
            />
            {pnlValue !== 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges || upsertPnL.isPending || !amount}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>

        {/* Last 5 days in input mode too */}
        {hasChartData && (
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
            {chartData.map((day) => {
              const val = day.value;
              const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
              return (
                <div 
                  key={day.date} 
                  className={cn(
                    "flex flex-col items-center px-1.5 py-1 rounded",
                    isToday && "bg-muted"
                  )}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {format(parseISO(day.date), 'EEE')}
                  </span>
                  <span className={cn(
                    "font-medium text-xs",
                    val > 0 && "text-emerald-600 dark:text-emerald-400",
                    val < 0 && "text-destructive",
                    val === 0 && "text-muted-foreground"
                  )}>
                    {formatCurrency(val, true)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Link 
          to="/trading" 
          className="block text-xs text-primary hover:underline"
        >
          View full Trading Journal →
        </Link>
      </CardContent>
    </Card>
  );
}
