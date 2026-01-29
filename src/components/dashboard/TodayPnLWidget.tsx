import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTodayPnL, useUpsertPnL } from '@/hooks/useTradingPnL';
import { cn } from '@/lib/utils';

export function TodayPnLWidget() {
  const { data: todayPnL, isLoading } = useTodayPnL();
  const upsertPnL = useUpsertPnL();
  
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

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
    return value < 0 ? `-${formatted}` : value > 0 ? `+${formatted}` : formatted;
  };

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
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Today's P&L
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className={cn(
            "text-3xl font-bold",
            isProfit && "text-emerald-600 dark:text-emerald-400",
            isLoss && "text-destructive"
          )}>
            {formatCurrency(pnlValue)}
          </p>
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
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Today's P&L
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
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
