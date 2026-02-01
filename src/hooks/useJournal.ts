import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { useActivityEmbeddings } from './useActivityEmbeddings';
export interface CompletedTask {
  id: string;
  title: string;
  category: string;
  completed_at: string;
}

export interface CompletedHabit {
  id: string;
  title: string;
  completed_count: number;
  goal_title: string;
}

export interface CompletedFocusSession {
  id: string;
  objective: string;
  actual_duration_minutes: number;
  rating: string | null;
  completed_at: string;
}

export interface UserPhoto {
  url: string;
  path: string;
  uploaded_at: string;
}

export interface AudioMetadata {
  mood?: string;
  energyLevel?: number;
  keyThemes?: string[];
  highlights?: { text: string; significance: string }[];
  suggestedPrompt?: string;
  transcribedAt?: string;
}

export interface TradingPnLData {
  pnl_amount: number;
  trade_count: number | null;
}

export interface CreatedNote {
  id: string;
  title: string;
  pillar: string | null;
}

export interface BirdSighting {
  id: string;
  species_name: string;
  location_name: string | null;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  completed_tasks: CompletedTask[];
  completed_habits: CompletedHabit[];
  completed_focus_sessions: CompletedFocusSession[];
  created_notes: CreatedNote[];
  bird_sightings: BirdSighting[];
  trading_pnl: TradingPnLData | null;
  image_url: string | null;
  image_prompt: string | null;
  user_notes: string | null;
  user_photos: UserPhoto[];
  audio_url: string | null;
  audio_transcript: string | null;
  audio_duration_seconds: number | null;
  audio_metadata: AudioMetadata | null;
  ai_daily_insight: string | null;
  created_at: string;
  updated_at: string;
}

export const useJournalEntries = (limit: number = 3) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries, isLoading, refetch } = useQuery({
    queryKey: ['journal-entries', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(entry => ({
        ...entry,
        completed_tasks: (entry.completed_tasks || []) as unknown as CompletedTask[],
        completed_habits: (entry.completed_habits || []) as unknown as CompletedHabit[],
        completed_focus_sessions: ((entry as any).completed_focus_sessions || []) as unknown as CompletedFocusSession[],
        created_notes: ((entry as any).created_notes || []) as unknown as CreatedNote[],
        bird_sightings: ((entry as any).bird_sightings || []) as unknown as BirdSighting[],
        user_photos: (entry.user_photos || []) as unknown as UserPhoto[],
        trading_pnl: (entry as any).trading_pnl || null,
      })) as JournalEntry[];
    },
    enabled: !!user?.id,
  });

  const loadMore = async (currentCount: number) => {
    queryClient.setQueryData(['journal-entries', user?.id, currentCount + 3], undefined);
    await queryClient.invalidateQueries({ 
      queryKey: ['journal-entries', user?.id] 
    });
  };

  return { entries: entries || [], isLoading, loadMore, refetch };
};

