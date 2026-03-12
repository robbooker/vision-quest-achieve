import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BigThreeTask {
  id: string;
  phase_id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BigThreePhase {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  tasks: BigThreeTask[];
}

export interface BigThreeProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  position: number;
  target_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  phases: BigThreePhase[];
}

const QUERY_KEY = ['big-three'];

export function useBigThree() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data: projectRows, error: pErr } = await supabase
        .from('big_three_projects')
        .select('*')
        .order('position');
      if (pErr) throw pErr;

      const { data: phaseRows, error: phErr } = await supabase
        .from('big_three_phases')
        .select('*')
        .order('position');
      if (phErr) throw phErr;

      const { data: taskRows, error: tErr } = await supabase
        .from('big_three_tasks')
        .select('*')
        .order('position');
      if (tErr) throw tErr;

      const tasksByPhase: Record<string, BigThreeTask[]> = {};
      for (const t of taskRows || []) {
        if (!tasksByPhase[t.phase_id]) tasksByPhase[t.phase_id] = [];
        tasksByPhase[t.phase_id].push(t as BigThreeTask);
      }

      const phasesByProject: Record<string, BigThreePhase[]> = {};
      for (const ph of phaseRows || []) {
        if (!phasesByProject[ph.project_id]) phasesByProject[ph.project_id] = [];
        phasesByProject[ph.project_id].push({
          ...(ph as any),
          tasks: tasksByPhase[ph.id] || [],
        });
      }

      return (projectRows || []).map((p: any) => ({
        ...p,
        phases: phasesByProject[p.id] || [],
      })) as BigThreeProject[];
    },
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const addProject = useMutation({
    mutationFn: async (data: { title: string; description?: string; position: number }) => {
      const { error } = await supabase.from('big_three_projects').insert({
        user_id: user!.id,
        title: data.title,
        description: data.description || null,
        position: data.position,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateProject = useMutation({
    mutationFn: async (data: { id: string; title?: string; description?: string; completed?: boolean; target_date?: string | null }) => {
      const { id, ...updates } = data;
      const { error } = await supabase.from('big_three_projects').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addPhase = useMutation({
    mutationFn: async (data: { project_id: string; title: string; description?: string; position: number }) => {
      const { error } = await supabase.from('big_three_phases').insert({
        user_id: user!.id,
        project_id: data.project_id,
        title: data.title,
        description: data.description || null,
        position: data.position,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updatePhase = useMutation({
    mutationFn: async (data: { id: string; title?: string; description?: string }) => {
      const { id, ...updates } = data;
      const { error } = await supabase.from('big_three_phases').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deletePhase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('big_three_phases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addTask = useMutation({
    mutationFn: async (data: { phase_id: string; title: string; description?: string; position: number }) => {
      const { error } = await supabase.from('big_three_tasks').insert({
        user_id: user!.id,
        phase_id: data.phase_id,
        title: data.title,
        description: data.description || null,
        position: data.position,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleTask = useMutation({
    mutationFn: async (data: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('big_three_tasks').update({
        completed: data.completed,
        completed_at: data.completed ? new Date().toISOString() : null,
      }).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: async (data: { id: string; title?: string; description?: string }) => {
      const { id, ...updates } = data;
      const { error } = await supabase.from('big_three_tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('big_three_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    addPhase,
    updatePhase,
    deletePhase,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
  };
}
