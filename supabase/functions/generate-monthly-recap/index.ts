import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecapRequest {
  month: string; // YYYY-MM format
  tone: 'witty' | 'reflective' | 'brutally_honest' | 'balanced';
}

interface MonthlyData {
  goals: any[];
  tactics: any[];
  tacticLogs: any[];
  journalEntries: any[];
  quickTasks: any[];
  focusSessions: any[];
  weekReviews: any[];
  vision: any;
  bigTenProjects: any[];
}

interface ComputedStats {
  totalJournalEntries: number;
  habitCompletionRate: number;
  goalsProgressed: number;
  totalFocusMinutes: number;
  tasksCompleted: number;
  longestStreak: number;
  photosCount: number;
}

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

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { month, tone = 'balanced' }: RecapRequest = await req.json();
    
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return new Response(JSON.stringify({ error: 'Invalid month format. Use YYYY-MM' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate date range for the month
    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]; // Last day of month

    console.log(`Generating recap for user ${user.id}, month ${month} (${startDate} to ${endDate})`);

    // Fetch all data in parallel
    const [
      goalsResult,
      tacticsResult,
      tacticLogsResult,
      journalResult,
      quickTasksResult,
      focusResult,
      weekReviewsResult,
      visionResult,
      bigTenResult,
      cyclesResult,
    ] = await Promise.all([
      // Goals active during the month
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .lte('created_at', `${endDate}T23:59:59Z`),
      
      // Tactics (habits)
      supabase
        .from('goal_tactics')
        .select('*, goals!inner(title)')
        .eq('user_id', user.id)
        .eq('is_active', true),
      
      // Tactic logs for the month
      supabase
        .from('tactic_logs')
        .select('*, goal_tactics!inner(title)')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate),
      
      // Journal entries
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true }),
      
      // Quick tasks completed
      supabase
        .from('quick_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', `${startDate}T00:00:00Z`)
        .lte('completed_at', `${endDate}T23:59:59Z`),
      
      // Focus sessions
      supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('started_at', `${startDate}T00:00:00Z`)
        .lte('started_at', `${endDate}T23:59:59Z`),
      
      // Week reviews
      supabase
        .from('week_reviews')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${startDate}T00:00:00Z`)
        .lte('created_at', `${endDate}T23:59:59Z`),
      
      // User vision for context
      supabase
        .from('user_vision')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      
      // Big Ten projects
      supabase
        .from('big_ten_projects')
        .select('*')
        .eq('user_id', user.id)
        .or(`completed_at.gte.${startDate}T00:00:00Z,completed.eq.false`),
      
      // Cycles for context
      supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id)
        .lte('start_date', endDate)
        .gte('end_date', startDate),
    ]);

    const monthlyData: MonthlyData = {
      goals: goalsResult.data || [],
      tactics: tacticsResult.data || [],
      tacticLogs: tacticLogsResult.data || [],
      journalEntries: journalResult.data || [],
      quickTasks: quickTasksResult.data || [],
      focusSessions: focusResult.data || [],
      weekReviews: weekReviewsResult.data || [],
      vision: visionResult.data,
      bigTenProjects: bigTenResult.data || [],
    };

    // Compute stats
    const stats = computeStats(monthlyData, startDate, endDate);

    // Extract photos from journal entries
    const photos = extractPhotos(monthlyData.journalEntries);

    // Prepare charts data
    const chartsData = prepareChartsData(monthlyData, startDate, endDate);

    // Generate AI content
    const aiContent = await generateAIContent(monthlyData, stats, tone, month);

    // Create or update the recap
    const monthDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
    
    const { data: existingRecap } = await supabase
      .from('monthly_recaps')
      .select('id')
      .eq('user_id', user.id)
      .eq('month', monthDate)
      .maybeSingle();

    let recapId: string;
    
    if (existingRecap) {
      const { data: updated, error: updateError } = await supabase
        .from('monthly_recaps')
        .update({
          headline: aiContent.headline,
          subheadline: aiContent.subheadline,
          content: aiContent.sections,
          charts_data: chartsData,
          photos: photos,
          stats: stats,
          tone: tone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecap.id)
        .select('id')
        .single();
      
      if (updateError) throw updateError;
      recapId = updated.id;
    } else {
      const { data: created, error: createError } = await supabase
        .from('monthly_recaps')
        .insert({
          user_id: user.id,
          month: monthDate,
          headline: aiContent.headline,
          subheadline: aiContent.subheadline,
          content: aiContent.sections,
          charts_data: chartsData,
          photos: photos,
          stats: stats,
          tone: tone,
        })
        .select('id')
        .single();
      
      if (createError) throw createError;
      recapId = created.id;
    }

    return new Response(JSON.stringify({
      success: true,
      recap_id: recapId,
      headline: aiContent.headline,
      subheadline: aiContent.subheadline,
      content: aiContent.sections,
      charts_data: chartsData,
      photos: photos,
      stats: stats,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating recap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: 'Failed to generate recap', 
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function computeStats(data: MonthlyData, startDate: string, endDate: string): ComputedStats {
  // Calculate habit completion rate
  const totalDays = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  const activeTactics = data.tactics.length;
  const expectedCompletions = activeTactics * totalDays;
  const actualCompletions = data.tacticLogs.reduce((sum, log) => sum + (log.completed_count || 1), 0);
  const habitCompletionRate = expectedCompletions > 0 
    ? Math.round((actualCompletions / expectedCompletions) * 100) 
    : 0;

  // Calculate longest streak
  const logDates = [...new Set(data.tacticLogs.map(l => l.logged_date))].sort();
  let longestStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < logDates.length; i++) {
    const prevDate = new Date(logDates[i - 1]);
    const currDate = new Date(logDates[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Count photos
  const photosCount = data.journalEntries.reduce((count, entry) => {
    const userPhotos = entry.user_photos || [];
    return count + (Array.isArray(userPhotos) ? userPhotos.length : 0);
  }, 0);

  // Count goals with progress
  const goalsProgressed = data.goals.filter(g => {
    // A goal "progressed" if it has tactic logs or completed tasks
    return data.tacticLogs.some(l => {
      const tactic = data.tactics.find(t => t.id === l.tactic_id);
      return tactic?.goal_id === g.id;
    });
  }).length;

  return {
    totalJournalEntries: data.journalEntries.length,
    habitCompletionRate,
    goalsProgressed,
    totalFocusMinutes: data.focusSessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0),
    tasksCompleted: data.quickTasks.length,
    longestStreak,
    photosCount,
  };
}

function extractPhotos(journalEntries: any[]): any[] {
  const photos: any[] = [];
  
  for (const entry of journalEntries) {
    const userPhotos = entry.user_photos || [];
    if (Array.isArray(userPhotos)) {
      for (const photo of userPhotos) {
        photos.push({
          url: typeof photo === 'string' ? photo : photo.url,
          date: entry.entry_date,
          caption: '', // Will be filled by AI
        });
      }
    }
  }
  
  // Limit to 12 photos
  return photos.slice(0, 12);
}

function prepareChartsData(data: MonthlyData, startDate: string, endDate: string): any {
  // Goal progress data
  const goalProgress = data.goals.map(goal => {
    const goalTactics = data.tactics.filter(t => t.goal_id === goal.id);
    const goalLogs = data.tacticLogs.filter(l => 
      goalTactics.some(t => t.id === l.tactic_id)
    );
    
    return {
      id: goal.id,
      title: goal.title,
      targetValue: goal.target_value,
      progress: goalLogs.length,
      type: goal.goal_type,
    };
  });

  // Habit heatmap data (daily completions)
  const habitHeatmap: Record<string, number> = {};
  for (const log of data.tacticLogs) {
    const date = log.logged_date;
    habitHeatmap[date] = (habitHeatmap[date] || 0) + (log.completed_count || 1);
  }

  // Focus time by week
  const focusByWeek: Record<string, number> = {};
  for (const session of data.focusSessions) {
    const date = new Date(session.started_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    focusByWeek[weekKey] = (focusByWeek[weekKey] || 0) + (session.actual_duration_minutes || 0);
  }

  return {
    goalProgress,
    habitHeatmap,
    focusByWeek,
  };
}

async function generateAIContent(
  data: MonthlyData, 
  stats: ComputedStats, 
  tone: string,
  month: string
): Promise<{ headline: string; subheadline: string; sections: any }> {
  const toneInstructions: Record<string, string> = {
    witty: 'Be witty, playful, and use gentle humor. Make observations that are self-aware and slightly ironic.',
    reflective: 'Be thoughtful and introspective. Focus on meaning, patterns, and personal growth insights.',
    brutally_honest: 'Be direct and unsparing. Call out contradictions, acknowledge failures plainly, and avoid sugarcoating.',
    balanced: 'Balance celebration with honest assessment. Acknowledge wins genuinely while noting areas for growth.',
  };

  const [yearStr, monthStr] = month.split('-');
  const monthName = new Date(parseInt(yearStr), parseInt(monthStr) - 1).toLocaleString('en-US', { month: 'long' });
  const monthYear = `${monthName} ${yearStr}`;

  // Prepare journal excerpts (limit to avoid token overflow)
  const journalExcerpts = data.journalEntries
    .filter(e => e.user_notes)
    .slice(0, 10)
    .map(e => ({
      date: e.entry_date,
      notes: e.user_notes?.substring(0, 500),
    }));

  // Prepare goal summaries
  const goalSummaries = data.goals.slice(0, 8).map(g => ({
    title: g.title,
    type: g.goal_type,
    why: g.why,
    obstacles: g.obstacles,
  }));

  // Week review excerpts
  const weekReviewExcerpts = data.weekReviews.map(r => ({
    week: r.week_number,
    wins: r.wins,
    lessons: r.lessons,
    score: r.execution_score,
  }));

  const prompt = `You are the ghostwriter for a thoughtful person's monthly life reflection.

WRITING STYLE:
- ${toneInstructions[tone] || toneInstructions.balanced}
- Witty but never glib or superficial
- Self-aware and honest (celebrate wins without inflation, acknowledge struggles without self-flagellation)
- Analytically precise (use the actual numbers provided)
- Conversational but intelligent
- Gentle humor about human nature
- No toxic positivity, no hustle-culture BS

STRICT RULES:
- Never fabricate data or progress - only use the numbers I provide
- If data is sparse, acknowledge it naturally
- Correlations must be observable from the data
- Struggles deserve same depth as wins
- Avoid clichés: "journey," "transformation," "crushing it," "leveling up"
- No productivity guru platitudes

MONTH: ${monthYear}

STATS FOR THIS MONTH:
- Journal entries written: ${stats.totalJournalEntries}
- Habit completion rate: ${stats.habitCompletionRate}%
- Goals actively worked on: ${stats.goalsProgressed}
- Focus session minutes: ${stats.totalFocusMinutes}
- Tasks completed: ${stats.tasksCompleted}
- Longest habit streak: ${stats.longestStreak} days
- Photos captured: ${stats.photosCount}

GOALS:
${JSON.stringify(goalSummaries, null, 2)}

JOURNAL EXCERPTS:
${JSON.stringify(journalExcerpts, null, 2)}

WEEK REVIEWS:
${JSON.stringify(weekReviewExcerpts, null, 2)}

VISION CONTEXT:
${data.vision ? `3-Year Vision: ${data.vision.vision_3_year}\nCore Values: ${data.vision.core_values}` : 'No vision statement set.'}

Generate a monthly recap with the following JSON structure. Be specific to this person's actual data:

{
  "headline": "A compelling, personal headline for the month (e.g., 'October 2024: The Month I Actually Finished What I Started')",
  "subheadline": "A key metric or insight as subheading (e.g., '23 days of morning pages, 4 major milestones, and the realization that consistency beats intensity')",
  "opening_reflection": "A 200-300 word narrative overview covering: overall theme, major wins, honest struggles, unexpected insights, how this month differed from previous ones",
  "goal_insights": [
    {"goal_title": "string", "insight": "2-3 sentence AI commentary on progress/patterns for this specific goal"}
  ],
  "habit_insights": "A paragraph about habit patterns, correlations you noticed, strengths/weaknesses by day of week, streak analysis",
  "biggest_win": {
    "title": "What was accomplished",
    "why_it_mattered": "Why it was significant",
    "narrative": "100-150 word celebration (without the cringe)"
  },
  "hardest_struggle": {
    "title": "What didn't go as planned",
    "lesson_learned": "What was learned",
    "narrative": "100-150 word honest reflection with forward-looking adaptation"
  },
  "unexpected_delight": {
    "title": "Something good that wasn't planned",
    "narrative": "50-100 words about serendipity or surprise"
  },
  "pull_quotes": ["1-2 meaningful quotes from the journal excerpts, if any stand out"],
  "looking_ahead": "2-3 paragraphs about: what to carry into next month, adjustments to make, one thing to remember. Grounded, not overly optimistic."
}

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      headline: parsed.headline || `${monthYear}: Your Month in Review`,
      subheadline: parsed.subheadline || `${stats.totalJournalEntries} journal entries, ${stats.habitCompletionRate}% habit completion`,
      sections: {
        opening_reflection: parsed.opening_reflection || '',
        goal_insights: parsed.goal_insights || [],
        habit_insights: parsed.habit_insights || '',
        biggest_win: parsed.biggest_win || null,
        hardest_struggle: parsed.hardest_struggle || null,
        unexpected_delight: parsed.unexpected_delight || null,
        pull_quotes: parsed.pull_quotes || [],
        looking_ahead: parsed.looking_ahead || '',
      },
    };
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Return fallback content
    return {
      headline: `${monthYear}: Your Month in Review`,
      subheadline: `${stats.totalJournalEntries} journal entries, ${stats.habitCompletionRate}% habit completion`,
      sections: {
        opening_reflection: `This month you wrote ${stats.totalJournalEntries} journal entries and maintained a ${stats.habitCompletionRate}% habit completion rate. You completed ${stats.tasksCompleted} tasks and spent ${stats.totalFocusMinutes} minutes in focused work sessions.`,
        goal_insights: [],
        habit_insights: `Your longest streak this month was ${stats.longestStreak} days.`,
        biggest_win: null,
        hardest_struggle: null,
        unexpected_delight: null,
        pull_quotes: [],
        looking_ahead: 'Continue building on the habits and systems that served you well this month.',
      },
    };
  }
}
