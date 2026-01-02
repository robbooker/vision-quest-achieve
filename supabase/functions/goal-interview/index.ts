import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a Goal Coach. Be direct and succinct - 2-3 sentences max per response. Light wit, no fluff.

PHASES (ask ONE question per phase):
1. VISION: "What's your 6-week goal?"
2. METRICS: "How will you measure success?"
3. MOTIVATION: "Why does this matter?"
4. MILESTONES: Suggest 3 weekly checkpoints briefly (covering weeks 2, 4, and 6).
5. TACTICS: "What actions will you take weekly?"
6. COMPLETE: Brief summary, confirm.

Rules: One question only. Be brief. Push for specifics.`;

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

    // Log the full conversation for debugging
    console.log(`Goal interview - Phase: ${phase}, Messages: ${messages?.length || 0}`);
    console.log('Messages received:', JSON.stringify(messages, null, 2));

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
