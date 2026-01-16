import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrendDataPoint {
  date: string;
  count?: number;
  sessions?: number;
  minutes?: number;
  total_completions?: number;
}

export interface SitewideTrends {
  daily_tasks: TrendDataPoint[];
  daily_focus: TrendDataPoint[];
  daily_journal: TrendDataPoint[];
  daily_habits: TrendDataPoint[];
  daily_active_users: TrendDataPoint[];
  daily_signups: TrendDataPoint[];
}

export function useSitewideTrends(daysBack: number = 14) {
  return useQuery({
    queryKey: ['sitewide-trends', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sitewide_trends', { days_back: daysBack });
      if (error) throw error;
      return data as unknown as SitewideTrends;
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
