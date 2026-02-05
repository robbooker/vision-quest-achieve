import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type DepthLevel = 'off' | 'brief' | 'full';

export interface BriefingLabPreferences {
  id: string;
  user_id: string;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  voice_id: string;
  max_duration_minutes: number;
  // Legacy boolean toggles (for non-news categories)
  include_short_scout: boolean;
  include_weather: boolean;
  include_calendar: boolean;
  include_intention: boolean;
  // Depth levels for news categories
  sports_depth: DepthLevel;
  tech_depth: DepthLevel;
  business_depth: DepthLevel;
  trading_depth: DepthLevel;
  politics_depth: DepthLevel;
  books_depth: DepthLevel;
  film_tv_depth: DepthLevel;
  music_depth: DepthLevel;
  gaming_depth: DepthLevel;
  science_depth: DepthLevel;
  health_depth: DepthLevel;
  // Topic details
  sports_teams: string | null;
  tech_topics: string | null;
  business_topics: string | null;
  politics_topics: string | null;
  books_topics: string | null;
  music_topics: string | null;
  gaming_topics: string | null;
  science_topics: string | null;
  health_topics: string | null;
  custom_topics: string | null;
  created_at: string;
  updated_at: string;
}

export interface BriefingLabEpisode {
  id: string;
  user_id: string;
  generated_at: string;
  podcast_url: string | null;
  script: string | null;
  duration_seconds: number | null;
  categories_used: string[];
  status: 'generating' | 'ready' | 'failed';
  error_message: string | null;
  created_at: string;
}

export function useBriefingLabPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['briefing-lab-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_lab_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as BriefingLabPreferences | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateBriefingLabPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (prefs: Partial<BriefingLabPreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('briefing_lab_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('briefing_lab_preferences')
          .update({ ...prefs, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('briefing_lab_preferences')
          .insert({ user_id: user.id, ...prefs });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing-lab-preferences'] });
      toast({ title: 'Preferences saved' });
    },
    onError: (error) => {
      toast({ title: 'Error saving preferences', description: error.message, variant: 'destructive' });
    }
  });
}

export function useGenerateLabBriefing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/briefing-lab-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({})
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate briefing');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing-lab-episodes'] });
      toast({ title: 'Briefing generated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to generate briefing', description: error.message, variant: 'destructive' });
    }
  });
}

export function useBriefingLabEpisodes(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['briefing-lab-episodes', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefing_lab_episodes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as BriefingLabEpisode[];
    },
    enabled: !!user?.id,
  });
}

export function useSendBriefingSms() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (podcastUrl: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get user's phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_us')
        .eq('user_id', user.id)
        .single();

      if (!profile?.phone_us) {
        throw new Error('No phone number configured. Please add your phone number in Settings.');
      }

      // Use dedicated briefing SMS endpoint
      const { data, error } = await supabase.functions.invoke('send-briefing-sms', {
        body: { podcast_url: podcastUrl }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send SMS');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send SMS');
      }

      return data;
    },
    onSuccess: () => {
      toast({ title: 'SMS sent!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to send SMS', description: error.message, variant: 'destructive' });
    }
  });
}
