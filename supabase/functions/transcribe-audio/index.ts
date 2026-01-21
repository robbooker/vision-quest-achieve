import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscriptionRequest {
  audioUrl: string;
  entryId: string;
}

interface TranscriptionResult {
  transcript: string;
  mood: string;
  energyLevel: number;
  keyThemes: string[];
  highlights: { text: string; significance: string }[];
  suggestedPrompt: string;
  durationSeconds: number;
}

interface TranscriptChunk {
  text: string;
  chunkIndex: number;
  wordCount: number;
}

function chunkTranscript(transcript: string, targetWordCount: number = 350): TranscriptChunk[] {
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
  const chunks: TranscriptChunk[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.trim().split(/\s+/).length;
    
    if (currentWordCount + sentenceWordCount > targetWordCount && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join(" ").trim(),
        chunkIndex: chunks.length,
        wordCount: currentWordCount,
      });
      // Add overlap - keep last sentence for context continuity
      currentChunk = [currentChunk[currentChunk.length - 1] || "", sentence.trim()].filter(Boolean);
      currentWordCount = currentChunk.join(" ").split(/\s+/).length;
    } else {
      currentChunk.push(sentence.trim());
      currentWordCount += sentenceWordCount;
    }
  }

  // Add remaining content
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join(" ").trim(),
      chunkIndex: chunks.length,
      wordCount: currentWordCount,
    });
  }

  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { audioUrl, entryId } = await req.json() as TranscriptionRequest;

    if (!audioUrl || !entryId) {
      return new Response(
        JSON.stringify({ error: "audioUrl and entryId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Transcribing audio for entry ${entryId}, user ${user.id}`);

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    // Determine MIME type from URL
    const mimeType = audioUrl.includes('.webm') ? 'audio/webm' 
      : audioUrl.includes('.mp3') ? 'audio/mp3'
      : audioUrl.includes('.m4a') ? 'audio/mp4'
      : audioUrl.includes('.wav') ? 'audio/wav'
      : 'audio/webm';

    // Call Gemini 3 Pro for transcription and analysis
    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert audio transcription and emotional intelligence analyst. 
            
Your task is to:
1. Transcribe the audio accurately, preserving the natural speech patterns
2. Analyze the emotional tone and mood of the speaker
3. Estimate the energy level (1-10 scale, where 1 is exhausted/low and 10 is highly energized/excited)
4. Identify key themes or topics discussed
5. Extract 1-3 highlight quotes - the most meaningful or insightful moments
6. Suggest a follow-up journaling prompt based on the content

Respond ONLY with valid JSON in this exact format:
{
  "transcript": "Full transcription of the audio...",
  "mood": "one of: happy, calm, reflective, stressed, anxious, energetic, sad, grateful, frustrated, hopeful, tired, excited",
  "energyLevel": 7,
  "keyThemes": ["theme1", "theme2", "theme3"],
  "highlights": [
    {"text": "Exact quote from transcript", "significance": "Why this is meaningful"}
  ],
  "suggestedPrompt": "A thoughtful follow-up question based on the content"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe and analyze this voice journal entry:"
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: mimeType.split('/')[1]
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const responseContent = geminiData.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from transcription service");
    }

    // Parse the JSON response
    let result: TranscriptionResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = responseContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        responseContent.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseContent;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseContent);
      // Fallback: use raw response as transcript
      result = {
        transcript: responseContent,
        mood: "reflective",
        energyLevel: 5,
        keyThemes: [],
        highlights: [],
        suggestedPrompt: "What else would you like to reflect on?",
        durationSeconds: 0,
      };
    }

    // Estimate duration from transcript length (rough: ~150 words per minute)
    const wordCount = result.transcript.split(/\s+/).length;
    result.durationSeconds = Math.round((wordCount / 150) * 60);

    // Update the journal entry with transcription results
    const { error: updateError } = await supabaseAdmin
      .from("journal_entries")
      .update({
        audio_transcript: result.transcript,
        audio_duration_seconds: result.durationSeconds,
        audio_metadata: {
          mood: result.mood,
          energyLevel: result.energyLevel,
          keyThemes: result.keyThemes,
          highlights: result.highlights,
          suggestedPrompt: result.suggestedPrompt,
          transcribedAt: new Date().toISOString(),
        },
      })
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update journal entry:", updateError);
      throw new Error("Failed to save transcription");
    }

    // Chunk the transcript for embeddings
    const chunks = chunkTranscript(result.transcript);
    console.log(`Created ${chunks.length} chunks from transcript`);

    // Generate embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      try {
        const embeddingResponse = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            sourceType: chunks.length === 1 ? "audio_journal" : "audio_journal_chunk",
            sourceId: entryId,
            contentText: chunk.text,
            activityDate: new Date().toISOString().split("T")[0],
            metadata: {
              chunkIndex: index,
              totalChunks: chunks.length,
              mood: result.mood,
              energyLevel: result.energyLevel,
              keyThemes: result.keyThemes,
              isHighlight: result.highlights.some(h => chunk.text.includes(h.text)),
            },
          }),
        });

        if (!embeddingResponse.ok) {
          console.error(`Failed to generate embedding for chunk ${index}`);
        }
      } catch (err) {
        console.error(`Embedding error for chunk ${index}:`, err);
      }
    });

    // Also create a summary embedding for the full entry
    const summaryText = `Voice journal entry. Mood: ${result.mood}. Energy level: ${result.energyLevel}/10. Key themes: ${result.keyThemes.join(", ")}. Highlights: ${result.highlights.map(h => h.text).join(" ")}`;
    
    const summaryPromise = (async () => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
          sourceType: "audio_journal",
          sourceId: `${entryId}-summary`,
          contentText: summaryText,
          activityDate: new Date().toISOString().split("T")[0],
          metadata: {
            isSummary: true,
            mood: result.mood,
            energyLevel: result.energyLevel,
            keyThemes: result.keyThemes,
            totalChunks: chunks.length,
          },
        }),
      });
      } catch (err) {
        console.error("Summary embedding error:", err);
      }
    })();
    embeddingPromises.push(summaryPromise
    );

    // Fire and forget the embedding generation
    Promise.all(embeddingPromises).catch(err => 
      console.error("Some embeddings failed:", err)
    );

    return new Response(
      JSON.stringify({
        success: true,
        transcript: result.transcript,
        mood: result.mood,
        energyLevel: result.energyLevel,
        keyThemes: result.keyThemes,
        highlights: result.highlights,
        suggestedPrompt: result.suggestedPrompt,
        durationSeconds: result.durationSeconds,
        chunksGenerated: chunks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Transcription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Transcription failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
