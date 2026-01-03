import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GoalSchedule {
  id: string;
  goal_id: string;
  user_id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  goal_id: string;
  day_of_week: number;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
}

export function useGoalSchedules(goalId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: ['goal_schedules', goalId],
    queryFn: async () => {
      let query = supabase.from('goal_schedules').select('*');
      
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }
      
      const { data, error } = await query.order('day_of_week', { ascending: true });

      if (error) throw error;
      return data as GoalSchedule[];
    },
    enabled: !!user && !!goalId,
  });

  const createSchedule = useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const { data, error } = await supabase
        .from('goal_schedules')
        .insert({
          ...input,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as GoalSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_schedules'] });
    },
  });

  const createMultipleSchedules = useMutation({
    mutationFn: async (inputs: CreateScheduleInput[]) => {
      const { data, error } = await supabase
        .from('goal_schedules')
        .insert(
          inputs.map(input => ({
            ...input,
            user_id: user!.id,
          }))
        )
        .select();

      if (error) throw error;
      return data as GoalSchedule[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_schedules'] });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GoalSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('goal_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GoalSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_schedules'] });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goal_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_schedules'] });
    },
  });

  const deleteAllForGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goal_schedules')
        .delete()
        .eq('goal_id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_schedules'] });
    },
  });

  return {
    schedules: schedulesQuery.data ?? [],
    isLoading: schedulesQuery.isLoading,
    error: schedulesQuery.error,
    createSchedule,
    createMultipleSchedules,
    updateSchedule,
    deleteSchedule,
    deleteAllForGoal,
  };
}

// Hook to get today's scheduled practice blocks
export function useTodaySchedules() {
  const { user } = useAuth();
  const today = new Date().getDay();

  return useQuery({
    queryKey: ['goal_schedules', 'today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_schedules')
        .select(`
          *,
          goals (
            id,
            title,
            goal_type
          )
        `)
        .eq('day_of_week', today);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
