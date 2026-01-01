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

interface UseGoalInterviewReturn {
  messages: InterviewMessage[];
  phase: InterviewPhase;
  isLoading: boolean;
  error: string | null;
  extractedGoal: ExtractedGoal | null;
  startInterview: () => Promise<string | void>;
  sendMessage: (text: string) => Promise<string>;
  reset: () => void;
  isComplete: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useGoalInterview(options: UseGoalInterviewOptions = {}): UseGoalInterviewReturn {
  const { cycleId, onGoalExtracted } = options;
  
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>('vision');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedGoal, setExtractedGoal] = useState<ExtractedGoal | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { vision } = useVision();
  const { goals } = useGoals(cycleId);

  const buildContext = useCallback(() => {
    return {
      vision: vision?.vision_3_year || vision?.vision_long_term,
      currentGoals: goals,
    };
  }, [vision, goals]);

  const processStream = useCallback(async (
    response: Response,
    onChunk: (content: string) => void
  ): Promise<{ fullContent: string; newPhase?: InterviewPhase; extractedGoal?: ExtractedGoal }> => {
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('No response body reader');
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let newPhase: InterviewPhase | undefined;
    let goalData: ExtractedGoal | undefined;
    let buffer = '';

    console.log('Starting to process stream...');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream done, total content length:', fullContent.length);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content' && parsed.delta) {
                fullContent += parsed.delta;
                onChunk(fullContent);
              } else if (parsed.type === 'done') {
                console.log('Received done event, phase:', parsed.phase);
                newPhase = parsed.phase;
                goalData = parsed.extractedGoal;
              }
            } catch (e) {
              console.log('Skipping unparseable chunk:', line.substring(0, 50));
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log('Stream processing complete, content:', fullContent.substring(0, 100));
    return { fullContent, newPhase, extractedGoal: goalData };
  }, []);

  const startInterview = useCallback(async () => {
    setMessages([]);
    setPhase('vision');
    setError(null);
    setExtractedGoal(null);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      console.log('Starting interview, calling goal-interview function...');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/goal-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'I want to create a new goal for my 12 Week Year cycle.' }],
          context: buildContext(),
          phase: 'vision',
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log('Response status:', response.status, 'ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }

      let streamedContent = '';
      
      const { fullContent, newPhase } = await processStream(response, (content) => {
        streamedContent = content;
        // Use functional update to avoid stale state
        setMessages([{ role: 'assistant', content }]);
      });

      // Final update with complete content
      setMessages([{ role: 'assistant', content: fullContent || streamedContent }]);
      if (newPhase) setPhase(newPhase);
      
      console.log('Interview started, first message content length:', (fullContent || streamedContent).length);
      return fullContent || streamedContent;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const errorMsg = e instanceof Error ? e.message : 'Failed to start interview';
      console.error('startInterview error:', errorMsg);
      setError(errorMsg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext, processStream]);

  const sendMessage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return '';

    const userMessage: InterviewMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/goal-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext(),
          phase,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      // Add empty assistant message that will be updated
      setMessages([...updatedMessages, { role: 'assistant', content: '' }]);

      const { fullContent, newPhase, extractedGoal: goalData } = await processStream(response, (content) => {
        setMessages([...updatedMessages, { role: 'assistant', content }]);
      });

      setMessages([...updatedMessages, { role: 'assistant', content: fullContent }]);
      
      if (newPhase) {
        setPhase(newPhase);
      }

      if (goalData) {
        setExtractedGoal(goalData);
        if (onGoalExtracted) {
          onGoalExtracted(goalData);
        }
      }

      return fullContent;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return '';
      const errorMsg = e instanceof Error ? e.message : 'Failed to send message';
      setError(errorMsg);
      // Remove the user message if the request failed
      setMessages(messages);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [messages, phase, buildContext, onGoalExtracted, processStream]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
