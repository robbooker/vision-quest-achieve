import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmbeddingRequest {
  sourceType: "journal_entry" | "quick_task" | "habit_log" | "focus_session";
  sourceId: string;
  contentText: string;
  activityDate: string;
  metadata?: Record<string, unknown>;
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

    const { sourceType, sourceId, contentText, activityDate, metadata } = await req.json() as EmbeddingRequest;

    if (!contentText || contentText.trim().length === 0) {
      console.log("Skipping empty content for", sourceType, sourceId);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating embedding for ${sourceType}:${sourceId}`);

    // Generate embedding using Lovable AI Gateway embeddings endpoint
    const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: contentText.slice(0, 8000), // Limit input length
        dimensions: 768,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("Embedding API error:", embeddingResponse.status, errorText);
      
      if (embeddingResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (embeddingResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Embedding API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      console.error("Invalid embedding response:", embeddingData);
      throw new Error("Invalid embedding response from API");
    }

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    // Upsert embedding into database
    const { error: upsertError } = await supabase
      .from("activity_embeddings")
      .upsert({
        user_id: user.id,
        source_type: sourceType,
        source_id: sourceId,
        content_text: contentText.slice(0, 10000), // Store truncated text
        embedding: embedding,
        activity_date: activityDate,
        metadata: metadata || {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "source_type,source_id",
      });

    if (upsertError) {
      console.error("Database upsert error:", upsertError);
      throw new Error(`Failed to store embedding: ${upsertError.message}`);
    }

    console.log(`Successfully stored embedding for ${sourceType}:${sourceId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-embedding error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
