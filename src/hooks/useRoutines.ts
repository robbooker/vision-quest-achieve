import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export interface RoutineItem {
  id: string;
  user_id: string;
  routine_type: 'morning' | 'evening';
  title: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineLog {
  id: string;
  user_id: string;
  routine_item_id: string;
  log_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function useRoutines() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const itemsQuery = useQuery({
    queryKey: ['routine-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as RoutineItem[];
    },
    enabled: !!user,
  });

  const logsQuery = useQuery({
    queryKey: ['routine-logs', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('log_date', today);
      if (error) throw error;
      return data as RoutineLog[];
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async ({ title, routineType }: { title: string; routineType: 'morning' | 'evening' }) => {
      const items = itemsQuery.data?.filter(i => i.routine_type === routineType) || [];
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : -1;
      const { data, error } = await supabase
        .from('routine_items')
        .insert({ title, routine_type: routineType, sort_order: maxOrder + 1, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routine-items'] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('routine_items').update({ title }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routine-items'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routine_items').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routine-items'] }),
  });

  const toggleLog = useMutation({
    mutationFn: async (routineItemId: string) => {
      const existing = logsQuery.data?.find(l => l.routine_item_id === routineItemId);
      if (existing) {
        const { error } = await supabase.from('routine_logs').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('routine_logs')
          .insert({ routine_item_id: routineItemId, log_date: today, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routine-logs', today] }),
  });

  const morningItems = (itemsQuery.data || []).filter(i => i.routine_type === 'morning');
  const eveningItems = (itemsQuery.data || []).filter(i => i.routine_type === 'evening');
  const hasRoutines = morningItems.length > 0 || eveningItems.length > 0;

  const isItemCompleted = (itemId: string) => {
    return logsQuery.data?.some(l => l.routine_item_id === itemId) ?? false;
  };

  const completionCount = (type: 'morning' | 'evening') => {
    const items = type === 'morning' ? morningItems : eveningItems;
    return items.filter(i => isItemCompleted(i.id)).length;
  };

  return {
    morningItems,
    eveningItems,
    hasRoutines,
    isLoading: itemsQuery.isLoading,
    isItemCompleted,
    completionCount,
    addItem,
    updateItem,
    deleteItem,
    toggleLog,
  };
}
