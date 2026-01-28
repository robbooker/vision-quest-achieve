import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePnLHistory, usePnLStats } from '@/hooks/useTradingPnL';
import { useBirdwatching } from '@/hooks/useBirdwatching';
import { format, endOfMonth, differenceInDays } from 'date-fns';

export interface PillarBreakdown {
  pillar: string;
  focusMinutes: number;
  tasksCompleted: number;
  calendarEvents: number;
  habitLogs: number;
  percentageOfTotal: number;
}

export interface PillarAnalytics {
  breakdown: PillarBreakdown[];
  mostActivePillar: string;
  leastActivePillar: string;
}

export interface AuditData {
  tradingStats: {
    totalPnL: number;
    winRate: number;
    bestDay: { date: string; amount: number } | null;
    worstDay: { date: string; amount: number } | null;
    tradingDays: number;
    dailyData: Array<{ date: string; pnl: number; cumulative: number }>;
  };
  birdLog: {
    speciesSighted: string[];
    totalSightings: number;
    newLifeListBirds: string[];
    photoOfMonth: string | null;
  };
  habitCompletion: {
    totalLogs: number;
    streaks: Array<{ name: string; streak: number }>;
    topHabits: Array<{ name: string; completions: number }>;
  };
  focusStats: {
    totalMinutes: number;
    sessions: number;
    avgSessionLength: number;
  };
  journalHighlights: {
    entriesCount: number;
    snippets: string[];
  };
  tasksCompleted: number;
  pillarAnalytics: PillarAnalytics;
}

// Check if month can be audited
export function canGenerateAudit(month: string): { canGenerate: boolean; reason?: string; daysUntilAvailable?: number } {
  const [year, monthNum] = month.split('-').map(Number);
  const monthEnd = endOfMonth(new Date(year, monthNum - 1));
  const now = new Date();
  
  if (now <= monthEnd) {
    const daysLeft = differenceInDays(monthEnd, now) + 1;
    return { 
      canGenerate: false, 
      reason: `${daysLeft} days until ${format(new Date(year, monthNum - 1), 'MMMM')} ends`,
      daysUntilAvailable: daysLeft,
    };
  }
  return { canGenerate: true };
}

