import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useVision } from './useVision';
import { useGoals } from './useGoals';

export interface WoopMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExtractedWoop {
  wish: string;
  outcome_visualization: string;
  primary_obstacle: string;
  implementation_intention: string;
}

export type WoopPhase = 'wish' | 'outcome' | 'obstacle' | 'plan' | 'complete';

interface UseWoopInterviewOptions {
  cycleId?: string;
  onWoopExtracted?: (woop: ExtractedWoop) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const WOOP_CONVERSATION_PREFIX = '[WOOP]';

export interface WoopConversation {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

export function useWoopInterview(options: UseWoopInterviewOptions = {}) {
  const { cycleId, onWoopExtracted } = options;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<WoopMessage[]>([]);
  const [phase, setPhase] = useState<WoopPhase>('wish');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedWoop, setExtractedWoop] = useState<ExtractedWoop | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pastInterviews, setPastInterviews] = useState<WoopConversation[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const { vision } = useVision();
  const { goals } = useGoals(cycleId);

  // Calculate phase from message count
  const calculatePhase = (messageCount: number): WoopPhase => {
    if (messageCount >= 8) return 'complete';
    if (messageCount >= 6) return 'plan';
    if (messageCount >= 4) return 'obstacle';
    if (messageCount >= 2) return 'outcome';
    return 'wish';
  };

  // Load all WOOP conversations on mount
  useEffect(() => {
    const loadInterviews = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .like('title', `${WOOP_CONVERSATION_PREFIX}%`)
          .order('updated_at', { ascending: false });

        if (conversations && conversations.length > 0) {
          const interviewsWithCounts: WoopConversation[] = await Promise.all(
            conversations.map(async (conv) => {
              const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id);
              
              return {
                id: conv.id,
                title: conv.title,
                updated_at: conv.updated_at,
                message_count: count || 0,
              };
            })
          );
          
          setPastInterviews(interviewsWithCounts);
        }
      } catch (e) {
        console.error('Failed to load WOOP interviews:', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadInterviews();
  }, [user]);

  // Load a specific WOOP conversation
  const loadInterview = useCallback(async (interviewId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: chatMessages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', interviewId)
        .order('created_at', { ascending: true });

      if (chatMessages && chatMessages.length > 0) {
        const loadedMessages = chatMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        setMessages(loadedMessages);
        setConversationId(interviewId);
        setPhase(calculatePhase(loadedMessages.length));
      }
    } catch (e) {
      console.error('Failed to load WOOP interview:', e);
      setError('Failed to load interview');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save a message to the database
  const saveMessage = async (message: WoopMessage, convId: string) => {
    if (!user) return;

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: convId,
      role: message.role,
      content: message.content,
    });

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId);
  };

  // Create a new WOOP conversation
  const createWoopConversation = async (): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: `${WOOP_CONVERSATION_PREFIX} WOOP Goal`,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create WOOP conversation:', error);
      return null;
    }

    return data.id;
  };

  const buildContext = useCallback(() => ({
    vision: vision?.vision_3_year || vision?.vision_long_term,
    currentGoals: goals,
  }), [vision, goals]);

  // Parse SSE stream and extract content
  const readStream = async (
    response: Response,
    onContent: (text: string) => void
  ): Promise<string> => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onContent(fullContent);
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }

    return fullContent;
  };

  const startInterview = useCallback(async () => {
    setMessages([]);
    setPhase('wish');
    setError(null);
    setExtractedWoop(null);
    setConversationId(null);
    setIsLoading(true);

    const newConvId = await createWoopConversation();
    if (!newConvId) {
      setError('Failed to create WOOP session');
      setIsLoading(false);
      return '';
    }
    setConversationId(newConvId);

    setPastInterviews(prev => [{
      id: newConvId,
      title: `${WOOP_CONVERSATION_PREFIX} WOOP Goal`,
      updated_at: new Date().toISOString(),
      message_count: 0,
    }, ...prev]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/woop-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Start the WOOP goal interview. Ask me what I want to accomplish.' }],
          context: buildContext(),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Request failed: ${response.status} - ${err}`);
      }

      const content = await readStream(response, (text) => {
        setMessages([{ role: 'assistant', content: text }]);
      });

      const assistantMsg: WoopMessage = { role: 'assistant', content };
      setMessages([assistantMsg]);
      
      await saveMessage(assistantMsg, newConvId);

      return content;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return '';
      const msg = e instanceof Error ? e.message : 'Failed to start WOOP interview';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext, user]);

  const sendMessage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim() || !conversationId) return '';

    const userMsg: WoopMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    await saveMessage(userMsg, conversationId);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/woop-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          context: buildContext(),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const content = await readStream(response, (text) => {
        setMessages([...updatedMessages, { role: 'assistant', content: text }]);
      });

      const assistantMsg: WoopMessage = { role: 'assistant', content };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      
      await saveMessage(assistantMsg, conversationId);
      setPhase(calculatePhase(finalMessages.length));

      return content;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return '';
      const msg = e instanceof Error ? e.message : 'Failed to send message';
      setError(msg);
      setMessages(messages);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [messages, buildContext, conversationId, user]);

  // Extract WOOP from conversation using AI
  const extractWoop = useCallback(async (): Promise<ExtractedWoop | null> => {
    if (messages.length < 4) return null;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-woop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract WOOP: ${response.status}`);
      }

      const woop = await response.json();
      setExtractedWoop(woop);
      
      if (onWoopExtracted) {
        onWoopExtracted(woop);
      }
      
      return woop;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to extract WOOP';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, onWoopExtracted]);

  const reset = useCallback(async () => {
    abortRef.current?.abort();
    
    if (conversationId) {
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      setPastInterviews(prev => prev.filter(p => p.id !== conversationId));
    }

    setMessages([]);
    setPhase('wish');
    setError(null);
    setExtractedWoop(null);
    setIsLoading(false);
    setConversationId(null);
  }, [conversationId]);

  const deleteInterview = useCallback(async (interviewId: string) => {
    await supabase
      .from('conversations')
      .delete()
      .eq('id', interviewId);
    
    setPastInterviews(prev => prev.filter(p => p.id !== interviewId));
    
    if (interviewId === conversationId) {
      setMessages([]);
      setPhase('wish');
      setConversationId(null);
    }
  }, [conversationId]);

  const hasExistingInterview = messages.length > 0 && !isLoadingHistory;

  return {
    messages,
    phase,
    isLoading,
    isLoadingHistory,
    error,
    extractedWoop,
    startInterview,
    sendMessage,
    extractWoop,
    reset,
    isComplete: phase === 'complete',
    hasExistingInterview,
    conversationId,
    pastInterviews,
    loadInterview,
    deleteInterview,
  };
}
