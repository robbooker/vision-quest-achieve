import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> {
  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh token:", await response.text());
    return null;
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request parameters
    const { action, eventId, title, startTime, endTime, taskInstanceId } = await req.json();

    // Get the user's calendar tokens using service role
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: tokenData, error: tokenError } = await serviceSupabase
      .from("user_calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Calendar not connected", code: "NOT_CONNECTED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = tokenData.access_token;

    // Check if token needs refresh
    const tokenExpiresAt = new Date(tokenData.token_expires_at);
    if (tokenExpiresAt <= new Date()) {
      console.log("Token expired, refreshing for user:", user.id);
      const newTokens = await refreshAccessToken(tokenData.refresh_token);
      
      if (!newTokens) {
        return new Response(
          JSON.stringify({ error: "Token refresh failed, please reconnect", code: "RECONNECT_REQUIRED" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await serviceSupabase
        .from("user_calendar_tokens")
        .update({
          access_token: newTokens.accessToken,
          token_expires_at: newTokens.expiresAt.toISOString(),
        })
        .eq("user_id", user.id);

      accessToken = newTokens.accessToken;
    }

    const calendarId = tokenData.calendar_id || "primary";
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    if (action === "create") {
      // Create a new calendar event
      const eventBody = {
        summary: `12WY: ${title}`,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        colorId: "9", // Blue color for task holds
        description: "Created by 12-Week Year Planner",
      };

      const createResponse = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("Failed to create event:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to create calendar event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const createdEvent = await createResponse.json();
      console.log("Created calendar event:", createdEvent.id);

      // Update the task instance with the calendar event ID if provided
      if (taskInstanceId) {
        await serviceSupabase
          .from("task_instances")
          .update({
            calendar_event_id: createdEvent.id,
            scheduled_start: startTime,
            scheduled_end: endTime,
            status: "scheduled",
          })
          .eq("id", taskInstanceId)
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({ event: { id: createdEvent.id, htmlLink: createdEvent.htmlLink } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "update" && eventId) {
      // Update an existing calendar event
      const eventBody = {
        summary: `12WY: ${title}`,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
      };

      const updateResponse = await fetch(`${baseUrl}/${eventId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Failed to update event:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to update calendar event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updatedEvent = await updateResponse.json();
      console.log("Updated calendar event:", updatedEvent.id);

      return new Response(
        JSON.stringify({ event: { id: updatedEvent.id, htmlLink: updatedEvent.htmlLink } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "delete" && eventId) {
      // Delete a calendar event
      const deleteResponse = await fetch(`${baseUrl}/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        console.error("Failed to delete event:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to delete calendar event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Deleted calendar event:", eventId);

      // Clear the calendar event ID from task instance if provided
      if (taskInstanceId) {
        await serviceSupabase
          .from("task_instances")
          .update({
            calendar_event_id: null,
            scheduled_start: null,
            scheduled_end: null,
            status: "pending",
          })
          .eq("id", taskInstanceId)
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'create', 'update', or 'delete'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in google-calendar-create-event:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
