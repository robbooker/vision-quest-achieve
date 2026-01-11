import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entryId } = await req.json();
    if (!entryId) {
      return new Response(JSON.stringify({ error: "Entry ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the journal entry
    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();

    if (entryError || !entry) {
      console.error("Entry fetch error:", entryError);
      return new Response(JSON.stringify({ error: "Entry not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's journal settings
    const { data: settings } = await supabase
      .from("journal_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const themeInstructions = settings?.theme_instructions || "Nature scenes with peaceful, calming vibes";
    const artStyle = settings?.art_style || "watercolor";
    const colorPalette = settings?.color_palette || "warm and inspiring";

    // Build accomplishment list
    const tasks = (entry.completed_tasks as any[]) || [];
    const habits = (entry.completed_habits as any[]) || [];

    const accomplishments: string[] = [];
    tasks.slice(0, 5).forEach((t: any) => {
      accomplishments.push(`Completed task: ${t.title}`);
    });
    habits.slice(0, 5).forEach((h: any) => {
      accomplishments.push(`Practiced habit: ${h.title} (${h.completed_count}x)`);
    });

    if (accomplishments.length === 0) {
      accomplishments.push("A day of rest and reflection");
    }

    // Create the prompt
    const prompt = `Create a beautiful ${artStyle} illustration for a personal daily journal.

Today's theme: ${themeInstructions}
Color palette: ${colorPalette}

This image should subtly represent these accomplishments:
${accomplishments.map(a => `- ${a}`).join("\n")}

Style notes:
- Make it feel personal and inspiring
- Suitable as a daily journal header image
- Aspect ratio: 16:9
- No text or words in the image
- Ultra high resolution`;

    console.log("Generating image with prompt:", prompt);

    // Call Lovable AI to generate image
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageBase64) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to storage
    const fileName = `${user.id}/${entry.entry_date}-${Date.now()}.png`;
    
    // Delete old image if exists
    if (entry.image_url) {
      const oldPath = entry.image_url.split("/journal-images/")[1];
      if (oldPath) {
        await supabase.storage.from("journal-images").remove([oldPath]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("journal-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("journal-images")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update journal entry with image URL
    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({
        image_url: publicUrl,
        image_prompt: prompt,
      })
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update entry" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Journal image generated successfully:", publicUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      imageUrl: publicUrl 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Generate journal image error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
