import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackfillResult {
  voiceCallLogs: { processed: number; skipped: number; errors: number };
  audioJournals: { processed: number; skipped: number; errors: number };
  monthlyIntentions: { processed: number; skipped: number; errors: number };
  chatConversations: { processed: number; skipped: number; errors: number };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result: BackfillResult = {
      voiceCallLogs: { processed: 0, skipped: 0, errors: 0 },
      audioJournals: { processed: 0, skipped: 0, errors: 0 },
      monthlyIntentions: { processed: 0, skipped: 0, errors: 0 },
      chatConversations: { processed: 0, skipped: 0, errors: 0 },
    };

    // Helper to generate embedding via edge function
    async function generateEmbedding(
      sourceType: string,
      sourceId: string,
      contentText: string,
      activityDate: string,
      metadata?: Record<string, unknown>
    ): Promise<boolean> {
      if (!contentText || contentText.trim().length < 10) {
        return false;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          sourceType,
          sourceId,
          contentText,
          activityDate,
          metadata,
        }),
      });

      return response.ok;
    }

    console.log(`Starting backfill for user ${user.id}`);

    // 1. Voice Call Logs - embed conversations with messages
    console.log("Processing voice call logs...");
    const { data: voiceCallLogs } = await supabase
      .from("voice_call_logs")
      .select("id, call_sid, messages, tasks_created, tasks_completed, created_at")
      .eq("user_id", user.id)
      .not("messages", "is", null);

    for (const log of voiceCallLogs || []) {
      try {
        // Check if already embedded
        const { data: existing } = await supabase
          .from("activity_embeddings")
          .select("id")
          .eq("source_type", "voice_call_log")
          .eq("source_id", log.id)
          .maybeSingle();

        if (existing) {
          result.voiceCallLogs.skipped++;
          continue;
        }

        const messages = log.messages as { role: string; content: string }[] || [];
        const userMessages = messages.filter(m => m.role === "user").map(m => m.content).filter(Boolean);
        
        if (userMessages.length === 0) {
          result.voiceCallLogs.skipped++;
          continue;
        }

        const parts: string[] = [`Voice call on ${new Date(log.created_at).toLocaleDateString()}.`];
        parts.push(`User requested: ${userMessages.join(". ")}`);
        
        const tasksCreated = log.tasks_created as { title: string }[] || [];
        const tasksCompleted = log.tasks_completed as { title: string }[] || [];
        
        if (tasksCreated.length > 0) {
          parts.push(`Tasks created: ${tasksCreated.map(t => t.title).join(", ")}`);
        }
        if (tasksCompleted.length > 0) {
          parts.push(`Habits/tasks completed: ${tasksCompleted.map(t => t.title).join(", ")}`);
        }

        const success = await generateEmbedding(
          "voice_call_log",
          log.id,
          parts.join(" "),
          log.created_at.split("T")[0],
          {
            callSid: log.call_sid,
            messageCount: messages.length,
            tasksCreated: tasksCreated.length,
            tasksCompleted: tasksCompleted.length,
          }
        );

        if (success) {
          result.voiceCallLogs.processed++;
        } else {
          result.voiceCallLogs.errors++;
        }

        // Rate limiting delay
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error processing voice call log ${log.id}:`, err);
        result.voiceCallLogs.errors++;
      }
    }

    // 2. Audio Journal Recordings - embed transcripts
    console.log("Processing audio journal recordings...");
    const { data: audioRecordings } = await supabase
      .from("journal_audio_recordings")
      .select("id, audio_transcript, audio_metadata, created_at")
      .eq("user_id", user.id)
      .not("audio_transcript", "is", null);

    for (const recording of audioRecordings || []) {
      try {
        const { data: existing } = await supabase
          .from("activity_embeddings")
          .select("id")
          .eq("source_type", "audio_journal")
          .eq("source_id", recording.id)
          .maybeSingle();

        if (existing) {
          result.audioJournals.skipped++;
          continue;
        }

        const metadata = recording.audio_metadata as { mood?: string; energyLevel?: number; keyThemes?: string[] } || {};
        const parts: string[] = [`Voice journal from ${new Date(recording.created_at).toLocaleDateString()}.`];
        
        if (metadata.mood) parts.push(`Mood: ${metadata.mood}`);
        if (metadata.energyLevel) parts.push(`Energy level: ${metadata.energyLevel}/10`);
        if (metadata.keyThemes?.length) parts.push(`Key themes: ${metadata.keyThemes.join(", ")}`);
        parts.push(`Transcript: ${recording.audio_transcript}`);

        const success = await generateEmbedding(
          "audio_journal",
          recording.id,
          parts.join(" "),
          recording.created_at.split("T")[0],
          metadata
        );

        if (success) {
          result.audioJournals.processed++;
        } else {
          result.audioJournals.errors++;
        }

        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error processing audio recording ${recording.id}:`, err);
        result.audioJournals.errors++;
      }
    }

    // 3. Monthly Intentions
    console.log("Processing monthly intentions...");
    const { data: intentions } = await supabase
      .from("monthly_intentions")
      .select("id, intention_word, intention_description, month_year, created_at")
      .eq("user_id", user.id);

    for (const intention of intentions || []) {
      try {
        const { data: existing } = await supabase
          .from("activity_embeddings")
          .select("id")
          .eq("source_type", "monthly_intention")
          .eq("source_id", intention.id)
          .maybeSingle();

        if (existing) {
          result.monthlyIntentions.skipped++;
          continue;
        }

        const parts: string[] = [`Monthly intention for ${intention.month_year}: "${intention.intention_word}".`];
        if (intention.intention_description) {
          parts.push(`Description: ${intention.intention_description}`);
        }

        const success = await generateEmbedding(
          "monthly_intention",
          intention.id,
          parts.join(" "),
          intention.created_at.split("T")[0],
          { word: intention.intention_word, monthYear: intention.month_year }
        );

        if (success) {
          result.monthlyIntentions.processed++;
        } else {
          result.monthlyIntentions.errors++;
        }

        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error processing intention ${intention.id}:`, err);
        result.monthlyIntentions.errors++;
      }
    }

    // 4. Chat Conversations (Goal Coach / AI Arena)
    console.log("Processing chat conversations...");
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id);

    for (const convo of conversations || []) {
      try {
        const { data: existing } = await supabase
          .from("activity_embeddings")
          .select("id")
          .eq("source_type", "chat_conversation")
          .eq("source_id", convo.id)
          .maybeSingle();

        if (existing) {
          result.chatConversations.skipped++;
          continue;
        }

        // Fetch messages for this conversation
        const { data: messages } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", convo.id)
          .order("created_at")
          .limit(10);

        const userMessages = (messages || [])
          .filter(m => m.role === "user")
          .map(m => m.content)
          .slice(0, 5);

        if (userMessages.length === 0) {
          result.chatConversations.skipped++;
          continue;
        }

        const parts: string[] = [`Chat conversation: "${convo.title}".`];
        parts.push(`Topics discussed: ${userMessages.join(" | ")}`);

        const success = await generateEmbedding(
          "chat_conversation",
          convo.id,
          parts.join(" "),
          convo.created_at.split("T")[0],
          { title: convo.title, messageCount: messages?.length || 0 }
        );

        if (success) {
          result.chatConversations.processed++;
        } else {
          result.chatConversations.errors++;
        }

        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error processing conversation ${convo.id}:`, err);
        result.chatConversations.errors++;
      }
    }

    const totalProcessed = 
      result.voiceCallLogs.processed + 
      result.audioJournals.processed + 
      result.monthlyIntentions.processed + 
      result.chatConversations.processed;

    console.log(`Backfill complete. Processed ${totalProcessed} embeddings.`);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
