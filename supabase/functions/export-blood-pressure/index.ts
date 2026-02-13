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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const format = url.searchParams.get("format") || "json";

    let query = supabase
      .from("health_measurements")
      .select("measured_at, primary_value, secondary_value, notes")
      .eq("user_id", user.id)
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
