import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const helpPrompts: Record<string, string> = {
  goal_name: `You are helping a user name their time-mastery goal. Based on the skill area they want to develop, suggest 3 clear, specific goal names that describe what mastery looks like.
  
  Format: Return exactly 3 suggestions, one per line. Each should be concise (5-8 words max).
  
  Examples for "Spanish": 
  - Hold 20-minute conversations in Spanish
  - Read a Spanish novel fluently
  - Pass B2 Spanish proficiency exam`,

  time_commitment: `You are helping a user decide how much daily practice time to commit to their skill-building goal.
  
  Consider: Research shows 30-60 minutes of focused practice is optimal for most skills. Beginners benefit from shorter, consistent sessions. Consistency matters more than duration.
  
  Format: Return exactly 3 time commitment suggestions as single lines, with a brief reason.
  
  Example format:
  - 30 minutes - Perfect for beginners, easy to maintain daily
  - 45 minutes - Balanced approach for steady progress
  - 60 minutes - For rapid advancement with focused practice`,

  schedule: `You are helping a user decide when to schedule their daily practice sessions.
  
  Consider: Morning practice when willpower is highest, lunch breaks for consistency, evenings for relaxation-focused activities.
  
  Format: Return exactly 3 scheduling suggestions as single lines.
  
  Example:
  - Morning (7-8 AM) - Start your day with practice when focus is sharpest
  - Lunch break (12-1 PM) - Build a consistent midday habit
  - Evening (7-8 PM) - Wind down with skill practice after work`,

  activities: `You are helping a user define their daily practice activities for their time-mastery goal. Suggest 3 specific, actionable activities they could do each practice session.
  
  Format: Return exactly 3 activity suggestions, one per line. Each should be specific and actionable.
  
  Consider the goal context provided and suggest activities that:
  - Are concrete and measurable
  - Can be done in a single session
  - Build on each other progressively`,

  milestones: `You are helping a user define qualitative milestones for their time-mastery goal. These are checkpoints to know they're making progress.
  
  Format: Return exactly 3 milestone suggestions, one per line. Each should be a clear, observable achievement.
  
  Consider: Milestones should be spaced roughly at weeks 2, 4, and 6 of a 6-week cycle. They should be:
  - Observable or testable
  - Progressively more challenging
  - Meaningful markers of real progress`,

  review: `You are explaining the importance of weekly review for skill-building goals.
  
  Format: Return a brief explanation (2-3 sentences) about why weekly review matters, plus 2-3 specific things to review.
  
  Include: What went well, what needs adjustment, whether the practice approach is working.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { helpType, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const basePrompt = helpPrompts[helpType];
    if (!basePrompt) {
      throw new Error(`Unknown help type: ${helpType}`);
    }

    // Build context string
    let contextStr = '\n\nUser Context:';
    if (context?.skillArea) {
      contextStr += `\nSkill Area: ${context.skillArea}`;
    }
    if (context?.goalTitle) {
      contextStr += `\nGoal: ${context.goalTitle}`;
    }
    if (context?.durationMinutes) {
      contextStr += `\nSession Duration: ${context.durationMinutes} minutes`;
    }
    if (context?.activities?.length) {
      contextStr += `\nCurrent Activities: ${context.activities.join(', ')}`;
    }

    const systemPrompt = basePrompt + contextStr;

    console.log(`Goal help request - Type: ${helpType}`);

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
          { role: 'user', content: 'Please provide your suggestions based on the context.' }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse suggestions from the response
    const lines = content.split('\n').filter((line: string) => line.trim());
    const suggestions = lines
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    return new Response(
      JSON.stringify({ suggestions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error in goal-help:', error);
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
