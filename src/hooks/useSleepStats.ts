import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export interface SleepStats {
  avgSleepScore: number;
  avgReadinessScore: number;
  highScoreStreak: number; // consecutive days with 85+ sleep score
  daysLogged: number;
  daysWithOura: number;
  daysWithManual: number;
  entries: {
    date: string;
    sleepScore: number | null;
    readinessScore: number | null;
    source: string;
  }[];
}

export function useSleepStats(daysBack: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sleep-stats', user?.id, daysBack],
    queryFn: async (): Promise<SleepStats> => {
      if (!user?.id) {
        return {
          avgSleepScore: 0,
          avgReadinessScore: 0,
          highScoreStreak: 0,
          daysLogged: 0,
          daysWithOura: 0,
          daysWithManual: 0,
          entries: [],
        };
      }

      const startDate = format(subDays(new Date(), daysBack - 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('oura_daily_metrics')
        .select('metric_date, sleep_score, readiness_score, source')
        .eq('user_id', user.id)
        .gte('metric_date', startDate)
        .lte('metric_date', endDate)
        .order('metric_date', { ascending: false });

      if (error) throw error;

      const entries = (data || []).map(d => ({
        date: d.metric_date,
        sleepScore: d.sleep_score,
        readinessScore: d.readiness_score,
        source: d.source,
      }));

      // Calculate averages
      const sleepScores = entries.filter(e => e.sleepScore !== null).map(e => e.sleepScore!);
      const readinessScores = entries.filter(e => e.readinessScore !== null).map(e => e.readinessScore!);

      const avgSleepScore = sleepScores.length > 0 
        ? Math.round(sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length)
        : 0;
      const avgReadinessScore = readinessScores.length > 0 
        ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length)
        : 0;

      // Calculate streak of 85+ sleep scores (from most recent)
      let highScoreStreak = 0;
      const sortedByDateDesc = [...entries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      for (const entry of sortedByDateDesc) {
        if (entry.sleepScore && entry.sleepScore >= 85) {
          highScoreStreak++;
        } else {
          break;
        }
      }

      const daysLogged = entries.length;
      const daysWithOura = entries.filter(e => e.source === 'oura').length;
      const daysWithManual = entries.filter(e => e.source === 'manual').length;

      return {
        avgSleepScore,
        avgReadinessScore,
        highScoreStreak,
        daysLogged,
        daysWithOura,
        daysWithManual,
        entries,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}
