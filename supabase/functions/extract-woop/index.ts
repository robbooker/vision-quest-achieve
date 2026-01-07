import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a goal extraction assistant. Given a WOOP interview conversation, extract the structured goal data.

Extract the following fields:
1. wish (string): The specific, concrete goal/wish the user wants to accomplish
2. outcome_visualization (string): The vivid description of the best outcome when achieved
3. primary_obstacle (string): The main internal obstacle that might derail progress
4. implementation_intention (string): The if-then plan in format "If I notice [obstacle], then I will [action]"

Return ONLY valid JSON in this exact format:
{
  "wish": "string - the specific goal",
  "outcome_visualization": "string - vivid outcome description",
  "primary_obstacle": "string - the internal obstacle",
  "implementation_intention": "string - the if-then plan"
}

If any field cannot be determined from the conversation, use a reasonable inference or leave empty string.
Do not include any text before or after the JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build conversation summary for extraction
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n');

    console.log('Extracting WOOP goal from conversation');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract the WOOP goal from this conversation:\n\n${conversationText}` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse goal extraction response');
    }

    const extracted = JSON.parse(jsonMatch[0]);
    
    console.log('Extracted WOOP goal:', extracted);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in extract-woop:', error);
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
