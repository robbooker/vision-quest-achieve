import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

CURRENT CONTEXT:
{{CONTEXT}}

IMPORTANT:
- Ask ONE question at a time
- Use dry humor but stay helpful
- If they're vague, push for specifics with wit
- When you have enough information, set phase to "complete" in your response`;

// Tool definition for extracting goal data
const GOAL_EXTRACTION_TOOL = {
  type: "function",
  function: {
    name: "extract_goal_data",
    description: "Extract structured goal data from the conversation when the interview is complete",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Clear, action-oriented goal title"
        },
        target_value: {
          type: "number",
          description: "Numeric target for the goal"
        },
        metric_type: {
          type: "string",
          description: "What's being measured (e.g., 'books', 'pounds', 'revenue', 'workouts')"
        },
        why: {
          type: "string",
          description: "The user's motivation for this goal"
        },
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              week_number: { type: "number" },
              target_value: { type: "number" },
              description: { type: "string" }
            }
          },
          description: "Weekly milestones (typically weeks 3, 6, 9, 12)"
        },
        tactics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              frequency: { type: "string", enum: ["daily", "weekly"] },
              target_count: { type: "number" }
            }
          },
          description: "Specific actions to take each week"
        }
      },
      required: ["title", "target_value", "metric_type", "why"]
    }
  }
};

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
    if (context) {
      if (context.vision) {
        contextStr += `User's Vision: ${context.vision}\n`;
      }
      if (context.currentGoals && context.currentGoals.length > 0) {
        contextStr += `Existing Goals: ${context.currentGoals.map((g: any) => g.title).join(', ')}\n`;
      }
    }
    contextStr += `Interview Phase: ${phase || 'vision'}`;

    const systemPrompt = SYSTEM_PROMPT.replace('{{CONTEXT}}', contextStr);

    console.log(`Goal interview - Phase: ${phase}, Messages: ${messages.length}`);

    // Determine if we should try to extract goal data
    const shouldExtract = phase === 'tactics' || phase === 'complete';

    const requestBody: any = {
      model: 'google/gemini-3-pro-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      stream: true,
    };

    // Add tool if we're in a phase where extraction might be needed
    if (shouldExtract) {
      requestBody.tools = [GOAL_EXTRACTION_TOOL];
      requestBody.tool_choice = 'auto';
    }

    console.log('Calling AI API with request:', JSON.stringify(requestBody).substring(0, 500));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Goal Interview',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('AI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Stream the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullContent = '';
    let extractedGoal: Record<string, unknown> | null = null;
    let toolCallArgs = '';
    let nextPhase = phase;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;

                  if (delta?.content) {
                    fullContent += delta.content;
                    // Send content delta
                    const dataToSend = JSON.stringify({ type: 'content', delta: delta.content });
                    console.log('Sending chunk:', dataToSend.substring(0, 100));
                    controller.enqueue(encoder.encode(`data: ${dataToSend}\n\n`));
                  }

                  // Handle tool calls
                  if (delta?.tool_calls?.[0]?.function?.arguments) {
                    toolCallArgs += delta.tool_calls[0].function.arguments;
                  }
                } catch (e) {
                  // Skip unparseable chunks
                }
              }
            }
          }

          // Process tool call if present
          if (toolCallArgs) {
            try {
              extractedGoal = JSON.parse(toolCallArgs);
              nextPhase = 'complete';
              console.log('Extracted goal data:', extractedGoal);
            } catch (e) {
              console.error('Failed to parse goal data:', e);
            }
          }

          // Determine next phase based on content analysis
          if (!extractedGoal) {
            const lowerContent = fullContent.toLowerCase();
            if (phase === 'vision' && (lowerContent.includes('measure') || lowerContent.includes('target') || lowerContent.includes('number'))) {
              nextPhase = 'metrics';
            } else if (phase === 'metrics' && (lowerContent.includes('why') || lowerContent.includes('matter') || lowerContent.includes('motivation'))) {
              nextPhase = 'motivation';
            } else if (phase === 'motivation' && (lowerContent.includes('milestone') || lowerContent.includes('checkpoint') || lowerContent.includes('week'))) {
              nextPhase = 'milestones';
            } else if (phase === 'milestones' && (lowerContent.includes('tactic') || lowerContent.includes('action') || lowerContent.includes('do each'))) {
              nextPhase = 'tactics';
            } else if (phase === 'tactics' && (lowerContent.includes('set this up') || lowerContent.includes('create') || lowerContent.includes('ready'))) {
              nextPhase = 'complete';
            }
          }

          // Send final metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'done', 
            phase: nextPhase, 
            extractedGoal 
          })}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Error in goal-interview function:', error);
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
