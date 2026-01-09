import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, parseISO, isSameDay } from 'date-fns';

export interface SickDay {
  id: string;
  user_id: string;
  sick_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSickDays() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all sick days
  const sickDaysQuery = useQuery({
    queryKey: ['sick-days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sick_days')
        .select('*')
        .order('sick_date', { ascending: false });

      if (error) throw error;
      return data as SickDay[];
    },
    enabled: !!user,
  });

  // Check if a specific date is a sick day
  const isSickDay = (date: Date | string): boolean => {
    if (!sickDaysQuery.data) return false;
    
    const checkDate = typeof date === 'string' ? parseISO(date) : date;
    const dateString = format(checkDate, 'yyyy-MM-dd');
    
    return sickDaysQuery.data.some(sd => sd.sick_date === dateString);
  };

  // Check if today is a sick day
  const isTodaySickDay = (): boolean => {
    return isSickDay(new Date());
  };

  // Toggle sick day for a date
  const toggleSickDay = useMutation({
    mutationFn: async ({ date, notes }: { date: Date; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Check if already exists
      const existing = sickDaysQuery.data?.find(sd => sd.sick_date === dateString);
      
      if (existing) {
        // Remove sick day
        const { error } = await supabase
          .from('sick_days')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add sick day
        const { error } = await supabase
          .from('sick_days')
          .insert({
            user_id: user.id,
            sick_date: dateString,
            notes: notes || null,
          });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sick-days'] });
      // Also invalidate tactic logs and habit chain data since sick days affect streaks
      queryClient.invalidateQueries({ queryKey: ['tactic-logs'] });
      queryClient.invalidateQueries({ queryKey: ['all-tactics-with-goals'] });
    },
  });

  // Get sick days in a date range (useful for calendar views)
  const getSickDaysInRange = (startDate: Date, endDate: Date): SickDay[] => {
    if (!sickDaysQuery.data) return [];
    
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    
    return sickDaysQuery.data.filter(sd => 
      sd.sick_date >= start && sd.sick_date <= end
    );
  };

  return {
    sickDays: sickDaysQuery.data || [],
    isLoading: sickDaysQuery.isLoading,
    error: sickDaysQuery.error,
    isSickDay,
    isTodaySickDay,
    toggleSickDay,
    getSickDaysInRange,
  };
}
