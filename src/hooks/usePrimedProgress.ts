import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PillarKey } from '@/data/primedBehaviors';
import { useCycles } from '@/hooks/useCycles';

export interface PillarProgress {
  pillar: PillarKey;
  goalsActive: number;
  goalsCompleted: number;
  habitsActive: number;
  focusMinutesThisMonth: number;
}

export function usePrimedProgress() {
  const { user } = useAuth();
  const { getActiveCycle } = useCycles();
  const activeCycle = getActiveCycle();

  // Calculate progress per pillar from goals
  const { data: pillarProgress, isLoading } = useQuery({
    queryKey: ['primed-progress', user?.id, activeCycle?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const pillars: PillarKey[] = ['physical', 'relations', 'income', 'mental', 'excellence', 'direction'];
      const progress: PillarProgress[] = [];

      // Fetch goals with pillar set
      const { data: goals } = await supabase
        .from('goals')
        .select('id, pillar')
        .eq('user_id', user.id)
        .not('pillar', 'is', null);

      for (const pillar of pillars) {
        // Count goals for this pillar
        const pillarGoals = goals?.filter((g: { pillar: string | null }) => g.pillar === pillar) ?? [];
        
        // Get focus minutes for goals in this pillar
        let focusMinutes = 0;
        if (pillarGoals.length > 0) {
          const goalIds = pillarGoals.map((g: { id: string }) => g.id);
          
          // Get focus sessions for these goals in the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('actual_duration_minutes')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .in('linked_goal_id', goalIds)
            .gte('started_at', thirtyDaysAgo.toISOString());
          
          focusMinutes = sessions?.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) || 0;
        }

        // Get active tactics/habits for this pillar's goals
        let habitsActive = 0;
        if (pillarGoals.length > 0) {
          const goalIds = pillarGoals.map((g: { id: string }) => g.id);
          
          const { data: tactics } = await supabase
            .from('goal_tactics')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .in('goal_id', goalIds);
          
          habitsActive = tactics?.length || 0;
        }

        progress.push({
          pillar,
          goalsActive: pillarGoals.length,
          goalsCompleted: 0, // Would need to track completed goals separately
          habitsActive,
          focusMinutesThisMonth: focusMinutes,
        });
      }

      return progress;
    },
    enabled: !!user?.id,
  });

  // Get progress for a specific pillar
  const getProgressForPillar = (pillar: PillarKey): PillarProgress | undefined => {
    return pillarProgress?.find(p => p.pillar === pillar);
  };

  return {
    pillarProgress: pillarProgress ?? [],
    isLoading,
    getProgressForPillar,
  };
}
