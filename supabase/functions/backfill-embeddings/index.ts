import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client for auth check
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let processed = { 
      journal: 0, 
      tasks: 0, 
      habits: 0, 
      focus: 0, 
      goals: 0, 
      reviews: 0, 
      vision: 0, 
      bigTen: 0, 
      resets: 0, 
      skipped: 0 
    };

    // Helper to generate embedding
    async function generateEmbedding(text: string): Promise<number[] | null> {
      if (!text || text.trim().length < 10) return null;
      
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: text.substring(0, 8000),
            model: "text-embedding-3-small",
          }),
        });

        if (!response.ok) {
          console.error("Embedding API error:", response.status);
          return null;
        }

        const result = await response.json();
        return result.data?.[0]?.embedding || null;
      } catch (e) {
        console.error("Embedding generation failed:", e);
        return null;
      }
    }

    // Helper to upsert embedding
    async function upsertEmbedding(
      sourceType: string,
      sourceId: string,
      contentText: string,
      activityDate: string,
      metadata: Record<string, unknown>
    ) {
      const embedding = await generateEmbedding(contentText);
      if (!embedding) {
        processed.skipped++;
        return;
      }

      const embeddingStr = `[${embedding.join(",")}]`;
      
      await supabase.from("activity_embeddings").upsert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        content_text: contentText,
        activity_date: activityDate,
        embedding: embeddingStr,
        metadata,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,source_type,source_id" });
    }

    // 1. Backfill journal entries
    const { data: journals } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });

    for (const entry of journals || []) {
      const parts: string[] = [];
      if (entry.user_notes) parts.push(`Journal: ${entry.user_notes}`);
      
      const tasks = entry.completed_tasks as string[] | null;
      if (tasks?.length) parts.push(`Tasks completed: ${tasks.join(", ")}`);
      
      const habits = entry.completed_habits as string[] | null;
      if (habits?.length) parts.push(`Habits: ${habits.join(", ")}`);
      
      const sessions = entry.completed_focus_sessions as string[] | null;
      if (sessions?.length) parts.push(`Focus sessions: ${sessions.join(", ")}`);

      if (parts.length > 0) {
        await upsertEmbedding(
          "journal_entry",
          entry.id,
          parts.join("\n"),
          entry.entry_date,
          { has_image: !!entry.image_url }
        );
        processed.journal++;
      }
      
      await new Promise(r => setTimeout(r, 100));
    }

    // 2. Backfill completed quick tasks
    const { data: tasks } = await supabase
      .from("quick_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", true)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    for (const task of tasks || []) {
      const content = `Completed task: ${task.title}${task.category !== "inbox" ? ` (${task.category})` : ""}`;
      const activityDate = task.completed_at?.split("T")[0] || task.created_at.split("T")[0];
      
      await upsertEmbedding(
        "quick_task",
        task.id,
        content,
        activityDate,
        { category: task.category }
      );
      processed.tasks++;
      await new Promise(r => setTimeout(r, 50));
    }

    // 3. Backfill habit/tactic logs
    const { data: tacticLogs } = await supabase
      .from("tactic_logs")
      .select("*, goal_tactics(title)")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false });

    for (const log of tacticLogs || []) {
      const tacticTitle = (log.goal_tactics as { title: string } | null)?.title || "Unknown habit";
      const parts = [`Habit completed: ${tacticTitle}`];
      if (log.completed_count > 1) parts.push(`(${log.completed_count}x)`);
      if (log.notes) parts.push(`Notes: ${log.notes}`);

      await upsertEmbedding(
        "habit_log",
        log.id,
        parts.join(" "),
        log.logged_date,
        { tactic_id: log.tactic_id, count: log.completed_count }
      );
      processed.habits++;
      await new Promise(r => setTimeout(r, 50));
    }

    // 4. Backfill completed focus sessions
    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    for (const session of sessions || []) {
      const parts = [`Focus session: ${session.objective}`];
      if (session.actual_duration_minutes) {
        parts.push(`Duration: ${session.actual_duration_minutes} minutes`);
      }
      if (session.rating) parts.push(`Rating: ${session.rating}`);
      if (session.notes) parts.push(`Notes: ${session.notes}`);

      const activityDate = session.completed_at?.split("T")[0] || session.started_at.split("T")[0];
      
      await upsertEmbedding(
        "focus_session",
        session.id,
        parts.join("\n"),
        activityDate,
        { 
          duration: session.actual_duration_minutes,
          rating: session.rating 
        }
      );
      processed.focus++;
      await new Promise(r => setTimeout(r, 50));
    }

    // 5. Backfill goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    for (const goal of goals || []) {
      const parts = [`Goal: "${goal.title}"`];
      parts.push(`Type: ${goal.goal_type}`);
      if (goal.why) parts.push(`Why: ${goal.why}`);
      if (goal.implementation_intention) parts.push(`Implementation intention: ${goal.implementation_intention}`);
      // Habit fields
      if (goal.habit_direction) parts.push(`Habit direction: ${goal.habit_direction}`);
      if (goal.habit_cue) parts.push(`Cue: ${goal.habit_cue}`);
      if (goal.habit_new_routine) parts.push(`New routine: ${goal.habit_new_routine}`);
      if (goal.habit_reward) parts.push(`Reward: ${goal.habit_reward}`);
      // WOOP fields
      if (goal.outcome_visualization) parts.push(`Best outcome visualization: ${goal.outcome_visualization}`);
      if (goal.primary_obstacle) parts.push(`Internal obstacle: ${goal.primary_obstacle}`);

      const activityDate = goal.created_at.split("T")[0];

      await upsertEmbedding(
        "goal",
        goal.id,
        parts.join(" "),
        activityDate,
        { goalType: goal.goal_type, hasWhy: !!goal.why, isWoop: goal.goal_type === 'woop' }
      );
      processed.goals++;
      await new Promise(r => setTimeout(r, 50));
    }

    // 6. Backfill week reviews
    const { data: reviews } = await supabase
      .from("week_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    for (const review of reviews || []) {
      const parts = [`Week ${review.week_number} Review`];
      if (review.execution_score !== null) parts.push(`Execution score: ${review.execution_score}%`);
      if (review.wins) parts.push(`Wins: ${review.wins}`);
      if (review.lessons) parts.push(`Lessons: ${review.lessons}`);
      if (review.next_focus) parts.push(`Next focus: ${review.next_focus}`);
      if (review.celebration) parts.push(`Celebration: ${review.celebration}`);

      const activityDate = review.created_at.split("T")[0];

      await upsertEmbedding(
        "week_review",
        review.id,
        parts.join(" "),
        activityDate,
        { weekNumber: review.week_number, executionScore: review.execution_score }
      );
      processed.reviews++;
      await new Promise(r => setTimeout(r, 50));
    }

    // 7. Backfill user vision
    const { data: vision } = await supabase
      .from("user_vision")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (vision) {
      const parts: string[] = ["Personal Vision Statement"];
      if (vision.vision_3_year) parts.push(`3-Year Vision: ${vision.vision_3_year}`);
      if (vision.vision_long_term) parts.push(`Long-term Vision (5-10 years): ${vision.vision_long_term}`);
      if (vision.core_values) parts.push(`Core Values: ${vision.core_values}`);

      if (parts.length > 1) {
        const activityDate = vision.updated_at.split("T")[0];
        await upsertEmbedding(
          "vision",
          vision.id,
          parts.join(" "),
          activityDate,
          { hasVision3Year: !!vision.vision_3_year, hasLongTermVision: !!vision.vision_long_term, hasCoreValues: !!vision.core_values }
        );
        processed.vision++;
      }
    }

    // 8. Backfill Big Ten projects
    const { data: projects } = await supabase
      .from("big_ten_projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    for (const project of projects || []) {
      const parts = [`Big Ten Project: "${project.title}"`];
      if (project.category) parts.push(`Category: ${project.category}`);
      if (project.completed) parts.push("Status: Completed");
      if (project.target_date) parts.push(`Target date: ${project.target_date}`);

      const activityDate = project.completed_at?.split("T")[0] || project.created_at.split("T")[0];

      await upsertEmbedding(
        "big_ten_project",
        project.id,
        parts.join(" "),
        activityDate,
        { category: project.category, completed: project.completed }
      );
      processed.bigTen++;
      await new Promise(r => setTimeout(r, 50));
    }

    // 9. Backfill reset audits (only those with notes)
    const { data: audits } = await supabase
      .from("reset_audits")
      .select("*")
      .eq("user_id", userId)
      .not("post_op_note", "is", null)
      .order("audit_date", { ascending: false });

    for (const audit of audits || []) {
      if (!audit.post_op_note) continue;

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
      if (completedRules.length > 0) parts.push(`Completed: ${completedRules.join(", ")}`);
      parts.push(`Post-op note: ${audit.post_op_note}`);

      await upsertEmbedding(
        "reset_audit",
        audit.id,
        parts.join(" "),
        audit.audit_date,
        { score: completedRules.length, completedRules }
      );
      processed.resets++;
      await new Promise(r => setTimeout(r, 50));
    }

    console.log(`Backfill complete for user ${userId}:`, processed);

    return new Response(JSON.stringify({ 
      success: true, 
      processed,
      message: `Generated embeddings: ${processed.journal} journal entries, ${processed.tasks} tasks, ${processed.habits} habit logs, ${processed.focus} focus sessions, ${processed.goals} goals, ${processed.reviews} week reviews, ${processed.vision} vision, ${processed.bigTen} Big Ten projects, ${processed.resets} reset audits. Skipped ${processed.skipped} items.`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
