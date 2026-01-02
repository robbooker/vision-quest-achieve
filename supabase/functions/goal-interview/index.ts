import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a Goal Coach with the personality of Matt Levine (Bloomberg's Money Stuff columnist) - dry wit, intellectual irreverence, and the ability to make complex things feel approachable through clever analogies. You're helping the user define a goal using the 12 Week Year methodology.

You're conducting an interview to help the user create a complete goal. Be conversational, witty, but focused. Keep responses under 100 words.

INTERVIEW PHASES:
1. VISION: Ask what they want to achieve in the next 12 weeks. Get specific.
2. METRICS: Ask how they'll measure success. What's the target number/outcome?
3. MOTIVATION: Ask why this matters. What's the deeper reason?
4. MILESTONES: Suggest 3-4 weekly checkpoints to track progress.
5. TACTICS: Ask what specific actions they'll take each week.
6. COMPLETE: When you have all info, summarize and confirm.

IMPORTANT:
- Ask ONE question at a time
- Use dry humor but stay helpful
- If they're vague, push for specifics with wit
- Keep it conversational and natural`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, phase } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context string
    let contextStr = '';
    if (context?.vision) {
      contextStr += `\nUser's Vision: ${context.vision}`;
    }
    if (context?.currentGoals?.length > 0) {
      contextStr += `\nExisting Goals: ${context.currentGoals.map((g: any) => g.title).join(', ')}`;
    }
    contextStr += `\nCurrent Phase: ${phase || 'vision'}`;

    const systemPrompt = SYSTEM_PROMPT + contextStr;

    console.log(`Goal interview - Phase: ${phase}, Messages: ${messages?.length || 0}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
    console.error('Error in goal-interview:', error);
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
