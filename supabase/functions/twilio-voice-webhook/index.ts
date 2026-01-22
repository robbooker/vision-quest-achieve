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

    // Validate Twilio signature
    const twilioSignature = req.headers.get('x-twilio-signature');
    const requestUrl = req.url;
    
    if (twilioSignature) {
      const isValid = await validateTwilioSignature(
        TWILIO_AUTH_TOKEN,
        twilioSignature,
        requestUrl,
        params
      );
      
      if (!isValid) {
        console.error('Invalid Twilio signature');
        return new Response('Unauthorized', { status: 403 });
      }
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get caller info
    const callerNumber = params.From;
    const callSid = params.CallSid;
    const speechResult = params.SpeechResult;
    const callStatus = params.CallStatus;

    // Normalize phone number for lookup
    const normalizedNumber = callerNumber?.replace(/\D/g, '');
    
    // Look up user by phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone_us')
      .or(`phone_us.ilike.%${normalizedNumber?.slice(-10)}%,phone_whatsapp.ilike.%${normalizedNumber?.slice(-10)}%`)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
    }

    // If no user found, ask them to register
    if (!profile) {
      console.log('No user found for number:', callerNumber);
      return twiml(
        say("Welcome to Groovy Planning. I don't recognize this phone number. " +
            "Please register your phone number on our website at groovy planning dot A I, " +
            "then try calling again. Goodbye!") +
        '<Hangup/>'
      );
    }

    const userName = profile.display_name || 'there';
    const userId = profile.user_id;
    const baseUrl = requestUrl.split('?')[0];

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

      // Fetch context for AI
      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('id, title, category, due_date, completed')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('position')
        .limit(10);

      const { data: recentHabits } = await supabase
        .from('tactic_logs')
        .select('goal_tactics(title), completed_count, logged_date')
        .eq('user_id', userId)
        .order('logged_date', { ascending: false })
        .limit(5);

      // Build context
      const taskContext = tasks?.length 
        ? `User's pending tasks:\n${tasks.map((t, i) => `${i + 1}. ${t.title} (${t.category})`).join('\n')}`
        : 'No pending tasks.';

      const habitContext = recentHabits?.length
        ? `Recent habits: ${recentHabits.map(h => (h as any).goal_tactics?.title).filter(Boolean).join(', ')}`
        : '';

      // Build system prompt
      const systemPrompt = `You are a helpful voice assistant for GroovyPlanning.ai, a goal and task management app. 
You're speaking to ${userName} on the phone. Keep responses conversational and concise (under 100 words) since this is voice.
Be warm, encouraging, and helpful. You can help with tasks, goals, habits, and general productivity advice.

IMPORTANT: You have tools to create tasks and mark tasks complete. Use them when the user asks!
- When they say "add a task for X" or "remind me to X" -> use create_task
- When they say "complete X" or "mark X as done" -> use complete_task
- When they ask "what are my tasks" -> use list_tasks

Context:
${taskContext}
${habitContext}

Remember: This is a phone call, so speak naturally and avoid markdown, bullet points, or formatting.
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
      // Initial call - give the welcome briefing
      console.log('Initial call from:', userName);

      // Fetch top 3 pending tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('quick_tasks')
        .select('title, category, due_date')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('position')
        .limit(3);

      if (tasksError) {
        console.error('Tasks fetch error:', tasksError);
      }

      // Build the greeting
      let greeting = `Hi ${userName}! Welcome to Groovy Planning. `;
      
      if (tasks && tasks.length > 0) {
        greeting += "Here's your briefing. ";
        greeting += "Your top tasks are: ";
        
        tasks.forEach((task, index) => {
          const separator = index === tasks.length - 1 ? '. ' : ', ';
          greeting += `${task.title}${separator}`;
        });
      } else {
        greeting += "You're all caught up! No pending tasks right now. ";
      }

      greeting += "You can ask me to add tasks, mark them complete, or chat about your goals.";

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
