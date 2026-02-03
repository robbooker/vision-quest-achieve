import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchUserContext(supabase: any, userId: string): Promise<string> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
  
  console.log(`Fetching context for user ${userId}...`);

  // Fetch all data in parallel
  const [
    goalsResult,
    cyclesResult,
    tasksResult,
    focusResult,
    journalResult,
    visionResult,
    tradingResult,
    habitsResult,
    sleepResult,
    primedResult,
    profileResult,
    bigTenResult,
    hardQuestionsResult,
    resetAuditsResult,
    nutritionResult,
    calendarPillarsResult,
    healthMeasurementsResult,
  ] = await Promise.all([
    supabase.from('goals').select('*, milestones(*)').eq('user_id', userId),
    supabase.from('cycles').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('quick_tasks').select('*').eq('user_id', userId).gte('created_at', thirtyDaysAgoStr).order('created_at', { ascending: false }).limit(100),
    supabase.from('focus_sessions').select('*').eq('user_id', userId).gte('started_at', thirtyDaysAgoStr).order('started_at', { ascending: false }).limit(50),
    supabase.from('journal_entries').select('*').eq('user_id', userId).gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0]).order('entry_date', { ascending: false }).limit(30),
    supabase.from('user_vision').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('trading_pnl').select('*').eq('user_id', userId).gte('trade_date', thirtyDaysAgo.toISOString().split('T')[0]).order('trade_date', { ascending: false }).limit(30),
    supabase.from('tactic_logs').select('*, goal_tactics(title, goal_id), goals:goal_tactics(goals(pillar))').eq('user_id', userId).gte('logged_date', thirtyDaysAgo.toISOString().split('T')[0]).order('logged_date', { ascending: false }).limit(100),
    supabase.from('oura_daily_metrics').select('*').eq('user_id', userId).gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0]).order('metric_date', { ascending: false }).limit(30),
    supabase.from('primed_assessments').select('*, primed_assessment_behaviors(*)').eq('user_id', userId).order('assessed_at', { ascending: false }).limit(1),
    supabase.from('profiles').select('display_name, email').eq('user_id', userId).maybeSingle(),
    supabase.from('big_ten_projects').select('*, big_ten_tasks(*)').eq('user_id', userId).order('position', { ascending: true }),
    supabase.from('hard_question_answers').select('*').eq('user_id', userId),
    supabase.from('reset_audits').select('*').eq('user_id', userId).gte('audit_date', thirtyDaysAgo.toISOString().split('T')[0]).order('audit_date', { ascending: false }).limit(14),
    supabase.from('daily_nutrition').select('*').eq('user_id', userId).gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0]).order('entry_date', { ascending: false }).limit(30),
    supabase.from('calendar_event_pillars').select('*').eq('user_id', userId).gte('created_at', thirtyDaysAgoStr).limit(100),
    supabase.from('health_measurements').select('*').eq('user_id', userId).gte('measured_at', thirtyDaysAgoStr).order('measured_at', { ascending: false }).limit(50),
  ]);

  // Log what we got
  console.log('Data fetch results:', {
    goals: goalsResult.data?.length || 0,
    cycles: cyclesResult.data?.length || 0,
    tasks: tasksResult.data?.length || 0,
    focus: focusResult.data?.length || 0,
    journal: journalResult.data?.length || 0,
    vision: visionResult.data ? 1 : 0,
    trading: tradingResult.data?.length || 0,
    habits: habitsResult.data?.length || 0,
    sleep: sleepResult.data?.length || 0,
    primed: primedResult.data?.length || 0,
    profile: profileResult.data ? 1 : 0,
    bigTen: bigTenResult.data?.length || 0,
    hardQuestions: hardQuestionsResult.data?.length || 0,
    resetAudits: resetAuditsResult.data?.length || 0,
    nutrition: nutritionResult.data?.length || 0,
    calendarPillars: calendarPillarsResult.data?.length || 0,
    healthMeasurements: healthMeasurementsResult.data?.length || 0,
  });

  let context = '';
  
  // User profile
  if (profileResult.data) {
    const p = profileResult.data;
    context += `👤 USER: ${p.display_name || 'Unknown'}\n`;
  }

  // Active cycle
  const activeCycle = cyclesResult.data?.find((c: any) => c.status === 'active');
  if (activeCycle) {
    const weekNum = Math.floor((now.getTime() - new Date(activeCycle.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    context += `\n📅 ACTIVE CYCLE: "${activeCycle.name}" (Week ${Math.min(weekNum, 8)} of 8)\n`;
    context += `Start: ${activeCycle.start_date} | End: ${activeCycle.end_date}\n`;
  }

  // Vision & Values
  if (visionResult.data) {
    context += `\n🔮 VISION & VALUES:\n`;
    if (visionResult.data.vision_3_year) context += `3-Year Vision: ${visionResult.data.vision_3_year}\n`;
    if (visionResult.data.vision_long_term) context += `Long-term Vision: ${visionResult.data.vision_long_term}\n`;
    if (visionResult.data.core_values) context += `Core Values: ${visionResult.data.core_values}\n`;
  }

  // Hard Questions (deep self-reflection)
  if (hardQuestionsResult.data && hardQuestionsResult.data.length > 0) {
    context += `\n💭 HARD QUESTIONS (Self-Reflection):\n`;
    hardQuestionsResult.data.forEach((q: any) => {
      if (q.answer) {
        context += `Q: ${q.question_key}\nA: ${q.answer.substring(0, 500)}${q.answer.length > 500 ? '...' : ''}\n\n`;
      }
    });
  }

  // Goals with milestones
  if (goalsResult.data && goalsResult.data.length > 0) {
    context += `\n🎯 GOALS (${goalsResult.data.length} total):\n`;
    goalsResult.data.forEach((goal: any) => {
      context += `- "${goal.title}" | Type: ${goal.goal_type} | Target: ${goal.target_value} ${goal.metric_type} | Pillar: ${goal.pillar || 'none'}\n`;
      if (goal.why) context += `  Why: ${goal.why}\n`;
      if (goal.vision_connection) context += `  Vision Connection: ${goal.vision_connection}\n`;
      if (goal.obstacles) context += `  Obstacles: ${goal.obstacles}\n`;
      if (goal.strategies) context += `  Strategies: ${goal.strategies}\n`;
      if (goal.milestones?.length > 0) {
        goal.milestones.slice(0, 5).forEach((m: any) => {
          context += `  → Week ${m.week_number}: ${m.target_value}${m.description ? ` - ${m.description}` : ''}\n`;
        });
      }
    });
  }

  // Big Ten Projects
  if (bigTenResult.data && bigTenResult.data.length > 0) {
    context += `\n🏆 BIG TEN PROJECTS:\n`;
    bigTenResult.data.forEach((p: any) => {
      const status = p.completed ? '✅' : '⏳';
      context += `${status} "${p.title}" | Pillar: ${p.pillar || 'none'}`;
      if (p.target_date) context += ` | Due: ${p.target_date}`;
      context += '\n';
      if (p.big_ten_tasks?.length > 0) {
        const completed = p.big_ten_tasks.filter((t: any) => t.completed).length;
        context += `   Tasks: ${completed}/${p.big_ten_tasks.length} completed\n`;
      }
    });
  }

  // Tasks - Include full details for pillar inference
  if (tasksResult.data && tasksResult.data.length > 0) {
    const completed = tasksResult.data.filter((t: any) => t.completed);
    const pending = tasksResult.data.filter((t: any) => !t.completed);
    context += `\n✅ TASKS (30 days): ${completed.length} completed, ${pending.length} pending\n`;
    
    // Group by inferred pillar based on task content
    context += `Recent completed tasks:\n`;
    completed.slice(0, 20).forEach((t: any) => {
      const dateStr = t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '';
      context += `- ${dateStr}: "${t.title}"${t.notes ? ` (${t.notes.substring(0, 50)})` : ''}\n`;
    });
    
    if (pending.length > 0) {
      context += `Pending tasks:\n`;
      pending.slice(0, 10).forEach((t: any) => {
        context += `- "${t.title}"${t.priority ? ` [${t.priority}]` : ''}\n`;
      });
    }
  }

  // Calendar Event Pillars - Shows what activities mapped to which pillars
  if (calendarPillarsResult.data && calendarPillarsResult.data.length > 0) {
    context += `\n📅 CALENDAR ACTIVITIES BY PILLAR (30 days):\n`;
    const byPillar: Record<string, number> = {};
    calendarPillarsResult.data.forEach((cp: any) => {
      byPillar[cp.pillar] = (byPillar[cp.pillar] || 0) + 1;
    });
    Object.entries(byPillar).forEach(([pillar, count]) => {
      context += `- ${pillar}: ${count} activities\n`;
    });
  }

  // Health Measurements (Physical pillar evidence)
  if (healthMeasurementsResult.data && healthMeasurementsResult.data.length > 0) {
    context += `\n💪 HEALTH MEASUREMENTS (Physical Pillar):\n`;
    const byType: Record<string, any[]> = {};
    healthMeasurementsResult.data.forEach((h: any) => {
      if (!byType[h.measurement_type]) byType[h.measurement_type] = [];
      byType[h.measurement_type].push(h);
    });
    Object.entries(byType).forEach(([type, measurements]) => {
      const latest = measurements[0];
      context += `- ${type}: Latest ${latest.primary_value}${latest.secondary_value ? `/${latest.secondary_value}` : ''} ${latest.unit} (${measurements.length} readings)\n`;
    });
  }

  // Focus sessions
  if (focusResult.data && focusResult.data.length > 0) {
    const totalMinutes = focusResult.data.reduce((sum: number, s: any) => sum + (s.actual_duration_minutes || 0), 0);
    const completedSessions = focusResult.data.filter((s: any) => s.status === 'completed');
    context += `\n🧘 FOCUS SESSIONS (30 days): ${completedSessions.length} sessions, ${totalMinutes} minutes total\n`;
    context += `Recent sessions:\n`;
    focusResult.data.slice(0, 10).forEach((s: any) => {
      context += `- ${s.objective} (${s.actual_duration_minutes || s.planned_duration_minutes}m, ${s.status}, pillar: ${s.pillar || 'none'})${s.rating ? ` - Rating: ${s.rating}` : ''}\n`;
    });
  }

  // Trading P&L
  if (tradingResult.data && tradingResult.data.length > 0) {
    const totalPnL = tradingResult.data.reduce((sum: number, p: any) => sum + Number(p.pnl_amount), 0);
    const winningDays = tradingResult.data.filter((p: any) => Number(p.pnl_amount) > 0).length;
    context += `\n📈 TRADING P&L (30 days): $${totalPnL.toFixed(2)} total, ${winningDays}/${tradingResult.data.length} winning days\n`;
    tradingResult.data.slice(0, 10).forEach((p: any) => {
      const amt = Number(p.pnl_amount);
      context += `${amt >= 0 ? '🟢' : '🔴'} ${p.trade_date}: $${amt.toFixed(2)}${p.notes ? ` - ${p.notes}` : ''}\n`;
    });
  }

  // Sleep/Oura
  if (sleepResult.data && sleepResult.data.length > 0) {
    context += `\n😴 SLEEP/BIOMETRICS (30 days):\n`;
    sleepResult.data.slice(0, 10).forEach((s: any) => {
      const sleepHours = s.total_sleep_seconds ? (s.total_sleep_seconds / 3600).toFixed(1) : 'N/A';
      context += `${s.metric_date}: Sleep ${sleepHours}h, Score ${s.sleep_score || 'N/A'}, Readiness ${s.readiness_score || 'N/A'}, HRV ${s.hrv_balance || 'N/A'}, Steps ${s.steps || 'N/A'}\n`;
    });
    
    // Calculate averages
    const avgSleep = sleepResult.data.reduce((sum: number, s: any) => sum + (s.total_sleep_seconds || 0), 0) / sleepResult.data.length / 3600;
    const avgReadiness = sleepResult.data.filter((s: any) => s.readiness_score).reduce((sum: number, s: any) => sum + s.readiness_score, 0) / sleepResult.data.filter((s: any) => s.readiness_score).length || 0;
    context += `Averages: ${avgSleep.toFixed(1)}h sleep, ${avgReadiness.toFixed(0)} readiness\n`;
  }

  // Habits
  if (habitsResult.data && habitsResult.data.length > 0) {
    context += `\n🔄 HABIT LOGS (30 days): ${habitsResult.data.length} logs\n`;
    const habitsByName: Record<string, number> = {};
    habitsResult.data.forEach((h: any) => {
      const name = h.goal_tactics?.title || 'Unknown';
      habitsByName[name] = (habitsByName[name] || 0) + (h.completed_count || 1);
    });
    Object.entries(habitsByName).slice(0, 10).forEach(([name, count]) => {
      context += `- ${name}: ${count}x\n`;
    });
  }

  // Reset Audits (daily discipline tracking)
  if (resetAuditsResult.data && resetAuditsResult.data.length > 0) {
    context += `\n📋 RESET AUDITS (Daily Discipline, last 14 days):\n`;
    const rules = ['wake', 'move', 'work', 'read', 'input', 'sleep', 'fuel', 'reset'];
    const totals: Record<string, number> = {};
    rules.forEach(r => totals[r] = 0);
    
    resetAuditsResult.data.forEach((a: any) => {
      rules.forEach(r => {
        if (a[`rule_${r}`]) totals[r]++;
      });
    });
    
    context += `Compliance over ${resetAuditsResult.data.length} days:\n`;
    rules.forEach(r => {
      const pct = Math.round((totals[r] / resetAuditsResult.data.length) * 100);
      context += `- ${r.toUpperCase()}: ${totals[r]}/${resetAuditsResult.data.length} (${pct}%)\n`;
    });
  }

  // Nutrition
  if (nutritionResult.data && nutritionResult.data.length > 0) {
    const avgCalories = nutritionResult.data.reduce((sum: number, n: any) => sum + (n.calories || 0), 0) / nutritionResult.data.length;
    const avgProtein = nutritionResult.data.reduce((sum: number, n: any) => sum + (n.protein_g || 0), 0) / nutritionResult.data.length;
    context += `\n🍎 NUTRITION (30 days): ${nutritionResult.data.length} logged meals\n`;
    context += `Average per meal: ${avgCalories.toFixed(0)} cal, ${avgProtein.toFixed(0)}g protein\n`;
  }

  // Journal entries
  if (journalResult.data && journalResult.data.length > 0) {
    context += `\n📔 JOURNAL ENTRIES (30 days): ${journalResult.data.length} entries\n`;
    journalResult.data.slice(0, 7).forEach((j: any) => {
      context += `${j.entry_date}: `;
      if (j.user_notes) context += `"${j.user_notes.substring(0, 200)}${j.user_notes.length > 200 ? '...' : ''}" `;
      if (j.intention_score) context += `[Intention Score: ${j.intention_score}/10] `;
      if (j.intention_reflection) context += `Reflection: ${j.intention_reflection.substring(0, 100)}...`;
      context += '\n';
    });
  }

  // PRIMED assessment
  if (primedResult.data && primedResult.data.length > 0) {
    const assessment = primedResult.data[0];
    context += `\n🎯 PRIMED PILLAR LEVELS (latest assessment ${assessment.assessed_at}):\n`;
    context += `Physical: ${assessment.physical_level}/10, Relations: ${assessment.relations_level}/10, Income: ${assessment.income_level}/10\n`;
    context += `Mental: ${assessment.mental_level}/10, Excellence: ${assessment.excellence_level}/10, Direction: ${assessment.direction_level}/10\n`;
    if (assessment.ai_notes) context += `AI Notes: ${assessment.ai_notes}\n`;
  }

  console.log(`Context built: ${context.length} characters`);
  return context;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, turn, topic, userId } = await req.json();
    
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!userId) {
      throw new Error("userId is required");
    }
    
    // Validate turn and required keys
    if (turn === 'claude' && !ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    if (turn === 'gemini' && !GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Fetch user's complete data context server-side
    const fullContext = await fetchUserContext(supabase, userId);
    
    if (!fullContext || fullContext.length < 50) {
      console.log("Warning: Very little context data found for user");
    }

    const otherAI = turn === 'claude' ? 'Gemini' : 'Claude';
    const aiName = turn === 'claude' ? 'Claude' : 'Gemini';

    const systemPrompt = `You are participating in a live, autonomous debate with ${otherAI} about a user's personal data and life.

YOUR IDENTITY: You are ${aiName}.
YOUR DEBATE PARTNER: ${otherAI}

CONVERSATION TOPIC: "${topic}"

YOUR COMMUNICATION STYLE:
- Conversational and intellectually engaging
- Reference SPECIFIC data points - dates, numbers, patterns, session names
- Agree or disagree naturally - you have your own perspective and personality
- Ask ${otherAI} questions occasionally to keep the debate dynamic
- Keep responses 1-3 paragraphs for good pacing (this is a live debate)
- You may go on tangents if something genuinely interesting comes up in the data
- When the human (Host) interjects, address them directly and warmly
- Be insightful and occasionally provocative in your observations
- Don't just summarize data - interpret it, find patterns, make predictions

PERSONALITY NOTES:
${turn === 'claude' ? `As Claude, you tend to be:
- More philosophical and nuanced
- Focused on deeper meaning and motivations
- Curious about the "why" behind patterns
- Gentle but honest when pointing out contradictions` : `As Gemini, you tend to be:
- More analytical and pattern-focused
- Quick to spot correlations and trends
- Direct and sometimes bold in observations
- Interested in optimization and improvement`}

THE USER'S COMPLETE GROOVYPLANNING DATA:
${fullContext}

IMPORTANT: You HAVE access to this user's real data above. Reference specific details, dates, goals, and metrics. Do not say you don't have data - you do!

Remember: This conversation can go ANYWHERE. If ${otherAI} brings up something tangential, explore it. If you notice something unexpected in the data, mention it. The goal is genuine insight and interesting dialogue, not a formal report.`;

    let streamResponse: Response;

    if (turn === 'claude') {
      // Call Anthropic API
      const formattedMessages = [];
      for (const msg of messages) {
        if (msg.role === 'host') {
          formattedMessages.push({ role: 'user', content: `[Host/Human]: ${msg.content}` });
        } else if (msg.role === 'gemini') {
          formattedMessages.push({ role: 'user', content: `[Gemini]: ${msg.content}` });
        } else if (msg.role === 'claude') {
          formattedMessages.push({ role: 'assistant', content: msg.content });
        }
      }

      // If no messages yet or last was not assistant, we need a user message
      if (formattedMessages.length === 0) {
        formattedMessages.push({ role: 'user', content: `Begin the debate about: ${topic}. Reference specific data from the user's GroovyPlanning context in your response.` });
      } else if (formattedMessages[formattedMessages.length - 1].role === 'assistant') {
        formattedMessages.push({ role: 'user', content: 'Continue the debate with your thoughts.' });
      }

      streamResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: formattedMessages,
          stream: true,
        }),
      });
    } else {
      // Call Google AI API
      const geminiMessages = [];
      
      for (const msg of messages) {
        if (msg.role === 'host') {
          geminiMessages.push({ role: 'user', parts: [{ text: `[Host/Human]: ${msg.content}` }] });
        } else if (msg.role === 'claude') {
          geminiMessages.push({ role: 'user', parts: [{ text: `[Claude]: ${msg.content}` }] });
        } else if (msg.role === 'gemini') {
          geminiMessages.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }

      if (geminiMessages.length === 0) {
        geminiMessages.push({ role: 'user', parts: [{ text: `Begin the debate about: ${topic}. Reference specific data from the user's GroovyPlanning context in your response.` }] });
      } else if (geminiMessages[geminiMessages.length - 1].role === 'model') {
        geminiMessages.push({ role: 'user', parts: [{ text: 'Continue the debate with your thoughts.' }] });
      }

      streamResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: 1024,
            },
          }),
        }
      );
    }

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error(`${turn} API error:`, streamResponse.status, errorText);
      
      if (streamResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: `${aiName} API error: ${streamResponse.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the stream to the client
    return new Response(streamResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("AI Arena error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});