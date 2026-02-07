import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type ArenaRole = 'claude' | 'gemini' | 'host';

export interface ArenaMessage {
  id: string;
  role: ArenaRole;
  content: string;
  timestamp: Date;
}

export interface ArenaConversation {
  id: string;
  topic: string;
  transcript: ArenaMessage[];
  turn_count: number;
  status: 'active' | 'paused' | 'completed';
  rating?: number;
  created_at: string;
  updated_at: string;
}

async function fetchFullContext(userId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    goalsResult,
    cyclesResult,
    tasksResult,
    focusResult,
    journalResult,
    visionResult,
    tradingResult,
    habitsResult,
    sleepResult,
    primedResult,
  ] = await Promise.all([
    supabase.from('goals').select('*, milestones(*)').eq('user_id', userId),
    supabase.from('cycles').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle(),
    supabase.from('quick_tasks').select('*').eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(100),
    supabase.from('focus_sessions').select('*').eq('user_id', userId).gte('started_at', thirtyDaysAgo.toISOString()).order('started_at', { ascending: false }).limit(50),
    supabase.from('journal_entries').select('*').eq('user_id', userId).gte('entry_date', thirtyDaysAgo.toISOString()).order('entry_date', { ascending: false }).limit(30),
    supabase.from('user_vision').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('trading_pnl').select('*').eq('user_id', userId).gte('trade_date', thirtyDaysAgo.toISOString()).order('trade_date', { ascending: false }).limit(30),
    supabase.from('tactic_logs').select('*, goal_tactics(title)').eq('user_id', userId).gte('logged_date', thirtyDaysAgo.toISOString()).order('logged_date', { ascending: false }).limit(100),
    supabase.from('oura_daily_metrics').select('*').eq('user_id', userId).gte('metric_date', thirtyDaysAgo.toISOString()).order('metric_date', { ascending: false }).limit(30),
    supabase.from('primed_assessments').select('*, primed_assessment_behaviors(*)').eq('user_id', userId).order('assessed_at', { ascending: false }).limit(1),
  ]);

  let context = '';

  // Active cycle
  if (cyclesResult.data) {
    const cycle = cyclesResult.data;
    const weekNum = Math.floor((now.getTime() - new Date(cycle.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    context += `\n\n📅 ACTIVE CYCLE: "${cycle.name}" (Week ${Math.min(weekNum, 8)} of 8)\n`;
    context += `Start: ${cycle.start_date} | End: ${cycle.end_date}\n`;
  }

  // Goals with milestones
  if (goalsResult.data && goalsResult.data.length > 0) {
    context += `\n\n🎯 GOALS (${goalsResult.data.length} total):\n`;
    goalsResult.data.forEach((goal: any) => {
      context += `- "${goal.title}" | Target: ${goal.target_value} ${goal.metric_type} | Pillar: ${goal.pillar || 'none'}\n`;
      if (goal.why) context += `  Why: ${goal.why}\n`;
      if (goal.milestones?.length > 0) {
        goal.milestones.forEach((m: any) => {
          context += `  → Week ${m.week_number}: ${m.target_value}${m.description ? ` - ${m.description}` : ''}\n`;
        });
      }
    });
  }

  // Vision
  if (visionResult.data) {
    context += `\n\n🔮 VISION & VALUES:\n`;
    if (visionResult.data.vision_3_year) context += `3-Year Vision: ${visionResult.data.vision_3_year}\n`;
    if (visionResult.data.vision_long_term) context += `Long-term: ${visionResult.data.vision_long_term}\n`;
    if (visionResult.data.core_values) context += `Core Values: ${visionResult.data.core_values}\n`;
  }

  // Tasks
  if (tasksResult.data && tasksResult.data.length > 0) {
    const completed = tasksResult.data.filter((t: any) => t.completed);
    const pending = tasksResult.data.filter((t: any) => !t.completed);
    context += `\n\n✅ TASKS (30 days): ${completed.length} completed, ${pending.length} pending\n`;
    context += `Recent completed: ${completed.slice(0, 10).map((t: any) => t.title).join(', ')}\n`;
    if (pending.length > 0) {
      context += `Pending: ${pending.slice(0, 10).map((t: any) => t.title).join(', ')}\n`;
    }
  }

  // Focus sessions
  if (focusResult.data && focusResult.data.length > 0) {
    const totalMinutes = focusResult.data.reduce((sum: number, s: any) => sum + (s.actual_duration_minutes || 0), 0);
    const completedSessions = focusResult.data.filter((s: any) => s.status === 'completed');
    context += `\n\n🧘 FOCUS SESSIONS (30 days): ${completedSessions.length} sessions, ${totalMinutes} minutes total\n`;
    focusResult.data.slice(0, 10).forEach((s: any) => {
      context += `- ${s.objective} (${s.actual_duration_minutes || s.planned_duration_minutes}m, ${s.status}, pillar: ${s.pillar || 'none'})\n`;
    });
  }

  // Trading P&L
  if (tradingResult.data && tradingResult.data.length > 0) {
    const totalPnL = tradingResult.data.reduce((sum: number, p: any) => sum + Number(p.pnl_amount), 0);
    const winningDays = tradingResult.data.filter((p: any) => Number(p.pnl_amount) > 0).length;
    context += `\n\n📈 TRADING P&L (30 days): $${totalPnL.toFixed(2)} total, ${winningDays}/${tradingResult.data.length} winning days\n`;
    tradingResult.data.slice(0, 10).forEach((p: any) => {
      const amt = Number(p.pnl_amount);
      context += `${amt >= 0 ? '🟢' : '🔴'} ${p.trade_date}: $${amt.toFixed(2)}${p.notes ? ` - ${p.notes}` : ''}\n`;
    });
  }

  // Sleep/Oura
  if (sleepResult.data && sleepResult.data.length > 0) {
    context += `\n\n😴 SLEEP/BIOMETRICS (30 days):\n`;
    sleepResult.data.slice(0, 7).forEach((s: any) => {
      const sleepHours = s.total_sleep_seconds ? (s.total_sleep_seconds / 3600).toFixed(1) : 'N/A';
      context += `${s.metric_date}: Sleep ${sleepHours}h, Score ${s.sleep_score || 'N/A'}, Readiness ${s.readiness_score || 'N/A'}, HRV ${s.hrv_balance || 'N/A'}\n`;
    });
  }

  // Habits
  if (habitsResult.data && habitsResult.data.length > 0) {
    context += `\n\n🔄 HABIT LOGS (30 days): ${habitsResult.data.length} logs\n`;
    const habitsByName: Record<string, number> = {};
    habitsResult.data.forEach((h: any) => {
      const name = h.goal_tactics?.title || 'Unknown';
      habitsByName[name] = (habitsByName[name] || 0) + (h.completed_count || 1);
    });
    Object.entries(habitsByName).slice(0, 10).forEach(([name, count]) => {
      context += `- ${name}: ${count}x\n`;
    });
  }

  // Journal entries
  if (journalResult.data && journalResult.data.length > 0) {
    context += `\n\n📔 JOURNAL ENTRIES (30 days): ${journalResult.data.length} entries\n`;
    journalResult.data.slice(0, 5).forEach((j: any) => {
      context += `${j.entry_date}: `;
      if (j.user_notes) context += `"${j.user_notes.substring(0, 150)}..."`;
      if (j.intention_score) context += ` [Intention Score: ${j.intention_score}]`;
      context += '\n';
    });
  }

  // PRIMED assessment
  if (primedResult.data && primedResult.data.length > 0) {
    const assessment = primedResult.data[0];
    context += `\n\n🎯 PRIMED LEVELS (latest assessment ${assessment.assessed_at}):\n`;
    context += `Physical: ${assessment.physical_level}, Relations: ${assessment.relations_level}, Income: ${assessment.income_level}\n`;
    context += `Mental: ${assessment.mental_level}, Excellence: ${assessment.excellence_level}, Direction: ${assessment.direction_level}\n`;
  }

  return context;
}

export function useAIArena() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState<ArenaMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'claude' | 'gemini'>('claude');
  const [typingAI, setTypingAI] = useState<'claude' | 'gemini' | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [fullContext, setFullContext] = useState('');
  const [hasLoadedPastConversation, setHasLoadedPastConversation] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  // Fetch past conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['ai-arena-conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ai_arena_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Map database response to our interface
      return (data || []).map((conv) => ({
        id: conv.id,
        topic: conv.topic,
        transcript: (conv.transcript as unknown as ArenaMessage[]) || [],
        turn_count: conv.turn_count || 0,
        status: conv.status as 'active' | 'paused' | 'completed',
        rating: conv.rating ?? undefined,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      })) as ArenaConversation[];
    },
    enabled: !!user,
  });

  // Save conversation mutation
  const saveConversation = useMutation({
    mutationFn: async (params: { id?: string; topic: string; transcript: ArenaMessage[]; status: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Convert transcript to JSON-compatible format
      const transcriptJson = params.transcript.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

      const payload = {
        user_id: user.id,
        topic: params.topic,
        transcript: transcriptJson as unknown as any,
        turn_count: params.transcript.length,
        status: params.status,
        updated_at: new Date().toISOString(),
      };

      if (params.id) {
        const { data, error } = await supabase
          .from('ai_arena_conversations')
          .update(payload)
          .eq('id', params.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('ai_arena_conversations')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-arena-conversations'] });
    },
  });

  const streamFromAI = useCallback(async (turn: 'claude' | 'gemini', allMessages: ArenaMessage[], debateTopic: string, context: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-arena`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        turn,
        topic: debateTopic,
        userId: user?.id,
        fullContext: context,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stream from AI');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();
    let content = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Handle Anthropic streaming format
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            content += parsed.delta.text;
            setStreamingContent(content);
          }
          // Handle Gemini streaming format
          else if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            content += parsed.candidates[0].content.parts[0].text;
            setStreamingContent(content);
          }
          // Handle OpenAI-compatible format (just in case)
          else if (parsed.choices?.[0]?.delta?.content) {
            content += parsed.choices[0].delta.content;
            setStreamingContent(content);
          }
        } catch {
          // Ignore parse errors for partial JSON
        }
      }
    }

    return content;
  }, [user?.id]);

  const startDebate = useCallback(async (debateTopic: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    setTopic(debateTopic);
    setMessages([]);
    setIsRunning(true);
    setIsPaused(false);
    pausedRef.current = false;
    runningRef.current = true;
    setCurrentTurn('claude');
    setCurrentConversationId(null);
    setHasLoadedPastConversation(false);

    // Fetch full context
    const context = await fetchFullContext(user.id);
    setFullContext(context);

    // Start the conversation loop
    runConversationLoop('claude', [], debateTopic, context);
  }, [user, toast]);

  const runConversationLoop = useCallback(async (
    startTurn: 'claude' | 'gemini',
    startMessages: ArenaMessage[],
    debateTopic: string,
    context: string
  ) => {
    let turn = startTurn;
    let allMessages = [...startMessages];
    let conversationId: string | null = null; // Local variable to track across iterations

    while (runningRef.current) {
      if (pausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      setTypingAI(turn);
      setStreamingContent('');

      try {
        const content = await streamFromAI(turn, allMessages, debateTopic, context);
        
        if (!content || !runningRef.current) break;

        const newMessage: ArenaMessage = {
          id: crypto.randomUUID(),
          role: turn,
          content,
          timestamp: new Date(),
        };

        allMessages = [...allMessages, newMessage];
        setMessages(allMessages);
        setStreamingContent('');
        setTypingAI(null);

        // Save to database - use local variable, not state
        const savedConv = await saveConversation.mutateAsync({
          id: conversationId || undefined,
          topic: debateTopic,
          transcript: allMessages,
          status: 'active',
        });
        
        if (!conversationId) {
          conversationId = savedConv.id; // Update local variable
          setCurrentConversationId(savedConv.id); // Also update state for UI
        }

        // Switch turns
        turn = turn === 'claude' ? 'gemini' : 'claude';
        setCurrentTurn(turn);

        // 5-second pause between turns for easier interjection
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        if ((error as Error).name === 'AbortError') break;
        console.error('Stream error:', error);
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        break;
      }
    }

    setTypingAI(null);
    setIsRunning(false);
  }, [streamFromAI, saveConversation, toast]);

  const stopDebate = useCallback(async () => {
    runningRef.current = false;
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setIsPaused(false);
    setTypingAI(null);
    setStreamingContent('');

    // Mark conversation as completed
    if (currentConversationId && messages.length > 0) {
      await saveConversation.mutateAsync({
        id: currentConversationId,
        topic,
        transcript: messages,
        status: 'completed',
      });
    }
  }, [currentConversationId, messages, topic, saveConversation]);

  const pauseDebate = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resumeDebate = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
  }, []);

  const sendHostMessage = useCallback(async (content: string) => {
    if (!isRunning || !content.trim()) return;

    // Pause, add message, then resume
    pausedRef.current = true;
    
    const hostMessage: ArenaMessage = {
      id: crypto.randomUUID(),
      role: 'host',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, hostMessage]);
    
    // Wait a beat then resume
    await new Promise(resolve => setTimeout(resolve, 500));
    pausedRef.current = false;
    setIsPaused(false);
  }, [isRunning]);

  const loadConversation = useCallback((conversation: ArenaConversation) => {
    setCurrentConversationId(conversation.id);
    setTopic(conversation.topic);
    setMessages(conversation.transcript.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })));
    setIsRunning(false);
    setIsPaused(false);
    setHasLoadedPastConversation(true);
  }, []);

  // Continue a loaded/stopped conversation with a host message
  const continueConversation = useCallback(async (hostMessage: string) => {
    if (!user || !currentConversationId || !topic) {
      toast({ title: 'Error', description: 'No conversation to continue', variant: 'destructive' });
      return;
    }

    // Add host message
    const newHostMessage: ArenaMessage = {
      id: crypto.randomUUID(),
      role: 'host',
      content: hostMessage.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newHostMessage];
    setMessages(updatedMessages);
    
    // Fetch fresh context and resume
    const context = await fetchFullContext(user.id);
    setFullContext(context);
    
    setIsRunning(true);
    setIsPaused(false);
    pausedRef.current = false;
    runningRef.current = true;
    
    // Determine next turn based on last AI message
    const lastAIMessage = [...updatedMessages].reverse().find(m => m.role === 'claude' || m.role === 'gemini');
    const nextTurn: 'claude' | 'gemini' = lastAIMessage?.role === 'claude' ? 'gemini' : 'claude';
    setCurrentTurn(nextTurn);
    
    // Resume the loop
    runConversationLoop(nextTurn, updatedMessages, topic, context);
  }, [user, currentConversationId, topic, messages, toast, runConversationLoop]);

  return {
    messages,
    isRunning,
    isPaused,
    currentTurn,
    typingAI,
    streamingContent,
    topic,
    currentConversationId,
    hasLoadedPastConversation,
    conversations,
    conversationsLoading,
    startDebate,
    stopDebate,
    pauseDebate,
    resumeDebate,
    sendHostMessage,
    loadConversation,
    continueConversation,
  };
}
