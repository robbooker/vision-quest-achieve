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

    // Fetch Oura biometric data for the journal date
    const { data: ouraMetrics } = await supabase
      .from("oura_daily_metrics")
      .select("*")
      .eq("user_id", user.id)
      .eq("metric_date", entry.entry_date)
      .maybeSingle();

    // Fetch pending task count for workload comparison
    const { data: pendingTasks } = await supabase
      .from("quick_tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", false);
    
    const pendingTaskCount = pendingTasks?.length || 0;

    // Fetch nutrition data for the journal date
    const { data: nutritionEntries } = await supabase
      .from("daily_nutrition")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", entry.entry_date);

    // Calculate nutrition totals
    const nutritionTotals = (nutritionEntries || []).reduce(
      (acc: any, entry: any) => ({
        calories: acc.calories + (entry.calories || 0),
        protein_g: acc.protein_g + (entry.protein_g || 0),
        carbs_g: acc.carbs_g + (entry.carbs_g || 0),
        fats_g: acc.fats_g + (entry.fats_g || 0),
        sugar_g: acc.sugar_g + (entry.sugar_g || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sugar_g: 0 }
    );

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

    // Build biometric context for Strategic Auditor
    let biometricContext = "";
    let strategicWarnings: string[] = [];

    if (ouraMetrics) {
      const readinessTier = (ouraMetrics.readiness_score ?? 0) >= 85 ? "Optimal" : 
                            (ouraMetrics.readiness_score ?? 0) >= 70 ? "Good" : "Pay Attention";
      
      const sleepHours = ouraMetrics.total_sleep_seconds 
        ? Math.floor(ouraMetrics.total_sleep_seconds / 3600) + "h " + 
          Math.floor((ouraMetrics.total_sleep_seconds % 3600) / 60) + "m"
        : "Unknown";

      biometricContext = `
**BIOMETRIC PERFORMANCE DATA (from ${ouraMetrics.source === 'oura' ? 'Oura Ring' : 'Manual Entry'}):**
- Readiness Score: ${ouraMetrics.readiness_score ?? 'N/A'}/100 (${readinessTier})
- Resilience Level: ${ouraMetrics.resilience_level ? ouraMetrics.resilience_level.charAt(0).toUpperCase() + ouraMetrics.resilience_level.slice(1) : 'N/A'}
- HRV Balance: ${ouraMetrics.hrv_balance ?? 'N/A'}/100${ouraMetrics.hrv_strain_alert ? ' (LOW - Strain Alert)' : ''}
- Resting Heart Rate: ${ouraMetrics.resting_heart_rate ?? 'N/A'} bpm${ouraMetrics.rhr_spike_alert ? ` (+${(ouraMetrics.resting_heart_rate ?? 0) - (ouraMetrics.rhr_baseline_14d ?? 0)} above baseline - ELEVATED)` : ''}
- Last Night's Sleep: ${sleepHours} (Score: ${ouraMetrics.sleep_score ?? 'N/A'})
${ouraMetrics.critical_deficit_alert ? '- 🔴 CRITICAL RECOVERY DEFICIT ACTIVE' : ''}
${ouraMetrics.hrv_strain_alert && !ouraMetrics.critical_deficit_alert ? '- ⚠️ Nervous System Strain Alert' : ''}
${ouraMetrics.rhr_spike_alert && !ouraMetrics.critical_deficit_alert ? '- ⚠️ Elevated RHR Alert' : ''}`;

      // Calculate strategic warnings based on the logic map
      if ((ouraMetrics.readiness_score ?? 100) < 75 && pendingTaskCount > 5) {
        strategicWarnings.push("**⚠️ Productivity Friction:** Your biological readiness doesn't match your task load. Consider deferring complex work.");
      }

      if (ouraMetrics.hrv_balance && ouraMetrics.hrv_balance < 70) {
        strategicWarnings.push("**⚠️ Trading Alpha Warning:** Emotional regulation and risk patience may be lowered. Stick to mechanical exits.");
      }

      if ((ouraMetrics.readiness_score ?? 0) >= 85) {
        strategicWarnings.push("**💪 High Operating Leverage:** Today is optimal for complex coding or high-conviction deep dives.");
      }

      if (ouraMetrics.resilience_level === 'limited') {
        strategicWarnings.push("**🛡️ Conservation Mode:** Long-term recovery buffer is depleted. Focus on recovery activities.");
      }

      if (ouraMetrics.critical_deficit_alert) {
        strategicWarnings.push("**🔴 CRITICAL RECOVERY DEFICIT:** Your nervous system is under significant strain. Consider this a forced rest day for high-stakes decisions.");
      }

      // Nutrition-based warnings with Oura integration
      const activeCalories = 350; // Approximate from Oura activity - could be enhanced later
      
      // Low Protein + High Activity Warning
      if (nutritionTotals.protein_g < 100 && activeCalories > 400) {
        strategicWarnings.push(
          `**🥩 Recovery Gap:** High activity (${activeCalories} cal burned) with only ${Math.round(nutritionTotals.protein_g)}g protein. Prioritize a protein-rich meal to support muscle recovery.`
        );
      }

      // High Carbs + Low Readiness Warning (Cognitive Slump)
      if (nutritionTotals.carbs_g > 200 && (ouraMetrics.readiness_score ?? 100) < 70) {
        strategicWarnings.push(
          `**⚠️ Cognitive Slump Risk:** High carb intake (${Math.round(nutritionTotals.carbs_g)}g) combined with low readiness (${ouraMetrics.readiness_score}). Afternoon brain fog likely—consider lighter carbs and strategic caffeine timing.`
        );
      }

      // High Sugar + Low Readiness (Compounded Fatigue)
      if (nutritionTotals.sugar_g > 50 && (ouraMetrics.readiness_score ?? 100) < 75) {
        strategicWarnings.push(
          `**🍬 Compounded Fatigue:** High sugar (${Math.round(nutritionTotals.sugar_g)}g) + low recovery creates blood sugar volatility. Energy crashes likely—stick to mechanical trading decisions.`
        );
      }

      // Net Fuel status
      if (nutritionTotals.calories > 0) {
        const netFuel = nutritionTotals.calories - activeCalories;
        if (netFuel > 500) {
          strategicWarnings.push(
            `**📊 Fuel Surplus:** +${netFuel} net calories. Good for recovery days; watch accumulation on consecutive rest days.`
          );
        } else if (netFuel < -300) {
          strategicWarnings.push(
            `**📊 Fuel Deficit:** ${netFuel} net calories. Sustainable for fat loss if protein stays high (${Math.round(nutritionTotals.protein_g)}g today).`
          );
        }
      }
    }

    // Build nutrition context for AI prompt
    let nutritionContext = "";
    if (nutritionTotals.calories > 0) {
      nutritionContext = `
**NUTRITION DATA:**
- Calories Consumed: ${nutritionTotals.calories} kcal
- Protein: ${Math.round(nutritionTotals.protein_g)}g
- Carbs: ${Math.round(nutritionTotals.carbs_g)}g
- Fats: ${Math.round(nutritionTotals.fats_g)}g
- Sugar: ${Math.round(nutritionTotals.sugar_g)}g`;
    }

    const workloadContext = `
**TODAY'S WORKLOAD:**
- Pending Tasks: ${pendingTaskCount}
- Completed Activities: ${totalActivities}`;

    // Build prompt - Strategic performance coach style with biometric awareness
    const prompt = `Act as a high-level performance coach and strategist. Analyze the user's journal and habit data for ${entry.entry_date}.

${assessment ? `USER'S CURRENT PILLAR STATUS:
${pillarStatus.map((p) => `- ${p.name}: Level ${p.level}${p.isFoundation ? " (foundation pillar)" : ""}`).join("\n")}` : "No PRIMED assessment completed yet."}
${biometricContext}
${nutritionContext}
${workloadContext}

TODAY'S ACTIVITIES:
${activitiesWithPillars.join("\n") || "No activities logged"}

${activeGoals ? `ACTIVE GOALS BY PILLAR:\n${activeGoals}` : ""}

${strategicWarnings.length > 0 ? `**STRATEGIC ALERTS TO ADDRESS:**\n${strategicWarnings.join("\n")}` : ""}

Provide a brief analysis in this exact structure:

${strategicWarnings.length > 0 ? `**The Strategic Alert:** Lead with the most important biometric warning above. If there's a Productivity Friction or Critical Deficit, address it first with specific advice.\n\n` : ''}**The Audit:** Briefly highlight the strongest pillar of the day with a 'Why it mattered' insight.

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
