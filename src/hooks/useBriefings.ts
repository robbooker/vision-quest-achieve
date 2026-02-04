import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BriefingPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  default_wake_time: string;
  default_topics: string[];
  timezone: string;
  evening_reminder_time: string;
  preferred_channel: 'call' | 'sms' | 'both';
  voice_id: string;
  include_calendar: boolean;
  include_email_summary: boolean;
  include_weather: boolean;
  weekend_enabled: boolean;
}

interface MorningBriefing {
  id: string;
  user_id: string;
  wake_date: string;
  wake_time: string;
  topics: string[];
  custom_instructions: string | null;
  status: 'scheduled' | 'generating' | 'ready' | 'played' | 'failed' | 'skipped';
  podcast_url: string | null;
  script: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
  generated_at: string | null;
  played_at: string | null;
}

interface BriefingHistory {
  briefings: MorningBriefing[];
  stats: {
    total_briefings: number;
    current_streak: number;
    average_wake_time: string;
    most_common_topics: string[];
  };
}

export function useBriefingPreferences() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['briefing-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as BriefingPreferences | null;
    },
    enabled: !!user?.id,
  });
}

export function useBriefingHistory(limit = 30, offset = 0) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['briefing-history', user?.id, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('briefing-history', {
        body: null,
      });
      
      if (error) throw error;
      return data as BriefingHistory;
    },
    enabled: !!user?.id,
  });
}

export function useTodaysBriefing() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['briefing-today', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('morning_briefings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('wake_date', today)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as MorningBriefing | null;
    },
    enabled: !!user?.id,
  });
}
