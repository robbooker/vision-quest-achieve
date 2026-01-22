import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface TaskAction {
  id: string;
  title: string;
  created_at?: string;
  completed_at?: string;
}

export interface VoiceCallLog {
  id: string;
  user_id: string;
  call_sid: string;
  caller_number: string | null;
  call_started_at: string;
  call_ended_at: string | null;
  messages: ConversationMessage[];
  tasks_created: TaskAction[];
  tasks_completed: TaskAction[];
  created_at: string;
  updated_at: string;
}

export function useVoiceCallLogs() {
  const { user } = useAuth();

  const { data: callLogs, isLoading, error, refetch } = useQuery({
    queryKey: ['voice-call-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('voice_call_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('call_started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Type assertion since Supabase types may not be updated yet
      return (data || []) as unknown as VoiceCallLog[];
    },
    enabled: !!user?.id,
  });

  const deleteCallLog = async (id: string) => {
    const { error } = await supabase
      .from('voice_call_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    refetch();
  };

  return {
    callLogs: callLogs || [],
    isLoading,
    error,
    refetch,
    deleteCallLog
  };
}
