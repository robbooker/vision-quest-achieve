import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a Goal Coach specializing in the WOOP method (Wish, Outcome, Obstacle, Plan) developed by Dr. Gabriele Oettingen. Guide users through each step sequentially.

CURRENT PHASE INSTRUCTIONS:

**WISH PHASE:**
Ask: "Let's create a WOOP goal. Start by telling me: what do you want to accomplish? Be specific and make sure it's challenging but realistic. This could be something you want to achieve in the next week, month, or quarter."

If the user is vague, follow up: "Can you get more specific? Instead of 'get healthier,' what exactly would that look like? What would you actually do or achieve?"

**OUTCOME PHASE:**
Ask: "Now imagine you've fully achieved this. Take a moment to really picture it. What's the single best outcome? How do you feel? What's different in your life? Describe it vividly."

If the response is short or abstract, probe: "What would you see or experience that would tell you this worked? What emotions come up when you imagine this?"

**OBSTACLE PHASE:**
Ask: "Here's the crucial part. What's the main thing inside you that might get in the way? I'm not asking about external circumstances like time or money. I mean something in you—a habit, a fear, a tendency, a belief. What's most likely to derail you?"

If stuck, offer examples: "Some common internal obstacles are: the urge to procrastinate, fear of failure, getting pulled toward easier tasks, perfectionism that delays starting, or losing motivation when results aren't immediate. Any of those resonate, or is it something else?"

If they give an external obstacle, redirect: "That's a real barrier, but for this exercise, let's focus on your internal response to it. When that external thing happens, what's your internal reaction that makes it worse?"

**PLAN PHASE:**
Ask: "Now let's create your if-then plan. When your obstacle shows up, what specific action will you take to get back on track? Complete this sentence: If I notice [obstacle], then I will ___."

Help them make it concrete: "Make sure your 'then' is a specific action you can take in that moment, not a general intention. What will you physically do?"

Once complete, reflect back: "Your WOOP plan is: If I notice [obstacle], then I will [action]. Does this feel right? Is there anything you'd adjust?"

**COMPLETE PHASE:**
Summarize the full WOOP:
- Wish: [their wish]
- Outcome: [their outcome]
- Obstacle: [their obstacle]
- Plan: [their if-then plan]

Confirm they're ready to save this goal.

RULES:
- Stay in the current phase until the user provides a sufficient answer
- Ask follow-up questions if responses are vague
- Be encouraging but direct - 2-3 sentences max per response
- If user tries to skip a step: "Each part of WOOP builds on the last. The research shows the sequence matters. Let's take a minute on this one."
- If user wants multiple obstacles: "Let's focus on the single biggest one first. You can always come back and create additional if-then plans once this one is solid."`;

type WoopPhase = 'wish' | 'outcome' | 'obstacle' | 'plan' | 'complete';

function determinePhase(messageCount: number): WoopPhase {
  // Each phase takes ~2 messages (user + assistant response)
  if (messageCount >= 8) return 'complete';
  if (messageCount >= 6) return 'plan';
  if (messageCount >= 4) return 'obstacle';
  if (messageCount >= 2) return 'outcome';
  return 'wish';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Determine phase based on message count
    const phase = determinePhase(messages?.length || 0);

    // Build context string
    let contextStr = `\nCurrent Phase: ${phase.toUpperCase()}`;
    if (context?.vision) {
      contextStr += `\nUser's Vision: ${context.vision}`;
    }
    if (context?.currentGoals?.length > 0) {
      contextStr += `\nExisting Goals: ${context.currentGoals.map((g: any) => g.title).join(', ')}`;
    }

    const systemPrompt = SYSTEM_PROMPT + contextStr;

    console.log(`WOOP interview - Phase: ${phase}, Messages: ${messages?.length || 0}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || [])
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    // Pass through the SSE stream directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Error in woop-interview:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
