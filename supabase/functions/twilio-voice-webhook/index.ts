import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

// AI tools for voice commands - comprehensive set for smart Toasty
const voiceTools = [
  // === DATA LOGGING TOOLS ===
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task for the user. Use when they say things like 'add a task', 'remind me to', 'create a task for', etc.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title/description of the task to create" },
          category: { type: "string", enum: ["personal", "work"], description: "The category of the task. Default to 'personal' unless work-related." }
        },
        required: ["title"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "complete_task",
      description: "Mark a task as complete. Use when they say 'complete', 'done', 'finished', 'mark as done', etc.",
      parameters: {
        type: "object",
        properties: {
          task_title: { type: "string", description: "The title or partial title of the task to complete (will match closest)" }
        },
        required: ["task_title"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "List the user's pending tasks. Use when they ask 'what are my tasks', 'what do I need to do', etc.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of tasks to list. Default 5." }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_habit",
      description: "Log a habit/tactic completion. Use when they say 'log meditation', 'did my workout', 'did 50 pushups', etc.",
      parameters: {
        type: "object",
        properties: {
          habit_name: { type: "string", description: "The name of the habit to log (will match closest)" },
          count: { type: "number", description: "Number of times completed. Default 1." }
        },
        required: ["habit_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_weight",
      description: "Log the user's weight. Use when they say 'log my weight', 'I weigh 185', 'weight is 180 pounds', etc.",
      parameters: {
        type: "object",
        properties: {
          weight: { type: "number", description: "Weight value" },
          unit: { type: "string", enum: ["lbs", "kg"], description: "Unit, defaults to lbs" }
        },
        required: ["weight"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_blood_pressure",
      description: "Log blood pressure. Use when they say 'BP is 120 over 80', 'blood pressure 115/75', etc.",
      parameters: {
        type: "object",
        properties: {
          systolic: { type: "number", description: "Systolic (top number)" },
          diastolic: { type: "number", description: "Diastolic (bottom number)" }
        },
        required: ["systolic", "diastolic"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_sleep",
      description: "Log manual sleep. Use when they say 'I slept 7 hours', 'got 8 hours of sleep', etc.",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "number", description: "Total sleep hours" },
          quality: { type: "number", description: "Quality 1-5, optional" }
        },
        required: ["hours"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_nap",
      description: "Log a nap. Use when they say 'took a 20 minute nap', 'napped for half hour', etc.",
      parameters: {
        type: "object",
        properties: {
          minutes: { type: "number", description: "Nap duration in minutes" }
        },
        required: ["minutes"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_meal",
      description: "Log a meal. Use when they describe food like 'had 2 eggs and toast for breakfast', 'ate a salad for lunch'.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Meal description" },
          meal_type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"], description: "Type of meal" }
        },
        required: ["description"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_water",
      description: "Log water intake. Use when they say 'drank 16oz water', 'had a glass of water', 'log 500ml water', etc.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount of water" },
          unit: { type: "string", enum: ["oz", "ml", "cups"], description: "Unit, defaults to oz" }
        },
        required: ["amount"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "toggle_reset_rule",
      description: "Toggle a Reset Audit rule. Rules: wake, move, work, read, input, sleep, fuel, reset. Use when they say 'mark wake as done', 'completed my workout', 'did my reading', etc.",
      parameters: {
        type: "object",
        properties: {
          rule: { type: "string", enum: ["wake", "move", "work", "read", "input", "sleep", "fuel", "reset"], description: "Which rule to toggle" },
          completed: { type: "boolean", description: "Whether completed, defaults to true" }
        },
        required: ["rule"],
        additionalProperties: false
      }
    }
  },
  // === READ-ONLY INSIGHT TOOLS ===
  {
    type: "function" as const,
    function: {
      name: "get_goal_progress",
      description: "Get progress on the user's goals. Use when they ask 'how am I doing on my goals', 'what's my progress', 'goal update', etc.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_weekly_summary",
      description: "Get a summary of the user's week. Use when they ask 'how was my week', 'what did I accomplish', 'weekly recap', etc.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_daily_briefing",
      description: "Get a daily briefing with priorities, habits, cycle status, and insights. Use when they ask 'give me my briefing', 'what's on my plate', 'daily update', etc.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_reset_status",
      description: "Get Reset Audit status. Use when they ask 'what's my reset score', 'how's my reset going', 'which rules are done', etc.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_cumulative_habit_progress",
      description: "Get cumulative progress on habits/tactics. Use for questions like 'how many pushups did I do this month', 'total meditation time', 'exercise count this week', etc.",
      parameters: {
        type: "object",
        properties: {
          habit_name: { type: "string", description: "Name of the habit (e.g., 'pushups', 'meditation')" },
          period: { type: "string", enum: ["today", "week", "month", "year", "all"], description: "Time period for aggregation. Default 'month'." }
        },
        required: ["habit_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_sleep_insights",
      description: "Get sleep insights and trends. Use when they ask 'how's my sleep', 'sleep score', 'average sleep', 'sleep trends', etc.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to analyze. Default 30." }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_activity_insights",
      description: "Get activity insights: steps, calories, movement. Use when they ask 'how many steps', 'activity level', 'am I moving enough', etc.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to analyze. Default 7." }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_heart_rate_insights",
      description: "Get heart rate insights: RHR, HRV, trends. Use when they ask 'resting heart rate', 'HRV', 'heart health', etc.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to analyze. Default 14." }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_habit_streaks",
      description: "Get habit streaks and totals for all habits. Use when they ask 'what are my streaks', 'habit consistency', 'how consistent am I', etc.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_focus_insights",
      description: "Get focus session insights: total time, sessions, trends. Use when they ask 'focus time', 'deep work hours', 'productivity stats', etc.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to analyze. Default 30." }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_nutrition_summary",
      description: "Get nutrition summary: calories, protein, macros. Use when they ask 'how are my macros', 'calorie intake', 'protein today', 'nutrition stats', etc.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to analyze. Default 7." }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "search_history",
      description: "Search the user's history for relevant context. Use when they ask 'when did I...', 'have I ever...', 'what did I say about...', 'remember when...', 'find entries about...'. Searches journal entries, tasks, habits, focus sessions, and more.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What to search for in the user's history" },
          limit: { type: "number", description: "Number of results, default 5" }
        },
        required: ["query"],
        additionalProperties: false
      }
    }
  }
];

