import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActivityEmbeddings } from './useActivityEmbeddings';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export interface TacticLog {
  id: string;
  tactic_id: string;
  user_id: string;
  logged_date: string;
  completed_count: number;
  notes: string | null;
  created_at: string;
}

export function useTacticLogs(date?: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedHabitLog } = useActivityEmbeddings();
  const targetDate = date || new Date();
  const dateString = format(targetDate, 'yyyy-MM-dd');

  // Fetch logs for a specific date
  const logsQuery = useQuery({
    queryKey: ['tactic-logs', dateString],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tactic_logs')
        .select('*')
        .eq('logged_date', dateString);

      if (error) throw error;
      return data as TacticLog[];
    },
    enabled: !!user,
  });

  // Fetch logs for streak calculation (last 30 days)
  const streakQuery = useQuery({
    queryKey: ['tactic-logs-streak'],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('tactic_logs')
        .select('*')
        .gte('logged_date', thirtyDaysAgo)
        .lte('logged_date', today)
        .order('logged_date', { ascending: false });

      if (error) throw error;
      return data as TacticLog[];
    },
    enabled: !!user,
  });

  // Calculate streak for a specific tactic
  const getStreak = (tacticId: string, targetCount: number): number => {
    if (!streakQuery.data) return 0;
    
    const tacticLogs = streakQuery.data
      .filter(log => log.tactic_id === tacticId && log.completed_count >= targetCount)
      .map(log => log.logged_date)
      .sort()
      .reverse();

    if (tacticLogs.length === 0) return 0;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Streak must include today or yesterday
    if (tacticLogs[0] !== today && tacticLogs[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < tacticLogs.length; i++) {
      const current = new Date(tacticLogs[i - 1]);
      const prev = new Date(tacticLogs[i]);
      const diffDays = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Upsert a log (create or update)
  const upsertLog = useMutation({
    mutationFn: async ({ 
      tacticId, 
      completedCount, 
      notes,
      tacticTitle,
    }: { 
      tacticId: string; 
      completedCount: number; 
      notes?: string;
      tacticTitle?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // First try to find existing log
      const { data: existing } = await supabase
        .from('tactic_logs')
        .select('id')
        .eq('tactic_id', tacticId)
        .eq('logged_date', dateString)
        .single();

      if (existing) {
        // Update existing
        if (completedCount <= 0) {
          // Delete if count is 0
          const { error } = await supabase
            .from('tactic_logs')
            .delete()
            .eq('id', existing.id);
          if (error) throw error;
          return null;
        }
        
        const { data, error } = await supabase
          .from('tactic_logs')
          .update({ completed_count: completedCount, notes })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        
        // Generate embedding for updated habit log
        if (data && tacticTitle) {
          embedHabitLog(data as TacticLog, tacticTitle).catch(err =>
            console.log('Embedding update failed (non-blocking):', err)
          );
        }
        
        return data as TacticLog;
      } else if (completedCount > 0) {
        // Insert new
        const { data, error } = await supabase
          .from('tactic_logs')
          .insert({
            tactic_id: tacticId,
            user_id: user!.id,
            logged_date: dateString,
            completed_count: completedCount,
            notes,
          })
          .select()
          .single();
        if (error) throw error;
        
        // Generate embedding for new habit log
        if (data && tacticTitle) {
          embedHabitLog(data as TacticLog, tacticTitle).catch(err =>
            console.log('Embedding generation failed (non-blocking):', err)
          );
        }
        
        return data as TacticLog;
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tactic-logs'] });
      queryClient.invalidateQueries({ queryKey: ['tactic-logs-streak'] });
    },
  });

  // Get log for a specific tactic on the target date
  const getLogForTactic = (tacticId: string): TacticLog | undefined => {
    return logsQuery.data?.find(log => log.tactic_id === tacticId);
  };

  return {
    logs: logsQuery.data ?? [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    upsertLog,
    getLogForTactic,
    getStreak,
  };
}
