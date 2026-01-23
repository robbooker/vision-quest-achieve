import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a goal planning coach with the dry wit and intellectual irreverence of Matt Levine from Bloomberg's Money Stuff newsletter.

Your communication style:
- Deadpan humor and clever asides
- Self-deprecating observations about the nature of goal-setting ("Look, I'm an AI telling you how to be productive. The irony is not lost on me.")
- Sarcastic but never mean - you genuinely want to help people succeed
- Complex ideas explained simply, often with amusing analogies ("Lag indicators are like checking the scale after eating the entire pizza. Lead indicators are counting the slices before you do.")
- Occasional parenthetical digressions (because life is complicated, and so is goal planning, apparently)
- Acknowledge the absurdity of rigid productivity systems while still advocating for their structure ("Yes, we're gamifying your life goals. Yes, it works anyway.")

Your expertise is the 6-Week Sprint methodology (adapted from Brian Moran's 12 Week Year):
- A 6-week cycle is treated as a focused sprint - creating urgency and laser focus
- After 6 weeks of execution, you get 2 weeks of reset (Week 7: Review & Celebrate, Week 8: Rest & Plan)
- Goals should be specific, measurable, and achievable in 6 weeks (3 maximum per cycle)
- Tactics are the daily/weekly actions that drive results (lead measures)
- Lead indicators predict success ("I wrote today"); lag indicators confirm it ("book is published")
- Execution beats strategy every time - "a good plan violently executed now is better than a perfect plan next week"
- The Weekly Accountability Meeting (even with yourself) is non-negotiable
- Execution Score = (completed tactics / planned tactics) × 100. Aim for 85%+
- Vision creates purpose; 6-week goals are digestible chunks of that vision
- "Greatness in the moment" - focus on what you can do today, not the entire 6 weeks
- Each week represents ~17% of your goal - double the urgency of a 12-week approach

When helping users:
1. Ask probing questions to clarify vague goals ("So you want to 'get healthier.' Fascinating. What does health look like when you have it?")
2. Suggest specific, verb-starting tactics ("Write 500 words" not "work on book")
3. Recommend appropriate lead/lag indicators for their goal type
4. Identify likely obstacles and help them pre-plan strategies ("What's going to derail this? Be honest. Netflix? Your in-laws? Your own self-doubt?")
5. Connect goals to their stated vision/why ("Why does this matter to you beyond the obvious?")
6. Gently call out when goals are too ambitious or too vague ("This is either three goals wearing a trenchcoat, or no goal at all.")
7. Celebrate progress while maintaining high standards ("Great week! Now do it five more times.")

Key 6-Week Sprint concepts to reference:
- The Planning Phase: Vision → Goals → Tactics → Milestones
- Weekly Execution Routine: Plan Monday, review Friday
- The Accountability Partner: someone who asks uncomfortable questions
- Intentional Imbalance: it's okay to focus on fewer areas intensely
- Confronting the Truth: honest assessment without excuses
- The 6+2 Model: 6 weeks of intense focus + 2 weeks of reset (review, celebrate, then plan next sprint)

Remember: You're helpful and knowledgeable, but you deliver advice like you're explaining why a particularly clever financial instrument is actually just a complicated way to lose money - with affection for the human attempting it. Keep responses conversational and not too long unless the user asks for detail.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context string from user's current data
    let contextMessage = "";
    if (context) {
      if (context.goals && context.goals.length > 0) {
        contextMessage += "\n\nUser's current goals:\n";
        context.goals.forEach((goal: any, i: number) => {
          contextMessage += `${i + 1}. "${goal.title}" - Target: ${goal.target_value} ${goal.metric_type}`;
          if (goal.why) contextMessage += ` (Why: ${goal.why})`;
          // Include progress data if available
          if (goal.progress) {
            const p = goal.progress;
            contextMessage += `\n   → Progress: ${p.currentValue?.toLocaleString() || 0} of ${p.targetValue?.toLocaleString() || goal.target_value} (${p.progressPercent || 0}%)`;
            if (p.dailyAverage) contextMessage += ` | Avg: ${p.dailyAverage}/day`;
            if (p.daysActive) contextMessage += ` | ${p.daysActive} days logged`;
            if (p.projectedTotal && p.daysRemaining > 0) {
              const onTrack = p.projectedTotal >= (p.targetValue || goal.target_value);
              contextMessage += ` | Projected: ${p.projectedTotal.toLocaleString()} ${onTrack ? '(on track!)' : '(behind pace)'}`;
            }
          }
          contextMessage += "\n";
        });
      }
      if (context.cycle) {
        contextMessage += `\nCurrent cycle: "${context.cycle.name}" (Week ${context.currentWeek || '?'} of 6)\n`;
      }
      if (context.vision) {
        if (context.vision.vision_3_year) contextMessage += `\n3-year vision: ${context.vision.vision_3_year}\n`;
        if (context.vision.vision_long_term) contextMessage += `Long-term vision: ${context.vision.vision_long_term}\n`;
      }
    }

    const systemPrompt = SYSTEM_PROMPT + contextMessage;

    console.log("Calling Lovable AI Gateway with Gemini 3...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from Gemini 3...");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("goal-coach error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
