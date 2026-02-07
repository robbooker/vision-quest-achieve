import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

// SMS tools for conversational AI - comprehensive set for smart Toasty
const smsTools = [
  // === DATA LOGGING TOOLS ===
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task for the user. Use when they want to add, create, or remember to do something.",
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
      description: "Mark a task as complete. Use when they say 'complete', 'done', 'finished', etc.",
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
      description: "List the user's pending tasks. Use when they ask about their tasks or to-dos.",
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
      description: "Log habit completion. IMPORTANT: Call this tool ONCE per habit, even if user mentions a number. The 'count' means sets/sessions completed (usually 1), NOT the number of reps. Example: 'did 10 pushups' = call ONCE with count=1. 'Did 3 sets' = call ONCE with count=3.",
      parameters: {
        type: "object",
        properties: {
          habit_name: { type: "string", description: "The name of the habit (e.g., 'pushups', 'meditation')" },
          count: { type: "number", description: "Number of SETS or SESSIONS completed (usually 1). NOT the number of reps. Default 1." }
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
      name: "get_habit_status",
      description: "Get the user's habit/tactic status and streaks. Use when they ask about habits or streaks.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_goal_progress",
      description: "Get progress on the user's goals. Use when they ask about goals or progress.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_daily_briefing",
      description: "Get a daily briefing with priorities, habits, cycle status, and insights. Use for 'briefing', 'how's my day', etc.",
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
      description: "Get cumulative progress on habits/tactics. Use for questions like 'how many pushups did I do this month', 'total meditation time', 'exercise count this week', 'pushups this cycle', etc.",
      parameters: {
        type: "object",
        properties: {
          habit_name: { type: "string", description: "Name of the habit (e.g., 'pushups', 'meditation')" },
          period: { type: "string", enum: ["today", "week", "month", "year", "cycle", "all"], description: "Time period for aggregation. Use 'cycle' for current 8-week cycle. Default 'month'." }
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
  },
  // === MORNING BRIEFING TOOLS ===
  {
    type: "function" as const,
    function: {
      name: "set_wake_time",
      description: "Set wake time for tomorrow's morning briefing. Use when they text a time like '6:30', '630', '7am', 'wake me at 6', etc. Also handles 'same' (use yesterday's settings) or 'skip'/'off' (no briefing tomorrow).",
      parameters: {
        type: "object",
        properties: {
          wake_time: { type: "string", description: "Wake time in HH:MM format, or 'same' for yesterday's time, or 'skip' to skip tomorrow" },
          topics: { type: "array", items: { type: "string" }, description: "Optional news topics to cover in the briefing" },
          custom_instructions: { type: "string", description: "Any special instructions for the briefing" }
        },
        required: ["wake_time"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_briefing_status",
      description: "Get status of today's or tomorrow's morning briefing. Use when they ask 'is my briefing ready', 'what time is my briefing', 'briefing status', etc.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  }
];

// Validate Twilio request signature
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

// Generate TwiML response for SMS
function twimlSms(message: string): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`,
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    }
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Execute tool calls - comprehensive implementation
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: any,
  userId: string,
  LOVABLE_API_KEY: string,
  userTimezone: string = 'America/Chicago'
): Promise<string> {
  // Calculate today's date in the user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayStr = formatter.format(now); // Returns YYYY-MM-DD format
  
  switch (toolName) {
    case 'create_task': {
      const { title, category = 'personal' } = args as { title: string; category?: string };
      const { error } = await supabase
        .from('quick_tasks')
        .insert({ user_id: userId, title, category, position: 0 });
      
      if (error) return `❌ Failed to create task: ${error.message}`;
      return `✅ Task created: "${title}"`;
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
      
      if (!tasks?.length) return `❌ Couldn't find a task matching "${task_title}"`;
      
      await supabase
        .from('quick_tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', tasks[0].id);
      
      return `✅ Completed: "${tasks[0].title}"`;
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
      
      if (!tasks?.length) return "📋 No pending tasks. You're all caught up!";
      
      const taskList = tasks.map((t: any, i: number) => `${i + 1}. ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}`).join('\n');
      return `📋 Your tasks:\n${taskList}`;
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
      
      if (!tactics?.length) return `❌ Couldn't find a habit matching "${habit_name}"`;
      
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
        return `✅ Updated "${tactics[0].title}" to ${existingLog.completed_count + count} today!`;
      } else {
        await supabase
          .from('tactic_logs')
          .insert({ user_id: userId, tactic_id: tactics[0].id, logged_date: todayStr, completed_count: count });
        return `✅ Logged "${tactics[0].title}"${count > 1 ? ` (${count}x)` : ''}!`;
      }
    }
    
    case 'log_weight': {
      const { weight, unit = 'lbs' } = args as { weight: number; unit?: string };
      
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
      
      let response = `⚖️ Logged ${weight} ${unit}`;
      if (lastWeight) {
        const diff = weight - lastWeight.primary_value;
        if (Math.abs(diff) >= 0.1) {
          response += diff < 0 ? ` (↓${Math.abs(diff).toFixed(1)})` : ` (↑${diff.toFixed(1)})`;
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
      
      let emoji = '🩺';
      if (systolic < 120 && diastolic < 80) emoji = '💚';
      else if (systolic >= 130 || diastolic >= 80) emoji = '⚠️';
      
      return `${emoji} Logged BP: ${systolic}/${diastolic}`;
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
      
      return `😴 Logged ${hours}h sleep${quality ? ` (quality ${quality}/5)` : ''} - score ~${estimatedScore}`;
    }
    
    case 'log_nap': {
      const { minutes } = args as { minutes: number };
      
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
      
      return `💤 Logged ${minutes}min nap (${totalNapMinutes}min total today)`;
    }
    
    case 'log_meal': {
      const { description, meal_type } = args as { description: string; meal_type?: string };
      
      try {
        // Call parse-nutrition with correct parameter name
        const parseResponse = await supabase.functions.invoke('parse-nutrition', {
          body: { mealDescription: description }
        });
        
        if (parseResponse.error) throw new Error(parseResponse.error.message);
        
        const parsed = parseResponse.data;
        
        // Check if parsing returned an error
        if (parsed.error) throw new Error(parsed.error);
        
        // Insert with parsed macros
        await supabase
          .from('daily_nutrition')
          .insert({
            user_id: userId,
            entry_date: todayStr,
            meal_description: description,
            meal_type: meal_type || 'snack',
            calories: parsed.calories || null,
            protein_g: parsed.protein_g || null,
            carbs_g: parsed.carbs_g || null,
            fats_g: parsed.fats_g || null,
            sugar_g: parsed.sugar_g || null,
            fiber_g: parsed.fiber_g || null,
            source: 'sms'
          });
        
        return `🍽️ Logged: ${description}\n~${parsed.calories || '?'} cal, ${parsed.protein_g || '?'}g protein`;
      } catch (e) {
        console.error('Meal parsing error:', e);
        // Fallback: insert without macros
        await supabase
          .from('daily_nutrition')
          .insert({
            user_id: userId,
            entry_date: todayStr,
            meal_description: description,
            meal_type: meal_type || 'snack',
            source: 'sms'
          });
        return `🍽️ Logged: ${description}`;
      }
    }
    
    case 'log_water': {
      const { amount, unit = 'oz' } = args as { amount: number; unit?: string };
      
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
          source: 'sms'
        });
      
      const { data: waterLogs } = await supabase
        .from('daily_nutrition')
        .select('water_ml')
        .eq('user_id', userId)
        .eq('entry_date', todayStr)
        .not('water_ml', 'is', null);
      
      const totalMl = (waterLogs || []).reduce((sum: number, l: any) => sum + (l.water_ml || 0), 0);
      const totalOz = Math.round(totalMl / 29.5735);
      
      return `💧 +${amount}${unit} water (${totalOz}oz total today)`;
    }
    
    case 'toggle_reset_rule': {
      const { rule, completed = true } = args as { rule: string; completed?: boolean };
      
      const ruleColumn = `rule_${rule}`;
      
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
      
      return `${completed ? '✅' : '⬜'} Reset: ${rule} ${completed ? 'done' : 'undone'}`;
    }
    
    case 'get_reset_status': {
      const { data: audit } = await supabase
        .from('reset_audits')
        .select('*')
        .eq('user_id', userId)
        .eq('audit_date', todayStr)
        .maybeSingle();
      
      if (!audit) return "🔄 No reset audit today. Text 'mark wake done' to start!";
      
      const rules = ['wake', 'move', 'work', 'read', 'input', 'sleep', 'fuel', 'reset'];
      const completed = rules.filter(r => audit[`rule_${r}`]);
      const remaining = rules.filter(r => !audit[`rule_${r}`]);
      
      return `🔄 Reset: ${completed.length}/8\n✅ ${completed.join(', ') || 'none'}\n⬜ ${remaining.join(', ')}`;
    }
    
    case 'get_habit_status': {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select('title, target_count, tactic_logs(logged_date, completed_count)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('tactic_logs.logged_date', sevenDaysAgo.toISOString().split('T')[0])
        .limit(5);
      
      if (!tactics?.length) return "📊 No active habits. Create some in the app!";
      
      const habitLines = tactics.map((t: any) => {
        const logs = t.tactic_logs || [];
        const totalThisWeek = logs.reduce((sum: number, l: any) => sum + l.completed_count, 0);
        const todayLog = logs.find((l: any) => l.logged_date === todayStr);
        return `• ${t.title}: ${todayLog?.completed_count || 0} today / ${totalThisWeek} week`;
      });
      
      return `📊 Habits:\n${habitLines.join('\n')}`;
    }
    
    case 'get_goal_progress': {
      // Get goals with their tactics for progress tracking
      const { data: goals } = await supabase
        .from('goals')
        .select(`
          id, title, target_value, metric_type, goal_type,
          goal_tactics(id, title, target_count, tactic_logs(completed_count, logged_date)),
          milestones(week_number, target_value)
        `)
        .eq('user_id', userId)
        .limit(5);
      
      const { data: cycle } = await supabase
        .from('cycles')
        .select('name, start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (!goals?.length) return "🎯 No active goals. Create one in the app!";
      
      let response = "";
      let currentWeek = 0;
      let daysRemaining = 0;
      
      if (cycle) {
        const startDate = new Date(cycle.start_date);
        const endDate = new Date(cycle.end_date);
        const today = new Date();
        currentWeek = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        response = `📅 ${cycle.name} (Wk ${Math.min(currentWeek, 8)}) - ${daysRemaining} days left\n\n`;
      }
      
      // Calculate actual progress for each goal
      const goalProgress = goals.map((g: any) => {
        let currentValue = 0;
        let totalTarget = g.target_value;
        
        // For habit-based goals, sum up tactic logs from cycle start
        if (g.goal_tactics?.length) {
          for (const tactic of g.goal_tactics) {
            const logs = tactic.tactic_logs || [];
            // Filter logs to only include those from current cycle
            const cycleLogs = cycle 
              ? logs.filter((l: any) => l.logged_date >= cycle.start_date)
              : logs;
            
            // Extract multiplier from tactic title (e.g., "Do 10 pushups" → 10)
            const unitMatch = tactic.title.match(/(\d+)/);
            const unitValue = unitMatch ? parseInt(unitMatch[1], 10) : 1;
            
            const tacticTotal = cycleLogs.reduce((sum: number, l: any) => 
              sum + ((l.completed_count || 0) * unitValue), 0);
            currentValue += tacticTotal;
          }
        }
        
        // Find current week's milestone target if exists
        let weeklyTarget = null;
        if (g.milestones?.length && currentWeek > 0) {
          const milestone = g.milestones.find((m: any) => m.week_number === currentWeek);
          if (milestone) weeklyTarget = milestone.target_value;
        }
        
        const percentage = totalTarget > 0 ? Math.round((currentValue / totalTarget) * 100) : 0;
        let status = '';
        if (percentage >= 100) status = '✅';
        else if (percentage >= 75) status = '🔥';
        else if (percentage >= 50) status = '📈';
        else status = '🎯';
        
        let info = `${status} ${g.title}: ${currentValue.toLocaleString()}/${totalTarget.toLocaleString()} (${percentage}%)`;
        if (weeklyTarget !== null) {
          info += ` | Wk${currentWeek} target: ${weeklyTarget}`;
        }
        
        return info;
      });
      
      response += `🎯 Goals:\n${goalProgress.join('\n')}`;
      
      return response;
    }
    
    case 'get_daily_briefing': {
      const [tasksResult, habitsResult, cycleResult] = await Promise.all([
        supabase.from('quick_tasks').select('title').eq('user_id', userId).eq('completed', false).order('position').limit(3),
        supabase.from('goal_tactics').select('title').eq('user_id', userId).eq('is_active', true).limit(3),
        supabase.from('cycles').select('name, start_date, end_date').eq('user_id', userId).eq('status', 'active').maybeSingle()
      ]);
      
      let briefing = "☀️ Daily Briefing\n\n";
      
      if (cycleResult.data) {
        const startDate = new Date(cycleResult.data.start_date);
        const endDate = new Date(cycleResult.data.end_date);
        const today = new Date();
        const currentWeek = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        briefing += `📅 ${cycleResult.data.name} - Wk ${Math.min(currentWeek, 8)} (${daysRemaining} days left)\n\n`;
      }
      
      if (tasksResult.data?.length) {
        briefing += `📋 Tasks:\n${tasksResult.data.map((t: any, i: number) => `${i + 1}. ${t.title}`).join('\n')}\n\n`;
      } else {
        briefing += "📋 No pending tasks!\n\n";
      }
      
      if (habitsResult.data?.length) {
        briefing += `🔄 Habits:\n${habitsResult.data.map((h: any) => `• ${h.title}`).join('\n')}`;
      }
      
      return briefing;
    }
    
    case 'get_cumulative_habit_progress': {
      const { habit_name, period = 'month' } = args as { habit_name: string; period?: string };
      
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select('id, title')
        .eq('user_id', userId)
        .ilike('title', `%${habit_name}%`)
        .limit(1);
      
      if (!tactics?.length) return `❌ No habit matching "${habit_name}"`;
      
      const now = new Date();
      let startDate: string | null = null;
      let periodLabel = 'all time';
      
      if (period === 'today') {
        startDate = todayStr;
        periodLabel = 'today';
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        periodLabel = 'this week';
      } else if (period === 'month') {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        periodLabel = 'this month';
      } else if (period === 'year') {
        startDate = `${now.getFullYear()}-01-01`;
        periodLabel = 'this year';
      } else if (period === 'cycle') {
        // Get active cycle start date
        const { data: cycle } = await supabase
          .from('cycles')
          .select('start_date, name')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        
        if (cycle) {
          startDate = cycle.start_date;
          periodLabel = `this cycle (${cycle.name})`;
        } else {
          periodLabel = 'all time (no active cycle)';
        }
      }
      
      let query = supabase
        .from('tactic_logs')
        .select('completed_count, logged_date')
        .eq('tactic_id', tactics[0].id);
      
      if (startDate) query = query.gte('logged_date', startDate);
      
      const { data: logs } = await query;
      
      const unitMatch = tactics[0].title.match(/(\d+)/);
      const unitValue = unitMatch ? parseInt(unitMatch[1], 10) : 1;
      
      const totalCount = (logs || []).reduce((sum: number, l: any) => sum + (l.completed_count || 0), 0);
      const totalUnits = totalCount * unitValue;
      const daysLogged = new Set((logs || []).map((l: any) => l.logged_date)).size;
      
      return `📊 ${totalUnits.toLocaleString()} ${habit_name} ${periodLabel}! (${daysLogged} days)`;
    }
    
    case 'get_sleep_insights': {
      const { days = 30 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: metrics } = await supabase
        .from('oura_daily_metrics')
        .select('sleep_score, total_sleep_seconds, readiness_score')
        .eq('user_id', userId)
        .gte('metric_date', startDate.toISOString().split('T')[0]);
      
      if (!metrics?.length) return `😴 No sleep data for ${days} days`;
      
      const sleepScores = metrics.filter((m: any) => m.sleep_score).map((m: any) => m.sleep_score);
      const avgScore = sleepScores.length ? Math.round(sleepScores.reduce((a: number, b: number) => a + b, 0) / sleepScores.length) : 0;
      
      const sleepHours = metrics.filter((m: any) => m.total_sleep_seconds).map((m: any) => m.total_sleep_seconds / 3600);
      const avgHours = sleepHours.length ? (sleepHours.reduce((a: number, b: number) => a + b, 0) / sleepHours.length).toFixed(1) : '?';
      
      return `😴 ${days}d avg: ${avgScore} score, ${avgHours}h/night`;
    }
    
    case 'get_activity_insights': {
      const { days = 7 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: metrics } = await supabase
        .from('oura_daily_metrics')
        .select('steps, active_calories')
        .eq('user_id', userId)
        .gte('metric_date', startDate.toISOString().split('T')[0]);
      
      if (!metrics?.length) return `🏃 No activity data for ${days} days`;
      
      const totalSteps = metrics.reduce((sum: number, m: any) => sum + (m.steps || 0), 0);
      const avgSteps = Math.round(totalSteps / metrics.length);
      
      return `🏃 ${days}d: ${totalSteps.toLocaleString()} steps (avg ${avgSteps.toLocaleString()}/day)`;
    }
    
    case 'get_heart_rate_insights': {
      const { days = 14 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: metrics } = await supabase
        .from('oura_daily_metrics')
        .select('resting_heart_rate, hrv_balance')
        .eq('user_id', userId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .not('resting_heart_rate', 'is', null);
      
      if (!metrics?.length) return `❤️ No HR data for ${days} days`;
      
      const rhrs = metrics.map((m: any) => m.resting_heart_rate);
      const avgRHR = Math.round(rhrs.reduce((a: number, b: number) => a + b, 0) / rhrs.length);
      
      return `❤️ ${days}d avg RHR: ${avgRHR} bpm`;
    }
    
    case 'get_habit_streaks': {
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select('title, tactic_logs(logged_date, completed_count)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('tactic_logs.logged_date', { ascending: false });
      
      if (!tactics?.length) return "📊 No active habits";
      
      const habitStats = tactics.map((t: any) => {
        const logs = t.tactic_logs || [];
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          if (logs.some((l: any) => l.logged_date === dateStr)) {
            streak++;
          } else if (i > 0) break;
        }
        return { title: t.title.slice(0, 15), streak };
      });
      
      return `🔥 Streaks:\n${habitStats.filter((h: { title: string; streak: number }) => h.streak > 0).map((h: { title: string; streak: number }) => `${h.title}: ${h.streak}d`).join('\n') || 'No active streaks'}`;
    }
    
    case 'get_focus_insights': {
      const { days = 30 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('actual_duration_minutes')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('started_at', startDate.toISOString());
      
      if (!sessions?.length) return `🎯 No focus sessions in ${days} days`;
      
      const totalMins = sessions.reduce((sum: number, s: any) => sum + (s.actual_duration_minutes || 0), 0);
      const hours = Math.floor(totalMins / 60);
      
      return `🎯 ${days}d: ${sessions.length} sessions, ${hours}h ${totalMins % 60}m total`;
    }
    
    case 'get_nutrition_summary': {
      const { days = 7 } = args as { days?: number };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: meals } = await supabase
        .from('daily_nutrition')
        .select('entry_date, calories, protein_g, water_ml')
        .eq('user_id', userId)
        .gte('entry_date', startDate.toISOString().split('T')[0]);
      
      if (!meals?.length) return `🍽️ No nutrition data for ${days} days`;
      
      const todayMeals = meals.filter((m: any) => m.entry_date === todayStr);
      const todayCal = todayMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
      const todayProtein = todayMeals.reduce((sum: number, m: any) => sum + (m.protein_g || 0), 0);
      
      return `🍽️ Today: ${todayCal} cal, ${todayProtein}g protein`;
    }
    
    case 'search_history': {
      const { query, limit = 10 } = args as { query: string; limit?: number };
      
      try {
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
        
        if (!embeddingResponse.ok) return "🔍 Search unavailable right now";
        
        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data?.[0]?.embedding;
        
        if (!queryEmbedding) return "🔍 Couldn't process search";
        
        const { data: results, error } = await supabase.rpc('match_activity_embeddings', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.3,
          match_count: limit,
          filter_user_id: userId,
        });
        
        if (error || !results?.length) return "🔍 Nothing found matching that";
        
        const formatted = results.slice(0, 3).map((r: any) => {
          const date = new Date(r.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `${date}: ${r.content_text.slice(0, 50)}...`;
        }).join('\n');
        
        return `🔍 Found ${results.length}:\n${formatted}`;
      } catch (error) {
        return "🔍 Search error";
      }
    }
    
    case 'set_wake_time': {
      const { wake_time } = args as { wake_time: string };
      
      // Get user's lab preferences
      const { data: labPrefs } = await supabase
        .from('briefing_lab_preferences')
        .select('timezone, enabled')
        .eq('user_id', userId)
        .maybeSingle();
      
      // Handle skip/off
      if (wake_time.toLowerCase() === 'skip' || wake_time.toLowerCase() === 'off') {
        await supabase
          .from('briefing_lab_preferences')
          .update({ enabled: false })
          .eq('user_id', userId);
        
        return "⏭️ Briefings disabled. Text 'enable briefing' to turn back on.";
      }
      
      // Handle 'same' - just confirm current setting
      if (wake_time.toLowerCase() === 'same') {
        const currentTime = labPrefs?.enabled ? 'enabled' : 'disabled';
        return `📋 Briefings are currently ${currentTime}. Update in the Briefing Lab settings.`;
      }
      
      // Parse time - handle various formats
      let parsedTime = wake_time;
      const timeMatch = wake_time.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || '0');
        const ampm = timeMatch[3]?.toLowerCase();
        
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        parsedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      // Update Lab preferences with new wake time
      await supabase
        .from('briefing_lab_preferences')
        .upsert({
          user_id: userId,
          default_wake_time: parsedTime,
          enabled: true
        }, { onConflict: 'user_id' });
      
      return `⏰ Wake time set to ${parsedTime}. Briefing will generate ~1hr before. 🌙`;
    }
    
    case 'get_briefing_status': {
      // Get Lab preferences
      const { data: labPrefs } = await supabase
        .from('briefing_lab_preferences')
        .select('timezone, enabled, default_wake_time')
        .eq('user_id', userId)
        .maybeSingle();
      
      const timezone = labPrefs?.timezone || 'America/Chicago';
      const now = new Date();
      const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const todayStr = userNow.toISOString().split('T')[0];
      
      // Check today's Lab episode
      const { data: todayEpisode } = await supabase
        .from('briefing_lab_episodes')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${todayStr}T00:00:00Z`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let response = '';
      
      if (todayEpisode) {
        const status = todayEpisode.status;
        if (status === 'ready') response += `☀️ Today's briefing is ready!\n`;
        else if (status === 'played') response += `✅ Played today's briefing\n`;
        else if (status === 'generating') response += `⏳ Generating briefing...\n`;
        else if (status === 'failed') response += `❌ Today's briefing failed: ${todayEpisode.error_message || 'Unknown error'}\n`;
      } else {
        response += `📋 No briefing generated today yet.\n`;
      }
      
      if (labPrefs?.enabled) {
        response += `⏰ Wake time: ${labPrefs.default_wake_time?.slice(0, 5) || '07:00'}`;
      } else {
        response += `⚠️ Briefings disabled. Text 'enable briefing' to turn on.`;
      }
      
      return response.trim();
    }
    
    default:
      return `❓ Unknown: ${toolName}`;
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
      return twimlSms("Sorry, there's a configuration error. Please try again later.");
    }

    // Parse form data from Twilio
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    console.log('Twilio SMS webhook received:', JSON.stringify(params, null, 2));

    // Validate Twilio signature - REQUIRED for security
    const twilioSignature = req.headers.get('x-twilio-signature');
    // Use the actual Supabase project ID for webhook URL validation
    // This must match the URL configured in Twilio console
    const SUPABASE_PROJECT_REF = Deno.env.get('SUPABASE_PROJECT_REF') || 'gogzkyjylruuziseprfw';
    const webhookUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/twilio-sms-webhook`;
    
    if (!twilioSignature) {
      console.error('Missing Twilio signature header - rejecting request');
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    const isValid = await validateTwilioSignature(
      TWILIO_AUTH_TOKEN,
      twilioSignature,
      webhookUrl,
      params
    );
    
    if (!isValid) {
      console.error('Invalid Twilio signature - rejecting request');
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get message info
    const fromNumber = params.From;
    const messageBody = params.Body?.trim();
    
    if (!messageBody) {
      return twimlSms("Hi! I'm Toasty 🍞 Text me anything - ask about your tasks, log habits, or just chat!");
    }

    // Normalize phone number for lookup
    const normalizedNumber = fromNumber?.replace(/\D/g, '');
    
    // Look up user by phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone_us, member_pin')
      .or(`phone_us.ilike.%${normalizedNumber?.slice(-10)}%,phone_whatsapp.ilike.%${normalizedNumber?.slice(-10)}%`)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
    }

    // If no user found, offer help
    if (!profile) {
      console.log('No user found for number:', fromNumber);
      return twimlSms(
        "Hi! I'm Toasty from GroovyPlanning 🍞\n\n" +
        "I don't recognize this number. To use SMS features:\n" +
        "1. Log in to GroovyPlanning.ai\n" +
        "2. Go to Settings → Profile\n" +
        "3. Add this phone number\n\n" +
        "Then text me again!"
      );
    }

    const userName = profile.display_name || 'there';
    const userId = profile.user_id;

    console.log(`Processing SMS from ${userName} (${userId}): ${messageBody}`);

    // Fetch user context for AI
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    const [tasksResult, habitsResult, goalsResult, cycleResult] = await Promise.all([
      supabase.from('quick_tasks').select('title, category, due_date').eq('user_id', userId).eq('completed', false).order('position').limit(5),
      supabase.from('goal_tactics').select('title, target_count').eq('user_id', userId).eq('is_active', true).limit(5),
      supabase.from('goals').select('title, target_value, metric_type').eq('user_id', userId).limit(3),
      supabase.from('cycles').select('name, start_date, end_date').eq('user_id', userId).eq('status', 'active').maybeSingle()
    ]);

    const tasks = tasksResult.data || [];
    const habits = habitsResult.data || [];
    const goals = goalsResult.data || [];
    const cycle = cycleResult.data;

    // Fetch user timezone for date calculations
    const { data: briefingPrefs } = await supabase
      .from('briefing_preferences')
      .select('timezone')
      .eq('user_id', userId)
      .maybeSingle();
    
    const userTimezone = briefingPrefs?.timezone || 'America/Chicago';

    let cycleContext = '';
    if (cycle) {
      const startDate = new Date(cycle.start_date);
      const now = new Date();
      const currentWeek = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      cycleContext = `Current cycle: "${cycle.name}" (Week ${Math.min(currentWeek, 8)}/8)`;
    }

    const taskContext = tasks.length ? `Pending tasks: ${tasks.map((t: any) => t.title).join(', ')}` : 'No pending tasks';
    const habitContext = habits.length ? `Active habits: ${habits.map((h: any) => h.title).join(', ')}` : 'No active habits';
    const goalContext = goals.length ? `Goals: ${goals.map((g: any) => `${g.title} (${g.target_value} ${g.metric_type})`).join(', ')}` : 'No active goals';

    // Build system prompt with comprehensive tool descriptions
    const systemPrompt = `You are Toasty 🍞, a warm and helpful SMS assistant for GroovyPlanning.ai.
You're texting with ${userName}. Keep responses SHORT (under 160 chars when possible, max 300).
Be warm, encouraging, and use emojis sparingly.

You have comprehensive tools:
- DATA LOGGING: create_task, complete_task, log_habit, log_weight, log_blood_pressure, log_sleep, log_nap, log_meal, log_water, toggle_reset_rule
- INSIGHTS: list_tasks, get_habit_status, get_goal_progress, get_daily_briefing, get_reset_status
- CUMULATIVE DATA: get_cumulative_habit_progress (for "how many pushups this month?" type questions)
- HEALTH INSIGHTS: get_sleep_insights, get_activity_insights, get_heart_rate_insights, get_nutrition_summary
- PRODUCTIVITY: get_habit_streaks, get_focus_insights
- HISTORY SEARCH: search_history (for "when did I..." or "have I ever..." questions)

CRITICAL TOOL RULES:
- log_habit: Call ONCE per habit. The 'count' = sets completed (usually 1).
  - "Did 10 pushups" → log_habit(habit_name: "pushups", count: 1)
  - "Did 3 sets of pushups" → log_habit(habit_name: "pushups", count: 3)
  - "Wrote 100 pages" → log_habit(habit_name: "writing", count: 1)
  - NEVER call the same tool multiple times for a single user request

For cumulative questions like "how many pushups this month", use get_cumulative_habit_progress.
For historical questions like "when did I journal about stress", use search_history.

USER CONTEXT:
${cycleContext}
${taskContext}
${habitContext}
${goalContext}

Respond naturally to their message. Use tools when appropriate.`;

    // Call AI with tools
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageBody }
        ],
        tools: smsTools,
        tool_choice: 'auto',
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return twimlSms("Sorry, I'm having trouble thinking right now. Try again in a moment! 🍞");
    }

    const aiResult = await response.json();
    const message = aiResult.choices?.[0]?.message;

    if (!message) {
      return twimlSms("Hmm, I got confused. Try rephrasing? 🍞");
    }

    // Handle tool calls
    if (message.tool_calls?.length) {
      const toolResults: string[] = [];
      const habitCallsProcessed = new Set<string>(); // Track processed habits to prevent duplicates
      
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        // Dedupe habit logs - only process first call per habit
        if (toolName === 'log_habit') {
          const habitKey = `${toolName}:${(toolArgs.habit_name || '').toLowerCase()}`;
          if (habitCallsProcessed.has(habitKey)) {
            console.log(`Skipping duplicate habit call: ${habitKey}`);
            continue;
          }
          habitCallsProcessed.add(habitKey);
        }
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        const result = await executeTool(toolName, toolArgs, supabase, userId, LOVABLE_API_KEY, userTimezone);
        toolResults.push(result);
      }
      
      // If there's also content, combine it
      const aiContent = message.content || '';
      const combined = [...toolResults, aiContent].filter(Boolean).join('\n\n');
      
      return twimlSms(combined.slice(0, 1600));
    }

    // Just return the AI response
    return twimlSms((message.content || "I'm here! How can I help? 🍞").slice(0, 1600));

  } catch (error) {
    console.error('SMS webhook error:', error);
    return twimlSms("Oops, something went wrong! Try again? 🍞");
  }
});
