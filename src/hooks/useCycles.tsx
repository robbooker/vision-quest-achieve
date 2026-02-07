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
      if (!user) throw new Error('Not authenticated');
      
      const startDate = startOfDay(new Date(input.start_date));
      const endDate = addWeeks(startDate, 6);
      
      // Always set to 'active' so users can immediately start planning
      const { data, error } = await supabase
        .from('cycles')
        .insert({
          name: input.name,
          start_date: input.start_date,
          end_date: endDate.toISOString().split('T')[0],
          user_id: user!.id,
          status: 'active',
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

  // Helper to get current week number for a cycle (6+2 model)
  // Weeks 1-6: Active cycle
  // Week 7: Review/Reflection week
  // Week 8: Planning week for next cycle
  const getCurrentWeekNumber = (cycle: Cycle): number => {
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(cycle.start_date));
    const endDate = startOfDay(new Date(cycle.end_date));
    
    // If today is before cycle starts, return 0
    if (today < startDate) return 0;
    
    // Calculate weeks since start
    const weeksDiff = differenceInWeeks(today, startDate);
    const currentWeek = weeksDiff + 1;
    
    // If today is after end date (week 6), check reset period
    if (today > endDate) {
      const weeksAfterEnd = differenceInWeeks(today, endDate);
      if (weeksAfterEnd < 1) return 7; // Week 7 (review week)
      if (weeksAfterEnd < 2) return 8; // Week 8 (planning week)
      return 8; // Still show as week 8 until new cycle
    }
    
    // Calculate current week (1-6)
    return Math.min(currentWeek, 6);
  };

  // Find the active cycle
  const getActiveCycle = (): Cycle | null => {
    if (!cyclesQuery.data) return null;
    
    const today = new Date();
    
    // First, look for an explicitly active cycle
    const activeCycle = cyclesQuery.data.find(c => c.status === 'active');
    if (activeCycle) return activeCycle;
    
    // Otherwise, find a cycle where today falls within start and end (+2 weeks for reset period)
    const currentCycle = cyclesQuery.data.find(cycle => {
      const startDate = new Date(cycle.start_date);
      const endDate = addWeeks(new Date(cycle.end_date), 2); // Include weeks 7-8 (reset period)
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