// Validate Twilio request signature using Web Crypto API
async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  try {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => key + params[key])
      .join('');
    
    const data = url + sortedParams;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(authToken);
    const dataBytes = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, dataBytes);
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    return computedSignature === signature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

// Generate TwiML response
function twiml(content: string): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`,
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    }
  );
}

// Say with a natural voice
function say(text: string, voice = 'Polly.Joanna'): string {
  return `<Say voice="${voice}">${escapeXml(text)}</Say>`;
}

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Gather speech input
function gather(action: string, prompt: string, timeout = 5): string {
  return `
    <Gather input="speech" action="${action}" timeout="${timeout}" speechTimeout="auto" language="en-US">
      ${prompt ? say(prompt) : ''}
    </Gather>
    ${say("I didn't catch that. Please try again.")}
    <Redirect>${action}</Redirect>
  `;
}

// Interface for conversation messages
interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Execute tool calls
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: any,
  userId: string,
  LOVABLE_API_KEY: string
): Promise<string> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  switch (toolName) {
    case 'create_task': {
      const { title, category = 'personal' } = args as { title: string; category?: string };
      const { error } = await supabase
        .from('quick_tasks')
        .insert({ user_id: userId, title, category, position: 0 });
      
      if (error) return `Failed to create task: ${error.message}`;
      return `Created task: "${title}"`;
    }
    
    case 'complete_task': {
      const { task_title } = args as { task_title: string };
      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('id, title')
        .eq('user_id', userId)
        .eq('completed', false)
        .ilike('title', `%${task_title}%`)
        .limit(1);
      
      if (!tasks?.length) return `Couldn't find a task matching "${task_title}"`;
      
      await supabase
        .from('quick_tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', tasks[0].id);
      
      return `Completed: "${tasks[0].title}"`;
    }
    
    case 'list_tasks': {
      const { limit = 5 } = args as { limit?: number };
      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('title, category, due_date')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('position')
        .limit(limit);
      
      if (!tasks?.length) return "No pending tasks. You're all caught up!";
      return `Your tasks: ${tasks.map((t: any, i: number) => `${i + 1}. ${t.title}`).join(', ')}`;
    }
    
    case 'log_habit': {
      const { habit_name, count = 1 } = args as { habit_name: string; count?: number };
      
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select('id, title')
        .eq('user_id', userId)
        .eq('is_active', true)
        .ilike('title', `%${habit_name}%`)
        .limit(1);
      
      if (!tactics?.length) return `Couldn't find a habit matching "${habit_name}"`;
      
      const { data: existingLog } = await supabase
        .from('tactic_logs')
        .select('id, completed_count')
        .eq('tactic_id', tactics[0].id)
        .eq('logged_date', todayStr)
        .maybeSingle();
      
      if (existingLog) {
        await supabase
          .from('tactic_logs')
          .update({ completed_count: existingLog.completed_count + count })
          .eq('id', existingLog.id);
        return `Updated "${tactics[0].title}" to ${existingLog.completed_count + count} today!`;
      } else {
        await supabase
          .from('tactic_logs')
          .insert({ user_id: userId, tactic_id: tactics[0].id, logged_date: todayStr, completed_count: count });
        return `Logged "${tactics[0].title}"${count > 1 ? ` (${count}x)` : ''}!`;
      }
    }
    
    case 'log_weight': {
      const { weight, unit = 'lbs' } = args as { weight: number; unit?: string };
      
      // Get previous weight for comparison
      const { data: lastWeight } = await supabase
        .from('health_measurements')
        .select('primary_value')
        .eq('user_id', userId)
        .eq('measurement_type', 'weight')
        .order('measured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      await supabase
        .from('health_measurements')
        .insert({
          user_id: userId,
          measurement_type: 'weight',
          primary_value: weight,
          unit: unit,
          measured_at: new Date().toISOString()
        });
      
      let response = `Logged weight at ${weight} ${unit}`;
      if (lastWeight) {
        const diff = weight - lastWeight.primary_value;
        if (Math.abs(diff) >= 0.1) {
          response += diff < 0 
            ? `. That's down ${Math.abs(diff).toFixed(1)} from your last measurement!`
            : `. That's up ${diff.toFixed(1)} from your last measurement.`;
        }
      }
      return response;
    }
    
    case 'log_blood_pressure': {
      const { systolic, diastolic } = args as { systolic: number; diastolic: number };
      
      await supabase
        .from('health_measurements')
        .insert({
          user_id: userId,
          measurement_type: 'blood_pressure',
          primary_value: systolic,
          secondary_value: diastolic,
          unit: 'mmHg',
          measured_at: new Date().toISOString()
        });
      
      // Provide context on the reading
      let context = '';
      if (systolic < 120 && diastolic < 80) context = ' That\'s in the normal range!';
      else if (systolic < 130 && diastolic < 80) context = ' That\'s elevated but not high.';
      else if (systolic >= 130 || diastolic >= 80) context = ' That\'s a bit high, keep monitoring.';
      
      return `Logged blood pressure at ${systolic}/${diastolic}${context}`;
    }
    
    case 'log_sleep': {
      const { hours, quality } = args as { hours: number; quality?: number };
      
      const totalSeconds = Math.round(hours * 3600);
      const estimatedScore = quality ? quality * 20 : Math.min(100, Math.round(hours * 12.5));
      
      await supabase
        .from('oura_daily_metrics')
        .upsert({
          user_id: userId,
          metric_date: todayStr,
          total_sleep_seconds: totalSeconds,
          sleep_score: estimatedScore,
          manual_sleep_quality: quality || null,
          source: 'manual'
        }, { onConflict: 'user_id,metric_date' });
      
      return `Logged ${hours} hours of sleep${quality ? ` with quality ${quality}/5` : ''}. Sleep score estimated at ${estimatedScore}.`;
    }
    
    case 'log_nap': {
      const { minutes } = args as { minutes: number };
      
      // Get existing record or create new one
      const { data: existing } = await supabase
        .from('oura_daily_metrics')
        .select('id, nap_duration_minutes')
        .eq('user_id', userId)
        .eq('metric_date', todayStr)
        .maybeSingle();
      
      const totalNapMinutes = (existing?.nap_duration_minutes || 0) + minutes;
      
      await supabase
        .from('oura_daily_metrics')
        .upsert({
          user_id: userId,
          metric_date: todayStr,
          nap_duration_minutes: totalNapMinutes,
          source: existing?.id ? undefined : 'manual'
        }, { onConflict: 'user_id,metric_date' });
      
      return `Logged ${minutes} minute nap. Total nap time today: ${totalNapMinutes} minutes.`;
    }
    
    case 'log_meal': {
      const { description, meal_type } = args as { description: string; meal_type?: string };
      
      // Call parse-nutrition function to get macros
      try {
        const parseResponse = await supabase.functions.invoke('parse-nutrition', {
          body: { description, userId }
        });
        
        if (parseResponse.error) throw new Error(parseResponse.error.message);
        
        const parsed = parseResponse.data;
        return `Logged ${meal_type || 'meal'}: ${description}. Estimated ${parsed.calories || '?'} calories, ${parsed.protein_g || '?'}g protein.`;
      } catch (e) {
        // Fallback: just log the description without parsing
        await supabase
          .from('daily_nutrition')
          .insert({
            user_id: userId,
            entry_date: todayStr,
            meal_description: description,
            meal_type: meal_type || 'snack',
            source: 'voice'
          });
        return `Logged ${meal_type || 'meal'}: ${description}. I couldn't estimate the macros right now.`;
      }
    }
    
    case 'log_water': {
      const { amount, unit = 'oz' } = args as { amount: number; unit?: string };
      
      // Convert to ml for consistency
      let ml = amount;
      if (unit === 'oz') ml = Math.round(amount * 29.5735);
      else if (unit === 'cups') ml = Math.round(amount * 236.588);
      
      await supabase
        .from('daily_nutrition')
        .insert({
          user_id: userId,
          entry_date: todayStr,
          meal_description: `Water: ${amount} ${unit}`,
          water_ml: ml,
          source: 'voice'
        });
      
      // Get total water today
      const { data: waterLogs } = await supabase
        .from('daily_nutrition')
        .select('water_ml')
        .eq('user_id', userId)
        .eq('entry_date', todayStr)
        .not('water_ml', 'is', null);
      
      const totalMl = (waterLogs || []).reduce((sum: number, l: any) => sum + (l.water_ml || 0), 0);
      const totalOz = Math.round(totalMl / 29.5735);
      
      return `Logged ${amount} ${unit} of water. Total today: ${totalOz} oz.`;
    }
    
    case 'toggle_reset_rule': {
      const { rule, completed = true } = args as { rule: string; completed?: boolean };
      
      const ruleColumn = `rule_${rule}`;
      
      // Check if audit exists for today
      const { data: existing } = await supabase
        .from('reset_audits')
        .select('id')
        .eq('user_id', userId)
        .eq('audit_date', todayStr)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('reset_audits')
          .update({ [ruleColumn]: completed })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('reset_audits')
          .insert({
            user_id: userId,
            audit_date: todayStr,
            [ruleColumn]: completed
          });
      }
      
      return `${completed ? 'Checked off' : 'Unchecked'} ${rule} for today's reset audit!`;
    }
    
    case 'get_reset_status': {
      const { data: audit } = await supabase
        .from('reset_audits')
        .select('*')
        .eq('user_id', userId)
        .eq('audit_date', todayStr)
        .maybeSingle();
      
      if (!audit) return "No reset audit started today. Say 'mark wake as done' to start tracking!";
      
      const rules = ['wake', 'move', 'work', 'read', 'input', 'sleep', 'fuel', 'reset'];
      const completed = rules.filter(r => audit[`rule_${r}`]);
      const remaining = rules.filter(r => !audit[`rule_${r}`]);
      
      return `Reset audit: ${completed.length}/8 complete. Done: ${completed.join(', ') || 'none'}. Remaining: ${remaining.join(', ')}.`;
    }
    
    case 'get_cumulative_habit_progress': {
      const { habit_name, period = 'month' } = args as { habit_name: string; period?: string };
      
      // Find matching tactic
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select('id, title')
        .eq('user_id', userId)
        .ilike('title', `%${habit_name}%`)
        .limit(1);
      
      if (!tactics?.length) return `Couldn't find a habit matching "${habit_name}"`;
      
      // Calculate date range
      const now = new Date();
      let startDate: string | null = null;
      
      if (period === 'today') {
        startDate = todayStr;
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (period === 'month') {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      } else if (period === 'year') {
        startDate = `${now.getFullYear()}-01-01`;
      }
      
      // Query logs
      let query = supabase
        .from('tactic_logs')
        .select('completed_count, logged_date')
        .eq('tactic_id', tactics[0].id);
      
      if (startDate) query = query.gte('logged_date', startDate);
      
      const { data: logs } = await query;
      
      // Extract unit value from tactic title (e.g., "Do 10 pushups" → 10)
      const unitMatch = tactics[0].title.match(/(\d+)/);
      const unitValue = unitMatch ? parseInt(unitMatch[1], 10) : 1;
      
      const totalCount = (logs || []).reduce((sum: number, l: any) => sum + (l.completed_count || 0), 0);
      const totalUnits = totalCount * unitValue;
      const daysLogged = new Set((logs || []).map((l: any) => l.logged_date)).size;
      
      const periodLabels: Record<string, string> = {
        today: 'today',
        week: 'this week',
        month: 'this month',
        year: 'this year',
        all: 'all time'
      };
      
      // Try to identify the unit type from title
      const titleLower = tactics[0].title.toLowerCase();
      let unitName = 'times';
      if (titleLower.includes('pushup') || titleLower.includes('push-up')) unitName = 'pushups';
      else if (titleLower.includes('squat')) unitName = 'squats';
      else if (titleLower.includes('minute')) unitName = 'minutes';
      else if (titleLower.includes('page')) unitName = 'pages';
      else if (titleLower.includes('step')) unitName = 'steps';
      
      return `You've done ${totalUnits.toLocaleString()} ${unitName} ${periodLabels[period]}! That's ${daysLogged} days of consistency.`;
    }
    
    case 'get_sleep_insights': {
      const { days = 30 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: metrics } = await supabase
        .from('oura_daily_metrics')
        .select('metric_date, sleep_score, total_sleep_seconds, readiness_score')
        .eq('user_id', userId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });
      
      if (!metrics?.length) return `No sleep data in the last ${days} days. Log your sleep or connect Oura!`;
      
      const sleepScores = metrics.filter((m: any) => m.sleep_score).map((m: any) => m.sleep_score as number);
      const avgScore = sleepScores.length ? Math.round(sleepScores.reduce((a: number, b: number) => a + b, 0) / sleepScores.length) : 0;
      const bestScore = sleepScores.length ? Math.max(...sleepScores) : 0;
      
      const sleepHours = metrics.filter((m: any) => m.total_sleep_seconds).map((m: any) => m.total_sleep_seconds / 3600);
      const avgHours = sleepHours.length ? (sleepHours.reduce((a: number, b: number) => a + b, 0) / sleepHours.length).toFixed(1) : '?';
      
      const readinessScores = metrics.filter((m: any) => m.readiness_score).map((m: any) => m.readiness_score as number);
      const avgReadiness = readinessScores.length ? Math.round(readinessScores.reduce((a: number, b: number) => a + b, 0) / readinessScores.length) : 0;
      
      return `Over the last ${days} days: average sleep score ${avgScore}, averaging ${avgHours} hours per night. Best night was ${bestScore}. Readiness averaging ${avgReadiness}.`;
    }
    
    case 'get_activity_insights': {
      const { days = 7 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: metrics } = await supabase
        .from('oura_daily_metrics')
        .select('metric_date, steps, active_calories, activity_score')
        .eq('user_id', userId)
        .gte('metric_date', startDate.toISOString().split('T')[0]);
      
      if (!metrics?.length) return `No activity data in the last ${days} days.`;
      
      const totalSteps = metrics.reduce((sum: number, m: any) => sum + (m.steps || 0), 0);
      const avgSteps = Math.round(totalSteps / metrics.length);
      const totalCalories = metrics.reduce((sum: number, m: any) => sum + (m.active_calories || 0), 0);
      const activityScores = metrics.filter((m: any) => m.activity_score).map((m: any) => m.activity_score as number);
      const avgActivity = activityScores.length ? Math.round(activityScores.reduce((a: number, b: number) => a + b, 0) / activityScores.length) : 0;
      
      return `Last ${days} days: ${totalSteps.toLocaleString()} total steps, averaging ${avgSteps.toLocaleString()} per day. ${totalCalories.toLocaleString()} active calories burned. Activity score averaging ${avgActivity}.`;
    }
    
    case 'get_heart_rate_insights': {
      const { days = 14 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: metrics } = await supabase
        .from('oura_daily_metrics')
        .select('metric_date, resting_heart_rate, hrv_balance')
        .eq('user_id', userId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .not('resting_heart_rate', 'is', null);
      
      if (!metrics?.length) return `No heart rate data in the last ${days} days.`;
      
      const rhrs = metrics.map((m: any) => m.resting_heart_rate as number);
      const avgRHR = Math.round(rhrs.reduce((a: number, b: number) => a + b, 0) / rhrs.length);
      const minRHR = Math.min(...rhrs);
      const maxRHR = Math.max(...rhrs);
      
      const hrvs = metrics.filter((m: any) => m.hrv_balance).map((m: any) => m.hrv_balance as number);
      const avgHRV = hrvs.length ? Math.round(hrvs.reduce((a: number, b: number) => a + b, 0) / hrvs.length) : null;
      
      let response = `Last ${days} days: Resting heart rate averaging ${avgRHR} bpm (range ${minRHR}-${maxRHR}).`;
      if (avgHRV) response += ` HRV balance averaging ${avgHRV}.`;
      
      return response;
    }
    
    case 'get_habit_streaks': {
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select(`
          id, title, target_count,
          tactic_logs(logged_date, completed_count)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('tactic_logs.logged_date', { ascending: false });
      
      if (!tactics?.length) return "No active habits to track.";
      
      const habitStats = tactics.map((t: any) => {
        const logs = t.tactic_logs || [];
        
        // Calculate streak (consecutive days from today going back)
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          if (logs.some((l: any) => l.logged_date === dateStr)) {
            streak++;
          } else if (i > 0) { // Allow today to not be logged yet
            break;
          }
        }
        
        const totalLogs = logs.reduce((sum: number, l: any) => sum + (l.completed_count || 0), 0);
        
        return { title: t.title, streak, totalLogs };
      });
      
      const summary = habitStats
        .filter((h: { title: string; streak: number; totalLogs: number }) => h.streak > 0 || h.totalLogs > 0)
        .map((h: { title: string; streak: number; totalLogs: number }) => `${h.title}: ${h.streak} day streak, ${h.totalLogs} total`)
        .join('. ');
      
      return summary || "No habit activity yet. Start logging to build streaks!";
    }
    
    case 'get_focus_insights': {
      const { days = 30 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('objective, actual_duration_minutes, pillar, started_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('started_at', startDate.toISOString());
      
      if (!sessions?.length) return `No focus sessions in the last ${days} days.`;
      
      const totalMinutes = sessions.reduce((sum: number, s: any) => sum + (s.actual_duration_minutes || 0), 0);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const avgSession = Math.round(totalMinutes / sessions.length);
      
      // Group by pillar
      const byPillar: Record<string, number> = {};
      sessions.forEach((s: any) => {
        const pillar = s.pillar || 'uncategorized';
        byPillar[pillar] = (byPillar[pillar] || 0) + (s.actual_duration_minutes || 0);
      });
      
      const topPillar = Object.entries(byPillar).sort((a, b) => b[1] - a[1])[0];
      
      return `Last ${days} days: ${sessions.length} focus sessions, ${hours}h ${mins}m total. Average ${avgSession} minutes per session.${topPillar ? ` Most time on ${topPillar[0]}.` : ''}`;
    }
    
    case 'get_nutrition_summary': {
      const { days = 7 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: meals } = await supabase
        .from('daily_nutrition')
        .select('entry_date, calories, protein_g, carbs_g, fats_g, water_ml')
        .eq('user_id', userId)
        .gte('entry_date', startDate.toISOString().split('T')[0]);
      
      if (!meals?.length) return `No nutrition data in the last ${days} days.`;
      
      // Today's totals
      const todayMeals = meals.filter((m: any) => m.entry_date === todayStr);
      const todayCalories = todayMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
      const todayProtein = todayMeals.reduce((sum: number, m: any) => sum + (m.protein_g || 0), 0);
      const todayWater = todayMeals.reduce((sum: number, m: any) => sum + (m.water_ml || 0), 0);
      
      // Weekly averages
      const daysWithData = new Set(meals.map((m: any) => m.entry_date)).size;
      const totalCalories = meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
      const avgCalories = daysWithData ? Math.round(totalCalories / daysWithData) : 0;
      
      const totalProtein = meals.reduce((sum: number, m: any) => sum + (m.protein_g || 0), 0);
      const avgProtein = daysWithData ? Math.round(totalProtein / daysWithData) : 0;
      
      return `Today: ${todayCalories} calories, ${todayProtein}g protein, ${Math.round(todayWater / 29.5735)}oz water. ${days}-day average: ${avgCalories} calories, ${avgProtein}g protein per day.`;
    }
    
    case 'get_goal_progress': {
      const { data: goals } = await supabase
        .from('goals')
        .select('title, target_value, metric_type, milestones(week_number, target_value)')
        .eq('user_id', userId)
        .limit(5);
      
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('name, start_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (!goals?.length) return "No active goals. Create one in the app to start tracking!";
      
      let currentWeek = 0;
      if (activeCycle) {
        const startDate = new Date(activeCycle.start_date);
        currentWeek = Math.floor((new Date().getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      }
      
      const goalInfo = goals.map((g: any) => {
        let info = `"${g.title}" - Target: ${g.target_value} ${g.metric_type}`;
        if (g.milestones?.length && currentWeek > 0) {
          const milestone = g.milestones.find((m: any) => m.week_number === currentWeek);
          if (milestone) info += ` | This week: ${milestone.target_value}`;
        }
        return info;
      }).join('. ');
      
      const cycleInfo = activeCycle ? `${activeCycle.name} Week ${Math.min(currentWeek, 8)}. ` : '';
      
      return `${cycleInfo}Goals: ${goalInfo}`;
    }
    
    case 'get_weekly_summary': {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();
      
      const [completedResult, focusResult, habitsResult] = await Promise.all([
        supabase
          .from('quick_tasks')
          .select('id')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', sevenDaysAgoStr),
        supabase
          .from('focus_sessions')
          .select('actual_duration_minutes')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('started_at', sevenDaysAgoStr),
        supabase
          .from('tactic_logs')
          .select('id')
          .eq('user_id', userId)
          .gte('logged_date', sevenDaysAgoStr.split('T')[0])
      ]);
      
      const tasksCompleted = completedResult.data?.length || 0;
      const focusMinutes = (focusResult.data || []).reduce((sum: number, s: any) => sum + (s.actual_duration_minutes || 0), 0);
      const habitLogs = habitsResult.data?.length || 0;
      
      const hours = Math.floor(focusMinutes / 60);
      const mins = focusMinutes % 60;
      
      return `This week: ${tasksCompleted} tasks completed, ${hours}h ${mins}m focused work, ${habitLogs} habit check-ins. Great progress!`;
    }
    
    case 'get_daily_briefing': {
      // Fetch comprehensive context
      const [tasksResult, cycleResult, goalsResult, focusResult, completedTodayResult, habitsResult] = await Promise.all([
        supabase.from('quick_tasks').select('title').eq('user_id', userId).eq('completed', false).order('position').limit(5),
        supabase.from('cycles').select('name, start_date').eq('user_id', userId).eq('status', 'active').maybeSingle(),
        supabase.from('goals').select('title, milestones(week_number, target_value)').eq('user_id', userId).limit(3),
        supabase.from('focus_sessions').select('actual_duration_minutes').eq('user_id', userId).eq('status', 'completed').gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('quick_tasks').select('id').eq('user_id', userId).eq('completed', true).gte('completed_at', `${todayStr}T00:00:00`),
        supabase.from('tactic_logs').select('id').eq('user_id', userId).gte('logged_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);
      
      let briefing = '';
      
      // Cycle context
      if (cycleResult.data) {
        const startDate = new Date(cycleResult.data.start_date);
        const currentWeek = Math.floor((new Date().getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        briefing += `You're in week ${Math.min(currentWeek, 8)} of "${cycleResult.data.name}". `;
      }
      
      // Today's progress
      const completedToday = completedTodayResult.data?.length || 0;
      if (completedToday > 0) {
        briefing += `Already completed ${completedToday} task${completedToday > 1 ? 's' : ''} today! `;
      }
      
      // Weekly focus time
      const focusMinutes = (focusResult.data || []).reduce((sum: number, s: any) => sum + (s.actual_duration_minutes || 0), 0);
      if (focusMinutes > 0) {
        const hours = Math.floor(focusMinutes / 60);
        briefing += `${hours}h ${focusMinutes % 60}m of focused work this week. `;
      }
      
      // Habit consistency
      const habitLogs = habitsResult.data?.length || 0;
      if (habitLogs > 0) {
        briefing += `${habitLogs} habit check-ins this week. `;
      }
      
      // Top priorities
      const tasks = tasksResult.data || [];
      if (tasks.length > 0) {
        briefing += `Top priorities: ${tasks.slice(0, 3).map((t: any) => t.title).join(', ')}. `;
      } else {
        briefing += `No pending tasks! `;
      }
      
      return briefing || "Ready to start your day! What would you like to focus on?";
    }
    
    case 'search_history': {
      const { query, limit = 10 } = args as { query: string; limit?: number };
      
      try {
        // Generate embedding for query
        const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: query,
            dimensions: 768,
          }),
        });
        
        if (!embeddingResponse.ok) {
          console.error('Embedding error:', await embeddingResponse.text());
          return "I couldn't search your history right now.";
        }
        
        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data?.[0]?.embedding;
        
        if (!queryEmbedding) return "I couldn't process that search.";
        
        // Search embeddings
        const { data: results, error } = await supabase.rpc('match_activity_embeddings', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.3,
          match_count: limit,
          filter_user_id: userId,
        });
        
        if (error) {
          console.error('Search error:', error);
          return "I had trouble searching your history.";
        }
        
        if (!results?.length) return "I couldn't find anything matching that in your history.";
        
        // Format results for voice
        const formatted = results.slice(0, 3).map((r: any) => {
          const date = new Date(r.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const snippet = r.content_text.slice(0, 80).replace(/\n/g, ' ');
          return `On ${date}: ${snippet}`;
        }).join('. ');
        
        return `I found ${results.length} relevant entries. ${formatted}`;
      } catch (error) {
        console.error('Search history error:', error);
        return "I had trouble searching your history right now.";
      }
    }
    
    default:
      return `Unknown tool: ${toolName}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!TWILIO_AUTH_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      console.error('Missing required environment variables');
      return twiml(say("Sorry, there's a configuration error. Please try again later.") + '<Hangup/>');
    }

    // Parse form data from Twilio
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    console.log('Twilio webhook received:', JSON.stringify(params, null, 2));

    // Validate Twilio signature using the actual webhook URL (not req.url which may differ)
    const twilioSignature = req.headers.get('x-twilio-signature');
    const SUPABASE_PROJECT_ID = SUPABASE_URL.replace('https://', '').split('.')[0];
    const webhookUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/twilio-voice-webhook`;
    
    if (twilioSignature) {
      const isValid = await validateTwilioSignature(
        TWILIO_AUTH_TOKEN,
        twilioSignature,
        webhookUrl,
        params
      );
      
      if (!isValid) {
        console.warn('Twilio signature validation failed - proceeding anyway for now');
      }
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get caller info
    const callerNumber = params.From;
    const callSid = params.CallSid;
    const speechResult = params.SpeechResult;
    const callStatus = params.CallStatus;
    const digits = params.Digits;
    const baseUrl = webhookUrl;

    // Normalize phone number for lookup
    const normalizedNumber = callerNumber?.replace(/\D/g, '');
    
    // Look up user by phone number first
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone_us, member_pin')
      .or(`phone_us.ilike.%${normalizedNumber?.slice(-10)}%,phone_whatsapp.ilike.%${normalizedNumber?.slice(-10)}%`)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
    }

    // If PIN was entered, look up by member_pin
    if (digits && digits.length === 4) {
      console.log('PIN entered:', digits);
      const { data: pinProfile, error: pinError } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone_us, member_pin')
        .eq('member_pin', digits)
        .maybeSingle();

      if (pinError) {
        console.error('PIN lookup error:', pinError);
      }

      if (pinProfile) {
        profile = pinProfile;
        console.log('User authenticated via PIN:', pinProfile.display_name);
      } else {
        console.log('Invalid PIN entered:', digits);
        return twiml(
          say("I couldn't find a member with that PIN.") +
          `<Gather input="dtmf" numDigits="4" action="${baseUrl}" timeout="10">
            ${say("Please enter your 4 digit member PIN, or hang up to try again later.")}
          </Gather>` +
          say("I didn't receive any input. Goodbye!") +
          '<Hangup/>'
        );
      }
    }

    // If still no user found, offer PIN authentication
    if (!profile) {
      console.log('No user found for number:', callerNumber);
      return twiml(
        say("Welcome to Groovy Planning! I don't recognize this phone number.") +
        `<Gather input="dtmf" numDigits="4" action="${baseUrl}" timeout="15">
          ${say("If you're already a member, please enter your 4 digit member PIN now. You can find your PIN in your profile settings.")}
        </Gather>` +
        say("If you're not a member yet, please visit groovy planning dot A I to sign up. Goodbye!") +
        '<Hangup/>'
      );
    }

    const userName = profile.display_name || 'there';
    const userId = profile.user_id;

    // Handle call end - update call log and generate embedding
    if (callStatus === 'completed') {
      // Update call end time
      await supabase
        .from('voice_call_logs')
        .update({ call_ended_at: new Date().toISOString() })
        .eq('call_sid', callSid);
      
      // Fetch the complete call log for embedding
      const { data: completedLog } = await supabase
        .from('voice_call_logs')
        .select('id, messages, tasks_created, tasks_completed, created_at')
        .eq('call_sid', callSid)
        .maybeSingle();
      
      // Generate embedding for the conversation if it has meaningful content
      if (completedLog?.messages && Array.isArray(completedLog.messages) && completedLog.messages.length > 0) {
        const messages = completedLog.messages as { role: string; content: string }[];
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).filter(Boolean);
        
        if (userMessages.length > 0) {
          const parts: string[] = [`Voice call on ${new Date(completedLog.created_at).toLocaleDateString()}.`];
          parts.push(`User requested: ${userMessages.join(". ")}`);
          
          const tasksCreated = (completedLog.tasks_created || []) as { title: string }[];
          const tasksCompleted = (completedLog.tasks_completed || []) as { title: string }[];
          
          if (tasksCreated.length > 0) {
            parts.push(`Tasks created: ${tasksCreated.map(t => t.title).join(", ")}`);
          }
          if (tasksCompleted.length > 0) {
            parts.push(`Habits/tasks completed: ${tasksCompleted.map(t => t.title).join(", ")}`);
          }
          
          // Fire and forget embedding generation
          fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              sourceType: "voice_call_log",
              sourceId: completedLog.id,
              contentText: parts.join(" "),
              activityDate: completedLog.created_at.split("T")[0],
              metadata: {
                callSid,
                messageCount: messages.length,
                tasksCreated: tasksCreated.length,
                tasksCompleted: tasksCompleted.length,
              },
            }),
          }).catch(err => console.error("Failed to generate embedding for call:", err));
        }
      }
      
      return new Response('OK', { headers: corsHeaders });
    }

    // Get or create call log for conversation memory
    let { data: callLog } = await supabase
      .from('voice_call_logs')
      .select('*')
      .eq('call_sid', callSid)
      .maybeSingle();

    if (!callLog) {
      const { data: newLog, error: createError } = await supabase
        .from('voice_call_logs')
        .insert({
          user_id: userId,
          call_sid: callSid,
          caller_number: callerNumber,
          messages: [],
          tasks_created: [],
          tasks_completed: []
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create call log:', createError);
      }
      callLog = newLog;
    }

    // Get conversation history from call log
    const conversationHistory: ConversationMessage[] = callLog?.messages || [];

    // Check if this is the initial call or a conversation response
    if (speechResult) {
      // Add user message to history
      const userMessage: ConversationMessage = {
        role: 'user',
        content: speechResult,
        timestamp: new Date().toISOString()
      };
      conversationHistory.push(userMessage);

      console.log('Processing speech input:', speechResult);

      // Fetch comprehensive context for AI
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();
      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch all context in parallel
      const [
        tasksResult,
        completedTasksResult,
        recentHabitsResult,
        goalsResult,
        activeCycleResult,
        visionResult,
        focusSessionsResult,
        journalEntriesResult
      ] = await Promise.all([
        supabase.from('quick_tasks').select('id, title, category, due_date, completed').eq('user_id', userId).eq('completed', false).order('position').limit(10),
        supabase.from('quick_tasks').select('title, completed_at').eq('user_id', userId).eq('completed', true).gte('completed_at', sevenDaysAgoStr).order('completed_at', { ascending: false }).limit(10),
        supabase.from('tactic_logs').select('goal_tactics(title), completed_count, logged_date').eq('user_id', userId).gte('logged_date', sevenDaysAgoStr.split('T')[0]).order('logged_date', { ascending: false }).limit(10),
        supabase.from('goals').select('title, target_value, metric_type, why, goal_type, obstacles, strategies, vision_connection, milestones(week_number, target_value, description)').eq('user_id', userId).limit(5),
        supabase.from('cycles').select('id, name, start_date, end_date, status').eq('user_id', userId).eq('status', 'active').maybeSingle(),
        supabase.from('user_vision').select('vision_3_year, vision_long_term, core_values').eq('user_id', userId).maybeSingle(),
        supabase.from('focus_sessions').select('objective, actual_duration_minutes, started_at, status').eq('user_id', userId).gte('started_at', sevenDaysAgoStr).order('started_at', { ascending: false }).limit(5),
        supabase.from('journal_entries').select('entry_date, user_notes, audio_transcript').eq('user_id', userId).order('entry_date', { ascending: false }).limit(3)
      ]);

      const tasks = tasksResult.data;
      const completedTasks = completedTasksResult.data;
      const recentHabits = recentHabitsResult.data;
      const goals = goalsResult.data;
      const activeCycle = activeCycleResult.data;
      const vision = visionResult.data;
      const focusSessions = focusSessionsResult.data;
      const journalEntries = journalEntriesResult.data;

      // Calculate current week number if cycle exists
      let currentWeek = 0;
      if (activeCycle) {
        const startDate = new Date(activeCycle.start_date);
        const now = new Date();
        currentWeek = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      }

      // Build context strings
      const taskContext = tasks?.length 
        ? `Pending tasks:\n${tasks.map((t, i) => `${i + 1}. ${t.title} (${t.category})`).join('\n')}`
        : 'No pending tasks.';

      const completedContext = completedTasks?.length
        ? `Completed this week: ${completedTasks.map(t => t.title).join(', ')}`
        : '';

      const habitContext = recentHabits?.length
        ? `Recent habits: ${recentHabits.map(h => (h as any).goal_tactics?.title).filter(Boolean).join(', ')}`
        : '';

      const goalContext = goals?.length
        ? `Active goals:\n${goals.map(g => `• "${g.title}" - Target: ${g.target_value} ${g.metric_type}${g.why ? ` (Why: ${g.why})` : ''}`).join('\n')}`
        : '';

      const cycleContext = activeCycle
        ? `Current cycle: "${activeCycle.name}" (Week ${Math.min(currentWeek, 8)} of 8)`
        : '';

      const visionContext = vision?.vision_3_year
        ? `3-Year Vision: ${vision.vision_3_year.slice(0, 200)}...`
        : '';

      const focusContext = focusSessions?.length
        ? `Focus sessions this week: ${focusSessions.length} sessions, ${focusSessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0)} minutes total`
        : '';

      const journalContext = journalEntries?.length
        ? `Recent reflections: ${journalEntries.map(j => j.user_notes || j.audio_transcript).filter(Boolean).slice(0, 2).map(n => n?.slice(0, 100)).join(' | ')}`
        : '';

      // Build system prompt with full context
      const systemPrompt = `You are Toasty, a warm and encouraging voice assistant for GroovyPlanning.ai. 
You're speaking to ${userName} on the phone. Keep responses natural and under 100 words since this is voice.
Be warm, encouraging, and helpful. You know about their goals, vision, tasks, habits, and recent activity.

IMPORTANT: You have comprehensive tools to help:
- DATA LOGGING: create_task, complete_task, log_habit, log_weight, log_blood_pressure, log_sleep, log_nap, log_meal, log_water, toggle_reset_rule
- INSIGHTS: list_tasks, get_goal_progress, get_weekly_summary, get_daily_briefing, get_reset_status
- CUMULATIVE DATA: get_cumulative_habit_progress (for "how many pushups this month?" type questions)
- HEALTH INSIGHTS: get_sleep_insights, get_activity_insights, get_heart_rate_insights, get_nutrition_summary
- PRODUCTIVITY: get_habit_streaks, get_focus_insights
- HISTORY SEARCH: search_history (for "when did I..." or "have I ever..." questions)

For cumulative questions like "how many pushups did I do this month", use get_cumulative_habit_progress.
For historical questions like "when did I journal about stress", use search_history.

**USER'S CONTEXT:**

${cycleContext}

${goalContext}

${visionContext}

${taskContext}

${completedContext}

${habitContext}

${focusContext}

${journalContext}

Remember: This is a phone call, so speak naturally and avoid markdown, bullet points, or formatting.
When discussing goals or vision, be encouraging and connect their daily actions to their bigger picture.
When you complete an action like creating or completing a task, confirm it naturally in conversation.`;

      // Build messages array with history
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      ];

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages,
            tools: voiceTools,
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (!aiResponse.ok) {
          console.error('AI error:', await aiResponse.text());
          return twiml(
            say("I'm having trouble thinking right now. Let me know if there's anything else I can help with.") +
            gather(baseUrl, "What else would you like to know?")
          );
        }

        const aiData = await aiResponse.json();
        const choice = aiData.choices?.[0];
        let assistantMessage = choice?.message?.content || '';
        const toolCalls = choice?.message?.tool_calls;

        // Handle tool calls
        if (toolCalls && toolCalls.length > 0) {
          const toolResults: string[] = [];
          const tasksCreated: any[] = callLog?.tasks_created || [];
          const tasksCompleted: any[] = callLog?.tasks_completed || [];

          for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || '{}');

            console.log('Tool call:', functionName, args);

            // Use the centralized executeTool function
            const result = await executeTool(functionName, args, supabase, userId, LOVABLE_API_KEY);
            toolResults.push(result);

            // Track task operations for the call log
            if (functionName === 'create_task' && !result.includes('Failed')) {
              tasksCreated.push({ title: args.title, created_at: new Date().toISOString() });
            } else if (functionName === 'complete_task' && !result.includes('Couldn\'t find')) {
              tasksCompleted.push({ title: args.task_title, completed_at: new Date().toISOString() });
            }
          }

          // Get follow-up response from AI with tool results
          const followUpMessages = [
            ...messages,
            choice.message,
            ...toolCalls.map((tc: any, i: number) => ({
              role: 'tool' as const,
              tool_call_id: tc.id,
              content: toolResults[i]
            }))
          ];

          const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: followUpMessages,
              max_tokens: 300,
              temperature: 0.7,
            }),
          });

          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json();
            assistantMessage = followUpData.choices?.[0]?.message?.content || 
              `Done! ${toolResults.join('. ')}`;
          } else {
            assistantMessage = `Done! ${toolResults.join('. ')}`;
          }

          // Update call log with tasks created/completed
          await supabase
            .from('voice_call_logs')
            .update({ 
              tasks_created: tasksCreated,
              tasks_completed: tasksCompleted
            })
            .eq('call_sid', callSid);
        }

        // Add assistant message to history
        const assistantHistoryMessage: ConversationMessage = {
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date().toISOString()
        };
        conversationHistory.push(assistantHistoryMessage);

        // Update call log with new messages
        await supabase
          .from('voice_call_logs')
          .update({ messages: conversationHistory })
          .eq('call_sid', callSid);

        console.log('AI response:', assistantMessage);

        // Respond and gather next input
        return twiml(
          say(assistantMessage) +
          gather(baseUrl, "")
        );

      } catch (aiError) {
        console.error('AI call error:', aiError);
        return twiml(
          say("I encountered an error processing your request. Please try again.") +
          gather(baseUrl, "What would you like to know?")
        );
      }

    } else {
      // Initial call - SIMPLE GREETING
      console.log('Initial call - Simple greeting for:', userName);

      const greeting = `Hi, ${userName}, I'm Toasty, how can I help today?`;

      // Add greeting to conversation history
      const greetingMessage: ConversationMessage = {
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString()
      };

      // Update call log
      await supabase
        .from('voice_call_logs')
        .update({ messages: [greetingMessage] })
        .eq('call_sid', callSid);

      // Return greeting with gather for next input
      return twiml(
        say(greeting) +
        gather(baseUrl, "")
      );
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return twiml(
      say("Sorry, something went wrong. Please try again later.") +
      '<Hangup/>'
    );
  }
});
