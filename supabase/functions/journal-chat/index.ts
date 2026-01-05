import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a thoughtful reflection assistant helping users understand their recent accomplishments and habits.

Your communication style:
- Warm and encouraging, celebrating wins both big and small
- Observant - you notice patterns in their activity
- Helpful with gentle suggestions, never preachy
- Specific - reference actual tasks and habits by name when available
- Brief but insightful (2-3 paragraphs max unless asked for more)

When analyzing their data:
- Highlight completed tasks and habits from recent days
- Identify streaks or consistent patterns
- Note any gaps without judgment
- Suggest connections between activities and goals
- Encourage reflection with follow-up questions

Keep responses conversational and supportive. You're here to help them reflect, not to lecture.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message from user data
    let contextMessage = "";
    
    if (context) {
      if (context.recentTasks && context.recentTasks.length > 0) {
        contextMessage += "\n\n**Recent Completed Tasks (last 7 days):**\n";
        context.recentTasks.forEach((task: any) => {
          contextMessage += `- ${task.title} (completed ${task.completed_at})\n`;
        });
      }
      
      if (context.pendingTasks && context.pendingTasks.length > 0) {
        contextMessage += "\n\n**Current Pending Tasks:**\n";
        context.pendingTasks.forEach((task: any) => {
          contextMessage += `- ${task.title}\n`;
        });
      }
      
      if (context.recentHabits && context.recentHabits.length > 0) {
        contextMessage += "\n\n**Recent Habit Activity (last 7 days):**\n";
        context.recentHabits.forEach((habit: any) => {
          contextMessage += `- ${habit.tactic_title}: ${habit.completed_count}x on ${habit.logged_date}\n`;
        });
      }
      
      if (context.journalEntries && context.journalEntries.length > 0) {
        contextMessage += "\n\n**Recent Journal Entries:**\n";
        context.journalEntries.forEach((entry: any) => {
          contextMessage += `- ${entry.entry_date}:`;
          if (entry.user_notes) {
            contextMessage += ` Notes: "${entry.user_notes}"`;
          }
          if (entry.completed_tasks && entry.completed_tasks.length > 0) {
            contextMessage += ` Tasks: ${entry.completed_tasks.map((t: any) => t.title).join(", ")}`;
          }
          contextMessage += "\n";
        });
      }
    }

    const systemContent = SYSTEM_PROMPT + (contextMessage ? `\n\n**User's Recent Activity Context:**${contextMessage}` : "");

    console.log("Journal chat - sending request with context length:", contextMessage.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Journal chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
