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
  position: number;
  created_at: string;
  updated_at: string;
  goal_id: string | null;
  goal_title?: string | null;
  due_date: string | null;
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
        .select(`
          *,
          goals ( title )
        `)
        .order('position', { ascending: true });
      
      if (error) throw error;
      
      // Map the nested goal data to a flat structure
      return data.map((task) => {
        const { goals, ...rest } = task as { goals?: { title: string } | null } & Omit<QuickTask, 'goal_title'>;
        return {
          ...rest,
          goal_title: goals?.title || null,
        };
      }) as QuickTask[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (task: { title: string; category: 'personal' | 'business'; goal_id?: string | null }) => {
      if (!user) throw new Error('Not authenticated');
      
      // New tasks go to position 0 (top of list)
      const { data, error } = await supabase
        .from('quick_tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          category: task.category,
          position: 0,
          goal_id: task.goal_id || null,
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
    mutationFn: async (update: { id: string; title?: string; category?: 'personal' | 'business'; completed?: boolean; position?: number; goal_id?: string | null; due_date?: string | null }) => {
      const updateData: Record<string, unknown> = {};
      if (update.title !== undefined) updateData.title = update.title;
      if (update.category !== undefined) updateData.category = update.category;
      if (update.position !== undefined) updateData.position = update.position;
      if (update.goal_id !== undefined) updateData.goal_id = update.goal_id;
      if (update.due_date !== undefined) updateData.due_date = update.due_date;
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

  const reorderTasks = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      // Update all positions in parallel
      const promises = updates.map(({ id, position }) =>
        supabase
          .from('quick_tasks')
          .update({ position })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
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

  // Get active (uncompleted) tasks sorted by position
  const activeTasks = (tasksQuery.data || [])
    .filter(t => !t.completed)
    .sort((a, b) => a.position - b.position);
  
  // Get completed tasks from last 24 hours, sorted by completion date (most recent first)
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const completedTasks = (tasksQuery.data || [])
    .filter(t => t.completed && t.completed_at && new Date(t.completed_at).getTime() > twentyFourHoursAgo)
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime());

  return {
    tasks: tasksQuery.data || [],
    activeTasks,
    completedTasks,
    isLoading: tasksQuery.isLoading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
}
