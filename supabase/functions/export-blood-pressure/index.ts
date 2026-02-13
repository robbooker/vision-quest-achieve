import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function resolveUserId(req: Request): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { userId: null, error: "No authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  // Check if it's a personal API key (starts with gp_)
  if (token.startsWith("gp_")) {
    const keyHash = await hashKey(token);
    
    // Use service role to bypass RLS for key lookup
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await adminClient.rpc("validate_api_key", { p_key_hash: keyHash });

    if (error || !data) {
      console.error("[export-blood-pressure] API key validation error:", error);
      return { userId: null, error: "Invalid API key" };
    }

    // Update last_used_at
    await adminClient
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash);

    return { userId: data as string, error: null };
  }

  // Standard JWT auth
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { userId: null, error: "Unauthorized" };
  }

  return { userId: user.id, error: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, error: authError } = await resolveUserId(req);
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: authError || "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const format = url.searchParams.get("format") || "json";

    // Use service role to query since API key users won't have a JWT session
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase
      .from("health_measurements")
      .select("measured_at, primary_value, secondary_value, notes")
      .eq("user_id", userId)
      .eq("measurement_type", "blood_pressure")
      .order("measured_at", { ascending: true });

    if (from) query = query.gte("measured_at", from);
    if (to) query = query.lte("measured_at", `${to}T23:59:59.999Z`);

    const { data, error } = await query;

    if (error) {
      console.error("[export-blood-pressure] Query error:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const records = (data || []).map((r: any) => ({
      date: r.measured_at,
      systolic: r.primary_value,
      diastolic: r.secondary_value,
      notes: r.notes || "",
    }));

    if (format === "csv") {
      const header = "date,systolic,diastolic,notes";
      const rows = records.map((r: any) =>
        `${r.date},${r.systolic},${r.diastolic},"${(r.notes || "").replace(/"/g, '""')}"`
      );
      const csv = [header, ...rows].join("\n");

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=blood-pressure.csv",
        },
      });
    }

    return new Response(JSON.stringify({
      count: records.length,
      from: from || null,
      to: to || null,
      data: records,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[export-blood-pressure] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
