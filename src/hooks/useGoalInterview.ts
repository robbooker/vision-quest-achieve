import { useState, useCallback, useRef } from 'react';
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

export function useGoalInterview(options: UseGoalInterviewOptions = {}) {
  const { cycleId, onGoalExtracted } = options;
  
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>('vision');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedGoal, setExtractedGoal] = useState<ExtractedGoal | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { vision } = useVision();
  const { goals } = useGoals(cycleId);

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
    setMessages([]);
    setPhase('vision');
    setError(null);
    setExtractedGoal(null);
    setIsLoading(true);

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

      setMessages([{ role: 'assistant', content }]);
      return content;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return '';
      const msg = e instanceof Error ? e.message : 'Failed to start interview';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  const sendMessage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return '';

    const userMsg: InterviewMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

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

      setMessages([...updatedMessages, { role: 'assistant', content }]);
      
      // Simple phase progression based on message count
      const totalMessages = updatedMessages.length + 1;
      if (totalMessages >= 10) setPhase('complete');
      else if (totalMessages >= 8) setPhase('tactics');
      else if (totalMessages >= 6) setPhase('milestones');
      else if (totalMessages >= 4) setPhase('motivation');
      else if (totalMessages >= 2) setPhase('metrics');

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
  }, [messages, phase, buildContext]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setPhase('vision');
    setError(null);
    setExtractedGoal(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    phase,
    isLoading,
    error,
    extractedGoal,
    startInterview,
    sendMessage,
    reset,
    isComplete: phase === 'complete',
  };
}
