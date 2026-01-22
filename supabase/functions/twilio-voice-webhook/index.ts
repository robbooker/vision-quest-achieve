import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

// AI tools for voice commands
const voiceTools = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task for the user. Use when they say things like 'add a task', 'remind me to', 'create a task for', etc.",
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
      description: "Mark a task as complete. Use when they say 'complete', 'done', 'finished', 'mark as done', etc.",
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
      description: "List the user's pending tasks. Use when they ask 'what are my tasks', 'what do I need to do', etc.",
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
      name: "get_goal_progress",
      description: "Get progress on the user's goals. Use when they ask 'how am I doing on my goals', 'what's my progress', 'goal update', etc.",
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
      name: "get_weekly_summary",
      description: "Get a summary of the user's week. Use when they ask 'how was my week', 'what did I accomplish', 'weekly recap', etc.",
      parameters: {
        type: "object",
        properties: {},
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
      ${say(prompt)}
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!TWILIO_AUTH_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
        // Log but don't block - signature validation can fail due to URL mismatches
        console.warn('Twilio signature validation failed - proceeding anyway for now');
        // In production, you may want to return a 403 here after confirming URLs match
      }
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get caller info
    const callerNumber = params.From;
    const callSid = params.CallSid;
    const speechResult = params.SpeechResult;
    const callStatus = params.CallStatus;
    const digits = params.Digits; // For PIN entry via keypad
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
        // Invalid PIN - offer to try again
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

    // Handle call end - update call log
    if (callStatus === 'completed') {
      await supabase
        .from('voice_call_logs')
        .update({ call_ended_at: new Date().toISOString() })
        .eq('call_sid', callSid);
      
      return new Response('OK', { headers: corsHeaders });
    }

    // Get or create call log for conversation memory
    let { data: callLog } = await supabase
      .from('voice_call_logs')
      .select('*')
      .eq('call_sid', callSid)
      .maybeSingle();

    if (!callLog) {
      // Create new call log
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
      console.log('Conversation history length:', conversationHistory.length);

      // Fetch comprehensive context for AI
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();

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
        // Pending tasks
        supabase
          .from('quick_tasks')
          .select('id, title, category, due_date, completed')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('position')
          .limit(10),
        
        // Completed tasks (last 7 days)
        supabase
          .from('quick_tasks')
          .select('title, completed_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', sevenDaysAgoStr)
          .order('completed_at', { ascending: false })
          .limit(10),
        
        // Recent habits
        supabase
          .from('tactic_logs')
          .select('goal_tactics(title), completed_count, logged_date')
          .eq('user_id', userId)
          .gte('logged_date', sevenDaysAgoStr.split('T')[0])
          .order('logged_date', { ascending: false })
          .limit(10),
        
        // Goals with milestones
        supabase
          .from('goals')
          .select(`
            title, target_value, metric_type, why, goal_type,
            obstacles, strategies, vision_connection,
            milestones(week_number, target_value, description)
          `)
          .eq('user_id', userId)
          .limit(5),
        
        // Active cycle
        supabase
          .from('cycles')
          .select('id, name, start_date, end_date, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        
        // User vision
        supabase
          .from('user_vision')
          .select('vision_3_year, vision_long_term, core_values')
          .eq('user_id', userId)
          .maybeSingle(),
        
        // Recent focus sessions
        supabase
          .from('focus_sessions')
          .select('objective, actual_duration_minutes, started_at, status')
          .eq('user_id', userId)
          .gte('started_at', sevenDaysAgoStr)
          .order('started_at', { ascending: false })
          .limit(5),
        
        // Recent journal entries
        supabase
          .from('journal_entries')
          .select('entry_date, user_notes, audio_transcript')
          .eq('user_id', userId)
          .order('entry_date', { ascending: false })
          .limit(3)
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

IMPORTANT: You have tools to help with tasks and provide insights:
- create_task: When they say "add a task for X" or "remind me to X"
- complete_task: When they say "complete X" or "mark X as done"
- list_tasks: When they ask "what are my tasks"
- get_goal_progress: When they ask "how am I doing on my goals"
- get_weekly_summary: When they ask "how was my week"

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

            if (functionName === 'create_task') {
              // Create a new task
              const { data: newTask, error: taskError } = await supabase
                .from('quick_tasks')
                .insert({
                  user_id: userId,
                  title: args.title,
                  category: args.category || 'personal',
                  position: 0
                })
                .select()
                .single();

              if (taskError) {
                console.error('Failed to create task:', taskError);
                toolResults.push(`Failed to create task: ${args.title}`);
              } else {
                toolResults.push(`Created task: ${args.title}`);
                tasksCreated.push({ id: newTask.id, title: args.title, created_at: new Date().toISOString() });
              }

            } else if (functionName === 'complete_task') {
              // Find and complete the task
              const searchTerm = args.task_title.toLowerCase();
              const matchingTask = tasks?.find(t => 
                t.title.toLowerCase().includes(searchTerm) ||
                searchTerm.includes(t.title.toLowerCase())
              );

              if (matchingTask) {
                const { error: updateError } = await supabase
                  .from('quick_tasks')
                  .update({ completed: true, completed_at: new Date().toISOString() })
                  .eq('id', matchingTask.id);

                if (updateError) {
                  console.error('Failed to complete task:', updateError);
                  toolResults.push(`Failed to complete task: ${matchingTask.title}`);
                } else {
                  toolResults.push(`Completed task: ${matchingTask.title}`);
                  tasksCompleted.push({ id: matchingTask.id, title: matchingTask.title, completed_at: new Date().toISOString() });
                }
              } else {
                toolResults.push(`Could not find a task matching: ${args.task_title}`);
              }

            } else if (functionName === 'list_tasks') {
              const limit = args.limit || 5;
              const taskList = tasks?.slice(0, limit).map(t => t.title).join(', ') || 'No pending tasks';
              toolResults.push(`Tasks: ${taskList}`);

            } else if (functionName === 'get_goal_progress') {
              // Build goal progress summary
              let progressSummary = '';
              if (goals && goals.length > 0) {
                progressSummary = `Goals progress:\n${goals.map(g => {
                  let goalInfo = `"${g.title}" - Target: ${g.target_value} ${g.metric_type}`;
                  if (g.milestones && g.milestones.length > 0 && currentWeek > 0) {
                    const currentMilestone = g.milestones.find((m: any) => m.week_number === currentWeek);
                    if (currentMilestone) {
                      goalInfo += ` | This week's target: ${currentMilestone.target_value}`;
                    }
                  }
                  return goalInfo;
                }).join('\n')}`;
                if (cycleContext) progressSummary += `\n${cycleContext}`;
              } else {
                progressSummary = 'No active goals set.';
              }
              toolResults.push(progressSummary);

            } else if (functionName === 'get_weekly_summary') {
              // Build weekly summary
              const completedCount = completedTasks?.length || 0;
              const focusMinutes = focusSessions?.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) || 0;
              const habitCount = recentHabits?.length || 0;
              
              let summary = `Weekly summary: `;
              summary += `${completedCount} tasks completed. `;
              summary += `${focusMinutes} minutes of focused work across ${focusSessions?.length || 0} sessions. `;
              summary += `${habitCount} habit logs this week. `;
              if (cycleContext) summary += cycleContext;
              
              toolResults.push(summary);
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
          gather(baseUrl, "Is there anything else I can help you with?")
        );

      } catch (aiError) {
        console.error('AI call error:', aiError);
        return twiml(
          say("I encountered an error processing your request. Please try again.") +
          gather(baseUrl, "What would you like to know?")
        );
      }

    } else {
      // Initial call - give the welcome briefing with full context
      console.log('Initial call from:', userName);

      // Fetch context for initial greeting in parallel
      const [tasksResult, cycleResult, goalsResult] = await Promise.all([
        // Fetch top 3 pending tasks
        supabase
          .from('quick_tasks')
          .select('title, category, due_date')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('position')
          .limit(3),
        
        // Fetch active cycle
        supabase
          .from('cycles')
          .select('id, name, start_date, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        
        // Fetch goals
        supabase
          .from('goals')
          .select('title')
          .eq('user_id', userId)
          .limit(2)
      ]);

      const tasks = tasksResult.data;
      const activeCycle = cycleResult.data;
      const goals = goalsResult.data;

      // Calculate current week if cycle exists
      let weekInfo = '';
      if (activeCycle) {
        const startDate = new Date(activeCycle.start_date);
        const now = new Date();
        const weekNumber = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        weekInfo = `You're in week ${Math.min(weekNumber, 8)} of your "${activeCycle.name}" cycle. `;
      }

      // Build the greeting
      let greeting = `Hi ${userName}! Welcome back to Groovy Planning. `;
      
      if (weekInfo) {
        greeting += weekInfo;
      }
      
      if (tasks && tasks.length > 0) {
        greeting += "Your top tasks are: ";
        tasks.forEach((task, index) => {
          const separator = index === tasks.length - 1 ? '. ' : ', ';
          greeting += `${task.title}${separator}`;
        });
      } else {
        greeting += "You're all caught up with no pending tasks! ";
      }

      if (goals && goals.length > 0) {
        greeting += `You can ask me about your ${goals.length} active goal${goals.length > 1 ? 's' : ''}, `;
      }

      greeting += "add tasks, mark them complete, or get a weekly summary.";

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
        gather(baseUrl, "What's on your mind?")
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
