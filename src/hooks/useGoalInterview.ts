import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  startInterview: () => Promise<void>;
  sendMessage: (text: string) => Promise<string>;
  reset: () => void;
  isComplete: boolean;
}

export function useGoalInterview(options: UseGoalInterviewOptions = {}): UseGoalInterviewReturn {
  const { cycleId, onGoalExtracted } = options;
  
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>('vision');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedGoal, setExtractedGoal] = useState<ExtractedGoal | null>(null);

  const { vision } = useVision();
  const { goals } = useGoals(cycleId);

  const buildContext = useCallback(() => {
    return {
      vision: vision?.vision_3_year || vision?.vision_long_term,
      currentGoals: goals,
    };
  }, [vision, goals]);

  const startInterview = useCallback(async () => {
    setMessages([]);
    setPhase('vision');
    setError(null);
    setExtractedGoal(null);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('goal-interview', {
        body: {
          messages: [{ role: 'user', content: 'I want to create a new goal for my 12 Week Year cycle.' }],
          context: buildContext(),
          phase: 'vision',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { content, phase: newPhase } = response.data;

      setMessages([
        { role: 'assistant', content },
      ]);
      setPhase(newPhase || 'vision');
      
      return content;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to start interview';
      setError(errorMsg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  const sendMessage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return '';

    const userMessage: InterviewMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('goal-interview', {
        body: {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext(),
          phase,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { content, phase: newPhase, extractedGoal: goalData } = response.data;

      const assistantMessage: InterviewMessage = { role: 'assistant', content };
      setMessages([...updatedMessages, assistantMessage]);
      
      if (newPhase) {
        setPhase(newPhase);
      }

      if (goalData) {
        setExtractedGoal(goalData);
        if (onGoalExtracted) {
          onGoalExtracted(goalData);
        }
      }

      return content;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to send message';
      setError(errorMsg);
      // Remove the user message if the request failed
      setMessages(messages);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [messages, phase, buildContext, onGoalExtracted]);

  const reset = useCallback(() => {
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
