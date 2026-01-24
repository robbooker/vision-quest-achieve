import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfYear, subDays } from 'date-fns';
import { toast } from 'sonner';

export interface TradingPnL {
  id: string;
  user_id: string;
  trade_date: string;
  pnl_amount: number;
  trade_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PnLStats {
  total: number;
  bestDay: { date: string; amount: number } | null;
  worstDay: { date: string; amount: number } | null;
  avgDaily: number;
  winningDays: number;
  losingDays: number;
  totalDays: number;
}

type DateRange = '30d' | 'ytd' | 'all';

export function useTodayPnL() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['trading-pnl', 'today', today],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('trading_pnl')
        .select('*')
        .eq('user_id', user.id)
        .eq('trade_date', today)
        .maybeSingle();

      if (error) throw error;
      return data as TradingPnL | null;
    },
    enabled: !!user,
  });
}

export function usePnLHistory(range: DateRange = '30d') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trading-pnl', 'history', range],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('trading_pnl')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: true });

      if (range === '30d') {
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        query = query.gte('trade_date', thirtyDaysAgo);
      } else if (range === 'ytd') {
        const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd');
        query = query.gte('trade_date', yearStart);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TradingPnL[];
    },
    enabled: !!user,
  });
}

export function usePnLPaginated(page: number, pageSize: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trading-pnl', 'paginated', page, pageSize],
    queryFn: async () => {
      if (!user) return { data: [], count: 0 };

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('trading_pnl')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { 
        data: data as TradingPnL[], 
        count: count || 0,
        hasMore: (count || 0) > to + 1
      };
    },
    enabled: !!user,
  });
}

export function usePnLStats(range: DateRange = 'all') {
  const { data: history = [] } = usePnLHistory(range);

  const stats: PnLStats = {
    total: 0,
    bestDay: null,
    worstDay: null,
    avgDaily: 0,
    winningDays: 0,
    losingDays: 0,
    totalDays: history.length,
  };

  if (history.length === 0) return stats;

  let best = history[0];
  let worst = history[0];

  history.forEach((entry) => {
    stats.total += Number(entry.pnl_amount);
    if (Number(entry.pnl_amount) > 0) stats.winningDays++;
    if (Number(entry.pnl_amount) < 0) stats.losingDays++;
    if (Number(entry.pnl_amount) > Number(best.pnl_amount)) best = entry;
    if (Number(entry.pnl_amount) < Number(worst.pnl_amount)) worst = entry;
  });

  stats.avgDaily = stats.total / history.length;
  stats.bestDay = { date: best.trade_date, amount: Number(best.pnl_amount) };
  stats.worstDay = { date: worst.trade_date, amount: Number(worst.pnl_amount) };

  return stats;
}

export function useUpsertPnL() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trade_date, 
      pnl_amount, 
      trade_count,
      notes 
    }: { 
      trade_date: string; 
      pnl_amount: number;
      trade_count?: number | null;
      notes?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('trading_pnl')
        .upsert({
          user_id: user.id,
          trade_date,
          pnl_amount,
          trade_count: trade_count ?? null,
          notes: notes ?? null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,trade_date',
        })
        .select()
        .single();

      if (error) throw error;
      return data as TradingPnL;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-pnl'] });
      toast.success('P&L saved');
    },
    onError: (error) => {
      console.error('Failed to save P&L:', error);
      toast.error('Failed to save P&L');
    },
  });
}

export function useDeletePnL() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trading_pnl')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-pnl'] });
      toast.success('P&L entry deleted');
    },
    onError: (error) => {
      console.error('Failed to delete P&L:', error);
      toast.error('Failed to delete P&L');
    },
  });
}

export function useWeekPnLTotal() {
  const { user } = useAuth();
  const today = new Date();
  const weekStart = format(subDays(today, today.getDay()), 'yyyy-MM-dd');
  const weekEnd = format(today, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['trading-pnl', 'week-total', weekStart],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('trading_pnl')
        .select('pnl_amount')
        .eq('user_id', user.id)
        .gte('trade_date', weekStart)
        .lte('trade_date', weekEnd);

      if (error) throw error;
      return data.reduce((sum, entry) => sum + Number(entry.pnl_amount), 0);
    },
    enabled: !!user,
  });
}
