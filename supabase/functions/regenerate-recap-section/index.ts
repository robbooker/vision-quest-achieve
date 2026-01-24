import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SectionKey = 
  | 'opening_reflection' 
  | 'habit_insights' 
  | 'biggest_win' 
  | 'hardest_struggle' 
  | 'unexpected_delight' 
  | 'looking_ahead'
  | 'goal_insights';

type Tone = 'witty' | 'reflective' | 'brutally_honest' | 'balanced';

interface RegenerateRequest {
  recap_id: string;
  section: SectionKey;
  tone: Tone;
  context?: Record<string, any>; // Additional context for the section
}

const toneInstructions: Record<Tone, string> = {
  witty: 'Be witty, playful, and use gentle humor. Make observations that are self-aware and slightly ironic. Think dry humor meets genuine insight.',
  reflective: 'Be thoughtful and introspective. Focus on meaning, patterns, and personal growth insights. Take time to explore the deeper significance.',
  brutally_honest: 'Be direct and unsparing. Call out contradictions, acknowledge failures plainly, and avoid sugarcoating. No false comfort.',
  balanced: 'Balance celebration with honest assessment. Acknowledge wins genuinely while noting areas for growth. Neither too harsh nor too soft.',
};

const sectionPrompts: Record<SectionKey, (data: any, tone: string) => string> = {
  opening_reflection: (data, tone) => `
Write a 200-300 word opening reflection for a monthly recap.

WRITING STYLE: ${tone}

MONTH: ${data.monthLabel}

STATS:
- Journal entries: ${data.stats.totalJournalEntries}
- Habit completion rate: ${data.stats.habitCompletionRate}%
- Goals worked on: ${data.stats.goalsProgressed}
- Focus minutes: ${data.stats.totalFocusMinutes}
- Tasks completed: ${data.stats.tasksCompleted}

GOALS: ${JSON.stringify(data.goals?.slice(0, 5) || [])}

Cover:
- Overall theme of the month
- Major wins (personal or professional)
- Honest acknowledgment of struggles
- Unexpected insights or pattern recognition

STRICT RULES:
- Use actual numbers provided
- No clichés like "journey," "transformation," "crushing it"
- No toxic positivity
- Be specific, not generic

Return ONLY the text, no quotes or formatting.`,

  habit_insights: (data, tone) => `
Write a paragraph about habit patterns for a monthly recap.

WRITING STYLE: ${tone}

STATS:
- Habit completion rate: ${data.stats.habitCompletionRate}%
- Longest streak: ${data.stats.longestStreak} days

Cover:
- Patterns you noticed (strong days, weak days)
- Correlations between habits
- What worked vs what didn't
- Streak analysis

Be specific and analytical. Return ONLY the text.`,

  biggest_win: (data, tone) => `
Write about the biggest win for a monthly recap.

WRITING STYLE: ${tone}

CONTEXT:
- Month: ${data.monthLabel}
- Goals worked on: ${data.stats.goalsProgressed}
- Tasks completed: ${data.stats.tasksCompleted}
- Focus time: ${data.stats.totalFocusMinutes} minutes

Generate a JSON object with:
{
  "title": "What was accomplished (short)",
  "why_it_mattered": "Why it was significant (1 sentence)",
  "narrative": "100-150 word celebration without the cringe"
}

Make it personal and specific. Return ONLY valid JSON.`,

  hardest_struggle: (data, tone) => `
Write about the hardest struggle for a monthly recap.

WRITING STYLE: ${tone}

CONTEXT:
- Month: ${data.monthLabel}
- Habit rate: ${data.stats.habitCompletionRate}%

Generate a JSON object with:
{
  "title": "What didn't go as planned (short)",
  "lesson_learned": "What was learned (1 sentence)",
  "narrative": "100-150 word honest reflection with forward-looking adaptation"
}

Be honest about struggles. Show growth without toxic positivity. Return ONLY valid JSON.`,

  unexpected_delight: (data, tone) => `
Write about an unexpected delight for a monthly recap.

WRITING STYLE: ${tone}

CONTEXT:
- Month: ${data.monthLabel}
- Journal entries: ${data.stats.totalJournalEntries}

Generate a JSON object with:
{
  "title": "Something good that wasn't planned (short)",
  "narrative": "50-100 words about serendipity or surprise"
}

Focus on genuine positive surprises. Return ONLY valid JSON.`,

  looking_ahead: (data, tone) => `
Write 2-3 paragraphs for "Looking Ahead" in a monthly recap.

WRITING STYLE: ${tone}

CONTEXT:
- Month: ${data.monthLabel}
- Habit rate: ${data.stats.habitCompletionRate}%
- Goals: ${data.stats.goalsProgressed}

Cover:
- What to carry into next month
- Adjustments to systems
- One thing to remember

Be grounded, not overly optimistic. Focus on small, concrete changes.
Return ONLY the text.`,

  goal_insights: (data, tone) => `
Write goal-specific insights for a monthly recap.

WRITING STYLE: ${tone}

GOALS: ${JSON.stringify(data.goals || [])}

For each goal, write a 2-3 sentence insight about progress, patterns, or observations.

Return a JSON array:
[
  {"goal_title": "Goal name", "insight": "2-3 sentence commentary"}
]

Be specific to each goal. Return ONLY valid JSON array.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { recap_id, section, tone, context }: RegenerateRequest = await req.json();

    if (!recap_id || !section || !tone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the existing recap
    const { data: recap, error: recapError } = await supabase
      .from('monthly_recaps')
      .select('*')
      .eq('id', recap_id)
      .eq('user_id', user.id)
      .single();

    if (recapError || !recap) {
      return new Response(JSON.stringify({ error: 'Recap not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare context data
    const monthDate = new Date(recap.month);
    const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const data = {
      monthLabel,
      stats: recap.stats || {},
      goals: context?.goals || [],
      ...context,
    };

    // Get the prompt for this section
    const promptFn = sectionPrompts[section];
    if (!promptFn) {
      return new Response(JSON.stringify({ error: 'Invalid section' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = promptFn(data, toneInstructions[tone]);

    console.log(`Regenerating section "${section}" with tone "${tone}" for recap ${recap_id}`);

    // Call AI
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const result = await response.json();
    let content = result.choices[0]?.message?.content || '';
    
    // Clean up the response
    content = content.trim();
    
    // Parse JSON sections
    let sectionContent: any;
    if (['biggest_win', 'hardest_struggle', 'unexpected_delight', 'goal_insights'].includes(section)) {
      try {
        const jsonMatch = content.match(/[\[{][\s\S]*[\]}]/);
        if (jsonMatch) {
          sectionContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        console.error('Failed to parse JSON response:', content);
        return new Response(JSON.stringify({ 
          error: 'Failed to parse AI response',
          raw: content 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Text sections
      sectionContent = content.replace(/^["']|["']$/g, ''); // Remove quotes if wrapped
    }

    // Update the recap with the new section
    const updatedContent = {
      ...recap.content,
      [section]: sectionContent,
    };

    const { error: updateError } = await supabase
      .from('monthly_recaps')
      .update({
        content: updatedContent,
        tone: tone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recap_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      section,
      content: sectionContent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error regenerating section:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: 'Failed to regenerate section', 
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
