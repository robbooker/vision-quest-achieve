import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a goal extraction assistant. Your job is to analyze a conversation between a user and a goal coach and extract structured goal data.

Extract the following from the conversation:
- title: A clear, concise goal title (e.g., "Reduce expenses by 25%")
- target_value: The numeric target (e.g., 25 for 25%)
- metric_type: What's being measured (e.g., "percentage", "count", "dollars", "hours")
- why: The user's motivation for this goal
- milestones: Weekly checkpoints with week_number (1-6), target_value, and description
- tactics: Specific actions with title, frequency (daily/weekly), and target_count

Be precise and extract only what was explicitly discussed.`;

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

    // Format conversation for extraction
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    console.log('Extracting goal from conversation:', conversationText.slice(0, 500));

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
          { role: 'user', content: `Extract the goal from this conversation:\n\n${conversationText}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_goal',
              description: 'Extract structured goal data from the interview conversation',
              parameters: {
                type: 'object',
                properties: {
                  title: { 
                    type: 'string', 
                    description: 'Clear, concise goal title' 
                  },
                  target_value: { 
                    type: 'number', 
                    description: 'Numeric target value for the goal' 
                  },
                  metric_type: { 
                    type: 'string', 
                    description: 'What is being measured (percentage, count, dollars, hours, etc.)' 
                  },
                  why: { 
                    type: 'string', 
                    description: "The user's motivation for this goal" 
                  },
                  milestones: {
                    type: 'array',
                    description: 'Weekly checkpoints toward the goal',
                    items: {
                      type: 'object',
                      properties: {
                        week_number: { type: 'number', description: 'Week 1-6' },
                        target_value: { type: 'number', description: 'Target for this milestone' },
                        description: { type: 'string', description: 'What should be achieved' }
                      },
                      required: ['week_number', 'target_value', 'description']
                    }
                  },
                  tactics: {
                    type: 'array',
                    description: 'Specific actions to take',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Action to take' },
                        frequency: { type: 'string', enum: ['daily', 'weekly'], description: 'How often' },
                        target_count: { type: 'number', description: 'Times per period' }
                      },
                      required: ['title', 'frequency', 'target_count']
                    }
                  }
                },
                required: ['title', 'target_value', 'metric_type', 'why'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_goal' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_goal') {
      throw new Error('No goal extraction result');
    }

    const extractedGoal = JSON.parse(toolCall.function.arguments);
    console.log('Extracted goal:', JSON.stringify(extractedGoal, null, 2));

    return new Response(JSON.stringify(extractedGoal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in extract-goal:', error);
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