export const useCreateJournalEntry = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedJournalEntry } = useActivityEmbeddings();

  return useMutation({
    mutationFn: async (date: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Fetch completed tasks for that date
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const [tasksResult, tacticLogsResult, focusSessionsResult, tradingPnLResult, notesResult, birdSightingsResult] = await Promise.all([
        // Fetch completed tasks
        supabase
          .from('quick_tasks')
          .select('id, title, category, completed_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('completed_at', startOfDay)
          .lte('completed_at', endOfDay),

        // Fetch completed habits (tactic logs)
        supabase
          .from('tactic_logs')
          .select(`
            id,
            completed_count,
            goal_tactics!inner(title, goals!inner(title))
          `)
          .eq('user_id', user.id)
          .eq('logged_date', date)
          .gt('completed_count', 0),

        // Fetch completed focus sessions
        supabase
          .from('focus_sessions')
          .select('id, objective, actual_duration_minutes, rating, completed_at')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', startOfDay)
          .lte('completed_at', endOfDay),

        // Fetch trading P&L
        supabase
          .from('trading_pnl')
          .select('pnl_amount, trade_count')
          .eq('user_id', user.id)
          .eq('trade_date', date)
          .maybeSingle(),

        // Fetch notes created that day
        supabase
          .from('lists')
          .select('id, title, pillar')
          .eq('user_id', user.id)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay),

        // Fetch bird sightings for that day
        supabase
          .from('bird_sightings')
          .select('id, species_name, location_name')
          .eq('user_id', user.id)
          .eq('sighting_date', date),
      ]);

      const completedTasks: CompletedTask[] = (tasksResult.data || []).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        completed_at: t.completed_at || '',
      }));

      const completedHabits: CompletedHabit[] = (tacticLogsResult.data || []).map((log: any) => ({
        id: log.id,
        title: log.goal_tactics?.title || '',
        completed_count: log.completed_count,
        goal_title: log.goal_tactics?.goals?.title || '',
      }));

      const completedFocusSessions: CompletedFocusSession[] = (focusSessionsResult.data || []).map(s => ({
        id: s.id,
        objective: s.objective,
        actual_duration_minutes: s.actual_duration_minutes || 0,
        rating: s.rating,
        completed_at: s.completed_at || '',
      }));

      const createdNotes: CreatedNote[] = (notesResult.data || []).map(n => ({
        id: n.id,
        title: n.title,
        pillar: n.pillar,
      }));

      const birdSightings: BirdSighting[] = (birdSightingsResult.data || []).map(s => ({
        id: s.id,
        species_name: s.species_name,
        location_name: s.location_name,
      }));

      const tradingPnLData: TradingPnLData | null = tradingPnLResult.data ? {
        pnl_amount: Number(tradingPnLResult.data.pnl_amount),
        trade_count: tradingPnLResult.data.trade_count,
      } : null;

      // Create the journal entry
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: date,
          completed_tasks: completedTasks as unknown as any,
          completed_habits: completedHabits as unknown as any,
          completed_focus_sessions: completedFocusSessions as unknown as any,
          created_notes: createdNotes as unknown as any,
          bird_sightings: birdSightings as unknown as any,
        })
        .select()
        .single();

      if (error) throw error;
      
      const entry = {
        ...data,
        completed_tasks: completedTasks,
        completed_habits: completedHabits,
        completed_focus_sessions: completedFocusSessions,
        created_notes: createdNotes,
        bird_sightings: birdSightings,
        user_photos: [] as UserPhoto[],
        trading_pnl: tradingPnLData,
      } as JournalEntry;

      // Generate embedding for the journal entry (fire and forget)
      embedJournalEntry(entry).catch(err => 
        console.log('Embedding generation failed (non-blocking):', err)
      );

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
    onError: (error) => {
      console.error('Failed to create journal entry:', error);
      toast.error('Failed to create journal entry');
    },
  });
};

export const useUpdateJournalNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedJournalEntry } = useActivityEmbeddings();

  return useMutation({
    mutationFn: async ({ entryId, notes }: { entryId: string; notes: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .update({ user_notes: notes })
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Re-generate embedding with updated notes
      if (data) {
        const entry = {
          ...data,
          completed_tasks: data.completed_tasks || [],
          completed_habits: data.completed_habits || [],
          completed_focus_sessions: (data as any).completed_focus_sessions || [],
        };
        embedJournalEntry(entry).catch(err => 
          console.log('Embedding update failed (non-blocking):', err)
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Notes saved');
    },
    onError: (error) => {
      console.error('Failed to update notes:', error);
      toast.error('Failed to save notes');
    },
  });
};

export const useGenerateJournalImage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-journal-image', {
        body: { entryId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Image generated!');
    },
    onError: (error) => {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate image');
    },
  });
};

export const useGenerateDailyInsight = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-daily-insight', {
        body: { entryId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Insight generated!');
    },
    onError: (error) => {
      console.error('Failed to generate insight:', error);
      toast.error('Failed to generate insight');
    },
  });
};

export const useDeleteJournalImage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get the entry to find the image path
      const { data: entry } = await supabase
        .from('journal_entries')
        .select('image_url')
        .eq('id', entryId)
        .single();

      if (entry?.image_url) {
        // Extract path from URL and delete from storage
        const urlParts = entry.image_url.split('/journal-images/');
        if (urlParts[1]) {
          await supabase.storage.from('journal-images').remove([urlParts[1]]);
        }
      }

      // Update entry to remove image
      const { error } = await supabase
        .from('journal_entries')
        .update({ image_url: null, image_prompt: null })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Image deleted');
    },
    onError: (error) => {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    },
  });
};

export const useUploadJournalPhoto = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, file }: { entryId: string; file: File }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get current entry to check photo count
      const { data: entry } = await supabase
        .from('journal_entries')
        .select('user_photos')
        .eq('id', entryId)
        .single();

      const currentPhotos = (entry?.user_photos || []) as unknown as UserPhoto[];
      if (currentPhotos.length >= 2) {
        throw new Error('Maximum 2 photos allowed per entry');
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/photos/${entryId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('journal-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('journal-images')
        .getPublicUrl(fileName);

      const newPhoto: UserPhoto = {
        url: urlData.publicUrl,
        path: fileName,
        uploaded_at: new Date().toISOString(),
      };

      // Update entry with new photo
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ 
          user_photos: [...currentPhotos, newPhoto] as unknown as any
        })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return newPhoto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Photo uploaded!');
    },
    onError: (error) => {
      console.error('Failed to upload photo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    },
  });
};

