import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, turn, topic, userId, fullContext } = await req.json();
    
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Validate turn and required keys
    if (turn === 'claude' && !ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    if (turn === 'gemini' && !GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
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

THE USER'S COMPLETE DATA CONTEXT:
${fullContext}

Remember: This conversation can go ANYWHERE. If ${otherAI} brings up something tangential, explore it. If you notice something unexpected in the data, mention it. The goal is genuine insight and interesting dialogue, not a formal report.`;

    let streamResponse: Response;

    if (turn === 'claude') {
      // Call Anthropic API
      const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'claude' ? 'assistant' : m.role === 'gemini' ? 'user' : m.role,
        content: m.content
      }));

      // Anthropic expects alternating user/assistant, so we need to format properly
      // For the debate, Claude sees Gemini's messages as "user" inputs to respond to
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
        formattedMessages.push({ role: 'user', content: `Begin the debate about: ${topic}` });
      } else if (formattedMessages[formattedMessages.length - 1].role === 'assistant') {
        // Need a user message after assistant
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
        geminiMessages.push({ role: 'user', parts: [{ text: `Begin the debate about: ${topic}` }] });
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
