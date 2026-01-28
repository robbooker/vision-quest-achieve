import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';
import { useSemanticSearch } from './useSemanticSearch';
import { useQueryClient } from '@tanstack/react-query';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type JournalContext = {
  recentTasks: any[];
  pendingTasks: any[];
  recentHabits: any[];
  journalEntries: any[];
  focusSessions: any[];
  goals: any[];
  activeCycle: any;
  vision: any;
  tradingPnL: any[];
  primedProgress: any;
};

type SemanticResult = {
  sourceType: string;
  sourceId: string;
  contentText: string;
  activityDate: string;
  similarity: number;
  metadata: Record<string, unknown>;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-chat`;

export const useJournalChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { search } = useSemanticSearch();
  const queryClient = useQueryClient();

  const fetchContext = useCallback(async (): Promise<JournalContext> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { recentTasks: [], pendingTasks: [], recentHabits: [], journalEntries: [], focusSessions: [], goals: [], activeCycle: null, vision: null, tradingPnL: [], primedProgress: null };
    }

    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    // Fetch all context data in parallel
    const [
      recentTasksResult,
      pendingTasksResult,
      recentHabitsResult,
      journalEntriesResult,
      focusSessionsResult,
      goalsResult,
      activeCycleResult,
      visionResult,
      tradingPnLResult,
      // PRIMED progress queries
      focusByPillarResult,
      tasksByPillarResult,
      currentAssessmentResult
    ] = await Promise.all([
      // Fetch recent completed tasks
      supabase
        .from('quick_tasks')
        .select('title, completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', sevenDaysAgo)
        .order('completed_at', { ascending: false })
        .limit(20),
      
      // Fetch pending tasks
      supabase
        .from('quick_tasks')
        .select('title')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('position', { ascending: true })
        .limit(10),
      
      // Fetch recent habit logs with tactic titles
      supabase
        .from('tactic_logs')
        .select(`
          logged_date,
          completed_count,
          goal_tactics!inner(title)
        `)
        .eq('user_id', user.id)
        .gte('logged_date', sevenDaysAgo)
        .order('logged_date', { ascending: false })
        .limit(30),
      
      // Fetch recent journal entries
      supabase
        .from('journal_entries')
        .select('entry_date, user_notes, completed_tasks')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(5),
      
      // Fetch recent focus sessions
      supabase
        .from('focus_sessions')
        .select('objective, actual_duration_minutes, planned_duration_minutes, status, started_at, pillar')
        .eq('user_id', user.id)
        .gte('started_at', sevenDaysAgo)
        .order('started_at', { ascending: false })
        .limit(10),
      
      // Fetch goals with milestones and pillar
      supabase
        .from('goals')
        .select(`
          title, target_value, metric_type, why, goal_type, pillar,
          obstacles, strategies, vision_connection,
          milestones(week_number, target_value, description)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Fetch active cycle
      supabase
        .from('cycles')
        .select('id, name, start_date, end_date, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      
      // Fetch user vision
      supabase
        .from('user_vision')
        .select('vision_3_year, vision_long_term, core_values')
        .eq('user_id', user.id)
        .maybeSingle(),
      
      // Fetch recent trading P&L
      supabase
        .from('trading_pnl')
        .select('trade_date, pnl_amount, trade_count')
        .eq('user_id', user.id)
        .gte('trade_date', sevenDaysAgo)
        .order('trade_date', { ascending: false })
        .limit(7),
      
      // PRIMED: Focus sessions by pillar (last 30 days)
      supabase
        .from('focus_sessions')
        .select('pillar, actual_duration_minutes')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('pillar', 'is', null)
        .gte('started_at', thirtyDaysAgo),
      
      // PRIMED: Tasks by pillar (last 30 days)
      supabase
        .from('quick_tasks')
        .select('pillar, completed')
        .eq('user_id', user.id)
        .not('pillar', 'is', null)
        .gte('created_at', thirtyDaysAgo),
      
      // Current PRIMED assessment
      supabase
        .from('primed_assessments')
        .select('physical_level, relations_level, income_level, mental_level, excellence_level, direction_level')
        .eq('user_id', user.id)
        .order('assessed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // Transform habit data to include tactic title
    const habitsWithTitles = recentHabitsResult.data?.map(h => ({
      logged_date: h.logged_date,
      completed_count: h.completed_count,
      tactic_title: (h.goal_tactics as any)?.title || 'Unknown habit'
    })) || [];

    // Build PRIMED progress summary
    const pillars = ['physical', 'relations', 'income', 'mental', 'excellence', 'direction'];
    const pillarProgress: Record<string, { focusMinutes: number; tasksCompleted: number; tasksTotal: number }> = {};
    
    pillars.forEach(pillar => {
      const focusForPillar = focusByPillarResult.data?.filter(f => f.pillar === pillar) || [];
      const tasksForPillar = tasksByPillarResult.data?.filter(t => t.pillar === pillar) || [];
      
      pillarProgress[pillar] = {
        focusMinutes: focusForPillar.reduce((sum, f) => sum + (f.actual_duration_minutes || 0), 0),
        tasksCompleted: tasksForPillar.filter(t => t.completed).length,
        tasksTotal: tasksForPillar.length,
      };
    });

    const primedProgress = {
      pillarProgress,
      currentLevels: currentAssessmentResult.data || null,
      goalsPerPillar: goalsResult.data?.reduce((acc: Record<string, number>, g: any) => {
        if (g.pillar) {
          acc[g.pillar] = (acc[g.pillar] || 0) + 1;
        }
        return acc;
      }, {}) || {},
    };

    return {
      recentTasks: recentTasksResult.data || [],
      pendingTasks: pendingTasksResult.data || [],
      recentHabits: habitsWithTitles,
      journalEntries: journalEntriesResult.data || [],
      focusSessions: focusSessionsResult.data || [],
      goals: goalsResult.data || [],
      activeCycle: activeCycleResult.data || null,
      vision: visionResult.data || null,
      tradingPnL: tradingPnLResult.data || [],
      primedProgress,
    };
  }, []);

  const fetchSemanticContext = useCallback(async (query: string): Promise<SemanticResult[]> => {
    try {
      // Search for relevant historical activities
      const { results, error } = await search(query, { limit: 8 });
      if (error) {
        console.log('Semantic search error (non-blocking):', error);
        return [];
      }
      return results;
    } catch (err) {
      console.log('Semantic search failed (non-blocking):', err);
      return [];
    }
  }, [search]);

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Fetch fresh context and semantic search in parallel
      const [context, semanticContext] = await Promise.all([
        fetchContext(),
        fetchSemanticContext(userMessage),
      ]);

      console.log('Semantic context found:', semanticContext.length, 'results');

      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context,
          semanticContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      // If a task was created, refresh the task list
      if (data.taskCreated) {
        console.log('Task created via chat:', data.taskCreated);
        queryClient.invalidateQueries({ queryKey: ['quick-tasks'] });
      }

      // Add assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);

    } catch (err) {
      console.error('Journal chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [messages, fetchContext, fetchSemanticContext, queryClient]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};
