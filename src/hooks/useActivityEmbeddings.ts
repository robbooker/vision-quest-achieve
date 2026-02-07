import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type SourceType = 
  | "journal_entry" 
  | "quick_task" 
  | "habit_log" 
  | "focus_session"
  | "goal"
  | "week_review"
  | "vision"
  | "big_ten_project"
  | "reset_audit"
  | "bird_sighting"
  | "voice_call_log"
  | "audio_journal"
  | "audio_journal_chunk"
  | "monthly_intention"
  | "chat_conversation";

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

  // Helper to format goal for embedding
  const embedGoal = useCallback(async (goal: {
    id: string;
    title: string;
    why?: string | null;
    goal_type: string;
    implementation_intention?: string | null;
    habit_direction?: string | null;
    habit_cue?: string | null;
    habit_new_routine?: string | null;
    habit_reward?: string | null;
    // WOOP fields
    outcome_visualization?: string | null;
    primary_obstacle?: string | null;
    created_at: string;
  }) => {
    const parts = [`Goal: "${goal.title}"`];
    parts.push(`Type: ${goal.goal_type}`);
    
    if (goal.why) {
      parts.push(`Why: ${goal.why}`);
    }
    if (goal.implementation_intention) {
      parts.push(`Implementation intention: ${goal.implementation_intention}`);
    }
    // Habit fields
    if (goal.habit_direction) {
      parts.push(`Habit direction: ${goal.habit_direction}`);
    }
    if (goal.habit_cue) {
      parts.push(`Cue: ${goal.habit_cue}`);
    }
    if (goal.habit_new_routine) {
      parts.push(`New routine: ${goal.habit_new_routine}`);
    }
    if (goal.habit_reward) {
      parts.push(`Reward: ${goal.habit_reward}`);
    }
    // WOOP fields
    if (goal.outcome_visualization) {
      parts.push(`Best outcome visualization: ${goal.outcome_visualization}`);
    }
    if (goal.primary_obstacle) {
      parts.push(`Internal obstacle: ${goal.primary_obstacle}`);
    }

    const activityDate = format(new Date(goal.created_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "goal",
      sourceId: goal.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        goalType: goal.goal_type,
        hasWhy: !!goal.why,
        isWoop: goal.goal_type === 'woop',
      },
    });
  }, [generateEmbedding]);

  // Helper to format week review for embedding
  const embedWeekReview = useCallback(async (review: {
    id: string;
    week_number: number;
    execution_score?: number | null;
    wins?: string | null;
    lessons?: string | null;
    next_focus?: string | null;
    celebration?: string | null;
    created_at: string;
  }) => {
    const parts = [`Week ${review.week_number} Review`];
    
    if (review.execution_score !== null && review.execution_score !== undefined) {
      parts.push(`Execution score: ${review.execution_score}%`);
    }
    if (review.wins) {
      parts.push(`Wins: ${review.wins}`);
    }
    if (review.lessons) {
      parts.push(`Lessons: ${review.lessons}`);
    }
    if (review.next_focus) {
      parts.push(`Next focus: ${review.next_focus}`);
    }
    if (review.celebration) {
      parts.push(`Celebration: ${review.celebration}`);
    }

    const activityDate = format(new Date(review.created_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "week_review",
      sourceId: review.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        weekNumber: review.week_number,
        executionScore: review.execution_score,
      },
    });
  }, [generateEmbedding]);

  // Helper to format vision for embedding
  const embedVision = useCallback(async (vision: {
    id: string;
    vision_3_year?: string | null;
    vision_long_term?: string | null;
    core_values?: string | null;
    updated_at: string;
  }) => {
    const parts: string[] = ["Personal Vision Statement"];
    
    if (vision.vision_3_year) {
      parts.push(`3-Year Vision: ${vision.vision_3_year}`);
    }
    if (vision.vision_long_term) {
      parts.push(`Long-term Vision (5-10 years): ${vision.vision_long_term}`);
    }
    if (vision.core_values) {
      parts.push(`Core Values: ${vision.core_values}`);
    }

    const activityDate = format(new Date(vision.updated_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "vision",
      sourceId: vision.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        hasVision3Year: !!vision.vision_3_year,
        hasLongTermVision: !!vision.vision_long_term,
        hasCoreValues: !!vision.core_values,
      },
    });
  }, [generateEmbedding]);

  // Helper to format Big Ten project for embedding
  const embedBigTenProject = useCallback(async (project: {
    id: string;
    title: string;
    category?: string | null;
    completed: boolean;
    completed_at?: string | null;
    target_date?: string | null;
    created_at: string;
  }) => {
    const parts = [`Big Ten Project: "${project.title}"`];
    
    if (project.category) {
      parts.push(`Category: ${project.category}`);
    }
    if (project.completed) {
      parts.push("Status: Completed");
    }
    if (project.target_date) {
      parts.push(`Target date: ${project.target_date}`);
    }

    const activityDate = project.completed_at 
      ? format(new Date(project.completed_at), "yyyy-MM-dd")
      : format(new Date(project.created_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "big_ten_project",
      sourceId: project.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        category: project.category,
        completed: project.completed,
      },
    });
  }, [generateEmbedding]);

  // Helper to format reset audit for embedding
  const embedResetAudit = useCallback(async (audit: {
    id: string;
    audit_date: string;
    post_op_note?: string | null;
    rule_wake: boolean;
    rule_move: boolean;
    rule_fuel: boolean;
    rule_work: boolean;
    rule_read: boolean;
    rule_reset: boolean;
    rule_sleep: boolean;
    rule_input: boolean;
  }) => {
    // Only embed if there's a note
    if (!audit.post_op_note) {
      return { success: true, skipped: true };
    }

    const completedRules: string[] = [];
    if (audit.rule_wake) completedRules.push("Wake");
    if (audit.rule_move) completedRules.push("Move");
    if (audit.rule_fuel) completedRules.push("Fuel");
    if (audit.rule_work) completedRules.push("Work");
    if (audit.rule_read) completedRules.push("Read");
    if (audit.rule_reset) completedRules.push("Reset");
    if (audit.rule_sleep) completedRules.push("Sleep");
    if (audit.rule_input) completedRules.push("Input");

    const parts = [`Reset Audit for ${audit.audit_date}`];
    parts.push(`Score: ${completedRules.length}/8`);
    if (completedRules.length > 0) {
      parts.push(`Completed: ${completedRules.join(", ")}`);
    }
    parts.push(`Post-op note: ${audit.post_op_note}`);

    return generateEmbedding({
      sourceType: "reset_audit",
      sourceId: audit.id,
      contentText: parts.join(" "),
      activityDate: audit.audit_date,
      metadata: {
        score: completedRules.length,
        completedRules,
      },
    });
  }, [generateEmbedding]);

  // Helper to format bird sighting for embedding
  const embedBirdSighting = useCallback(async (sighting: {
    id: string;
    species_name: string;
    sighting_date: string;
    sighting_time?: string | null;
    location_name?: string | null;
    behavior_notes?: string | null;
    field_marks?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    const parts = [`Bird sighting: ${sighting.species_name}`];
    parts.push(`Date: ${sighting.sighting_date}`);
    
    if (sighting.sighting_time) {
      parts.push(`Time: ${sighting.sighting_time}`);
    }
    if (sighting.location_name) {
      parts.push(`Location: ${sighting.location_name}`);
    }
    if (sighting.behavior_notes) {
      parts.push(`Behavior: ${sighting.behavior_notes}`);
    }
    if (sighting.field_marks) {
      parts.push(`Field marks: ${sighting.field_marks}`);
    }

    return generateEmbedding({
      sourceType: "bird_sighting",
      sourceId: sighting.id,
      contentText: parts.join(". "),
      activityDate: sighting.sighting_date,
      metadata: {
        species: sighting.species_name,
        location: sighting.location_name,
        hasCoordinates: !!(sighting.latitude && sighting.longitude),
      },
    });
  }, [generateEmbedding]);

  // Helper to format voice call log for embedding
  const embedVoiceCallLog = useCallback(async (log: {
    id: string;
    user_id: string;
    call_sid: string;
    messages?: { role: string; content: string }[] | null;
    tasks_created?: { title: string }[] | null;
    tasks_completed?: { title: string }[] | null;
    created_at: string;
  }) => {
    const parts: string[] = [`Voice call on ${format(new Date(log.created_at), "MMM d, yyyy")}.`];
    
    // Extract user messages
    const userMessages = (log.messages || [])
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .filter(Boolean);
    
    if (userMessages.length > 0) {
      parts.push(`User requested: ${userMessages.join(". ")}`);
    }
    
    // Add tasks created/completed
    if (log.tasks_created && log.tasks_created.length > 0) {
      parts.push(`Tasks created: ${log.tasks_created.map(t => t.title).join(", ")}`);
    }
    if (log.tasks_completed && log.tasks_completed.length > 0) {
      parts.push(`Habits/tasks completed: ${log.tasks_completed.map(t => t.title).join(", ")}`);
    }

    const activityDate = format(new Date(log.created_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "voice_call_log",
      sourceId: log.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        callSid: log.call_sid,
        messageCount: log.messages?.length || 0,
        tasksCreated: log.tasks_created?.length || 0,
        tasksCompleted: log.tasks_completed?.length || 0,
      },
    });
  }, [generateEmbedding]);

  // Helper to format audio journal recording for embedding
  const embedAudioJournal = useCallback(async (recording: {
    id: string;
    audio_transcript?: string | null;
    audio_metadata?: {
      mood?: string;
      energyLevel?: number;
      keyThemes?: string[];
    } | null;
    created_at: string;
  }) => {
    if (!recording.audio_transcript) {
      return { success: true, skipped: true };
    }

    const metadata = recording.audio_metadata || {};
    const parts: string[] = [`Voice journal from ${format(new Date(recording.created_at), "MMM d, yyyy")}.`];
    
    if (metadata.mood) {
      parts.push(`Mood: ${metadata.mood}`);
    }
    if (metadata.energyLevel) {
      parts.push(`Energy level: ${metadata.energyLevel}/10`);
    }
    if (metadata.keyThemes && metadata.keyThemes.length > 0) {
      parts.push(`Key themes: ${metadata.keyThemes.join(", ")}`);
    }
    parts.push(`Transcript: ${recording.audio_transcript}`);

    const activityDate = format(new Date(recording.created_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "audio_journal",
      sourceId: recording.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        mood: metadata.mood,
        energyLevel: metadata.energyLevel,
        keyThemes: metadata.keyThemes,
      },
    });
  }, [generateEmbedding]);

  // Helper to format monthly intention for embedding
  const embedMonthlyIntention = useCallback(async (intention: {
    id: string;
    intention_word: string;
    intention_description?: string | null;
    month_year: string;
    created_at: string;
  }) => {
    const parts: string[] = [`Monthly intention for ${intention.month_year}: "${intention.intention_word}".`];
    
    if (intention.intention_description) {
      parts.push(`Description: ${intention.intention_description}`);
    }

    return generateEmbedding({
      sourceType: "monthly_intention",
      sourceId: intention.id,
      contentText: parts.join(" "),
      activityDate: intention.created_at.split('T')[0],
      metadata: {
        word: intention.intention_word,
        monthYear: intention.month_year,
      },
    });
  }, [generateEmbedding]);

  // Helper to format chat conversation for embedding
  const embedChatConversation = useCallback(async (conversation: {
    id: string;
    title: string;
    messages: { role: string; content: string }[];
    created_at: string;
  }) => {
    // Extract key content from the conversation
    const userMessages = conversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .slice(0, 5); // First 5 user messages for context
    
    const parts: string[] = [`Chat conversation: "${conversation.title}".`];
    if (userMessages.length > 0) {
      parts.push(`Topics discussed: ${userMessages.join(" | ")}`);
    }

    const activityDate = format(new Date(conversation.created_at), "yyyy-MM-dd");

    return generateEmbedding({
      sourceType: "chat_conversation",
      sourceId: conversation.id,
      contentText: parts.join(" "),
      activityDate,
      metadata: {
        title: conversation.title,
        messageCount: conversation.messages.length,
      },
    });
  }, [generateEmbedding]);

  return {
    generateEmbedding,
    embedJournalEntry,
    embedQuickTask,
    embedHabitLog,
    embedFocusSession,
    embedGoal,
    embedWeekReview,
    embedVision,
    embedBigTenProject,
    embedResetAudit,
    embedBirdSighting,
    embedVoiceCallLog,
    embedAudioJournal,
    embedMonthlyIntention,
    embedChatConversation,
  };
}
