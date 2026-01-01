import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TaskInstance {
  id: string;
  user_id: string;
  cycle_id: string;
  goal_id: string;
  template_id: string | null;
  title: string;
  due_week: number;
  due_date: string | null;
  duration_minutes: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  scheduled_start: string | null;
  scheduled_end: string | null;
  calendar_event_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  cycle_id: string;
  goal_id: string;
  title: string;
  due_week: number;
  due_date?: string;
  duration_minutes?: number;
  template_id?: string;
}

export interface UpdateTaskInput {
  id: string;
  status?: TaskInstance['status'];
  notes?: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  calendar_event_id?: string | null;
}

export function useTaskInstances(cycleId?: string, goalId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['task_instances', cycleId, goalId],
    queryFn: async () => {
      let query = supabase
        .from('task_instances')
        .select('*')
        .order('due_date', { ascending: true });

      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaskInstance[];
    },
    enabled: !!user && (!!cycleId || !!goalId),
  });

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from('task_instances')
        .insert({
          ...input,
          user_id: user!.id,
          status: 'pending',
          duration_minutes: input.duration_minutes || 60,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('task_instances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TaskInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_instances'] });
    },
  });

  // Get tasks for today
  const getTodaysTasks = (tasks: TaskInstance[]) => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => 
      task.due_date === today || 
      (task.scheduled_start && task.scheduled_start.startsWith(today))
    );
  };

  // Get overdue/upcoming tasks
  const getUpcomingTasks = (tasks: TaskInstance[], daysAhead: number = 3) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return tasks.filter(task => {
      if (task.status === 'completed' || task.status === 'skipped') return false;
      if (!task.due_date) return true; // Unscheduled tasks
      
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate <= futureDate;
    });
  };

  // Calculate completion stats for a week
  const getWeekStats = (tasks: TaskInstance[], weekNumber: number) => {
    const weekTasks = tasks.filter(t => t.due_week === weekNumber);
    const completed = weekTasks.filter(t => t.status === 'completed').length;
    const total = weekTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask,
    updateTask,
    deleteTask,
    getTodaysTasks,
    getUpcomingTasks,
    getWeekStats,
  };
}
