import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SitewideStats {
  quick_tasks_completed_today: number;
  quick_tasks_completed_all_time: number;
  quick_tasks_total: number;
  big_ten_projects_total: number;
  big_ten_projects_completed: number;
  big_ten_tasks_completed: number;
  focus_sessions_total: number;
  focus_sessions_completed: number;
  focus_sessions_today: number;
  focus_minutes_total: number;
  focus_minutes_today: number;
  journal_entries_total: number;
  journal_entries_today: number;
  tactics_created: number;
  tactic_logs_total: number;
  tactic_logs_today: number;
  goals_total: number;
  cycles_total: number;
  total_users: number;
  users_active_today: number;
  // New sleep & nutrition stats
  sleep_entries_total: number;
  sleep_entries_today: number;
  nutrition_entries_total: number;
  nutrition_entries_today: number;
}

export function useSitewideStats() {
  return useQuery({
    queryKey: ['sitewide-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sitewide_stats');
      if (error) throw error;
      return data as unknown as SitewideStats;
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
