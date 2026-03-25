import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_by: string | null;
  assigned_to: string | null;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTeamTasks() {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("team_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading tasks", description: error.message, variant: "destructive" });
    } else {
      setTasks((data as unknown as TeamTask[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("team-tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const addTask = async (task: {
    title: string;
    description?: string;
    priority: string;
    created_by: string;
    assigned_to: string | null;
  }) => {
    const { error } = await supabase.from("team_tasks").insert({
      title: task.title,
      description: task.description || null,
      priority: task.priority,
      created_by: task.created_by,
      assigned_to: task.assigned_to,
    } as any);

    if (error) {
      toast({ title: "Failed to add task", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const completeTask = async (id: string, completedBy: string) => {
    const { error } = await supabase
      .from("team_tasks")
      .update({
        status: "done",
        completed_by: completedBy,
        completed_at: new Date().toISOString(),
      } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to complete task", description: error.message, variant: "destructive" });
    }
  };

  const reopenTask = async (id: string) => {
    const { error } = await supabase
      .from("team_tasks")
      .update({
        status: "open",
        completed_by: null,
        completed_at: null,
      } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to reopen task", description: error.message, variant: "destructive" });
    }
  };

  const updateTask = async (id: string, updates: {
    title?: string;
    description?: string | null;
    priority?: string;
    assigned_to?: string | null;
  }) => {
    const { error } = await supabase
      .from("team_tasks")
      .update(updates as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from("team_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  return { tasks, loading, addTask, completeTask, reopenTask, updateTask, deleteTask };
}
