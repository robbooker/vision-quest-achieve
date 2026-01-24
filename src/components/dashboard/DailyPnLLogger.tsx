import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTodayPnL, useUpsertPnL, useWeekPnLTotal } from '@/hooks/useTradingPnL';
import { cn } from '@/lib/utils';

export function DailyPnLLogger() {
  const { data: todayPnL, isLoading } = useTodayPnL();
  const { data: weekTotal = 0 } = useWeekPnLTotal();
  const upsertPnL = useUpsertPnL();
  
  const [amount, setAmount] = useState('');
  const [tradeCount, setTradeCount] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (todayPnL) {
      setAmount(todayPnL.pnl_amount.toString());
      setTradeCount(todayPnL.trade_count?.toString() || '');
    }
  }, [todayPnL]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setHasChanges(true);
  };

  const handleTradeCountChange = (value: string) => {
    setTradeCount(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    const pnlValue = parseFloat(amount);
    if (isNaN(pnlValue)) return;

    upsertPnL.mutate({
      trade_date: format(new Date(), 'yyyy-MM-dd'),
      pnl_amount: pnlValue,
      trade_count: tradeCount ? parseInt(tradeCount) : null,
    }, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const pnlValue = parseFloat(amount) || 0;
  const isProfit = pnlValue > 0;
  const isLoss = pnlValue < 0;

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
    return value < 0 ? `-${formatted}` : value > 0 ? `+${formatted}` : formatted;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Trading P&L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Trading P&L
          </CardTitle>
          {weekTotal !== 0 && (
            <Badge 
              variant="secondary"
              className={cn(
                "text-xs",
                weekTotal > 0 && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                weekTotal < 0 && "bg-destructive/10 text-destructive"
              )}
            >
              Week: {formatCurrency(weekTotal)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(
                "pl-9 font-mono",
                isProfit && "border-emerald-500/50 focus-visible:ring-emerald-500/30",
                isLoss && "border-destructive/50 focus-visible:ring-destructive/30"
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
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="# trades"
            value={tradeCount}
            onChange={(e) => handleTradeCountChange(e.target.value)}
            className="flex-1 text-sm"
          />
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges || upsertPnL.isPending || !amount}
            className="shrink-0"
          >
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>

        {todayPnL && !hasChanges && (
          <p className="text-xs text-muted-foreground text-center">
            Logged at {format(new Date(todayPnL.updated_at), 'h:mm a')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
