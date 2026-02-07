import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivityEmbeddings } from './useActivityEmbeddings';

export type GoalType = 'standard' | 'time_mastery' | 'habit' | 'woop';
export type HabitDirection = 'start' | 'stop' | 'replace';

import { PillarKey } from '@/data/primedBehaviors';

export interface Goal {
  id: string;
  cycle_id: string;
  user_id: string;
  title: string;
  metric_type: string;
  target_value: number;
  why: string | null;
  goal_type: GoalType;
  created_at: string;
  updated_at: string;
  // P.R.I.M.E.D. pillar
  pillar?: PillarKey | null;
  // Habit-based goal fields
  habit_direction?: HabitDirection | null;
  habit_cue?: string | null;
  habit_current_routine?: string | null;
  habit_new_routine?: string | null;
  habit_reward?: string | null;
  habit_craving?: string | null;
  habit_environment_change?: string | null;
  implementation_intention?: string | null;
  is_keystone_habit?: boolean | null;
  accountability_partner_email?: string | null;
  // WOOP goal fields
  outcome_visualization?: string | null;
  primary_obstacle?: string | null;
}

export interface CreateGoalInput {
  cycle_id: string;
  title: string;
  metric_type: string;
  target_value: number;
  why?: string;
  goal_type?: GoalType;
  pillar?: PillarKey;
  // Habit-based goal fields
  habit_direction?: HabitDirection;
  habit_cue?: string;
  habit_current_routine?: string;
  habit_new_routine?: string;
  habit_reward?: string;
  habit_craving?: string;
  habit_environment_change?: string;
  implementation_intention?: string;
  is_keystone_habit?: boolean;
  accountability_partner_email?: string;
  // WOOP goal fields
  outcome_visualization?: string;
  primary_obstacle?: string;
}

export function useGoals(cycleId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedGoal } = useActivityEmbeddings();

  const goalsQuery = useQuery({
    queryKey: ['goals', cycleId],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      let query = supabase.from('goals').select('*').eq('user_id', user.id);
      
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user && !!cycleId,
  });

  const createGoal = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...input,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Goal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      // Generate embedding for the new goal
      embedGoal(data).catch(console.error);
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Goal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      // Update embedding for the goal
      embedGoal(data).catch(console.error);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    error: goalsQuery.error,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
