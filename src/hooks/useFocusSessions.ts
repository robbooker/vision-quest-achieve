import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityEmbeddings } from '@/hooks/useActivityEmbeddings';
import { startOfDay, endOfDay, subDays, format, differenceInMinutes } from 'date-fns';

export type FocusSession = {
  id: string;
  user_id: string;
  objective: string;
  linked_goal_id: string | null;
  linked_task_id: string | null;
  linked_big_ten_task_id: string | null;
  planned_duration_minutes: number;
  actual_duration_minutes: number | null;
  started_at: string;
  completed_at: string | null;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  notes: string | null;
  rating: 'bad' | 'good' | 'great' | null;
  break_duration_minutes: number | null;
  ambient_sound: string | null;
  created_at: string;
  updated_at: string;
};

type CreateSessionInput = {
  objective: string;
  planned_duration_minutes: number;
  linked_goal_id?: string | null;
  linked_task_id?: string | null;
  linked_big_ten_task_id?: string | null;
  ambient_sound?: string | null;
};

type CompleteSessionInput = {
  id: string;
  actual_duration_minutes: number;
  notes?: string | null;
  rating?: 'bad' | 'good' | 'great' | null;
};

type UpdateSessionInput = {
  id: string;
  status?: 'completed' | 'abandoned';
  rating?: 'bad' | 'good' | 'great' | null;
  notes?: string | null;
  planned_duration_minutes?: number;
};

export const useFocusSessions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedFocusSession } = useActivityEmbeddings();

  // Fetch all sessions (used for reports)
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['focus-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as FocusSession[];
    },
    enabled: !!user?.id,
  });

  // Fetch today's sessions
  const { data: todaySessions = [] } = useQuery({
    queryKey: ['focus-sessions-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date();
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', startOfDay(today).toISOString())
        .lte('started_at', endOfDay(today).toISOString())
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data as FocusSession[];
    },
    enabled: !!user?.id,
  });

  // Fetch active session
  const { data: activeSession } = useQuery({
    queryKey: ['focus-session-active', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data as FocusSession | null;
    },
    enabled: !!user?.id,
  });

  // Create new session
  const createSession = useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          objective: input.objective,
          planned_duration_minutes: input.planned_duration_minutes,
          linked_goal_id: input.linked_goal_id || null,
          linked_task_id: input.linked_task_id || null,
          linked_big_ten_task_id: input.linked_big_ten_task_id || null,
          ambient_sound: input.ambient_sound || null,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-today'] });
      queryClient.invalidateQueries({ queryKey: ['focus-session-active'] });
    },
  });

  // Complete session
  const completeSession = useMutation({
    mutationFn: async (input: CompleteSessionInput) => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          status: 'completed',
          actual_duration_minutes: input.actual_duration_minutes,
          completed_at: new Date().toISOString(),
          notes: input.notes || null,
          rating: input.rating || null,
        })
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Generate embedding for completed session
      embedFocusSession(data as FocusSession).catch(err =>
        console.log('Embedding generation failed (non-blocking):', err)
      );
      
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-today'] });
      queryClient.invalidateQueries({ queryKey: ['focus-session-active'] });
    },
  });

  // Abandon session
  const abandonSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const session = activeSession;
      const elapsedMinutes = session 
        ? differenceInMinutes(new Date(), new Date(session.started_at))
        : 0;

      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          status: 'abandoned',
          actual_duration_minutes: Math.max(1, elapsedMinutes),
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-today'] });
      queryClient.invalidateQueries({ queryKey: ['focus-session-active'] });
    },
  });

  // Update existing session
  const updateSession = useMutation({
    mutationFn: async (input: UpdateSessionInput) => {
      const updateData: Record<string, unknown> = {};
      if (input.status !== undefined) updateData.status = input.status;
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.planned_duration_minutes !== undefined) updateData.planned_duration_minutes = input.planned_duration_minutes;

      const { data, error } = await supabase
        .from('focus_sessions')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus-sessions-today'] });
      queryClient.invalidateQueries({ queryKey: ['focus-session-active'] });
    },
  });

  // Calculate stats
  const todayMinutes = todaySessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0);

  const todayCompletedCount = todaySessions.filter(s => s.status === 'completed').length;

  // Calculate streak (consecutive days with at least one completed session)
  const calculateStreak = () => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    if (completedSessions.length === 0) return 0;

    const sessionDates = new Set(
      completedSessions.map(s => format(new Date(s.started_at), 'yyyy-MM-dd'))
    );

    let streak = 0;
    let checkDate = new Date();
    
    // Check if today has a session, if not start from yesterday
    const todayStr = format(checkDate, 'yyyy-MM-dd');
    if (!sessionDates.has(todayStr)) {
      checkDate = subDays(checkDate, 1);
    }

    while (sessionDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

    return streak;
  };

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const weekAgo = subDays(new Date(), 7);
    const recentSessions = sessions.filter(
      s => s.status === 'completed' && new Date(s.started_at) >= weekAgo
    );

    const totalMinutes = recentSessions.reduce(
      (sum, s) => sum + (s.actual_duration_minutes || 0), 0
    );
    const sessionCount = recentSessions.length;
    const avgDuration = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;

    // Daily breakdown for charts
    const dailyStats: { date: string; minutes: number; sessions: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySessions = recentSessions.filter(
        s => format(new Date(s.started_at), 'yyyy-MM-dd') === dateStr
      );
      dailyStats.push({
        date: format(date, 'EEE'),
        minutes: daySessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0),
        sessions: daySessions.length,
      });
    }

    return { totalMinutes, sessionCount, avgDuration, dailyStats };
  };

  // Time of day distribution
  const getTimeOfDayStats = () => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const distribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    completedSessions.forEach(s => {
      const hour = new Date(s.started_at).getHours();
      if (hour >= 5 && hour < 12) distribution.morning += s.actual_duration_minutes || 0;
      else if (hour >= 12 && hour < 17) distribution.afternoon += s.actual_duration_minutes || 0;
      else if (hour >= 17 && hour < 21) distribution.evening += s.actual_duration_minutes || 0;
      else distribution.night += s.actual_duration_minutes || 0;
    });

    return Object.entries(distribution).map(([time, minutes]) => ({
      time: time.charAt(0).toUpperCase() + time.slice(1),
      minutes,
    }));
  };

  return {
    sessions,
    todaySessions,
    activeSession,
    isLoading,
    createSession,
    completeSession,
    abandonSession,
    updateSession,
    todayMinutes,
    todayCompletedCount,
    streak: calculateStreak(),
    weeklyStats: getWeeklyStats(),
    timeOfDayStats: getTimeOfDayStats(),
  };
};
