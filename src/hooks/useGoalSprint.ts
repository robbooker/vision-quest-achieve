import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GOAL_SPRINT, formatDateStr, isSprintActive, GoalKey } from '@/data/goalSprint';

export function useGoalSprint(date: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateStr = formatDateStr(date);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['goal-sprint-logs', dateStr],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('goal_sprint_logs' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('sprint_date', dateStr);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user?.id && isSprintActive(date),
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['goal-sprint-logs-all'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('goal_sprint_logs' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('sprint_date', GOAL_SPRINT.startDate)
        .lte('sprint_date', GOAL_SPRINT.endDate);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  const toggleGoal = useMutation({
    mutationFn: async ({ goalKey, completed }: { goalKey: GoalKey; completed: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const existing = logs.find((l: any) => l.goal_key === goalKey);
      
      if (existing) {
        const { error } = await supabase
          .from('goal_sprint_logs' as any)
          .update({ completed, updated_at: new Date().toISOString() } as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goal_sprint_logs' as any)
          .insert({
            user_id: user.id,
            sprint_date: dateStr,
            goal_key: goalKey,
            completed,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-sprint-logs', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['goal-sprint-logs-all'] });
    },
  });

  const completedKeys = new Set(
    logs.filter((l: any) => l.completed).map((l: any) => l.goal_key)
  );

  // Compute sprint-wide stats
  const totalGoalsPerDay = 6; // 5 daily + 1 strength
  const totalPossible = GOAL_SPRINT.totalDays * totalGoalsPerDay;
  const totalCompleted = allLogs.filter((l: any) => l.completed).length;

  return {
    logs,
    allLogs,
    isLoading,
    toggleGoal,
    completedKeys,
    stats: {
      totalPossible,
      totalCompleted,
      percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    },
  };
}