export function useMonthlyAuditData(month: string = '2025-01') {
  const { user } = useAuth();
  const { data: pnlHistory = [] } = usePnLHistory('ytd');
  const pnlStats = usePnLStats('ytd');
  const { sightings, lifeList, allPhotos, stats: birdStats } = useBirdwatching();

  // Parse month string
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = format(new Date(year, monthNum - 1, 1), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(year, monthNum - 1)), 'yyyy-MM-dd');

  // Fetch habit data for the month
  const { data: habitData } = useQuery({
    queryKey: ['audit-habits', user?.id, month],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: logs, error } = await supabase
        .from('tactic_logs')
        .select('*, goal_tactics(title)')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate);
      
      if (error) throw error;
      
      // Group by tactic and count
      const tacticCounts: Record<string, number> = {};
      logs?.forEach(log => {
        const title = (log.goal_tactics as any)?.title || 'Unknown';
        tacticCounts[title] = (tacticCounts[title] || 0) + log.completed_count;
      });
      
      return {
        totalLogs: logs?.length || 0,
        topHabits: Object.entries(tacticCounts)
          .map(([name, completions]) => ({ name, completions }))
          .sort((a, b) => b.completions - a.completions)
          .slice(0, 5),
      };
    },
    enabled: !!user,
  });

  // Fetch focus data for the month
  const { data: focusData } = useQuery({
    queryKey: ['audit-focus', user?.id, month],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('actual_duration_minutes')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('started_at', `${startDate}T00:00:00Z`)
        .lte('started_at', `${endDate}T23:59:59Z`);
      
      if (error) throw error;
      
      const totalMinutes = data?.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) || 0;
      const sessions = data?.length || 0;
      
      return {
        totalMinutes,
        sessions,
        avgSessionLength: sessions > 0 ? Math.round(totalMinutes / sessions) : 0,
      };
    },
    enabled: !!user,
  });

  // Fetch journal data for the month
  const { data: journalData } = useQuery({
    queryKey: ['audit-journal', user?.id, month],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('user_notes, ai_daily_insight')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);
      
      if (error) throw error;
      
      const snippets = data
        ?.filter(e => e.user_notes || e.ai_daily_insight)
        .slice(0, 3)
        .map(e => e.user_notes || e.ai_daily_insight || '')
        .filter(s => s.length > 20);
      
      return {
        entriesCount: data?.length || 0,
        snippets: snippets || [],
      };
    },
    enabled: !!user,
  });

  // Fetch tasks completed for the month
  const { data: tasksData } = useQuery({
    queryKey: ['audit-tasks', user?.id, month],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('quick_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', `${startDate}T00:00:00Z`)
        .lte('completed_at', `${endDate}T23:59:59Z`);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Filter P&L data for the month
  const monthPnL = pnlHistory.filter(p => {
    const date = new Date(p.trade_date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  // Calculate cumulative P&L
  let cumulative = 0;
  const dailyData = monthPnL.map(p => {
    cumulative += Number(p.pnl_amount);
    return {
      date: format(new Date(p.trade_date), 'MMM d'),
      pnl: Number(p.pnl_amount),
      cumulative,
    };
  });

  // Filter bird sightings for the month
  const monthSightings = sightings.filter(s => {
    const date = new Date(s.sighting_date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  // Get unique species for the month
  const monthSpecies = [...new Set(monthSightings.map(s => s.species_name))];
  
  // Find photo of the month (first photo from month's sightings)
  const monthPhotos = allPhotos.filter(p => {
    const sighting = sightings.find(s => s.id === p.sighting_id);
    if (!sighting) return false;
    const date = new Date(sighting.sighting_date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  const auditData: AuditData = {
    tradingStats: {
      totalPnL: monthPnL.reduce((sum, p) => sum + Number(p.pnl_amount), 0),
      winRate: monthPnL.length > 0 
        ? Math.round((monthPnL.filter(p => Number(p.pnl_amount) > 0).length / monthPnL.length) * 100)
        : 0,
      bestDay: pnlStats.bestDay,
      worstDay: pnlStats.worstDay,
      tradingDays: monthPnL.length,
      dailyData,
    },
    birdLog: {
      speciesSighted: monthSpecies,
      totalSightings: monthSightings.length,
      newLifeListBirds: monthSpecies.filter(species => {
        const allSpeciesSightings = sightings.filter(s => s.species_name === species);
        const firstSighting = allSpeciesSightings[allSpeciesSightings.length - 1];
        return firstSighting && new Date(firstSighting.sighting_date) >= new Date(startDate);
      }),
      photoOfMonth: monthPhotos[0]?.photo_url || null,
    },
    habitCompletion: {
      totalLogs: habitData?.totalLogs || 0,
      streaks: [],
      topHabits: habitData?.topHabits || [],
    },
    focusStats: focusData || { totalMinutes: 0, sessions: 0, avgSessionLength: 0 },
    journalHighlights: journalData || { entriesCount: 0, snippets: [] },
    tasksCompleted: tasksData || 0,
    pillarAnalytics: {
      breakdown: [],
      mostActivePillar: 'none',
      leastActivePillar: 'none',
    },
  };

  const { canGenerate, reason, daysUntilAvailable } = canGenerateAudit(month);

  return {
    data: auditData,
    isLoading: !habitData || !focusData || !journalData,
    month: format(new Date(year, monthNum - 1), 'MMMM yyyy'),
    canGenerate,
    reason,
    daysUntilAvailable,
  };
}

// Alias for backward compatibility
export const useJanuaryAuditData = useMonthlyAuditData;
