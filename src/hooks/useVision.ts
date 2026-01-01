import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Vision {
  id: string;
  user_id: string;
  vision_3_year: string | null;
  vision_long_term: string | null;
  core_values: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisionInput {
  vision_3_year?: string;
  vision_long_term?: string;
  core_values?: string;
}

export function useVision() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const visionQuery = useQuery({
    queryKey: ['vision', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_vision')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as Vision | null;
    },
    enabled: !!user,
  });

  const upsertVision = useMutation({
    mutationFn: async (input: VisionInput) => {
      // Check if vision exists
      const { data: existing } = await supabase
        .from('user_vision')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('user_vision')
          .update(input)
          .eq('user_id', user!.id)
          .select()
          .single();
        if (error) throw error;
        return data as Vision;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('user_vision')
          .insert({ ...input, user_id: user!.id })
          .select()
          .single();
        if (error) throw error;
        return data as Vision;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision'] });
    },
  });

  return {
    vision: visionQuery.data,
    isLoading: visionQuery.isLoading,
    error: visionQuery.error,
    upsertVision,
  };
}
