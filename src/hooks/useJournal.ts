import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

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

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  completed_tasks: CompletedTask[];
  completed_habits: CompletedHabit[];
  image_url: string | null;
  image_prompt: string | null;
  user_notes: string | null;
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

  return useMutation({
    mutationFn: async (date: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Fetch completed tasks for that date
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('id, title, category, completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay);

      // Fetch completed habits (tactic logs) for that date
      const { data: tacticLogs } = await supabase
        .from('tactic_logs')
        .select(`
          id,
          completed_count,
          goal_tactics!inner(title, goals!inner(title))
        `)
        .eq('user_id', user.id)
        .eq('logged_date', date)
        .gt('completed_count', 0);

      const completedTasks: CompletedTask[] = (tasks || []).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        completed_at: t.completed_at || '',
      }));

      const completedHabits: CompletedHabit[] = (tacticLogs || []).map((log: any) => ({
        id: log.id,
        title: log.goal_tactics?.title || '',
        completed_count: log.completed_count,
        goal_title: log.goal_tactics?.goals?.title || '',
      }));

      // Create the journal entry
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: date,
          completed_tasks: completedTasks as unknown as any,
          completed_habits: completedHabits as unknown as any,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        completed_tasks: completedTasks,
        completed_habits: completedHabits,
      } as JournalEntry;
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

  return useMutation({
    mutationFn: async ({ entryId, notes }: { entryId: string; notes: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('journal_entries')
        .update({ user_notes: notes })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
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

      return {
        hasActivity: (tasks?.length || 0) > 0 || (habits?.length || 0) > 0,
        date: yesterday,
      };
    },
    enabled: !!user?.id,
  });
};
