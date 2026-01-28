import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { PillarKey, PILLARS } from '@/data/primedBehaviors';

export interface PillarWeeklyData {
  pillar: PillarKey;
  focusMinutes: number;
  tasksCompleted: number;
  habitLogs: number;
  totalActivity: number;
}

export interface WeeklyRecommendation {
  pillar: PillarKey;
  pillarName: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export function usePrimedWeeklySummary() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['primed-weekly-summary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const sevenDaysAgo = subDays(new Date(), 7);
      const startDate = startOfDay(sevenDaysAgo).toISOString();
      const endDate = endOfDay(new Date()).toISOString();
      const startDateStr = format(sevenDaysAgo, 'yyyy-MM-dd');

      const pillars: PillarKey[] = ['physical', 'relations', 'income', 'mental', 'excellence', 'direction'];
      const pillarData: PillarWeeklyData[] = [];

      // Fetch all data in parallel
      const [focusResult, tasksResult, habitLogsResult] = await Promise.all([
        // Focus sessions by pillar
        supabase
          .from('focus_sessions')
          .select('pillar, actual_duration_minutes')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', startDate)
          .lte('completed_at', endDate)
          .not('pillar', 'is', null),

        // Tasks completed by pillar
        supabase
          .from('quick_tasks')
          .select('pillar')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('completed_at', startDate)
          .lte('completed_at', endDate)
          .not('pillar', 'is', null),

        // Habit logs (need to join with tactics to get pillar via goal)
        supabase
          .from('tactic_logs')
          .select(`
            completed_count,
            goal_tactics!inner(
              goals!inner(pillar)
            )
          `)
          .eq('user_id', user.id)
          .gte('logged_date', startDateStr),
      ]);

      // Aggregate by pillar
      for (const pillar of pillars) {
        // Focus minutes
        const focusMinutes = (focusResult.data || [])
          .filter((f: any) => f.pillar === pillar)
          .reduce((sum: number, f: any) => sum + (f.actual_duration_minutes || 0), 0);

        // Tasks completed
        const tasksCompleted = (tasksResult.data || [])
          .filter((t: any) => t.pillar === pillar)
          .length;

        // Habit logs
        const habitLogs = (habitLogsResult.data || [])
          .filter((h: any) => h.goal_tactics?.goals?.pillar === pillar)
          .reduce((sum: number, h: any) => sum + (h.completed_count || 0), 0);

        pillarData.push({
          pillar,
          focusMinutes,
          tasksCompleted,
          habitLogs,
          totalActivity: focusMinutes + (tasksCompleted * 15) + (habitLogs * 10), // Weighted score
        });
      }

      // Sort by activity level
      pillarData.sort((a, b) => b.totalActivity - a.totalActivity);

      // Generate recommendations
      const recommendations: WeeklyRecommendation[] = [];
      const avgActivity = pillarData.reduce((sum, p) => sum + p.totalActivity, 0) / pillars.length;

      pillarData.forEach(p => {
        if (p.totalActivity === 0) {
          recommendations.push({
            pillar: p.pillar,
            pillarName: PILLARS[p.pillar].name,
            message: `No activity in ${PILLARS[p.pillar].name} this week. Consider scheduling a focus block.`,
            priority: 'high',
          });
        } else if (p.totalActivity < avgActivity * 0.5) {
          recommendations.push({
            pillar: p.pillar,
            pillarName: PILLARS[p.pillar].name,
            message: `${PILLARS[p.pillar].name} needs attention. Try adding a daily habit or quick task.`,
            priority: 'medium',
          });
        }
      });

      // Find strongest pillar for encouragement
      const strongest = pillarData[0];
      if (strongest.totalActivity > 0) {
        recommendations.push({
          pillar: strongest.pillar,
          pillarName: PILLARS[strongest.pillar].name,
          message: `Great progress on ${PILLARS[strongest.pillar].name}! ${strongest.focusMinutes}m focused, ${strongest.tasksCompleted} tasks done.`,
          priority: 'low',
        });
      }

      return {
        pillarData,
        recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        totalFocusMinutes: pillarData.reduce((sum, p) => sum + p.focusMinutes, 0),
        totalTasks: pillarData.reduce((sum, p) => sum + p.tasksCompleted, 0),
      };
    },
    enabled: !!user?.id,
  });

  return {
    pillarData: data?.pillarData || [],
    recommendations: data?.recommendations || [],
    totalFocusMinutes: data?.totalFocusMinutes || 0,
    totalTasks: data?.totalTasks || 0,
    isLoading,
  };
}
