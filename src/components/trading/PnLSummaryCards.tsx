import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { PnLStats } from '@/hooks/useTradingPnL';
import { cn } from '@/lib/utils';

interface PnLSummaryCardsProps {
  stats: PnLStats;
}

export function PnLSummaryCards({ stats }: PnLSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
    return value < 0 ? `-${formatted}` : value > 0 ? `+${formatted}` : formatted;
  };

  const winRate = stats.totalDays > 0 
    ? Math.round((stats.winningDays / stats.totalDays) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
              "p-1.5 rounded-md",
              stats.total >= 0 ? "bg-emerald-500/10" : "bg-destructive/10"
            )}>
              {stats.total >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">Total P&L</span>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            stats.total > 0 && "text-emerald-600 dark:text-emerald-400",
            stats.total < 0 && "text-destructive"
          )}>
            {formatCurrency(stats.total)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">Best Day</span>
          </div>
          {stats.bestDay ? (
            <>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.bestDay.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(stats.bestDay.date), 'MMM d, yyyy')}
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-destructive/10">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Worst Day</span>
          </div>
          {stats.worstDay ? (
            <>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(stats.worstDay.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(stats.worstDay.date), 'MMM d, yyyy')}
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Win Rate</span>
          </div>
          <p className="text-2xl font-bold">{winRate}%</p>
          <p className="text-xs text-muted-foreground">
            {stats.winningDays}W / {stats.losingDays}L ({stats.totalDays} days)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
