import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PillarStatus {
  name: string;
  level: number;
  isFoundation: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entryId } = await req.json();
    if (!entryId) {
      return new Response(JSON.stringify({ error: "Entry ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the journal entry
    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();

    if (entryError || !entry) {
      console.error("Entry fetch error:", entryError);
      return new Response(JSON.stringify({ error: "Entry not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's current PRIMED assessment
    const { data: assessment } = await supabase
      .from("primed_assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("assessed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch active goals with their pillars
    const { data: goals } = await supabase
      .from("goals")
      .select("id, title, pillar")
      .eq("user_id", user.id)
      .not("pillar", "is", null);

    // Fetch quick tasks with their pillars for that day
    const startOfDay = `${entry.entry_date}T00:00:00.000Z`;
    const endOfDay = `${entry.entry_date}T23:59:59.999Z`;
    
    const { data: tasksWithPillar } = await supabase
      .from("quick_tasks")
      .select("id, title, pillar, completed_at")
      .eq("user_id", user.id)
      .eq("completed", true)
      .not("pillar", "is", null)
      .gte("completed_at", startOfDay)
      .lte("completed_at", endOfDay);

    // Fetch focus sessions with their pillars for that day
    const { data: focusWithPillar } = await supabase
      .from("focus_sessions")
      .select("id, objective, pillar, actual_duration_minutes, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("pillar", "is", null)
      .gte("completed_at", startOfDay)
      .lte("completed_at", endOfDay);

    // Build pillar status from assessment
    const pillarStatus: PillarStatus[] = assessment ? [
      { name: "Physical", level: assessment.physical_level, isFoundation: true },
      { name: "Relations", level: assessment.relations_level, isFoundation: true },
      { name: "Income", level: assessment.income_level, isFoundation: false },
      { name: "Mental", level: assessment.mental_level, isFoundation: true },
      { name: "Excellence", level: assessment.excellence_level, isFoundation: false },
      { name: "Direction", level: assessment.direction_level, isFoundation: false },
    ] : [];

    // Get activities from entry
    const tasks = (entry.completed_tasks as any[]) || [];
    const habits = (entry.completed_habits as any[]) || [];
    const focusSessions = (entry.completed_focus_sessions as any[]) || [];

    const totalActivities = tasks.length + habits.length + focusSessions.length;

    if (totalActivities === 0) {
      // No activities to analyze
      const { error: updateError } = await supabase
        .from("journal_entries")
        .update({ ai_daily_insight: null })
        .eq("id", entryId)
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ 
        success: true, 
        insight: null,
        reason: "No activities to analyze"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for AI
    const activitiesWithPillars: string[] = [];
    
    // Add tasks with pillars
    (tasksWithPillar || []).forEach((t) => {
      activitiesWithPillars.push(`Task: "${t.title}" (${t.pillar} pillar)`);
    });
    
    // Add regular tasks without pillars
    tasks.forEach((t) => {
      const hasPillarTask = (tasksWithPillar || []).some((pt) => pt.id === t.id);
      if (!hasPillarTask) {
        activitiesWithPillars.push(`Task: "${t.title}" (untagged)`);
      }
    });
    
    // Add habits (connected to goals which have pillars)
    habits.forEach((h) => {
      const goal = goals?.find((g) => g.title === h.goal_title);
      const pillar = goal?.pillar || "untagged";
      activitiesWithPillars.push(`Habit: "${h.title}" × ${h.completed_count} (${pillar} pillar, goal: ${h.goal_title})`);
    });
    
    // Add focus sessions with pillars
    (focusWithPillar || []).forEach((s) => {
      activitiesWithPillars.push(`Focus: "${s.objective}" for ${s.actual_duration_minutes} min (${s.pillar} pillar)`);
    });
    
    // Add regular focus sessions without pillars
    focusSessions.forEach((s) => {
      const hasPillarSession = (focusWithPillar || []).some((ps) => ps.id === s.id);
      if (!hasPillarSession) {
        activitiesWithPillars.push(`Focus: "${s.objective}" for ${s.actual_duration_minutes} min (untagged)`);
      }
    });

    // Build goals context
    const activeGoals = (goals || []).map((g) => `- ${g.title} (${g.pillar})`).join("\n");

    // Build prompt - Strategic performance coach style
    const prompt = `Act as a high-level performance coach and strategist. Analyze the user's journal and habit data for ${entry.entry_date}.

${assessment ? `USER'S CURRENT PILLAR STATUS:
${pillarStatus.map((p) => `- ${p.name}: Level ${p.level}${p.isFoundation ? " (foundation pillar)" : ""}`).join("\n")}` : "No PRIMED assessment completed yet."}

TODAY'S ACTIVITIES:
${activitiesWithPillars.join("\n") || "No activities logged"}

${activeGoals ? `ACTIVE GOALS BY PILLAR:\n${activeGoals}` : ""}

Provide a brief analysis in this exact structure:

**The Audit:** Briefly highlight the strongest pillar of the day with a 'Why it mattered' insight.

**The Divergence:** Identify the pillar that was most neglected and hypothesize one small 'frictionless' way to address it tomorrow.

**The Mental Model:** Connect today's effort to a concept (e.g., Stoic 'Amor Fati', Munger's 'Inversion', or 'Compounding Interest').

TONE: Be intelligent, slightly witty, and direct. Use declarative, insightful sentences. Never say "It's wonderful to see..." or "I wonder if...". No filler phrases.

Keep the response concise - 3-4 sentences per section maximum.`;

    console.log("Generating daily insight...");

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate insight" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const insight = aiData.choices?.[0]?.message?.content?.trim();

    if (!insight) {
      console.error("No insight in AI response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "No insight generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generated insight:", insight.slice(0, 100) + "...");

    // Update journal entry with insight
    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({ ai_daily_insight: insight })
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save insight" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      insight 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Generate daily insight error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
