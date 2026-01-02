import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useVision } from './useVision';
import { useGoals } from './useGoals';

export interface InterviewMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExtractedGoal {
  title: string;
  target_value: number;
  metric_type: string;
  why: string;
  milestones?: Array<{
    week_number: number;
    target_value: number;
    description: string;
  }>;
  tactics?: Array<{
    title: string;
    frequency: 'daily' | 'weekly';
    target_count: number;
  }>;
}

export type InterviewPhase = 'vision' | 'metrics' | 'motivation' | 'milestones' | 'tactics' | 'complete';

interface UseGoalInterviewOptions {
  cycleId?: string;
  onGoalExtracted?: (goal: ExtractedGoal) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const INTERVIEW_CONVERSATION_PREFIX = '[Interview]';

export interface InterviewConversation {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

export function useGoalInterview(options: UseGoalInterviewOptions = {}) {
  const { cycleId, onGoalExtracted } = options;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>('vision');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedGoal, setExtractedGoal] = useState<ExtractedGoal | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pastInterviews, setPastInterviews] = useState<InterviewConversation[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const { vision } = useVision();
  const { goals } = useGoals(cycleId);

  // Calculate phase from message count
  const calculatePhase = (messageCount: number): InterviewPhase => {
    if (messageCount >= 10) return 'complete';
    if (messageCount >= 8) return 'tactics';
    if (messageCount >= 6) return 'milestones';
    if (messageCount >= 4) return 'motivation';
    if (messageCount >= 2) return 'metrics';
    return 'vision';
  };

  // Load all interview conversations on mount
  useEffect(() => {
    const loadInterviews = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        // Get all interview conversations
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .like('title', `${INTERVIEW_CONVERSATION_PREFIX}%`)
          .order('updated_at', { ascending: false });

        if (conversations && conversations.length > 0) {
          // Get message counts for each conversation
          const interviewsWithCounts: InterviewConversation[] = await Promise.all(
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
        console.error('Failed to load interviews:', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadInterviews();
  }, [user]);

  // Load a specific interview conversation
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
      console.error('Failed to load interview:', e);
      setError('Failed to load interview');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save a message to the database
  const saveMessage = async (message: InterviewMessage, convId: string) => {
    if (!user) return;

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: convId,
      role: message.role,
      content: message.content,
    });

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId);
  };

  // Create a new interview conversation
  const createInterviewConversation = async (): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: `${INTERVIEW_CONVERSATION_PREFIX} Goal Interview`,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create interview conversation:', error);
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
      
      // Process complete lines
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
    // Start fresh without deleting old interviews
    setMessages([]);
    setPhase('vision');
    setError(null);
    setExtractedGoal(null);
    setConversationId(null);
    setIsLoading(true);

    // Create new conversation
    const newConvId = await createInterviewConversation();
    if (!newConvId) {
      setError('Failed to create interview session');
      setIsLoading(false);
      return '';
    }
    setConversationId(newConvId);

    // Add to past interviews list
    setPastInterviews(prev => [{
      id: newConvId,
      title: `${INTERVIEW_CONVERSATION_PREFIX} Goal Interview`,
      updated_at: new Date().toISOString(),
      message_count: 0,
    }, ...prev]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/goal-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Start the goal interview. Ask me what I want to accomplish.' }],
          context: buildContext(),
          phase: 'vision',
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

      const assistantMsg: InterviewMessage = { role: 'assistant', content };
      setMessages([assistantMsg]);
      
      // Save to database
      await saveMessage(assistantMsg, newConvId);

      return content;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return '';
      const msg = e instanceof Error ? e.message : 'Failed to start interview';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext, user]);

  const sendMessage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim() || !conversationId) return '';

    const userMsg: InterviewMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    // Save user message immediately
    await saveMessage(userMsg, conversationId);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/goal-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          context: buildContext(),
          phase,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const content = await readStream(response, (text) => {
        setMessages([...updatedMessages, { role: 'assistant', content: text }]);
      });

      const assistantMsg: InterviewMessage = { role: 'assistant', content };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      
      // Save assistant message
      await saveMessage(assistantMsg, conversationId);
      
      // Update phase based on message count
      setPhase(calculatePhase(finalMessages.length));

      return content;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return '';
      const msg = e instanceof Error ? e.message : 'Failed to send message';
      setError(msg);
      setMessages(messages); // Rollback
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [messages, phase, buildContext, conversationId, user]);

  // Extract goal from conversation using AI
  const extractGoal = useCallback(async (): Promise<ExtractedGoal | null> => {
    if (messages.length < 6) return null; // Need enough conversation
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract goal: ${response.status}`);
      }

      const goal = await response.json();
      setExtractedGoal(goal);
      
      if (onGoalExtracted) {
        onGoalExtracted(goal);
      }
      
      return goal;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to extract goal';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, onGoalExtracted]);

  const reset = useCallback(async () => {
    abortRef.current?.abort();
    
    // Delete the conversation from database
    if (conversationId) {
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      // Remove from past interviews list
      setPastInterviews(prev => prev.filter(p => p.id !== conversationId));
    }

    setMessages([]);
    setPhase('vision');
    setError(null);
    setExtractedGoal(null);
    setIsLoading(false);
    setConversationId(null);
  }, [conversationId]);

  const deleteInterview = useCallback(async (interviewId: string) => {
    await supabase
      .from('conversations')
      .delete()
      .eq('id', interviewId);
    
    setPastInterviews(prev => prev.filter(p => p.id !== interviewId));
    
    // If we deleted the current interview, clear state
    if (interviewId === conversationId) {
      setMessages([]);
      setPhase('vision');
      setConversationId(null);
    }
  }, [conversationId]);

  // Check if there's a resumable interview
  const hasExistingInterview = messages.length > 0 && !isLoadingHistory;

  return {
    messages,
    phase,
    isLoading,
    isLoadingHistory,
    error,
    extractedGoal,
    startInterview,
    sendMessage,
    extractGoal,
    reset,
    isComplete: phase === 'complete',
    hasExistingInterview,
    conversationId,
    pastInterviews,
    loadInterview,
    deleteInterview,
  };
}
