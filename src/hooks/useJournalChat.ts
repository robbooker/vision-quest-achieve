import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

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
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-chat`;

export const useJournalChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async (): Promise<JournalContext> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { recentTasks: [], pendingTasks: [], recentHabits: [], journalEntries: [], focusSessions: [] };
    }

    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    // Fetch recent completed tasks
    const { data: recentTasks } = await supabase
      .from('quick_tasks')
      .select('title, completed_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('completed_at', sevenDaysAgo)
      .order('completed_at', { ascending: false })
      .limit(20);

    // Fetch pending tasks
    const { data: pendingTasks } = await supabase
      .from('quick_tasks')
      .select('title')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('position', { ascending: true })
      .limit(10);

    // Fetch recent habit logs with tactic titles
    const { data: recentHabits } = await supabase
      .from('tactic_logs')
      .select(`
        logged_date,
        completed_count,
        goal_tactics!inner(title)
      `)
      .eq('user_id', user.id)
      .gte('logged_date', sevenDaysAgo)
      .order('logged_date', { ascending: false })
      .limit(30);

    // Transform habit data to include tactic title
    const habitsWithTitles = recentHabits?.map(h => ({
      logged_date: h.logged_date,
      completed_count: h.completed_count,
      tactic_title: (h.goal_tactics as any)?.title || 'Unknown habit'
    })) || [];

    // Fetch recent journal entries
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('entry_date, user_notes, completed_tasks')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(5);

    // Fetch recent focus sessions
    const { data: focusSessions } = await supabase
      .from('focus_sessions')
      .select('objective, actual_duration_minutes, planned_duration_minutes, status, started_at')
      .eq('user_id', user.id)
      .gte('started_at', sevenDaysAgo)
      .order('started_at', { ascending: false })
      .limit(10);

    return {
      recentTasks: recentTasks || [],
      pendingTasks: pendingTasks || [],
      recentHabits: habitsWithTitles,
      journalEntries: journalEntries || [],
      focusSessions: focusSessions || [],
    };
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Fetch fresh context
      const context = await fetchContext();

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context,
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error('Journal chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  }, [messages, fetchContext]);

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