export const useDeleteJournalPhoto = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, photoPath }: { entryId: string; photoPath: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('journal-images')
        .remove([photoPath]);

      if (deleteError) throw deleteError;

      // Get current entry
      const { data: entry } = await supabase
        .from('journal_entries')
        .select('user_photos')
        .eq('id', entryId)
        .single();

      const currentPhotos = (entry?.user_photos || []) as unknown as UserPhoto[];
      const updatedPhotos = currentPhotos.filter(p => p.path !== photoPath);

      // Update entry
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ user_photos: updatedPhotos as unknown as any })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Photo deleted');
    },
    onError: (error) => {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo');
    },
  });
};

export const useUpdateIntentionScore = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      entryId, 
      intentionScore,
      intentionReflection 
    }: { 
      entryId: string; 
      intentionScore?: number;
      intentionReflection?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const updates: Record<string, any> = {};
      if (intentionScore !== undefined) {
        updates.intention_score = intentionScore;
      }
      if (intentionReflection !== undefined) {
        updates.intention_reflection = intentionReflection;
      }

      const { error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
    onError: (error) => {
      console.error('Failed to update intention score:', error);
      toast.error('Failed to save intention score');
    },
  });
};

export const useCheckYesterdayEntry = () => {
  const { user } = useAuth();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['journal-entry-check', user?.id, yesterday],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', yesterday)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCheckTodayEntry = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['journal-entry-check', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useYesterdayActivity = () => {
  const { user } = useAuth();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['yesterday-activity', user?.id, yesterday],
    queryFn: async () => {
      if (!user?.id) return { hasActivity: false };

      const startOfDay = `${yesterday}T00:00:00.000Z`;
      const endOfDay = `${yesterday}T23:59:59.999Z`;

      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay)
        .limit(1);

      const { data: habits } = await supabase
        .from('tactic_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('logged_date', yesterday)
        .gt('completed_count', 0)
        .limit(1);

      const { data: focusSessions } = await supabase
        .from('focus_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay)
        .limit(1);

      return {
        hasActivity: (tasks?.length || 0) > 0 || (habits?.length || 0) > 0 || (focusSessions?.length || 0) > 0,
      };
    },
    enabled: !!user?.id,
  });
};

// Check for missing entries in the past N days (excluding today)
export const useMissingPastEntries = (daysBack: number = 3) => {
  const { user } = useAuth();
  const today = new Date();

  return useQuery({
    queryKey: ['missing-past-entries', user?.id, daysBack],
    queryFn: async () => {
      if (!user?.id) return [];

      // Generate dates for past N days (excluding today)
      const pastDates = Array.from({ length: daysBack }, (_, i) => 
        format(subDays(today, i + 1), 'yyyy-MM-dd')
      );

      // Check which dates already have entries
      const { data: existingEntries } = await supabase
        .from('journal_entries')
        .select('entry_date')
        .eq('user_id', user.id)
        .in('entry_date', pastDates);

      const existingDates = new Set((existingEntries || []).map(e => e.entry_date));
      
      // For each missing date, check if there was activity
      const missingDates = pastDates.filter(date => !existingDates.has(date));
      
      const missingWithActivity = await Promise.all(
        missingDates.map(async (date) => {
          const startOfDay = `${date}T00:00:00.000Z`;
          const endOfDay = `${date}T23:59:59.999Z`;

          const [tasks, habits, focusSessions] = await Promise.all([
            supabase
              .from('quick_tasks')
              .select('id')
              .eq('user_id', user.id)
              .eq('completed', true)
              .gte('completed_at', startOfDay)
              .lte('completed_at', endOfDay)
              .limit(1),
            supabase
              .from('tactic_logs')
              .select('id')
              .eq('user_id', user.id)
              .eq('logged_date', date)
              .gt('completed_count', 0)
              .limit(1),
            supabase
              .from('focus_sessions')
              .select('id')
              .eq('user_id', user.id)
              .eq('status', 'completed')
              .gte('completed_at', startOfDay)
              .lte('completed_at', endOfDay)
              .limit(1),
          ]);

          const hasActivity = 
            (tasks.data?.length || 0) > 0 || 
            (habits.data?.length || 0) > 0 || 
            (focusSessions.data?.length || 0) > 0;

          return { date, hasActivity };
        })
      );

      return missingWithActivity;
    },
    enabled: !!user?.id,
  });
};
