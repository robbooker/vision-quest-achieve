import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, startDate, endDate, purpose, plannedActivities, masterItems, hasFlight } = await req.json();

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Format master items for the prompt
    const existingItemsList = masterItems?.length > 0 
      ? masterItems.map((item: { item_name: string; category: string }) => 
          `- ${item.item_name} (${item.category})`
        ).join('\n')
      : 'No existing items';

    const flightInstructions = hasFlight 
      ? `
IMPORTANT - FLIGHT TRAVEL:
The user is FLYING to the destination. You MUST categorize each item as either:
- "carry_on": Items needed during flight, valuable electronics, medications, essential documents, items that shouldn't be in checked luggage
- "checked": Larger items, liquids over 3.4oz, items that can safely go in checked luggage

Always put these in carry_on: passport, wallet, phone, laptop, medications, jewelry, chargers, change of clothes
Always put these in checked: large toiletries, bulky shoes, most clothing, large equipment`
      : '';

    const systemPrompt = `You are a smart travel packing assistant. Generate practical packing lists based on trip details.`;

    const userPrompt = `Generate a comprehensive packing list for this trip.

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${tripDays} days (${startDate} to ${endDate})
- Purpose: ${purpose}
- Planned Activities: ${plannedActivities || 'General travel'}
- Transportation: ${hasFlight ? 'FLYING (organize by carry-on vs checked bag)' : 'Not flying'}

USER'S EXISTING ITEMS (Master Locker):
${existingItemsList}
${flightInstructions}

INSTRUCTIONS:
1. Generate a practical packing list organized by category
2. Consider the destination's typical weather and culture
3. Prioritize items from the user's existing Master Locker when applicable
4. For items NOT in the Master Locker, mark them as suggestions
5. Include appropriate quantities based on trip duration
6. Categories should include: Clothing, Tech, Toiletries, Documents, Accessories, Activity-Specific, Miscellaneous
${hasFlight ? '7. CRITICAL: Include bag_type for EVERY item (carry_on or checked)' : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_packing_list",
              description: "Generate a structured packing list for a trip",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    description: "List of items to pack",
                    items: {
                      type: "object",
                      properties: {
                        item_name: { type: "string", description: "Name of the item" },
                        category: { type: "string", description: "Category like Clothing, Tech, Toiletries, Documents, Accessories, Activity-Specific, Miscellaneous" },
                        quantity: { type: "number", description: "How many to bring" },
                        is_from_master: { type: "boolean", description: "Whether this item is from user's master locker" },
                        bag_type: { type: "string", enum: ["carry_on", "checked"], description: "Whether item goes in carry-on or checked bag (for flights)" },
                        reason: { type: "string", description: "Brief reason for including this item" }
                      },
                      required: ["item_name", "category", "quantity", "is_from_master", "bag_type"],
                      additionalProperties: false
                    }
                  },
                  weather_note: { type: "string", description: "Brief note about expected weather" },
                  tips: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "2-3 helpful packing tips"
                  }
                },
                required: ["items", "weather_note", "tips"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_packing_list" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_packing_list') {
      console.error('No valid tool call in response:', JSON.stringify(data));
      throw new Error('AI did not return a valid packing list');
    }

    let packingList;
    try {
      packingList = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool arguments:', toolCall.function.arguments);
      throw new Error('Failed to parse packing list response');
    }

    return new Response(JSON.stringify(packingList), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating packing list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate packing list';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
