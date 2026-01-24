import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

// SMS tools for conversational AI
const smsTools = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task for the user. Use when they want to add, create, or remember to do something.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title/description of the task to create"
          },
          category: {
            type: "string",
            enum: ["personal", "work"],
            description: "The category of the task. Default to 'personal' unless work-related."
          }
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
          task_title: {
            type: "string",
            description: "The title or partial title of the task to complete (will match closest)"
          }
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
          limit: {
            type: "number",
            description: "Number of tasks to list. Default 5."
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_habit",
      description: "Log a habit/tactic completion. Use when they say 'log meditation', 'did my workout', etc.",
      parameters: {
        type: "object",
        properties: {
          habit_name: {
            type: "string",
            description: "The name of the habit to log (will match closest)"
          },
          count: {
            type: "number",
            description: "Number of times completed. Default 1."
          }
        },
        required: ["habit_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_habit_status",
      description: "Get the user's habit/tactic status and streaks. Use when they ask about habits or streaks.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_goal_progress",
      description: "Get progress on the user's goals. Use when they ask about goals or progress.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_daily_briefing",
      description: "Get a daily briefing with priorities, habits, and upcoming items. Use for 'briefing', 'how's my day', etc.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
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

// Execute tool calls
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: any,
  userId: string
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  
  switch (toolName) {
    case 'create_task': {
      const { title, category = 'personal' } = args as { title: string; category?: string };
      const { error } = await supabase
        .from('quick_tasks')
        .insert({
          user_id: userId,
          title,
          category,
          position: 0
        });
      
      if (error) {
        console.error('Create task error:', error);
        return `Failed to create task: ${error.message}`;
      }
      return `✅ Task created: "${title}"`;
    }
    
    case 'complete_task': {
      const { task_title } = args as { task_title: string };
      
      // Find matching task
      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('id, title')
        .eq('user_id', userId)
        .eq('completed', false)
        .ilike('title', `%${task_title}%`)
        .limit(1) as { data: { id: string; title: string }[] | null };
      
      if (!tasks?.length) {
        return `❌ Couldn't find a task matching "${task_title}"`;
      }
      
      const { error } = await supabase
        .from('quick_tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', tasks[0].id);
      
      if (error) {
        return `Failed to complete task: ${error.message}`;
      }
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
        .limit(limit) as { data: { title: string; category: string; due_date: string | null }[] | null };
      
      if (!tasks?.length) {
        return "📋 No pending tasks. You're all caught up!";
      }
      
      const taskList = tasks.map((t, i) => 
        `${i + 1}. ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}`
      ).join('\n');
      
      return `📋 Your tasks:\n${taskList}`;
    }
    
    case 'log_habit': {
      const { habit_name, count = 1 } = args as { habit_name: string; count?: number };
      
      // Find matching tactic
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select('id, title')
        .eq('user_id', userId)
        .eq('is_active', true)
        .ilike('title', `%${habit_name}%`)
        .limit(1) as { data: { id: string; title: string }[] | null };
      
      if (!tactics?.length) {
        return `❌ Couldn't find a habit matching "${habit_name}"`;
      }
      
      // Check if already logged today
      const { data: existingLog } = await supabase
        .from('tactic_logs')
        .select('id, completed_count')
        .eq('tactic_id', tactics[0].id)
        .eq('logged_date', today)
        .maybeSingle() as { data: { id: string; completed_count: number } | null };
      
      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('tactic_logs')
          .update({ completed_count: existingLog.completed_count + count })
          .eq('id', existingLog.id);
        
        if (error) return `Failed to update habit: ${error.message}`;
        return `✅ Updated "${tactics[0].title}" to ${existingLog.completed_count + count} today!`;
      } else {
        // Create new log
        const { error } = await supabase
          .from('tactic_logs')
          .insert({
            user_id: userId,
            tactic_id: tactics[0].id,
            logged_date: today,
            completed_count: count
          });
        
        if (error) return `Failed to log habit: ${error.message}`;
        return `✅ Logged "${tactics[0].title}"${count > 1 ? ` (${count}x)` : ''}!`;
      }
    }
    
    case 'get_habit_status': {
      // Get active tactics with logs from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: tactics } = await supabase
        .from('goal_tactics')
        .select(`
          title, target_count, frequency,
          tactic_logs(logged_date, completed_count)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('tactic_logs.logged_date', sevenDaysAgo.toISOString().split('T')[0])
        .limit(5) as { data: { title: string; target_count: number; frequency: string; tactic_logs: { logged_date: string; completed_count: number }[] }[] | null };
      
      if (!tactics?.length) {
        return "📊 No active habits to track. Create some in the app!";
      }
      
      const habitLines = tactics.map(t => {
        const logs = (t as any).tactic_logs || [];
        const totalThisWeek = logs.reduce((sum: number, l: any) => sum + l.completed_count, 0);
        const todayLog = logs.find((l: any) => l.logged_date === today);
        const todayCount = todayLog?.completed_count || 0;
        return `• ${t.title}: ${todayCount} today / ${totalThisWeek} this week`;
      });
      
      return `📊 Habit Status:\n${habitLines.join('\n')}`;
    }
    
    case 'get_goal_progress': {
      const { data: goals } = await supabase
        .from('goals')
        .select('title, target_value, metric_type')
        .eq('user_id', userId)
        .limit(5) as { data: { title: string; target_value: number; metric_type: string }[] | null };
      
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('name, start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle() as { data: { name: string; start_date: string; end_date: string } | null };
      
      if (!goals?.length) {
        return "🎯 No active goals. Create one in the app to start tracking!";
      }
      
      let response = "🎯 Your Goals:\n";
      
      if (activeCycle) {
        const startDate = new Date(activeCycle.start_date);
        const now = new Date();
        const currentWeek = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        response = `📅 ${activeCycle.name} (Week ${Math.min(currentWeek, 8)}/8)\n\n🎯 Goals:\n`;
      }
      
      response += goals.map(g => 
        `• ${g.title}: ${g.target_value} ${g.metric_type}`
      ).join('\n');
      
      return response;
    }
    
    case 'get_daily_briefing': {
      // Fetch tasks, habits for today, cycle info
      const [tasksResult, habitsResult, cycleResult] = await Promise.all([
        supabase
          .from('quick_tasks')
          .select('title')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('position')
          .limit(3) as Promise<{ data: { title: string }[] | null }>,
        
        supabase
          .from('goal_tactics')
          .select('title, target_count')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(3) as Promise<{ data: { title: string; target_count: number }[] | null }>,
        
        supabase
          .from('cycles')
          .select('name, start_date')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle() as Promise<{ data: { name: string; start_date: string } | null }>
      ]);
      
      let briefing = "☀️ Daily Briefing\n\n";
      
      // Cycle info
      if (cycleResult.data) {
        const startDate = new Date(cycleResult.data.start_date);
        const now = new Date();
        const currentWeek = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        briefing += `📅 ${cycleResult.data.name} - Week ${Math.min(currentWeek, 8)}\n\n`;
      }
      
      // Top tasks
      if (tasksResult.data?.length) {
        briefing += "📋 Priority Tasks:\n";
        briefing += tasksResult.data.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
        briefing += "\n\n";
      } else {
        briefing += "📋 No pending tasks!\n\n";
      }
      
      // Habits to do
      if (habitsResult.data?.length) {
        briefing += "🔄 Habits:\n";
        briefing += habitsResult.data.map(h => `• ${h.title}`).join('\n');
      }
      
      return briefing;
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
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
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

    // Validate Twilio signature
    const twilioSignature = req.headers.get('x-twilio-signature');
    const SUPABASE_PROJECT_ID = SUPABASE_URL.replace('https://', '').split('.')[0];
    const webhookUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/twilio-sms-webhook`;
    
    if (twilioSignature) {
      const isValid = await validateTwilioSignature(
        TWILIO_AUTH_TOKEN,
        twilioSignature,
        webhookUrl,
        params
      );
      
      if (!isValid) {
        console.warn('Twilio signature validation failed - proceeding anyway');
      }
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
    const today = new Date().toISOString().split('T')[0];

    const [
      tasksResult,
      habitsResult,
      goalsResult,
      cycleResult
    ] = await Promise.all([
      supabase
        .from('quick_tasks')
        .select('title, category, due_date')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('position')
        .limit(5),
      
      supabase
        .from('goal_tactics')
        .select('title, target_count')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(5),
      
      supabase
        .from('goals')
        .select('title, target_value, metric_type')
        .eq('user_id', userId)
        .limit(3),
      
      supabase
        .from('cycles')
        .select('name, start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
    ]);

    const tasks = tasksResult.data || [];
    const habits = habitsResult.data || [];
    const goals = goalsResult.data || [];
    const cycle = cycleResult.data;

    // Calculate cycle week
    let cycleContext = '';
    if (cycle) {
      const startDate = new Date(cycle.start_date);
      const now = new Date();
      const currentWeek = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      cycleContext = `Current cycle: "${cycle.name}" (Week ${Math.min(currentWeek, 8)}/8)`;
    }

    const taskContext = tasks.length 
      ? `Pending tasks: ${tasks.map(t => t.title).join(', ')}`
      : 'No pending tasks';

    const habitContext = habits.length
      ? `Active habits: ${habits.map(h => h.title).join(', ')}`
      : 'No active habits';

    const goalContext = goals.length
      ? `Goals: ${goals.map(g => `${g.title} (${g.target_value} ${g.metric_type})`).join(', ')}`
      : 'No active goals';

    // Build system prompt
    const systemPrompt = `You are Toasty 🍞, a warm and helpful SMS assistant for GroovyPlanning.ai.
You're texting with ${userName}. Keep responses SHORT (under 160 chars when possible, max 300).
Be warm, encouraging, and use emojis sparingly.

You have tools to help:
- create_task: Add new tasks
- complete_task: Mark tasks done
- list_tasks: Show pending tasks
- log_habit: Log habit completions
- get_habit_status: Check habit streaks
- get_goal_progress: Check goal status
- get_daily_briefing: Get today's overview

USER CONTEXT:
${cycleContext}
${taskContext}
${habitContext}
${goalContext}

Respond naturally to their message. Use tools when appropriate.`;

    // Call AI with tools
    const response = await fetch('https://api.lovable.dev/api/chat/completions', {
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
      
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        const result = await executeTool(toolName, toolArgs, supabase, userId);
        toolResults.push(result);
      }
      
      // If there's also content, combine it
      const aiContent = message.content || '';
      const combined = [...toolResults, aiContent].filter(Boolean).join('\n\n');
      
      return twimlSms(combined.slice(0, 1600)); // SMS limit
    }

    // Just return the AI response
    return twimlSms((message.content || "I'm here! How can I help? 🍞").slice(0, 1600));

  } catch (error) {
    console.error('SMS webhook error:', error);
    return twimlSms("Oops, something went wrong! Try again? 🍞");
  }
});
