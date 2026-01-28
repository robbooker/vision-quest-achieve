import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useActivityEmbeddings } from './useActivityEmbeddings';

export type BigTenCategory = 'opportunity' | 'challenge';

export interface BigTenTask {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface BigTenProject {
  id: string;
  user_id: string;
  title: string;
  target_date: string | null;
  position: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  category: BigTenCategory | null;
  pillar: string | null;
  goal_id: string | null;
  tasks?: BigTenTask[];
  // Joined data
  goal_title?: string;
}

export function useBigTen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { embedBigTenProject } = useActivityEmbeddings();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['big-ten-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: projectsData, error: projectsError } = await supabase
        .from('big_ten_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (projectsError) throw projectsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('big_ten_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (tasksError) throw tasksError;

      // Map tasks to their projects and get goal titles
      const projectsWithTasks = await Promise.all(
        (projectsData || []).map(async (project) => {
          const proj = project as { goal_id?: string | null } & typeof project;
          let goal_title: string | undefined;
          if (proj.goal_id) {
            const { data: goal } = await supabase
              .from('goals')
              .select('title')
              .eq('id', proj.goal_id)
              .maybeSingle();
            goal_title = goal?.title;
          }

          return {
            ...project,
            tasks: (tasksData || []).filter((task) => task.project_id === project.id),
            goal_title,
          };
        })
      );

      return projectsWithTasks as BigTenProject[];
    },
    enabled: !!user?.id,
  });

  const createProject = useMutation({
    mutationFn: async ({ 
      title, 
      position, 
      category,
      pillar,
      goal_id,
    }: { 
      title: string; 
      position: number; 
      category?: BigTenCategory;
      pillar?: string;
      goal_id?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('big_ten_projects')
        .insert({
          user_id: user.id,
          title,
          position,
          category: category || null,
          pillar: pillar || null,
          goal_id: goal_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['big-ten-projects'] });
      // Generate embedding for the project
      embedBigTenProject(data).catch(console.error);
    },
    onError: (error) => {
      toast.error('Failed to create project');
      console.error(error);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({
      id,
      title,
      target_date,
      completed,
      category,
      pillar,
      goal_id,
    }: {
      id: string;
      title?: string;
      target_date?: string | null;
      completed?: boolean;
      category?: BigTenCategory | null;
      pillar?: string | null;
      goal_id?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (target_date !== undefined) updates.target_date = target_date;
      if (completed !== undefined) {
        updates.completed = completed;
        updates.completed_at = completed ? new Date().toISOString() : null;
      }
      if (category !== undefined) updates.category = category;
      if (pillar !== undefined) updates.pillar = pillar;
      if (goal_id !== undefined) updates.goal_id = goal_id;

      const { data, error } = await supabase
        .from('big_ten_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['big-ten-projects'] });
      // Update embedding for the project
      if (data) embedBigTenProject(data).catch(console.error);
    },
    onError: (error) => {
      toast.error('Failed to update project');
      console.error(error);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('big_ten_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['big-ten-projects'] });
      toast.success('Project deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete project');
      console.error(error);
    },
  });

  const createTask = useMutation({
    mutationFn: async ({
      project_id,
      title,
      position,
    }: {
      project_id: string;
      title: string;
      position: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('big_ten_tasks')
        .insert({
          user_id: user.id,
          project_id,
          title,
          position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['big-ten-projects'] });
    },
    onError: (error) => {
      toast.error('Failed to add task');
      console.error(error);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      title,
      completed,
    }: {
      id: string;
      title?: string;
      completed?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (completed !== undefined) updates.completed = completed;

      const { error } = await supabase
        .from('big_ten_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['big-ten-projects'] });
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error(error);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('big_ten_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['big-ten-projects'] });
    },
    onError: (error) => {
      toast.error('Failed to delete task');
      console.error(error);
    },
  });

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  };
}
