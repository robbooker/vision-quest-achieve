import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSickDays } from './useSickDays';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';

export interface HabitDayStatus {
  date: Date;
  dateString: string;
  tactics: {
    tacticId: string;
    completed: boolean;
    completedCount: number;
    targetCount: number;
  }[];
  allCompleted: boolean;
  someCompleted: boolean;
  completionRatio: number;
}

export interface GoalHabitChain {
  goalId: string;
  goalTitle: string;
  goalCreatedAt: Date;
  tactics: {
    id: string;
    title: string;
    targetCount: number;
  }[];
  days: HabitDayStatus[];
}

export function useHabitChainData(month: Date = new Date()) {
  const { user } = useAuth();
  const { isSickDay } = useSickDays();
  
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startString = format(monthStart, 'yyyy-MM-dd');
  const endString = format(monthEnd, 'yyyy-MM-dd');

  // Fetch all active tactics with their goals
  const tacticsQuery = useQuery({
    queryKey: ['all-tactics-with-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goal_tactics')
        .select(`
          id,
          goal_id,
          title,
          target_count,
          frequency,
          is_active,
          goals!inner (
            id,
            title,
            created_at
          )
        `)
        .eq('is_active', true)
        .eq('frequency', 'daily');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all tactic logs for the month
  const logsQuery = useQuery({
    queryKey: ['tactic-logs-month', startString, endString],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tactic_logs')
        .select('*')
        .gte('logged_date', startString)
        .lte('logged_date', endString);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Build the chain data structure
  const goalChains = useMemo<GoalHabitChain[]>(() => {
    if (!tacticsQuery.data || !logsQuery.data) return [];

    const tactics = tacticsQuery.data;
    const logs = logsQuery.data;
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Group tactics by goal
    const goalMap = new Map<string, {
      goalId: string;
      goalTitle: string;
      goalCreatedAt: Date;
      tactics: typeof tactics;
    }>();

    tactics.forEach(tactic => {
      const goal = tactic.goals as { id: string; title: string; created_at: string };
      if (!goalMap.has(goal.id)) {
        goalMap.set(goal.id, {
          goalId: goal.id,
          goalTitle: goal.title,
          goalCreatedAt: new Date(goal.created_at),
          tactics: [],
        });
      }
      goalMap.get(goal.id)!.tactics.push(tactic);
    });

    // Build chains for each goal
    return Array.from(goalMap.values()).map(({ goalId, goalTitle, goalCreatedAt, tactics: goalTactics }) => {
      const dayStatuses: HabitDayStatus[] = days.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        
        const tacticStatuses = goalTactics.map(tactic => {
          const log = logs.find(
            l => l.tactic_id === tactic.id && l.logged_date === dateString
          );
          const completedCount = log?.completed_count ?? 0;
          const completed = completedCount >= tactic.target_count;
          
          return {
            tacticId: tactic.id,
            completed,
            completedCount,
            targetCount: tactic.target_count,
          };
        });

        const completedCount = tacticStatuses.filter(t => t.completed).length;
        const totalCount = tacticStatuses.length;
        
        return {
          date,
          dateString,
          tactics: tacticStatuses,
          allCompleted: completedCount === totalCount && totalCount > 0,
          someCompleted: completedCount > 0,
          completionRatio: totalCount > 0 ? completedCount / totalCount : 0,
        };
      });

      return {
        goalId,
        goalTitle,
        goalCreatedAt,
        tactics: goalTactics.map(t => ({
          id: t.id,
          title: t.title,
          targetCount: t.target_count,
        })),
        days: dayStatuses,
      };
    });
  }, [tacticsQuery.data, logsQuery.data, monthStart, monthEnd]);

  // Calculate current streak for a goal (excluding sick days)
  const getCurrentStreak = (goalId: string): number => {
    const chain = goalChains.find(c => c.goalId === goalId);
    if (!chain) return 0;

    const today = new Date();
    let streak = 0;
    
    // Work backwards from today
    for (let i = chain.days.length - 1; i >= 0; i--) {
      const day = chain.days[i];
      if (day.date > today) continue;
      
      // Skip sick days - they don't break or count towards streak
      if (isSickDay(day.date)) {
        continue;
      }
      
      if (day.allCompleted) {
        streak++;
      } else if (isSameDay(day.date, today)) {
        // Today can be incomplete, continue checking
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  return {
    goalChains,
    isLoading: tacticsQuery.isLoading || logsQuery.isLoading,
    error: tacticsQuery.error || logsQuery.error,
    getCurrentStreak,
  };
}
