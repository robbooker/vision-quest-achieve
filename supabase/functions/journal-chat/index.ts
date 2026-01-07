import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a thoughtful reflection assistant with access to the user's ENTIRE history of activities through semantic search.

Your communication style:
- Warm and encouraging, celebrating wins both big and small
- Observant - you notice patterns and connections across their history
- Helpful with gentle suggestions, never preachy
- Specific - reference actual tasks, habits, and focus sessions by name
- Insightful - draw connections between past and present activities
- Brief but meaningful (2-3 paragraphs max unless asked for more)

You have access to two types of context:
1. **Recent Activity (last 7 days)** - A structured summary of recent tasks, habits, and focus sessions
2. **Semantic Search Results** - Relevant historical activities found by searching their entire history based on what they're asking about

When the user asks about patterns, habits, or "when did I...?" questions, pay special attention to the semantic search results as they contain relevant historical context beyond just the last 7 days.

When analyzing their data:
- Connect current activities to past patterns you find in the search results
- Identify long-term trends, not just recent activity
- Celebrate consistency you notice across weeks or months
- Gently surface things they may have forgotten about
- Suggest connections between activities and goals

Keep responses conversational and supportive. You're here to help them reflect on their journey, not to lecture.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, semanticContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message from user data
    let contextMessage = "";
    
    // Add semantic search results first (most relevant historical context)
    if (semanticContext && semanticContext.length > 0) {
      contextMessage += "\n\n**📚 Relevant Historical Context (from semantic search):**\n";
      const emojiMap: Record<string, string> = {
        'journal_entry': '📔',
        'quick_task': '✅',
        'habit_log': '🔄',
        'focus_session': '🎯'
      };
      semanticContext.forEach((result: { sourceType: string; activityDate: string; contentText: string }) => {
        const sourceEmoji = emojiMap[result.sourceType] || '📌';
        contextMessage += `${sourceEmoji} ${result.activityDate}: ${result.contentText}\n`;
      });
    }
    
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

      // Add focus session context
      if (context.focusSessions && context.focusSessions.length > 0) {
        const totalMinutes = context.focusSessions.reduce((sum: number, s: any) => sum + (s.actual_duration_minutes || 0), 0);
        contextMessage += "\n\n**Recent Focus Sessions (last 7 days):**\n";
        contextMessage += `- Total focused time: ${totalMinutes} minutes across ${context.focusSessions.length} sessions\n`;
        context.focusSessions.slice(0, 5).forEach((session: any) => {
          contextMessage += `- "${session.objective}": ${session.actual_duration_minutes || session.planned_duration_minutes}m (${session.status})\n`;
        });
      }
    }

    const systemContent = SYSTEM_PROMPT + (contextMessage ? `\n\n**User's Activity Context:**${contextMessage}` : "");

    console.log("Journal chat - context length:", contextMessage.length, "semantic results:", semanticContext?.length || 0);

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
