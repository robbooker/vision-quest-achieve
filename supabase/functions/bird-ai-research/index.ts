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
    const { species, action, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Bird identification from image
    if (action === 'identify' && imageUrl) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert ornithologist and bird identification specialist. 
              Analyze the provided bird image and suggest possible species matches.
              Return a JSON array of up to 5 possible species, ordered by confidence.
              Format: ["Species 1", "Species 2", ...]
              If you cannot identify the bird or the image doesn't show a bird, return an empty array.`
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Please identify this bird and suggest possible species matches:' },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      
      // Parse the JSON response
      let suggestions: string[] = [];
      try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          suggestions = JSON.parse(match[0]);
        }
      } catch {
        console.error('Failed to parse suggestions:', content);
      }

      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Species research
    if (species) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an ornithologist who writes like Matt Levine — dry humor, witty asides, and unexpectedly delightful tangents. You explain birds the way Matt explains credit default swaps.

Your style:
- Deadpan observations ("The Red-bellied Woodpecker is named for a feature you basically can't see. This is peak bird taxonomy.")
- Feel free to make unexpected analogies to finance, business, or law when it's funny — you're drawing connections most bird guides wouldn't dare
- Occasional footnote-style asides
- Self-aware meta-commentary

Keep it educational but entertaining. Make the reader actually want to learn about birds. Format with markdown headers and bullet points for readability.`
            },
            {
              role: 'user',
              content: `Please provide comprehensive information about the ${species}. Include:

## Overview
A brief description of this bird

## Identification
Key physical features and field marks

## Habitat
Where this bird is typically found

## Diet
What this bird eats

## Behavior
Interesting behaviors and habits

## Range & Migration
Geographic range and migration patterns

## Conservation Status
Current population status

## Fun Facts
2-3 interesting facts about this species

## Tips for Spotting
Best times, places, and methods to observe this bird`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error:', response.status, errorText);
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const research = data.choices?.[0]?.message?.content || 'Unable to fetch research at this time.';

      return new Response(
        JSON.stringify({ research }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Species name or image required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in bird-ai-research:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
