import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface QuickTask {
  id: string;
  user_id: string;
  title: string;
  category: 'personal' | 'business';
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useQuickTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['quick-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('quick_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QuickTask[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (task: { title: string; category: 'personal' | 'business' }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('quick_tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          category: task.category,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-tasks'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (update: { id: string; title?: string; category?: 'personal' | 'business'; completed?: boolean }) => {
      const updateData: Record<string, unknown> = {};
      if (update.title !== undefined) updateData.title = update.title;
      if (update.category !== undefined) updateData.category = update.category;
      if (update.completed !== undefined) {
        updateData.completed = update.completed;
        updateData.completed_at = update.completed ? new Date().toISOString() : null;
      }
      
      const { data, error } = await supabase
        .from('quick_tasks')
        .update(updateData)
        .eq('id', update.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quick_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-tasks'] });
    },
  });

  // Get active (uncompleted) tasks - these roll over automatically
  const activeTasks = (tasksQuery.data || []).filter(t => !t.completed);
  
  // Get completed tasks
  const completedTasks = (tasksQuery.data || []).filter(t => t.completed);

  return {
    tasks: tasksQuery.data || [],
    activeTasks,
    completedTasks,
    isLoading: tasksQuery.isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
}