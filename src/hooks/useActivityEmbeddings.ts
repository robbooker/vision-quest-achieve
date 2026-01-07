import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type SourceType = "journal_entry" | "quick_task" | "habit_log" | "focus_session";

interface EmbeddingData {
  sourceType: SourceType;
  sourceId: string;
  contentText: string;
  activityDate: string;
  metadata?: Record<string, unknown>;
}

export function useActivityEmbeddings() {
  const generateEmbedding = useCallback(async (data: EmbeddingData) => {
    try {
      // Skip empty content
      if (!data.contentText || data.contentText.trim().length < 10) {
        console.log("Skipping embedding for short/empty content");
        return { success: true, skipped: true };
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        console.log("No auth session, skipping embedding generation");
        return { success: false, error: "Not authenticated" };
      }

      const response = await supabase.functions.invoke("generate-embedding", {
        body: {
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          contentText: data.contentText,
          activityDate: data.activityDate,
          metadata: data.metadata,
        },
      });

      if (response.error) {
        console.error("Embedding generation error:", response.error);
        return { success: false, error: response.error.message };
      }

      console.log("Embedding generated for", data.sourceType, data.sourceId);
      return { success: true };
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }, []);

  // Helper to format journal entry for embedding
  const embedJournalEntry = useCallback(async (entry: {
    id: string;
    entry_date: string;
    user_notes?: string | null;
    completed_tasks?: unknown;
    completed_habits?: unknown;
    completed_focus_sessions?: unknown;
  }) => {
    const parts: string[] = [`Journal entry for ${entry.entry_date}.`];
    
    if (entry.user_notes) {
      parts.push(`Notes: ${entry.user_notes}`);
    }
    
    // Add completed tasks
    if (entry.completed_tasks && Array.isArray(entry.completed_tasks)) {
      const taskTitles = entry.completed_tasks
        .map((t: any) => t.title || t)
        .filter(Boolean)
        .join(", ");
      if (taskTitles) {
        parts.push(`Completed tasks: ${taskTitles}`);
      }
    }
    
    // Add completed habits
    if (entry.completed_habits && Array.isArray(entry.completed_habits)) {
      const habitNames = entry.completed_habits
        .map((h: any) => h.title || h.name || h)
        .filter(Boolean)
        .join(", ");
      if (habitNames) {
        parts.push(`Completed habits: ${habitNames}`);
      }
    }
    
    // Add focus sessions
    if (entry.completed_focus_sessions && Array.isArray(entry.completed_focus_sessions)) {
      const sessions = entry.completed_focus_sessions
        .map((s: any) => `${s.objective || "Focus session"} (${s.duration || s.actual_duration_minutes || "?"}min)`)
        .join(", ");
      if (sessions) {
        parts.push(`Focus sessions: ${sessions}`);
      }
    }

    return generateEmbedding({
      sourceType: "journal_entry",
      sourceId: entry.id,
      contentText: parts.join(" "),
      activityDate: entry.entry_date,
      metadata: {
        hasNotes: !!entry.user_notes,
        taskCount: Array.isArray(entry.completed_tasks) ? entry.completed_tasks.length : 0,
        habitCount: Array.isArray(entry.completed_habits) ? entry.completed_habits.length : 0,
      },
    });
  }, [generateEmbedding]);

  // Helper to format quick task for embedding
  const embedQuickTask = useCallback(async (task: {
    id: string;
    title: string;
    category: string;
    completed: boolean;
    completed_at?: string | null;
  }) => {
    if (!task.completed || !task.completed_at) {
      return { success: true, skipped: true };
    }

    const contentText = `Completed task: "${task.title}" in category ${task.category}.`;
    const activityDate = format(new Date(task.completed_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "quick_task",
      sourceId: task.id,
      contentText,
      activityDate,
      metadata: {
        category: task.category,
      },
    });
  }, [generateEmbedding]);

  // Helper to format habit log for embedding
  const embedHabitLog = useCallback(async (log: {
    id: string;
    tactic_id: string;
    logged_date: string;
    completed_count: number;
    notes?: string | null;
  }, tacticTitle: string) => {
    const parts = [`Habit completed: "${tacticTitle}"`];
    if (log.completed_count > 1) {
      parts.push(`(${log.completed_count}x)`);
    }
    if (log.notes) {
      parts.push(`Notes: ${log.notes}`);
    }

    return generateEmbedding({
      sourceType: "habit_log",
      sourceId: log.id,
      contentText: parts.join(" "),
      activityDate: log.logged_date,
      metadata: {
        tacticId: log.tactic_id,
        tacticTitle,
        completedCount: log.completed_count,
      },
    });
  }, [generateEmbedding]);

  // Helper to format focus session for embedding
  const embedFocusSession = useCallback(async (session: {
    id: string;
    objective: string;
    status: string;
    started_at: string;
    actual_duration_minutes?: number | null;
    notes?: string | null;
    rating?: string | null;
  }) => {
    if (session.status !== "completed") {
      return { success: true, skipped: true };
    }

    const parts = [`Focus session: "${session.objective}"`];
    if (session.actual_duration_minutes) {
      parts.push(`Duration: ${session.actual_duration_minutes} minutes.`);
    }
    if (session.rating) {
      parts.push(`Rating: ${session.rating}.`);
    }
    if (session.notes) {
      parts.push(`Notes: ${session.notes}`);
    }

    const activityDate = format(new Date(session.started_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "focus_session",
      sourceId: session.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        durationMinutes: session.actual_duration_minutes,
        rating: session.rating,
      },
    });
  }, [generateEmbedding]);

  return {
    generateEmbedding,
    embedJournalEntry,
    embedQuickTask,
    embedHabitLog,
    embedFocusSession,
  };
}
