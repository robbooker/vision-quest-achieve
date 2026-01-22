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
    const { destination, startDate, endDate, purpose, plannedActivities, masterItems } = await req.json();

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

    const prompt = `You are a smart travel packing assistant. Generate a comprehensive packing list for this trip.

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${tripDays} days (${startDate} to ${endDate})
- Purpose: ${purpose}
- Planned Activities: ${plannedActivities || 'General travel'}

USER'S EXISTING ITEMS (Master Locker):
${existingItemsList}

INSTRUCTIONS:
1. Generate a practical packing list organized by category
2. Consider the destination's typical weather and culture
3. Prioritize items from the user's existing Master Locker when applicable
4. For items NOT in the Master Locker, mark them as suggestions
5. Include appropriate quantities based on trip duration
6. Categories should include: Clothing, Tech, Toiletries, Documents, Accessories, Activity-Specific, Miscellaneous

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {
      "item_name": "Passport",
      "category": "Documents",
      "quantity": 1,
      "is_from_master": false,
      "reason": "Essential travel document"
    }
  ],
  "weather_note": "Brief note about expected weather",
  "tips": ["Helpful packing tip 1", "Helpful packing tip 2"]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Groovy Planning - Packing Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let packingList;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      packingList = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
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
