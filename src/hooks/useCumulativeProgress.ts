import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

interface DailyProgress {
  date: string;
  value: number;
  cumulative: number;
}

interface CumulativeProgressData {
  goalId: string;
  goalTitle: string;
  targetValue: number;
  currentValue: number;
  progressPercent: number;
  dailyProgress: DailyProgress[];
  daysActive: number;
  dailyAverage: number;
  projectedTotal: number;
  daysRemaining: number;
}

export function useCumulativeProgress(goalId: string, goalTitle: string, targetValue: number, cycleEndDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cumulative-progress', goalId],
    queryFn: async (): Promise<CumulativeProgressData> => {
      // Get tactics for this goal
      const { data: tactics, error: tacticsError } = await supabase
        .from('goal_tactics')
        .select('id, target_count, title')
        .eq('goal_id', goalId)
        .eq('frequency', 'daily')
        .eq('is_active', true);

      if (tacticsError) throw tacticsError;
      if (!tactics?.length) {
        return {
          goalId,
          goalTitle,
          targetValue,
          currentValue: 0,
          progressPercent: 0,
          dailyProgress: [],
          daysActive: 0,
          dailyAverage: 0,
          projectedTotal: 0,
          daysRemaining: 0,
        };
      }

      const tacticIds = tactics.map(t => t.id);

      // Get all logs for these tactics
      const { data: logs, error: logsError } = await supabase
        .from('tactic_logs')
        .select('tactic_id, logged_date, completed_count')
        .in('tactic_id', tacticIds)
        .order('logged_date', { ascending: true });

      if (logsError) throw logsError;

      // Calculate cumulative value by date
      const dailyMap = new Map<string, number>();
      
      logs?.forEach(log => {
        const tactic = tactics.find(t => t.id === log.tactic_id);
        if (tactic) {
          // Extract number from tactic title (e.g., "Do 10 pushups" -> 10)
          const match = tactic.title.match(/\d+/);
          const unitValue = match ? parseInt(match[0], 10) : 1;
          const dayValue = log.completed_count * unitValue;
          
          dailyMap.set(log.logged_date, (dailyMap.get(log.logged_date) || 0) + dayValue);
        }
      });

      // Build daily progress array with cumulative totals
      const sortedDates = Array.from(dailyMap.keys()).sort();
      let cumulative = 0;
      const dailyProgress: DailyProgress[] = sortedDates.map(date => {
        const value = dailyMap.get(date) || 0;
        cumulative += value;
        return { date, value, cumulative };
      });

      const currentValue = cumulative;
      const progressPercent = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
      const daysActive = sortedDates.length;
      const dailyAverage = daysActive > 0 ? Math.round(currentValue / daysActive) : 0;

      // Calculate projected total based on days remaining
      let daysRemaining = 0;
      let projectedTotal = currentValue;
      
      if (cycleEndDate) {
        daysRemaining = Math.max(0, differenceInDays(parseISO(cycleEndDate), new Date()));
        projectedTotal = currentValue + (dailyAverage * daysRemaining);
      }

      return {
        goalId,
        goalTitle,
        targetValue,
        currentValue,
        progressPercent: Math.min(progressPercent, 100),
        dailyProgress,
        daysActive,
        dailyAverage,
        projectedTotal,
        daysRemaining,
      };
    },
    enabled: !!user && !!goalId && targetValue > 100, // Only for high-target numeric goals
  });
}

// Hook to get progress for all numeric goals at once
export function useAllGoalsProgress(goals: Array<{ id: string; title: string; target_value: number; metric_type: string }>, cycleEndDate?: string) {
  const { user } = useAuth();
  
  const numericGoals = goals.filter(g => 
    !g.metric_type.toLowerCase().includes('score') && g.target_value > 100
  );

  return useQuery({
    queryKey: ['all-goals-progress', numericGoals.map(g => g.id).join(',')],
    queryFn: async (): Promise<CumulativeProgressData[]> => {
      if (!numericGoals.length) return [];

      const results: CumulativeProgressData[] = [];

      for (const goal of numericGoals) {
        // Get tactics for this goal
        const { data: tactics, error: tacticsError } = await supabase
          .from('goal_tactics')
          .select('id, target_count, title')
          .eq('goal_id', goal.id)
          .eq('frequency', 'daily')
          .eq('is_active', true);

        if (tacticsError) throw tacticsError;
        if (!tactics?.length) {
          results.push({
            goalId: goal.id,
            goalTitle: goal.title,
            targetValue: goal.target_value,
            currentValue: 0,
            progressPercent: 0,
            dailyProgress: [],
            daysActive: 0,
            dailyAverage: 0,
            projectedTotal: 0,
            daysRemaining: 0,
          });
          continue;
        }

        const tacticIds = tactics.map(t => t.id);

        // Get all logs for these tactics
        const { data: logs, error: logsError } = await supabase
          .from('tactic_logs')
          .select('tactic_id, logged_date, completed_count')
          .in('tactic_id', tacticIds)
          .order('logged_date', { ascending: true });

        if (logsError) throw logsError;

        // Calculate cumulative value by date
        const dailyMap = new Map<string, number>();
        
        logs?.forEach(log => {
          const tactic = tactics.find(t => t.id === log.tactic_id);
          if (tactic) {
            const match = tactic.title.match(/\d+/);
            const unitValue = match ? parseInt(match[0], 10) : 1;
            const dayValue = log.completed_count * unitValue;
            dailyMap.set(log.logged_date, (dailyMap.get(log.logged_date) || 0) + dayValue);
          }
        });

        const sortedDates = Array.from(dailyMap.keys()).sort();
        let cumulative = 0;
        const dailyProgress: DailyProgress[] = sortedDates.map(date => {
          const value = dailyMap.get(date) || 0;
          cumulative += value;
          return { date, value, cumulative };
        });

        const currentValue = cumulative;
        const progressPercent = goal.target_value > 0 ? Math.round((currentValue / goal.target_value) * 100) : 0;
        const daysActive = sortedDates.length;
        const dailyAverage = daysActive > 0 ? Math.round(currentValue / daysActive) : 0;

        let daysRemaining = 0;
        let projectedTotal = currentValue;
        
        if (cycleEndDate) {
          daysRemaining = Math.max(0, differenceInDays(parseISO(cycleEndDate), new Date()));
          projectedTotal = currentValue + (dailyAverage * daysRemaining);
        }

        results.push({
          goalId: goal.id,
          goalTitle: goal.title,
          targetValue: goal.target_value,
          currentValue,
          progressPercent: Math.min(progressPercent, 100),
          dailyProgress,
          daysActive,
          dailyAverage,
          projectedTotal,
          daysRemaining,
        });
      }

      return results;
    },
    enabled: !!user && numericGoals.length > 0,
  });
}
