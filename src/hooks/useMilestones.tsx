import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Milestone {
  id: string;
  goal_id: string;
  user_id: string;
  week_number: number;
  target_value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneInput {
  goal_id: string;
  week_number: number;
  target_value: number;
  description?: string;
}

export type DistributionType = 'linear' | 'ramp-up' | 'ramp-down' | 'custom';

export function useMilestones(goalId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const milestonesQuery = useQuery({
    queryKey: ['milestones', goalId],
    queryFn: async () => {
      let query = supabase.from('milestones').select('*');
      
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }
      
      const { data, error } = await query.order('week_number', { ascending: true });

      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!user && !!goalId,
  });

  const createMilestone = useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const { data, error } = await supabase
        .from('milestones')
        .insert({
          ...input,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Milestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Milestone> & { id: string }) => {
      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Milestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  const bulkCreateMilestones = useMutation({
    mutationFn: async (inputs: CreateMilestoneInput[]) => {
      // First delete existing milestones for this goal
      if (inputs.length > 0) {
        const { error: deleteError } = await supabase
          .from('milestones')
          .delete()
          .eq('goal_id', inputs[0].goal_id);

        if (deleteError) throw deleteError;
      }

      // Then insert new milestones
      const { data, error } = await supabase
        .from('milestones')
        .insert(
          inputs.map(input => ({
            ...input,
            user_id: user!.id,
          }))
        )
        .select();

      if (error) throw error;
      return data as Milestone[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  return {
    milestones: milestonesQuery.data ?? [],
    isLoading: milestonesQuery.isLoading,
    error: milestonesQuery.error,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    bulkCreateMilestones,
  };
}

// Helper function to generate milestone distributions
export function generateMilestoneDistribution(
  targetValue: number,
  distributionType: DistributionType
): number[] {
  const weeks = 12;
  
  switch (distributionType) {
    case 'linear': {
      const baseValue = Math.floor(targetValue / weeks);
      const remainder = targetValue - (baseValue * weeks);
      return Array.from({ length: weeks }, (_, i) => 
        i === weeks - 1 ? baseValue + remainder : baseValue
      );
    }
    
    case 'ramp-up': {
      // Weights: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
      const weights = Array.from({ length: weeks }, (_, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const values = weights.map(w => Math.floor((w / totalWeight) * targetValue));
      const sum = values.reduce((a, b) => a + b, 0);
      values[weeks - 1] += targetValue - sum; // Adjust last week for rounding
      return values;
    }
    
    case 'ramp-down': {
      // Weights: 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
      const weights = Array.from({ length: weeks }, (_, i) => weeks - i);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const values = weights.map(w => Math.floor((w / totalWeight) * targetValue));
      const sum = values.reduce((a, b) => a + b, 0);
      values[weeks - 1] += targetValue - sum; // Adjust last week for rounding
      return values;
    }
    
    case 'custom':
    default:
      return Array(weeks).fill(0);
  }
}
