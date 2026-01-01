import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { addWeeks, differenceInWeeks, isWithinInterval, startOfDay } from 'date-fns';

export interface Cycle {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'review' | 'completed';
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCycleInput {
  name: string;
  start_date: string;
}

export function useCycles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cyclesQuery = useQuery({
    queryKey: ['cycles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('archived', false)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Cycle[];
    },
    enabled: !!user,
  });

  const createCycle = useMutation({
    mutationFn: async (input: CreateCycleInput) => {
      const startDate = new Date(input.start_date);
      const endDate = addWeeks(startDate, 12);
      
      const { data, error } = await supabase
        .from('cycles')
        .insert({
          name: input.name,
          start_date: input.start_date,
          end_date: endDate.toISOString().split('T')[0],
          user_id: user!.id,
          status: 'planning',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] });
    },
  });

  const updateCycleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Cycle['status'] }) => {
      const { data, error } = await supabase
        .from('cycles')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] });
    },
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] });
    },
  });

  const archiveCycle = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('cycles')
        .update({ archived: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] });
    },
  });

  // Helper to get current week number for a cycle
  const getCurrentWeekNumber = (cycle: Cycle): number => {
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(cycle.start_date));
    const endDate = startOfDay(new Date(cycle.end_date));
    
    // If today is before cycle starts, return 0
    if (today < startDate) return 0;
    
    // If today is after end date, check if in week 13
    if (today > endDate) {
      const weeksAfterEnd = differenceInWeeks(today, endDate);
      if (weeksAfterEnd < 1) return 13; // Week 13 (review week)
      return 13; // Still show as week 13 until new cycle
    }
    
    // Calculate current week (1-12)
    const weeksDiff = differenceInWeeks(today, startDate);
    return Math.min(weeksDiff + 1, 12);
  };

  // Find the active cycle
  const getActiveCycle = (): Cycle | null => {
    if (!cyclesQuery.data) return null;
    
    const today = new Date();
    
    // First, look for an explicitly active cycle
    const activeCycle = cyclesQuery.data.find(c => c.status === 'active');
    if (activeCycle) return activeCycle;
    
    // Otherwise, find a cycle where today falls within start and end (+1 week for review)
    const currentCycle = cyclesQuery.data.find(cycle => {
      const startDate = new Date(cycle.start_date);
      const endDate = addWeeks(new Date(cycle.end_date), 1); // Include week 13
      return isWithinInterval(today, { start: startDate, end: endDate });
    });
    
    return currentCycle ?? null;
  };

  return {
    cycles: cyclesQuery.data ?? [],
    isLoading: cyclesQuery.isLoading,
    error: cyclesQuery.error,
    createCycle,
    updateCycleStatus,
    deleteCycle,
    archiveCycle,
    getCurrentWeekNumber,
    getActiveCycle,
  };
}
