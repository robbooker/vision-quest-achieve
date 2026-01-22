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

You have access to multiple types of context:
1. **Recent Activity (last 7 days)** - Tasks, habits, focus sessions
2. **Semantic Search Results** - Historical activities matching their query
3. **Voice Journal Entries** - Audio journals with mood and energy levels
4. **Goals & Milestones** - Their 6-Week Sprint goals and weekly targets
5. **Active Cycle** - Current planning cycle info and week number
6. **Personal Vision** - 3-year vision, long-term vision, and core values

**GOAL & VISION AWARENESS:**
You have access to the user's 6-Week Sprint goals, their weekly milestones, and their personal vision.
- Reference their goals when discussing productivity or priorities
- Connect daily tasks to their bigger picture vision
- Acknowledge progress on milestones ("You're in Week 3 of your cycle, how's the book project going?")
- Use vision to provide encouraging perspective when they're struggling
- Help them see the connection between small wins and their larger aspirations

When the user asks about patterns, habits, or "when did I...?" questions, pay special attention to the semantic search results as they contain relevant historical context beyond just the last 7 days.

**VOICE JOURNAL AWARENESS:**
You have access to the user's voice journal entries, which include their spoken reflections along with detected mood and energy levels. When referencing voice journals, you might say things like:
- "I noticed in your voice journal from Tuesday, you sounded really energized when talking about..."
- "You mentioned feeling stressed about X in your voice note last week..."
Look for patterns in mood and energy across voice entries to provide deeper insights.

When analyzing their data:
- Connect current activities to past patterns you find in the search results
- Identify long-term trends, not just recent activity
- Celebrate consistency you notice across weeks or months
- Gently surface things they may have forgotten about
- Reference mood and energy patterns from voice journals when relevant
- Connect daily tasks and habits to their active goals and milestones
- Use their vision and core values to provide meaningful encouragement

**TASK CREATION:**
When the user wants to add, create, or remind themselves about a task, use the create_task tool to add it to their task list. Examples:
- "Add 'call mom' to my tasks" → use create_task with title "call mom"
- "Remind me to review the budget" → use create_task with title "review the budget"
- "Add 'prepare presentation' to my business tasks" → use create_task with title "prepare presentation" and category "business"

If they don't specify a category, default to "personal". After creating, confirm what you added.

Keep responses conversational and supportive. You're here to help them reflect on their journey, not to lecture.`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task in the user's Quick Tasks list",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title/name of the task to create"
          },
          category: {
            type: "string",
            enum: ["personal", "business"],
            description: "The category of the task. Defaults to 'personal' if not specified."
          }
        },
        required: ["title"],
        additionalProperties: false
      }
    }
  }
];

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

    // Get user from auth header for task creation
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
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
      // Add active cycle info first
      if (context.activeCycle) {
        const startDate = new Date(context.activeCycle.start_date);
        const now = new Date();
        const weekNumber = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        contextMessage += `\n\n**📅 Current 6-Week Cycle:** "${context.activeCycle.name}" (Week ${Math.min(weekNumber, 8)} of 8)\n`;
      }

      // Add goals with milestones
      if (context.goals && context.goals.length > 0) {
        contextMessage += "\n\n**🎯 Active Goals:**\n";
        context.goals.forEach((goal: any) => {
          contextMessage += `- "${goal.title}" (Target: ${goal.target_value} ${goal.metric_type})`;
          if (goal.why) contextMessage += ` | Why: ${goal.why}`;
          contextMessage += "\n";
          if (goal.milestones?.length > 0) {
            goal.milestones.forEach((m: any) => {
              contextMessage += `  • Week ${m.week_number}: ${m.target_value}${m.description ? ` - ${m.description}` : ''}\n`;
            });
          }
          if (goal.obstacles) contextMessage += `  Obstacles: ${goal.obstacles}\n`;
          if (goal.strategies) contextMessage += `  Strategies: ${goal.strategies}\n`;
        });
      }

      // Add user vision
      if (context.vision) {
        contextMessage += "\n\n**🔮 User's Vision:**\n";
        if (context.vision.vision_3_year) contextMessage += `3-Year Vision: ${context.vision.vision_3_year}\n`;
        if (context.vision.vision_long_term) contextMessage += `Long-term Vision: ${context.vision.vision_long_term}\n`;
        if (context.vision.core_values) contextMessage += `Core Values: ${context.vision.core_values}\n`;
      }

      if (context.recentTasks && context.recentTasks.length > 0) {
        contextMessage += "\n\n**✅ Recent Completed Tasks (last 7 days):**\n";
        context.recentTasks.forEach((task: any) => {
          contextMessage += `- ${task.title} (completed ${task.completed_at})\n`;
        });
      }
      
      if (context.pendingTasks && context.pendingTasks.length > 0) {
        contextMessage += "\n\n**📋 Current Pending Tasks:**\n";
        context.pendingTasks.forEach((task: any) => {
          contextMessage += `- ${task.title}\n`;
        });
      }
      
      if (context.recentHabits && context.recentHabits.length > 0) {
        contextMessage += "\n\n**🔄 Recent Habit Activity (last 7 days):**\n";
        context.recentHabits.forEach((habit: any) => {
          contextMessage += `- ${habit.tactic_title}: ${habit.completed_count}x on ${habit.logged_date}\n`;
        });
      }
      
      if (context.journalEntries && context.journalEntries.length > 0) {
        contextMessage += "\n\n**📔 Recent Journal Entries:**\n";
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
        contextMessage += "\n\n**🧘 Recent Focus Sessions (last 7 days):**\n";
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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        tools,
        stream: false, // Disable streaming to handle tool calls properly
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

    const aiResponse = await response.json();
    const choice = aiResponse.choices?.[0];
    
    // Check if there are tool calls
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolResults: { taskCreated?: { title: string; category: string } } = {};
      
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function.name === "create_task") {
          const args = JSON.parse(toolCall.function.arguments);
          const title = args.title;
          const category = args.category || "personal";
          
          if (userId) {
            // Get max position
            const supabase = createClient(
              Deno.env.get("SUPABASE_URL") ?? "",
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );
            
            const { data: maxPosData } = await supabase
              .from("quick_tasks")
              .select("position")
              .eq("user_id", userId)
              .order("position", { ascending: false })
              .limit(1);
            
            const nextPosition = (maxPosData?.[0]?.position ?? -1) + 1;
            
            // Create the task
            const { error: insertError } = await supabase
              .from("quick_tasks")
              .insert({
                user_id: userId,
                title,
                category,
                position: nextPosition,
                completed: false,
              });
            
            if (insertError) {
              console.error("Error creating task:", insertError);
            } else {
              toolResults.taskCreated = { title, category };
              console.log("Task created:", title, category);
            }
          }
        }
      }
      
      // Get a follow-up response with the tool result
      const followUpMessages = [
        { role: "system", content: systemContent },
        ...messages,
        choice.message,
        {
          role: "tool",
          tool_call_id: choice.message.tool_calls[0].id,
          content: toolResults.taskCreated 
            ? `Task created successfully: "${toolResults.taskCreated.title}" in ${toolResults.taskCreated.category} category`
            : "Failed to create task - user not authenticated"
        }
      ];
      
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: followUpMessages,
          stream: false,
        }),
      });
      
      const followUpData = await followUpResponse.json();
      const finalContent = followUpData.choices?.[0]?.message?.content || "Done!";
      
      return new Response(JSON.stringify({ 
        content: finalContent,
        taskCreated: toolResults.taskCreated 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // No tool calls, return the content directly
    return new Response(JSON.stringify({ 
      content: choice?.message?.content || "I'm here to help!" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Journal chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
