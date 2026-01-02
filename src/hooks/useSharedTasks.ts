import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SharedTask {
  id: string;
  owner_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  // Additional info
  is_owner: boolean;
  owner_email?: string;
  owner_name?: string;
  shared_with: string[]; // user_ids
}

export interface TaskShare {
  id: string;
  task_id: string;
  shared_with_id: string;
  created_at: string;
}

export function useSharedTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tasks owned by user
  const ownedTasksQuery = useQuery({
    queryKey: ['shared-tasks-owned', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('shared_tasks')
        .select('*')
        .eq('owner_id', user.id)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch task shares for owned tasks
  const taskSharesQuery = useQuery({
    queryKey: ['task-shares', user?.id],
    queryFn: async () => {
      if (!user || !ownedTasksQuery.data) return [];
      
      const taskIds = ownedTasksQuery.data.map(t => t.id);
      if (taskIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('task_shares')
        .select('*')
        .in('task_id', taskIds);
      
      if (error) throw error;
      return data as TaskShare[];
    },
    enabled: !!user && !!ownedTasksQuery.data,
  });

  // Fetch tasks shared with user
  const sharedWithMeQuery = useQuery({
    queryKey: ['shared-tasks-with-me', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get task IDs shared with me
      const { data: shares, error: sharesError } = await supabase
        .from('task_shares')
        .select('task_id')
        .eq('shared_with_id', user.id);
      
      if (sharesError) throw sharesError;
      if (!shares || shares.length === 0) return [];
      
      const taskIds = shares.map(s => s.task_id);
      
      const { data: tasks, error: tasksError } = await supabase
        .from('shared_tasks')
        .select('*')
        .in('id', taskIds)
        .order('position', { ascending: true });
      
      if (tasksError) throw tasksError;
      return tasks;
    },
    enabled: !!user,
  });

  // Combine and format tasks
  const allTasks: SharedTask[] = [
    // Owned tasks
    ...(ownedTasksQuery.data || []).map(task => ({
      ...task,
      is_owner: true,
      shared_with: (taskSharesQuery.data || [])
        .filter(s => s.task_id === task.id)
        .map(s => s.shared_with_id),
    })),
    // Tasks shared with me
    ...(sharedWithMeQuery.data || []).map(task => ({
      ...task,
      is_owner: false,
      shared_with: [],
    })),
  ];

  // Split into active and completed
  const activeTasks = allTasks
    .filter(t => !t.completed)
    .sort((a, b) => a.position - b.position);
  
  const completedTasks = allTasks
    .filter(t => t.completed)
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime());

  // Create shared task
  const createTask = useMutation({
    mutationFn: async (task: { title: string; sharedWith: string[] }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Create the task
      const { data: newTask, error: taskError } = await supabase
        .from('shared_tasks')
        .insert({
          owner_id: user.id,
          title: task.title,
          position: 0,
        })
        .select()
        .single();
      
      if (taskError) throw taskError;
      
      // Create shares
      if (task.sharedWith.length > 0) {
        const shares = task.sharedWith.map(friendId => ({
          task_id: newTask.id,
          shared_with_id: friendId,
        }));
        
        const { error: sharesError } = await supabase
          .from('task_shares')
          .insert(shares);
        
        if (sharesError) throw sharesError;
      }
      
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-tasks-owned'] });
      queryClient.invalidateQueries({ queryKey: ['task-shares'] });
    },
  });

  // Update task
  const updateTask = useMutation({
    mutationFn: async (update: { id: string; title?: string; completed?: boolean; position?: number }) => {
      const updateData: Record<string, unknown> = {};
      if (update.title !== undefined) updateData.title = update.title;
      if (update.position !== undefined) updateData.position = update.position;
      if (update.completed !== undefined) {
        updateData.completed = update.completed;
        updateData.completed_at = update.completed ? new Date().toISOString() : null;
      }
      
      const { data, error } = await supabase
        .from('shared_tasks')
        .update(updateData)
        .eq('id', update.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-tasks-owned'] });
      queryClient.invalidateQueries({ queryKey: ['shared-tasks-with-me'] });
    },
  });

  // Delete task (owner only)
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-tasks-owned'] });
      queryClient.invalidateQueries({ queryKey: ['task-shares'] });
    },
  });

  // Update task shares
  const updateShares = useMutation({
    mutationFn: async ({ taskId, sharedWith }: { taskId: string; sharedWith: string[] }) => {
      // Delete existing shares
      await supabase
        .from('task_shares')
        .delete()
        .eq('task_id', taskId);
      
      // Create new shares
      if (sharedWith.length > 0) {
        const shares = sharedWith.map(friendId => ({
          task_id: taskId,
          shared_with_id: friendId,
        }));
        
        const { error } = await supabase
          .from('task_shares')
          .insert(shares);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-shares'] });
    },
  });

  // Reorder tasks
  const reorderTasks = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      const promises = updates.map(({ id, position }) =>
        supabase
          .from('shared_tasks')
          .update({ position })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-tasks-owned'] });
    },
  });

  return {
    tasks: allTasks,
    activeTasks,
    completedTasks,
    isLoading: ownedTasksQuery.isLoading || sharedWithMeQuery.isLoading,
    createTask,
    updateTask,
    deleteTask,
    updateShares,
    reorderTasks,
  };
}
