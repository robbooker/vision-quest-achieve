import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Tactic {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  frequency: string;
  target_count: number;
  due_weeks: number[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTacticInput {
  goal_id: string;
  title: string;
  frequency?: string;
  target_count?: number;
  due_weeks?: number[];
}

export function useTactics(goalId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tacticsQuery = useQuery({
    queryKey: ['tactics', goalId],
    queryFn: async () => {
      let query = supabase.from('goal_tactics').select('*');
      
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return data as Tactic[];
    },
    enabled: !!user && !!goalId,
  });

  const createTactic = useMutation({
    mutationFn: async (input: CreateTacticInput) => {
      const { data, error } = await supabase
        .from('goal_tactics')
        .insert({
          ...input,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Tactic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tactics'] });
    },
  });

  const updateTactic = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tactic> & { id: string }) => {
      const { data, error } = await supabase
        .from('goal_tactics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Tactic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tactics'] });
    },
  });

  const deleteTactic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goal_tactics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tactics'] });
    },
  });

  return {
    tactics: tacticsQuery.data ?? [],
    isLoading: tacticsQuery.isLoading,
    error: tacticsQuery.error,
    createTactic,
    updateTactic,
    deleteTactic,
  };
}
