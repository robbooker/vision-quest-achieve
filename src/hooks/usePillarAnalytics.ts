import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PillarKey } from '@/data/primedBehaviors';
import { subDays, format, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export interface PillarAnalytics {
  pillar: PillarKey;
  focusMinutes: number;
  focusSessions: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  goalsCount: number;
}

export function usePillarAnalytics(selectedPillar: PillarKey | 'all' = 'all') {
  const { user } = useAuth();
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['pillar-analytics', user?.id, selectedPillar],
    queryFn: async () => {
      if (!user?.id) return null;

      const pillars: PillarKey[] = ['physical', 'relations', 'income', 'mental', 'excellence', 'direction'];

      // Build pillar filter
      const pillarFilter = selectedPillar === 'all' ? pillars : [selectedPillar];

      // Fetch all data in parallel
      const [focusResult, tasksResult, goalsResult, tacticsResult] = await Promise.all([
        // Focus sessions
        supabase
          .from('focus_sessions')
          .select('pillar, actual_duration_minutes, completed_at, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('pillar', 'is', null)
          .in('pillar', pillarFilter)
          .gte('started_at', thirtyDaysAgo),
        
        // Tasks
        supabase
          .from('quick_tasks')
          .select('pillar, completed, completed_at, created_at')
          .eq('user_id', user.id)
          .not('pillar', 'is', null)
          .in('pillar', pillarFilter)
          .gte('created_at', thirtyDaysAgo),
        
        // Goals
        supabase
          .from('goals')
          .select('id, pillar, title')
          .eq('user_id', user.id)
          .not('pillar', 'is', null)
          .in('pillar', pillarFilter),
        
        // Habit/tactic logs
        supabase
          .from('tactic_logs')
          .select(`
            completed_count,
            logged_date,
            goal_tactics!inner(goal_id, goals!inner(pillar))
          `)
          .eq('user_id', user.id)
          .gte('logged_date', thirtyDaysAgo),
      ]);

      // Calculate per-pillar analytics
      const analytics: PillarAnalytics[] = pillarFilter.map(pillar => {
        const focusForPillar = focusResult.data?.filter(f => f.pillar === pillar) || [];
        const tasksForPillar = tasksResult.data?.filter(t => t.pillar === pillar) || [];
        const goalsForPillar = goalsResult.data?.filter(g => g.pillar === pillar) || [];
        
        const goalsInPillar = goalsForPillar.map(g => g.id);
        const habitsCompleted = tacticsResult.data?.filter((log: any) => {
          const goalPillar = log.goal_tactics?.goals?.pillar;
          return goalPillar === pillar;
        }).reduce((sum: number, log: any) => sum + (log.completed_count || 0), 0) || 0;

        return {
          pillar,
          focusMinutes: focusForPillar.reduce((sum, f) => sum + (f.actual_duration_minutes || 0), 0),
          focusSessions: focusForPillar.length,
          tasksCompleted: tasksForPillar.filter(t => t.completed).length,
          tasksTotal: tasksForPillar.length,
          habitsCompleted,
          goalsCount: goalsForPillar.length,
        };
      });

      // Daily breakdown for charts (last 7 days)
      const sevenDaysAgo = subDays(new Date(), 6);
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
      
      const dailyFocusData = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayLabel = format(day, 'EEE');
        
        const dayFocus = focusResult.data?.filter(f => {
          const completedDate = f.completed_at ? format(new Date(f.completed_at), 'yyyy-MM-dd') : null;
          return completedDate === dateStr && (selectedPillar === 'all' || f.pillar === selectedPillar);
        }) || [];

        return {
          date: dayLabel,
          minutes: dayFocus.reduce((sum, f) => sum + (f.actual_duration_minutes || 0), 0),
        };
      });

      // Weekly breakdown (last 4 weeks)
      const fourWeeksAgo = subDays(new Date(), 28);
      const weeks = eachWeekOfInterval({ start: fourWeeksAgo, end: new Date() }, { weekStartsOn: 1 });
      
      const weeklyData = weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const weekTasks = tasksResult.data?.filter(t => {
          if (!t.completed || !t.completed_at) return false;
          const completedDate = new Date(t.completed_at);
          return completedDate >= weekStart && completedDate <= weekEnd && (selectedPillar === 'all' || t.pillar === selectedPillar);
        }) || [];

        const weekFocus = focusResult.data?.filter(f => {
          if (!f.completed_at) return false;
          const completedDate = new Date(f.completed_at);
          return completedDate >= weekStart && completedDate <= weekEnd && (selectedPillar === 'all' || f.pillar === selectedPillar);
        }) || [];

        return {
          week: `W${index + 1}`,
          label: format(weekStart, 'MMM d'),
          tasks: weekTasks.length,
          focusMinutes: weekFocus.reduce((sum, f) => sum + (f.actual_duration_minutes || 0), 0),
        };
      });

      // Totals
      const totals = {
        focusMinutes: analytics.reduce((sum, a) => sum + a.focusMinutes, 0),
        focusSessions: analytics.reduce((sum, a) => sum + a.focusSessions, 0),
        tasksCompleted: analytics.reduce((sum, a) => sum + a.tasksCompleted, 0),
        tasksTotal: analytics.reduce((sum, a) => sum + a.tasksTotal, 0),
        habitsCompleted: analytics.reduce((sum, a) => sum + a.habitsCompleted, 0),
        goalsCount: analytics.reduce((sum, a) => sum + a.goalsCount, 0),
      };

      return {
        analytics,
        dailyFocusData,
        weeklyData,
        totals,
      };
    },
    enabled: !!user?.id,
  });
}
