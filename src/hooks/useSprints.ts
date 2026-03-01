import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SprintTemplate {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  default_tasks: any[];
  is_system: boolean;
}

export interface Sprint {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  goal: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  duration_weeks: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SprintArea {
  id: string;
  sprint_id: string;
  name: string;
  color: string | null;
  sort_order: number;
}

export interface SprintTask {
  id: string;
  sprint_id: string;
  area_of_focus_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  week: number | null;
  day_range: string | null;
  sort_order: number;
  template_task_order: number | null;
  completed_at: string | null;
}

export interface DraftArea {
  draft_id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface DraftTask {
  draft_id: string;
  title: string;
  description: string;
  week: number | null;
  day_range: string;
  sort_order: number;
  area_draft_id: string;
  template_task_order: number | null;
}

export function useSprints() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['sprint-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprint_templates')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as SprintTemplate[];
    },
    enabled: !!user,
  });

  const sprintsQuery = useQuery({
    queryKey: ['sprints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!user,
  });

  const activeSprint = sprintsQuery.data?.find(s => s.status === 'active') ?? null;

  const useSprintDetails = (sprintId: string | null) => {
    const areasQuery = useQuery({
      queryKey: ['sprint-areas', sprintId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('sprint_areas_of_focus')
          .select('*')
          .eq('sprint_id', sprintId!)
          .order('sort_order');
        if (error) throw error;
        return data as SprintArea[];
      },
      enabled: !!sprintId,
    });

    const tasksQuery = useQuery({
      queryKey: ['sprint-tasks', sprintId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('sprint_tasks')
          .select('*')
          .eq('sprint_id', sprintId!)
          .order('sort_order');
        if (error) throw error;
        return data as SprintTask[];
      },
      enabled: !!sprintId,
    });

    return { areas: areasQuery.data ?? [], tasks: tasksQuery.data ?? [], isLoading: areasQuery.isLoading || tasksQuery.isLoading };
  };

  const launchSprint = useMutation({
    mutationFn: async (params: {
      name: string;
      goal: string;
      durationWeeks: number;
      templateId: string | null;
      areas: DraftArea[];
      tasks: DraftTask[];
    }) => {
      const { data, error } = await supabase.rpc('launch_sprint', {
        p_name: params.name,
        p_goal: params.goal,
        p_duration_weeks: params.durationWeeks,
        p_template_id: params.templateId,
        p_areas: params.areas as any,
        p_tasks: params.tasks as any,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase
        .from('sprint_tasks')
        .update({ 
          status, 
          completed_at: status === 'done' ? new Date().toISOString() : null 
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const task = sprintsQuery.data?.find(s => s.status === 'active');
      if (task) {
        queryClient.invalidateQueries({ queryKey: ['sprint-tasks', task.id] });
      }
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    sprints: sprintsQuery.data ?? [],
    activeSprint,
    isLoading: sprintsQuery.isLoading,
    templatesLoading: templatesQuery.isLoading,
    useSprintDetails,
    launchSprint,
    updateTaskStatus,
  };
}
