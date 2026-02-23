import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Auth: supports both gp_ API keys and Supabase JWTs ──────────────
async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolveUserId(
  req: Request,
): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { userId: null, error: "No authorization header" };

  const token = authHeader.replace("Bearer ", "");

  // Personal API key path
  if (token.startsWith("gp_")) {
    const keyHash = await hashKey(token);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin.rpc("validate_api_key", {
      p_key_hash: keyHash,
    });
    if (error || !data) return { userId: null, error: "Invalid API key" };

    await admin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash);

    return { userId: data as string, error: null };
  }

  // JWT path
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { userId: null, error: "Unauthorized" };
  return { userId: user.id, error: null };
}

// ── Google token helpers ─────────────────────────────────────────────
async function getCalendarAccess(userId: string) {
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: tokenData, error: tokenError } = await serviceClient
    .from("user_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (tokenError || !tokenData) {
    return { error: "Google Calendar not connected. Connect it in Settings first." };
  }

  let accessToken = tokenData.access_token;

  // Refresh if expired
  if (new Date(tokenData.token_expires_at) <= new Date()) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!,
        refresh_token: tokenData.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      return { error: "Calendar token expired and refresh failed. Please reconnect." };
    }

    const refreshData = await res.json();
    accessToken = refreshData.access_token;

    await serviceClient
      .from("user_calendar_tokens")
      .update({
        access_token: accessToken,
        token_expires_at: new Date(
          Date.now() + refreshData.expires_in * 1000,
        ).toISOString(),
      })
      .eq("user_id", userId);
  }

  const calendarId = tokenData.calendar_id || "primary";
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  return { accessToken, baseUrl };
}

// ── Handlers ─────────────────────────────────────────────────────────

async function handleCreate(
  body: Record<string, unknown>,
  accessToken: string,
  baseUrl: string,
) {
  const { title, start, end, all_day, notes } = body as {
    title: string;
    start: string;
    end: string;
    all_day?: boolean;
    notes?: string;
  };

  if (!title || !start || !end) {
    return jsonResponse({ error: "title, start, and end are required" }, 400);
  }

  const eventBody: Record<string, unknown> = { summary: title };

  if (all_day) {
    // Google expects date-only strings for all-day events (YYYY-MM-DD)
    eventBody.start = { date: start.substring(0, 10) };
    eventBody.end = { date: end.substring(0, 10) };
  } else {
    eventBody.start = { dateTime: start };
    eventBody.end = { dateTime: end };
  }

  if (notes) eventBody.description = notes;

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Google create error:", errText);
    return jsonResponse({ error: "Failed to create event in Google Calendar" }, 502);
  }

  const created = await res.json();
  return jsonResponse({ id: created.id, success: true });
}

async function handleUpdate(
  body: Record<string, unknown>,
  accessToken: string,
  baseUrl: string,
) {
  const { id, title, start, end, notes } = body as {
    id: string;
    title?: string;
    start?: string;
    end?: string;
    notes?: string;
  };

  if (!id) return jsonResponse({ error: "id is required for update" }, 400);

  const patch: Record<string, unknown> = {};
  if (title !== undefined) patch.summary = title;
  if (start !== undefined) patch.start = { dateTime: start };
  if (end !== undefined) patch.end = { dateTime: end };
  if (notes !== undefined) patch.description = notes;

  if (Object.keys(patch).length === 0) {
    return jsonResponse({ error: "No fields to update" }, 400);
  }

  const res = await fetch(`${baseUrl}/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Google update error:", errText);
    return jsonResponse({ error: "Failed to update event in Google Calendar" }, 502);
  }

  const updated = await res.json();
  return jsonResponse({ id: updated.id, success: true });
}

async function handleDelete(
  body: Record<string, unknown>,
  accessToken: string,
  baseUrl: string,
) {
  const { id } = body as { id: string };
  if (!id) return jsonResponse({ error: "id is required for delete" }, 400);

  const res = await fetch(`${baseUrl}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text();
    console.error("Google delete error:", errText);
    return jsonResponse({ error: "Failed to delete event in Google Calendar" }, 502);
  }

  return jsonResponse({ success: true });
}

// ── Main handler ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate
    const { userId, error: authError } = await resolveUserId(req);
    if (!userId) return jsonResponse({ error: authError || "Unauthorized" }, 401);

    // 2. Parse body
    const body = await req.json();
    const action = body.action as string;
    if (!action || !["create", "update", "delete"].includes(action)) {
      return jsonResponse(
        { error: "action must be one of: create, update, delete" },
        400,
      );
    }

    // 3. Get Google Calendar access
    const cal = await getCalendarAccess(userId);
    if ("error" in cal) return jsonResponse({ error: cal.error }, 400);
    const { accessToken, baseUrl } = cal;

    // 4. Dispatch
    switch (action) {
      case "create":
        return await handleCreate(body, accessToken, baseUrl);
      case "update":
        return await handleUpdate(body, accessToken, baseUrl);
      case "delete":
        return await handleDelete(body, accessToken, baseUrl);
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("manage-calendar error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
