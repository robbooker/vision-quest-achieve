import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format, startOfMonth } from 'date-fns';

export interface MonthlyIntention {
  id: string;
  user_id: string;
  month: string;
  word: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useCurrentMonthIntention = () => {
  const { user } = useAuth();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['monthly-intention', user?.id, currentMonth],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('monthly_intentions')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      if (error) throw error;
      return data as MonthlyIntention | null;
    },
    enabled: !!user?.id,
  });
};

export const useIntentionForMonth = (month: string) => {
  const { user } = useAuth();
  const monthDate = `${month}-01`;

  return useQuery({
    queryKey: ['monthly-intention', user?.id, monthDate],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('monthly_intentions')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', monthDate)
        .maybeSingle();

      if (error) throw error;
      return data as MonthlyIntention | null;
    },
    enabled: !!user?.id && !!month,
  });
};

export const useIntentionHistory = (limit: number = 12) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['intention-history', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('monthly_intentions')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as MonthlyIntention[];
    },
    enabled: !!user?.id,
  });
};

export const useSetMonthlyIntention = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      word, 
      description,
      month 
    }: { 
      word: string; 
      description?: string;
      month?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const monthDate = month 
        ? `${month}-01` 
        : format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('monthly_intentions')
        .upsert({
          user_id: user.id,
          month: monthDate,
          word: word.trim(),
          description: description?.trim() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,month',
        })
        .select()
        .single();

      if (error) throw error;
      return data as MonthlyIntention;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-intention'] });
      queryClient.invalidateQueries({ queryKey: ['intention-history'] });
      toast.success('Monthly intention set!');
    },
    onError: (error) => {
      console.error('Failed to set intention:', error);
      toast.error('Failed to set intention');
    },
  });
};

export const useDeleteIntention = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intentionId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('monthly_intentions')
        .delete()
        .eq('id', intentionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-intention'] });
      queryClient.invalidateQueries({ queryKey: ['intention-history'] });
      toast.success('Intention removed');
    },
    onError: (error) => {
      console.error('Failed to delete intention:', error);
      toast.error('Failed to delete intention');
    },
  });
};
