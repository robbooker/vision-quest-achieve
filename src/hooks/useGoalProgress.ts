import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';

interface GoalProgress {
  goalId: string;
  actualValue: number;
  progressPercent: number;
}

export function useGoalProgress(goalId: string, targetValue: number, metricType: string) {
  const { user } = useAuth();

  // Fetch indicator logs for score-based goals
  const indicatorLogsQuery = useQuery({
    queryKey: ['goal-progress-indicator', goalId],
    queryFn: async () => {
      // First get indicators for this goal
      const { data: indicators, error: indicatorsError } = await supabase
        .from('goal_indicators')
        .select('id')
        .eq('goal_id', goalId);

      if (indicatorsError) throw indicatorsError;
      if (!indicators?.length) return [];

      const indicatorIds = indicators.map(i => i.id);

      // Get all logs for these indicators
      const { data: logs, error: logsError } = await supabase
        .from('indicator_logs')
        .select('value, logged_at')
        .in('indicator_id', indicatorIds)
        .order('logged_at', { ascending: false });

      if (logsError) throw logsError;
      return logs ?? [];
    },
    enabled: !!user && !!goalId && metricType.toLowerCase().includes('score'),
  });

  // Fetch tactic logs for habit-based goals
  const tacticLogsQuery = useQuery({
    queryKey: ['goal-progress-tactic', goalId],
    queryFn: async () => {
      // First get tactics for this goal
      const { data: tactics, error: tacticsError } = await supabase
        .from('goal_tactics')
        .select('id, target_count')
        .eq('goal_id', goalId)
        .eq('frequency', 'daily')
        .eq('is_active', true);

      if (tacticsError) throw tacticsError;
      if (!tactics?.length) return { daysCompleted: 0, totalDays: 0 };

      const tacticIds = tactics.map(t => t.id);
      const tacticMap = new Map(tactics.map(t => [t.id, t.target_count]));

      // Get logs from last 84 days (12 weeks)
      const startDate = format(subDays(new Date(), 84), 'yyyy-MM-dd');
      
      const { data: logs, error: logsError } = await supabase
        .from('tactic_logs')
        .select('tactic_id, logged_date, completed_count')
        .in('tactic_id', tacticIds)
        .gte('logged_date', startDate);

      if (logsError) throw logsError;

      // Group logs by date and count days where all tactics met target
      const logsByDate = new Map<string, Map<string, number>>();
      
      logs?.forEach(log => {
        if (!logsByDate.has(log.logged_date)) {
          logsByDate.set(log.logged_date, new Map());
        }
        logsByDate.get(log.logged_date)!.set(log.tactic_id, log.completed_count);
      });

      let daysCompleted = 0;
      logsByDate.forEach((tacticLogs, date) => {
        const allComplete = tactics.every(t => {
          const count = tacticLogs.get(t.id) || 0;
          return count >= t.target_count;
        });
        if (allComplete) daysCompleted++;
      });

      return { daysCompleted, totalDays: logsByDate.size };
    },
    enabled: !!user && !!goalId && !metricType.toLowerCase().includes('score'),
  });

  // Calculate progress based on metric type
  const isScoreBased = metricType.toLowerCase().includes('score');
  
  if (isScoreBased) {
    const logs = indicatorLogsQuery.data ?? [];
    // For score goals, calculate average of all logged scores
    const totalScore = logs.reduce((sum, log) => sum + log.value, 0);
    const avgScore = logs.length > 0 ? totalScore / logs.length : 0;
    // Progress is based on average score vs target (e.g., 8/10 = 80%)
    const progressPercent = targetValue > 0 ? Math.round((avgScore / targetValue) * 100) : 0;
    
    return {
      actualValue: Math.round(avgScore * 10) / 10,
      progressPercent: Math.min(progressPercent, 100),
      isLoading: indicatorLogsQuery.isLoading,
      logCount: logs.length,
    };
  } else {
    const { daysCompleted = 0, totalDays = 0 } = tacticLogsQuery.data ?? {};
    // For habit goals, progress is days completed vs target days
    const progressPercent = targetValue > 0 ? Math.round((daysCompleted / targetValue) * 100) : 0;
    
    return {
      actualValue: daysCompleted,
      progressPercent: Math.min(progressPercent, 100),
      isLoading: tacticLogsQuery.isLoading,
      logCount: totalDays,
    };
  }
}

// Hook to get weekly habit completion stats
export function useWeeklyHabitStats(goalIds: string[], weekStart: Date, weekEnd: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-habit-stats', goalIds, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!goalIds.length) return { completed: 0, total: 0, percentage: 0 };

      // Get all daily tactics for these goals
      const { data: tactics, error: tacticsError } = await supabase
        .from('goal_tactics')
        .select('id, target_count, goal_id')
        .in('goal_id', goalIds)
        .eq('frequency', 'daily')
        .eq('is_active', true);

      if (tacticsError) throw tacticsError;
      if (!tactics?.length) return { completed: 0, total: 0, percentage: 0 };

      const tacticIds = tactics.map(t => t.id);
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');

      // Get logs for the week
      const { data: logs, error: logsError } = await supabase
        .from('tactic_logs')
        .select('tactic_id, logged_date, completed_count')
        .in('tactic_id', tacticIds)
        .gte('logged_date', startStr)
        .lte('logged_date', endStr);

      if (logsError) throw logsError;

      // Count completions
      let completed = 0;
      const total = tactics.length * 7; // Each tactic should be done each day

      logs?.forEach(log => {
        const tactic = tactics.find(t => t.id === log.tactic_id);
        if (tactic && log.completed_count >= tactic.target_count) {
          completed++;
        }
      });

      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
    enabled: !!user && goalIds.length > 0,
  });
}
