import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  status: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

interface UserPreferences {
  work_start_hour: number;
  work_end_hour: number;
  min_task_block_minutes: number;
  buffer_minutes: number;
  timezone: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  work_start_hour: 9,
  work_end_hour: 17,
  min_task_block_minutes: 30,
  buffer_minutes: 15,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function useCalendarConnection() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check connection status
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    const checkConnection = async () => {
      const { data, error } = await supabase
        .from('user_calendar_tokens')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsConnected(!!data && !error);
      setIsLoading(false);
    };

    checkConnection();
  }, [user]);

  // Handle OAuth callback params
  useEffect(() => {
    const url = new URL(window.location.href);
    const calendarConnected = url.searchParams.get('calendar_connected');
    const calendarError = url.searchParams.get('calendar_error');

    if (calendarConnected === 'true') {
      setIsConnected(true);
      toast({
        title: 'Calendar Connected',
        description: 'Your Google Calendar has been connected successfully.',
      });
      // Clean up URL
      url.searchParams.delete('calendar_connected');
      window.history.replaceState({}, '', url.toString());
    } else if (calendarError) {
      toast({
        title: 'Calendar Connection Failed',
        description: `Error: ${calendarError}`,
        variant: 'destructive',
      });
      // Clean up URL
      url.searchParams.delete('calendar_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [toast]);

  const connect = useCallback(async () => {
    if (!session?.access_token) {
      toast({
        title: 'Not Authenticated',
        description: 'Please sign in to connect your calendar.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { redirectUri: window.location.origin + '/dashboard' },
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error) {
      console.error('Failed to initiate calendar auth:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to start calendar connection. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  }, [session, toast]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      toast({
        title: 'Calendar Disconnected',
        description: 'Your Google Calendar has been disconnected.',
      });
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect calendar. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  return {
    isConnected,
    isLoading,
    isConnecting,
    connect,
    disconnect,
  };
}

export function useCalendarEvents(timeMin: string, timeMax: string) {
  const { session } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!session?.access_token || !timeMin || !timeMax) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('google-calendar-events', {
        body: { timeMin, timeMax },
      });

      if (fnError) throw fnError;

      if (data?.code === 'NOT_CONNECTED' || data?.code === 'RECONNECT_REQUIRED') {
        setError(data.code);
        setEvents([]);
      } else if (data?.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      setError('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [session, timeMin, timeMax]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && !error) {
        setPreferences({
          work_start_hour: data.work_start_hour,
          work_end_hour: data.work_end_hour,
          min_task_block_minutes: data.min_task_block_minutes,
          buffer_minutes: data.buffer_minutes,
          timezone: data.timezone,
        });
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'Preferences Saved',
        description: 'Your calendar preferences have been updated.',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return { preferences, isLoading, updatePreferences };
}

export function useCalendarAvailability(
  events: CalendarEvent[],
  preferences: UserPreferences,
  date: Date
) {
  return useMemo(() => {
    const slots: TimeSlot[] = [];
    const dayStart = new Date(date);
    dayStart.setHours(preferences.work_start_hour, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(preferences.work_end_hour, 0, 0, 0);

    // Filter events for this day
    const dayEvents = events
      .filter(e => !e.allDay)
      .map(e => ({
        start: new Date(e.start),
        end: new Date(e.end),
      }))
      .filter(e => e.start < dayEnd && e.end > dayStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let currentStart = dayStart;

    for (const event of dayEvents) {
      const eventStart = new Date(Math.max(event.start.getTime(), dayStart.getTime()));
      const eventEnd = new Date(Math.min(event.end.getTime(), dayEnd.getTime()));

      // Add buffer before event
      const bufferedEventStart = new Date(eventStart.getTime() - preferences.buffer_minutes * 60000);

      if (bufferedEventStart > currentStart) {
        const slotDuration = (bufferedEventStart.getTime() - currentStart.getTime()) / 60000;
        if (slotDuration >= preferences.min_task_block_minutes) {
          slots.push({
            start: new Date(currentStart),
            end: bufferedEventStart,
            durationMinutes: slotDuration,
          });
        }
      }

      // Move current start to after the event (with buffer)
      currentStart = new Date(eventEnd.getTime() + preferences.buffer_minutes * 60000);
    }

    // Add remaining time after last event
    if (currentStart < dayEnd) {
      const slotDuration = (dayEnd.getTime() - currentStart.getTime()) / 60000;
      if (slotDuration >= preferences.min_task_block_minutes) {
        slots.push({
          start: new Date(currentStart),
          end: dayEnd,
          durationMinutes: slotDuration,
        });
      }
    }

    return slots;
  }, [events, preferences, date]);
}

function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const [value, setValue] = useState<T>(factory);
  
  useEffect(() => {
    setValue(factory());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  
  return value;
}
