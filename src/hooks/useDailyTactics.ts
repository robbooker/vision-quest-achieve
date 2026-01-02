import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tactic } from './useTactics';

export function useDailyTactics(goalIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-tactics', goalIds],
    queryFn: async () => {
      if (goalIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('goal_tactics')
        .select('*')
        .in('goal_id', goalIds)
        .eq('frequency', 'daily')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Tactic[];
    },
    enabled: !!user && goalIds.length > 0,
  });
}
