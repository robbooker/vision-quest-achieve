import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useResetPreference() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch reset preference
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('reset_active, reset_started_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isResetActive = preferences?.reset_active ?? false;
  const resetStartedAt = preferences?.reset_started_at ? new Date(preferences.reset_started_at) : null;

  // Start reset
  const startReset = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ 
            reset_active: true, 
            reset_started_at: new Date().toISOString() 
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({ 
            user_id: user.id, 
            reset_active: true, 
            reset_started_at: new Date().toISOString() 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  // End reset
  const endReset = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .update({ 
          reset_active: false, 
          reset_started_at: null 
        })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  return {
    isResetActive,
    resetStartedAt,
    isLoading,
    startReset,
    endReset,
  };
}
