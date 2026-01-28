import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CalendarEventPillar {
  id: string;
  user_id: string;
  calendar_event_id: string;
  pillar: string;
  created_at: string;
  updated_at: string;
}

// Keywords for auto-detecting pillars from event titles
const PILLAR_KEYWORDS: Record<string, string[]> = {
  physical: ['gym', 'workout', 'fitness', 'walk', 'cardio', 'run', 'exercise', 'yoga', 'swim', 'bike', 'hike', 'sport'],
  mental: ['meditation', 'meditate', 'therapy', 'journal', 'mindfulness', 'breathe', 'mental health', 'counseling'],
  relations: ['dinner with', 'lunch with', 'coffee with', 'call with', 'meeting with', 'isaac', 'family', 'date night', 'hangout', 'catch up'],
  income: ['client', 'sales', 'interview', 'pitch', 'business', 'investor', 'networking', 'work'],
  excellence: ['practice', 'learn', 'study', 'course', 'training', 'skill', 'class', 'lesson'],
  direction: ['planning', 'goals', 'strategy', 'vision', 'review', 'reflect'],
};

export function detectPillarFromTitle(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  for (const [pillar, keywords] of Object.entries(PILLAR_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return pillar;
      }
    }
  }
  
  return null;
}

export function useCalendarEventPillars() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pillarsQuery = useQuery({
    queryKey: ['calendar_event_pillars', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_event_pillars')
        .select('*');
      
      if (error) throw error;
      return data as CalendarEventPillar[];
    },
    enabled: !!user,
  });

  const setPillar = useMutation({
    mutationFn: async ({ calendarEventId, pillar }: { calendarEventId: string; pillar: string | null }) => {
      if (!user) throw new Error('User not authenticated');
      
      if (!pillar) {
        // Remove pillar association
        const { error } = await supabase
          .from('calendar_event_pillars')
          .delete()
          .eq('calendar_event_id', calendarEventId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return null;
      }
      
      // Upsert pillar association
      const { data, error } = await supabase
        .from('calendar_event_pillars')
        .upsert({
          user_id: user.id,
          calendar_event_id: calendarEventId,
          pillar,
        }, {
          onConflict: 'user_id,calendar_event_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as CalendarEventPillar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_event_pillars'] });
    },
  });

  // Get pillar for a specific event (manual override takes precedence over auto-detect)
  const getPillarForEvent = (eventId: string, eventTitle: string): string | null => {
    const manualPillar = pillarsQuery.data?.find(p => p.calendar_event_id === eventId);
    if (manualPillar) return manualPillar.pillar;
    
    // Auto-detect from title
    return detectPillarFromTitle(eventTitle);
  };

  // Check if pillar was manually set or auto-detected
  const isManuallySet = (eventId: string): boolean => {
    return !!pillarsQuery.data?.find(p => p.calendar_event_id === eventId);
  };

  return {
    pillars: pillarsQuery.data ?? [],
    isLoading: pillarsQuery.isLoading,
    setPillar,
    getPillarForEvent,
    isManuallySet,
    detectPillarFromTitle,
  };
}
