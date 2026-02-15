import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityEmbeddings } from '@/hooks/useActivityEmbeddings';
import { format } from 'date-fns';

interface Reminder {
  id: string;
  user_id: string;
  reminder_text: string;
  reminder_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useReminders(date?: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedReminder } = useActivityEmbeddings();

  const dateStr = date ? format(date, 'yyyy-MM-dd') : undefined;

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', user?.id, dateStr],
    queryFn: async () => {
      let query = supabase
        .from('reminders')
        .select('*')
        .order('reminder_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (dateStr) {
        query = query.eq('reminder_date', dateStr);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Reminder[];
    },
    enabled: !!user,
  });

  const createReminder = useMutation({
    mutationFn: async ({ text, date }: { text: string; date: string }) => {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: user!.id,
          reminder_text: text,
          reminder_date: date,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Reminder;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      // Generate embedding
      try {
        await embedReminder({
          id: data.id,
          reminder_text: data.reminder_text,
          reminder_date: data.reminder_date,
        });
      } catch (e) {
        console.error('Failed to embed reminder:', e);
      }
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('reminders')
        .update({ completed })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  return {
    reminders,
    isLoading,
    createReminder,
    toggleComplete,
    deleteReminder,
  };
}
