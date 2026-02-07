import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Indicator {
  id: string;
  goal_id: string;
  user_id: string;
  type: 'lead' | 'lag';
  name: string;
  unit: string;
  target_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface IndicatorLog {
  id: string;
  indicator_id: string;
  user_id: string;
  value: number;
  logged_at: string;
  notes: string | null;
  created_at: string;
}

export interface CreateIndicatorInput {
  goal_id: string;
  type: 'lead' | 'lag';
  name: string;
  unit: string;
  target_value?: number;
}

export interface CreateLogInput {
  indicator_id: string;
  value: number;
  notes?: string;
}

export function useIndicators(goalId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const indicatorsQuery = useQuery({
    queryKey: ['indicators', goalId],
    queryFn: async () => {
      let query = supabase.from('goal_indicators').select('*');
      
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return data as Indicator[];
    },
    enabled: !!user && !!goalId,
  });

  const createIndicator = useMutation({
    mutationFn: async (input: CreateIndicatorInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('goal_indicators')
        .insert({
          ...input,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Indicator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });

  const updateIndicator = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Indicator> & { id: string }) => {
      const { data, error } = await supabase
        .from('goal_indicators')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Indicator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });

  const deleteIndicator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goal_indicators')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });

  return {
    indicators: indicatorsQuery.data ?? [],
    isLoading: indicatorsQuery.isLoading,
    error: indicatorsQuery.error,
    createIndicator,
    updateIndicator,
    deleteIndicator,
  };
}

export function useIndicatorLogs(indicatorId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['indicator-logs', indicatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indicator_logs')
        .select('*')
        .eq('indicator_id', indicatorId!)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return data as IndicatorLog[];
    },
    enabled: !!user && !!indicatorId,
  });

  const createLog = useMutation({
    mutationFn: async (input: CreateLogInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('indicator_logs')
        .insert({
          ...input,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as IndicatorLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicator-logs'] });
    },
  });

  return {
    logs: logsQuery.data ?? [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    createLog,
  };
}
