import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

// Validate Twilio request signature using Web Crypto API
async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  try {
    // Sort params alphabetically and concatenate
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => key + params[key])
      .join('');
    
    const data = url + sortedParams;
    
    // Create HMAC-SHA1 signature using Web Crypto API
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

serve(async (req) => {
  // Handle CORS preflight
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

    // Validate Twilio signature (skip in development if needed)
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

    // Normalize phone number for lookup (remove + and format variations)
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

    // Check if this is the initial call or a conversation response
    if (speechResult) {
      // This is a response from the user - process with AI
      console.log('Processing speech input:', speechResult);

      // First, respond with a thinking message to reduce perceived latency
      // We use <Redirect> to process in background and come back
      
      // Fetch context for AI
      const { data: tasks } = await supabase
        .from('quick_tasks')
        .select('title, category, due_date')
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

      // Build context for AI
      const taskContext = tasks?.length 
        ? `User's pending tasks: ${tasks.map(t => t.title).join(', ')}`
        : 'No pending tasks.';

      const habitContext = recentHabits?.length
        ? `Recent habits: ${recentHabits.map(h => (h as any).goal_tactics?.title).filter(Boolean).join(', ')}`
        : '';

      // Call Lovable AI for response
      const systemPrompt = `You are a helpful voice assistant for GroovyPlanning.ai, a goal and task management app. 
You're speaking to ${userName} on the phone. Keep responses conversational and concise (under 100 words) since this is voice.
Be warm, encouraging, and helpful. You can help with tasks, goals, habits, and general productivity advice.

Context:
${taskContext}
${habitContext}

Remember: This is a phone call, so speak naturally and avoid markdown, bullet points, or formatting.`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: speechResult }
            ],
            max_tokens: 300,
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
        const assistantMessage = aiData.choices?.[0]?.message?.content || 
          "I'm not sure how to respond to that. Is there something else I can help you with?";

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

      // Return greeting with gather for next input
      return twiml(
        say(greeting) +
        gather(baseUrl, "What's on your mind? You can ask me about your tasks, goals, or anything else.")
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
