import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface JournalSettings {
  id: string;
  user_id: string;
  theme_instructions: string | null;
  art_style: string | null;
  color_palette: string | null;
  created_at: string;
  updated_at: string;
}

export const useJournalSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['journal-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('journal_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as JournalSettings | null;
    },
    enabled: !!user?.id,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: {
      theme_instructions?: string;
      art_style?: string;
      color_palette?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_settings')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-settings', user?.id] });
      toast.success('Journal settings saved');
    },
    onError: (error) => {
      console.error('Failed to save journal settings:', error);
      toast.error('Failed to save settings');
    },
  });

  return {
    settings,
    isLoading,
    upsertSettings,
  };
};
