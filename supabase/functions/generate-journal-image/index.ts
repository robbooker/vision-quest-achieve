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

    // Fetch calendar events for that day if user has calendar connected
    let calendarEvents: string[] = [];
    try {
      const { data: calendarToken } = await supabase
        .from("user_calendar_tokens")
        .select("access_token, refresh_token, token_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (calendarToken) {
        // Get events for this specific date
        const entryDate = new Date(entry.entry_date + "T00:00:00");
        const nextDay = new Date(entryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const timeMin = entryDate.toISOString();
        const timeMax = nextDay.toISOString();

        // Check if token needs refresh
        let accessToken = calendarToken.access_token;
        const tokenExpiry = new Date(calendarToken.token_expires_at);
        
        if (tokenExpiry <= new Date()) {
          // Refresh the token
          const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
          const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
          
          if (clientId && clientSecret) {
            const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: calendarToken.refresh_token,
                grant_type: "refresh_token",
              }),
            });

            if (refreshResponse.ok) {
              const tokenData = await refreshResponse.json();
              accessToken = tokenData.access_token;
              
              // Update token in database
              await supabase
                .from("user_calendar_tokens")
                .update({
                  access_token: accessToken,
                  token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                })
                .eq("user_id", user.id);
            }
          }
        }

        // Fetch calendar events
        const calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          calendarEvents = (calendarData.items || [])
            .filter((event: any) => event.summary)
            .map((event: any) => event.summary)
            .slice(0, 5);
          console.log("Found calendar events:", calendarEvents);
        }
      }
    } catch (calendarError) {
      console.log("Calendar fetch skipped (non-blocking):", calendarError);
    }

    // Build accomplishment list
    const tasks = (entry.completed_tasks as any[]) || [];
    const habits = (entry.completed_habits as any[]) || [];
    const focusSessions = (entry.completed_focus_sessions as any[]) || [];

    const accomplishments: string[] = [];
    
    // Add calendar events first as context
    calendarEvents.forEach((event: string) => {
      accomplishments.push(`Calendar event: ${event}`);
    });
    
    tasks.slice(0, 5).forEach((t: any) => {
      accomplishments.push(`Completed task: ${t.title}`);
    });
    habits.slice(0, 5).forEach((h: any) => {
      accomplishments.push(`Practiced habit: ${h.title} (${h.completed_count}x)`);
    });
    focusSessions.slice(0, 3).forEach((s: any) => {
      accomplishments.push(`Focus session: ${s.objective} (${s.actual_duration_minutes} min)`);
    });

    if (accomplishments.length === 0) {
      accomplishments.push("A day of rest and reflection");
    }

    // Create the prompt with calendar context
    const prompt = `Create a beautiful ${artStyle} illustration for a personal daily journal.

Today's theme: ${themeInstructions}
Color palette: ${colorPalette}

This image should subtly represent these activities and accomplishments from the day:
${accomplishments.map(a => `- ${a}`).join("\n")}

Style notes:
- Make it feel personal and inspiring
- Subtly incorporate visual elements that represent the day's activities
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
