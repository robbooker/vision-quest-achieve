import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

interface ToastCallback {
  (notification: { title: string; message: string; type: string }): void;
}

export function useSharedTasksRealtime(onToast: ToastCallback) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const onToastRef = useRef(onToast);
  
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const fetchTaskOwnerName = useCallback(async (ownerId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", ownerId)
      .single();
    return data?.display_name || data?.email || "Someone";
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen for new task shares (someone shared a task with me)
    const taskSharesChannel = supabase
      .channel("task-shares-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_shares",
          filter: `shared_with_id=eq.${user.id}`,
        },
        async (payload) => {
          const taskShare = payload.new as { task_id: string };
          
          // Get task details
          const { data: task } = await supabase
            .from("shared_tasks")
            .select("title, owner_id")
            .eq("id", taskShare.task_id)
            .single();

          if (task) {
            const ownerName = await fetchTaskOwnerName(task.owner_id);
            
            // Create notification in DB
            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "task_shared",
              title: "New shared task",
              message: `${ownerName} shared "${task.title}" with you`,
              metadata: { task_id: taskShare.task_id },
            });

            // Show toast
            onToastRef.current({
              title: "New shared task",
              message: `${ownerName} shared "${task.title}" with you`,
              type: "task_shared",
            });
          }

          queryClient.invalidateQueries({ queryKey: ["shared-tasks"] });
        }
      )
      .subscribe();

    // Listen for shared task completions
    const sharedTasksChannel = supabase
      .channel("shared-tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shared_tasks",
        },
        async (payload) => {
          const oldTask = payload.old as { completed: boolean; id: string };
          const newTask = payload.new as { completed: boolean; id: string; title: string; owner_id: string };
          
          // Only notify on completion change
          if (!oldTask.completed && newTask.completed) {
            // Check if this task is shared with me or I own it
            const { data: shares } = await supabase
              .from("task_shares")
              .select("shared_with_id")
              .eq("task_id", newTask.id);

            const isSharedWithMe = shares?.some((s) => s.shared_with_id === user.id);
            const isOwner = newTask.owner_id === user.id;

            if (isSharedWithMe || isOwner) {
              // Don't notify yourself
              const completedByName = await fetchTaskOwnerName(newTask.owner_id);
              
              if (newTask.owner_id !== user.id) {
                await supabase.from("notifications").insert({
                  user_id: user.id,
                  type: "task_completed",
                  title: "Task completed",
                  message: `${completedByName} completed "${newTask.title}"`,
                  metadata: { task_id: newTask.id },
                });

                onToastRef.current({
                  title: "Task completed!",
                  message: `${completedByName} completed "${newTask.title}"`,
                  type: "task_completed",
                });
              }
            }
          }

          queryClient.invalidateQueries({ queryKey: ["shared-tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskSharesChannel);
      supabase.removeChannel(sharedTasksChannel);
    };
  }, [user, queryClient, fetchTaskOwnerName]);
}
