import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonthlyAuditRequest {
  month: string; // format: "2025-01"
}

interface PillarBreakdown {
  pillar: string;
  focusMinutes: number;
  tasksCompleted: number;
  calendarEvents: number;
  habitLogs: number;
  percentageOfTotal: number;
}

interface EditorialContent {
  headline: string;
  subheadline: string;
  opening: string;
  pullQuote: string;
  habitSection: string;
  focusSection: string;
  tradingSection: string;
  pillarSection: string;
  closing: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { month } = await req.json() as MonthlyAuditRequest;

    // Validate month format
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return new Response(JSON.stringify({ error: 'Invalid month format. Use YYYY-MM' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate month has ended
    const [year, monthNum] = month.split('-').map(Number);
    const monthEnd = new Date(year, monthNum, 0); // Last day of month
    const now = new Date();
    
    if (now <= monthEnd) {
      const daysLeft = Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return new Response(JSON.stringify({ 
        error: `Cannot generate audit until month ends. ${daysLeft} days remaining.` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startDate = `${month}-01`;
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${monthEnd.getDate()}`;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single();

    const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'User';

    // Aggregate all data for the month
    const [
      tradingData,
      focusData,
      habitData,
      tasksData,
      journalData,
      birdData,
      pillarFocusData,
      pillarTasksData,
      calendarPillarsData,
    ] = await Promise.all([
      // Trading P&L
      supabase
        .from('trading_pnl')
        .select('*')
        .eq('user_id', user.id)
        .gte('trade_date', startDate)
        .lte('trade_date', endDate),
      
      // Focus sessions
      supabase
        .from('focus_sessions')
        .select('actual_duration_minutes, pillar, objective')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('started_at', `${startDate}T00:00:00Z`)
        .lte('started_at', `${endDate}T23:59:59Z`),
      
      // Habit logs with tactic info
      supabase
        .from('tactic_logs')
        .select('*, goal_tactics(title, goal_id)')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .lte('logged_date', endDate),
      
      // Tasks completed
      supabase
        .from('quick_tasks')
        .select('id, pillar')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', `${startDate}T00:00:00Z`)
        .lte('completed_at', `${endDate}T23:59:59Z`),
      
      // Journal entries
      supabase
        .from('journal_entries')
        .select('user_notes, ai_daily_insight')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate),
      
      // Bird sightings
      supabase
        .from('bird_sightings')
        .select('species_name')
        .eq('user_id', user.id)
        .gte('sighting_date', startDate)
        .lte('sighting_date', endDate),
      
      // Focus sessions by pillar
      supabase
        .from('focus_sessions')
        .select('pillar, actual_duration_minutes')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('pillar', 'is', null)
        .gte('started_at', `${startDate}T00:00:00Z`)
        .lte('started_at', `${endDate}T23:59:59Z`),
      
      // Tasks by pillar
      supabase
        .from('quick_tasks')
        .select('pillar')
        .eq('user_id', user.id)
        .eq('completed', true)
        .not('pillar', 'is', null)
        .gte('completed_at', `${startDate}T00:00:00Z`)
        .lte('completed_at', `${endDate}T23:59:59Z`),
      
      // Calendar event pillars
      supabase
        .from('calendar_event_pillars')
        .select('pillar')
        .eq('user_id', user.id),
    ]);

    // Calculate stats
    const trading = tradingData.data || [];
    const focus = focusData.data || [];
    const habits = habitData.data || [];
    const tasks = tasksData.data || [];
    const journal = journalData.data || [];
    const birds = birdData.data || [];

    const totalPnL = trading.reduce((sum, t) => sum + Number(t.pnl_amount), 0);
    const winningDays = trading.filter(t => Number(t.pnl_amount) > 0).length;
    const winRate = trading.length > 0 ? Math.round((winningDays / trading.length) * 100) : 0;
    
    const focusMinutes = focus.reduce((sum, f) => sum + (f.actual_duration_minutes || 0), 0);
    const focusSessions = focus.length;
    
    const habitLogs = habits.length;
    const habitCounts: Record<string, number> = {};
    habits.forEach(h => {
      const title = (h.goal_tactics as any)?.title || 'Unknown';
      habitCounts[title] = (habitCounts[title] || 0) + h.completed_count;
    });
    const topHabits = Object.entries(habitCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const uniqueSpecies = [...new Set(birds.map(b => b.species_name))];

    // Calculate PRIMED pillar breakdown
    const pillars = ['physical', 'relations', 'income', 'mental', 'excellence', 'direction'];
    const pillarData: Record<string, PillarBreakdown> = {};
    
    pillars.forEach(pillar => {
      pillarData[pillar] = {
        pillar,
        focusMinutes: 0,
        tasksCompleted: 0,
        calendarEvents: 0,
        habitLogs: 0,
        percentageOfTotal: 0,
      };
    });

    // Aggregate focus by pillar
    (pillarFocusData.data || []).forEach(f => {
      if (f.pillar && pillarData[f.pillar]) {
        pillarData[f.pillar].focusMinutes += f.actual_duration_minutes || 0;
      }
    });

    // Aggregate tasks by pillar
    (pillarTasksData.data || []).forEach(t => {
      if (t.pillar && pillarData[t.pillar]) {
        pillarData[t.pillar].tasksCompleted += 1;
      }
    });

    // Aggregate calendar events by pillar
    (calendarPillarsData.data || []).forEach(c => {
      if (c.pillar && pillarData[c.pillar]) {
        pillarData[c.pillar].calendarEvents += 1;
      }
    });

    // Calculate total effort and percentages
    const totalEffort = Object.values(pillarData).reduce(
      (sum, p) => sum + p.focusMinutes + (p.tasksCompleted * 10) + (p.calendarEvents * 15) + (p.habitLogs * 5),
      0
    );

    Object.values(pillarData).forEach(p => {
      const effort = p.focusMinutes + (p.tasksCompleted * 10) + (p.calendarEvents * 15) + (p.habitLogs * 5);
      p.percentageOfTotal = totalEffort > 0 ? Math.round((effort / totalEffort) * 100) : 0;
    });

    const pillarBreakdown = Object.values(pillarData).sort((a, b) => b.percentageOfTotal - a.percentageOfTotal);
    const mostActivePillar = pillarBreakdown[0]?.pillar || 'none';
    const leastActivePillar = pillarBreakdown.filter(p => p.percentageOfTotal > 0).pop()?.pillar || 'none';

    // Generate AI editorial content
    const monthLabel = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const prompt = `You are a financial columnist with a dry, witty voice (think Matt Levine of Money Stuff). 
Write a monthly performance review for a productivity-obsessed individual named ${displayName}.

Data for ${monthLabel}:
- Trading P&L: $${totalPnL.toLocaleString()}, ${winRate}% win rate across ${trading.length} trading days
- Focus sessions: ${Math.round(focusMinutes / 60)} hours across ${focusSessions} sessions
- Habits completed: ${habitLogs} logs, top habit: ${topHabits[0]?.[0] || 'none tracked'}
- Birds spotted: ${uniqueSpecies.length} species, ${birds.length} total sightings
- Tasks completed: ${tasks.length}
- Journal entries: ${journal.length}
- PRIMED balance: Most active pillar: ${mostActivePillar}, Least active: ${leastActivePillar}

Generate a JSON object with exactly these fields (all strings, no nested objects):
{
  "headline": "A provocative, clever headline (max 15 words)",
  "subheadline": "A summary line with key stats (max 30 words)",
  "opening": "An opening paragraph that deserves a drop cap. Brutally honest but ultimately encouraging. Reference specific data. (50-80 words)",
  "pullQuote": "A memorable, quotable line from your editorial (max 20 words)",
  "habitSection": "Analysis of habit performance with dry wit. Reference the data. (40-60 words)",
  "focusSection": "Analysis of deep work and focus time. Be specific with numbers. (40-60 words)",
  "tradingSection": "Commentary on trading performance. Even if negative, find something instructive. (40-60 words)",
  "pillarSection": "Analysis of PRIMED pillar balance. Note which areas got attention and which were neglected. (40-60 words)",
  "closing": "A forward-looking closing. The market doesn't care about goals, but showing up anyway matters. (30-50 words)"
}

Return ONLY valid JSON, no markdown, no explanation.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
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

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      throw new Error('Failed to generate editorial content');
    }

    const aiData = await aiResponse.json();
    const contentText = aiData.choices?.[0]?.message?.content || '{}';
    
    // Parse AI response (handle potential markdown code blocks)
    let editorial: EditorialContent;
    try {
      const cleanedContent = contentText.replace(/```json\n?|\n?```/g, '').trim();
      editorial = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse AI response:', contentText);
      // Fallback editorial
      editorial = {
        headline: `The ${monthLabel} Audit: A Data-Driven Reckoning`,
        subheadline: `${trading.length} trading days. ${Math.round(focusMinutes / 60)} hours of focus. ${tasks.length} tasks completed. The numbers don't lie.`,
        opening: `${monthLabel} has come and gone, leaving behind a trail of data points that tell a story. Whether it's a story of triumph or gentle humbling depends on your perspective and perhaps your expectations going in.`,
        pullQuote: "The data doesn't care about your intentions. It only knows what you did.",
        habitSection: `Habit tracking recorded ${habitLogs} completions this month. ${topHabits[0] ? `${topHabits[0][0]} led the way.` : 'The tracking system awaits more input.'}`,
        focusSection: `${focusSessions} focus sessions totaling ${Math.round(focusMinutes / 60)} hours. That's roughly ${Math.round(focusMinutes / 60 / 30 * 100)}% of a theoretical 30-hour deep work month.`,
        tradingSection: totalPnL >= 0 
          ? `The portfolio ended ${monthLabel} up $${totalPnL.toLocaleString()} with a ${winRate}% win rate. Not bad. Not legendary. Somewhere in the middle where most of life happens.`
          : `The portfolio experienced a $${Math.abs(totalPnL).toLocaleString()} drawdown. Markets teach expensive lessons, but they teach them well.`,
        pillarSection: `PRIMED analysis shows ${mostActivePillar} received the most attention this month, while ${leastActivePillar} was relatively neglected. Balance is aspirational.`,
        closing: `Another month in the books. The spreadsheets are saved, the habits logged, the birds counted. Tomorrow we do it all again.`,
      };
    }

    // Generate unique slug
    const slug = `${month}-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;

    // Create stats snapshot
    const statsSnapshot = {
      trading: {
        totalPnL,
        winRate,
        tradingDays: trading.length,
      },
      focus: {
        totalMinutes: focusMinutes,
        sessions: focusSessions,
        avgSessionLength: focusSessions > 0 ? Math.round(focusMinutes / focusSessions) : 0,
      },
      habits: {
        totalLogs: habitLogs,
        topHabits: topHabits.map(([name, count]) => ({ name, completions: count })),
      },
      tasks: {
        completed: tasks.length,
      },
      journal: {
        entries: journal.length,
      },
      birds: {
        species: uniqueSpecies.length,
        sightings: birds.length,
        speciesList: uniqueSpecies,
      },
    };

    const pillarAnalytics = {
      breakdown: pillarBreakdown,
      mostActivePillar,
      leastActivePillar,
      totalEffort,
    };

    // Upsert the audit record
    const { data: audit, error: upsertError } = await supabase
      .from('monthly_audits')
      .upsert({
        user_id: user.id,
        month: `${month}-01`,
        display_name: displayName,
        editorial_content: editorial,
        stats_snapshot: statsSnapshot,
        pillar_analytics: pillarAnalytics,
        status: 'draft',
        privacy: 'private',
        slug,
      }, {
        onConflict: 'user_id,month',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Database error:', upsertError);
      throw new Error('Failed to save audit');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      audit,
      message: `${monthLabel} audit generated successfully` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating audit:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});