import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  limit?: number;
  sourceTypes?: string[];
  dateRange?: { from: string; to: string };
}

interface SearchResult {
  sourceType: string;
  sourceId: string;
  contentText: string;
  activityDate: string;
  similarity: number;
  metadata: Record<string, unknown>;
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

    const { query, limit = 10, sourceTypes, dateRange } = await req.json() as SearchRequest;

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Semantic search for user ${user.id}: "${query.slice(0, 50)}..."`);

    // Generate embedding for the query
    const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query.slice(0, 8000),
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
    const queryEmbedding = embeddingData.data?.[0]?.embedding;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      throw new Error("Invalid embedding response from API");
    }

    // Build the similarity search query using pgvector
    // We use a raw query because supabase-js doesn't have built-in vector support
    let filterConditions = [`user_id = '${user.id}'`];
    
    if (sourceTypes && sourceTypes.length > 0) {
      const sourceTypesStr = sourceTypes.map(t => `'${t}'`).join(",");
      filterConditions.push(`source_type IN (${sourceTypesStr})`);
    }
    
    if (dateRange?.from) {
      filterConditions.push(`activity_date >= '${dateRange.from}'`);
    }
    if (dateRange?.to) {
      filterConditions.push(`activity_date <= '${dateRange.to}'`);
    }

    const whereClause = filterConditions.join(" AND ");
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Execute similarity search
    const { data: results, error: searchError } = await supabase.rpc("match_activity_embeddings", {
      query_embedding: embeddingStr,
      match_threshold: 0.3,
      match_count: limit,
      filter_user_id: user.id,
      filter_source_types: sourceTypes || null,
      filter_date_from: dateRange?.from || null,
      filter_date_to: dateRange?.to || null,
    });

    if (searchError) {
      console.error("Search error:", searchError);
      // Fall back to simple text search if RPC doesn't exist yet
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from("activity_embeddings")
        .select("source_type, source_id, content_text, activity_date, metadata")
        .eq("user_id", user.id)
        .ilike("content_text", `%${query}%`)
        .order("activity_date", { ascending: false })
        .limit(limit);

      if (fallbackError) {
        throw new Error(`Search failed: ${fallbackError.message}`);
      }

      const searchResults: SearchResult[] = (fallbackResults || []).map((r: any) => ({
        sourceType: r.source_type,
        sourceId: r.source_id,
        contentText: r.content_text,
        activityDate: r.activity_date,
        similarity: 0.5, // Placeholder for text search
        metadata: r.metadata,
      }));

      return new Response(JSON.stringify({ results: searchResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchResults: SearchResult[] = (results || []).map((r: any) => ({
      sourceType: r.source_type,
      sourceId: r.source_id,
      contentText: r.content_text,
      activityDate: r.activity_date,
      similarity: r.similarity,
      metadata: r.metadata,
    }));

    console.log(`Found ${searchResults.length} results`);

    return new Response(JSON.stringify({ results: searchResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("semantic-search error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
