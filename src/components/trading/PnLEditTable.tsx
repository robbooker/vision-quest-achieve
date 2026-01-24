import { useState } from 'react';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePnLPaginated, useUpsertPnL, useDeletePnL, TradingPnL } from '@/hooks/useTradingPnL';
import { cn } from '@/lib/utils';

interface EditRowProps {
  date: string;
  existingEntry?: TradingPnL;
  onSave: (date: string, amount: number, tradeCount?: number) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}

function EditRow({ date, existingEntry, onSave, onDelete, isSaving }: EditRowProps) {
  const [amount, setAmount] = useState(existingEntry?.pnl_amount?.toString() || '');
  const [tradeCount, setTradeCount] = useState(existingEntry?.trade_count?.toString() || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setIsDirty(true);
  };

  const handleTradeCountChange = (value: string) => {
    setTradeCount(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    const pnlValue = parseFloat(amount);
    if (isNaN(pnlValue)) return;
    onSave(date, pnlValue, tradeCount ? parseInt(tradeCount) : undefined);
    setIsDirty(false);
  };

  const pnlValue = parseFloat(amount) || 0;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {format(new Date(date), 'EEE, MMM d')}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0.00"
          className={cn(
            "w-32 font-mono",
            pnlValue > 0 && "text-emerald-600 dark:text-emerald-400",
            pnlValue < 0 && "text-destructive"
          )}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={tradeCount}
          onChange={(e) => handleTradeCountChange(e.target.value)}
          placeholder="—"
          className="w-20"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {isDirty && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={isSaving || !amount}
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
          {existingEntry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(existingEntry.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

interface PnLEditTableProps {
  onRefresh?: () => void;
}

export function PnLEditTable({ onRefresh }: PnLEditTableProps) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const { data: paginatedData, isLoading } = usePnLPaginated(page, pageSize);
  const upsertPnL = useUpsertPnL();
  const deletePnL = useDeletePnL();

  // Generate last 30 days for backfilling
  const today = new Date();
  const last30Days = eachDayOfInterval({
    start: subDays(today, 29),
    end: today,
  }).reverse();

  // Create a map of existing entries by date
  const entriesByDate = new Map<string, TradingPnL>();
  paginatedData?.data.forEach((entry) => {
    entriesByDate.set(entry.trade_date, entry);
  });

  // Get dates for current page
  const startIdx = page * pageSize;
  const endIdx = startIdx + pageSize;
  const displayDates = last30Days.slice(startIdx, endIdx);

  const handleSave = (date: string, amount: number, tradeCount?: number) => {
    upsertPnL.mutate({
      trade_date: date,
      pnl_amount: amount,
      trade_count: tradeCount,
    }, {
      onSuccess: onRefresh,
    });
  };

  const handleDelete = (id: string) => {
    deletePnL.mutate(id, {
      onSuccess: onRefresh,
    });
  };

  const totalPages = Math.ceil(30 / pageSize);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Edit History</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>P&L ($)</TableHead>
              <TableHead># Trades</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const existingEntry = entriesByDate.get(dateStr);
              return (
                <EditRow
                  key={dateStr}
                  date={dateStr}
                  existingEntry={existingEntry}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  isSaving={upsertPnL.isPending}
                />
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
