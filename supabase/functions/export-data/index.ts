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
  if (!authHeader) return { userId: null, error: "No authorization header" };

  const token = authHeader.replace("Bearer ", "");

  if (token.startsWith("gp_")) {
    const keyHash = await hashKey(token);
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await adminClient.rpc("validate_api_key", { p_key_hash: keyHash });
    if (error || !data) return { userId: null, error: "Invalid API key" };

    await adminClient.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash);
    return { userId: data as string, error: null };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { userId: null, error: "Unauthorized" };
  return { userId: user.id, error: null };
}

// Resource handlers - each returns { columns: string[], rows: any[] }
const RESOURCE_HANDLERS: Record<string, (supabase: any, userId: string, from: string | null, to: string | null) => Promise<{ columns: string[]; rows: any[] }>> = {
  
  blood_pressure: async (supabase, userId, from, to) => {
    let query = supabase.from("health_measurements")
      .select("measured_at, primary_value, secondary_value, notes")
      .eq("user_id", userId).eq("measurement_type", "blood_pressure")
      .order("measured_at", { ascending: true });
    if (from) query = query.gte("measured_at", from);
    if (to) query = query.lte("measured_at", `${to}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "systolic", "diastolic", "notes"],
      rows: (data || []).map((r: any) => ({ date: r.measured_at, systolic: r.primary_value, diastolic: r.secondary_value, notes: r.notes || "" })),
    };
  },

  weight: async (supabase, userId, from, to) => {
    let query = supabase.from("health_measurements")
      .select("measured_at, primary_value, notes")
      .eq("user_id", userId).eq("measurement_type", "weight")
      .order("measured_at", { ascending: true });
    if (from) query = query.gte("measured_at", from);
    if (to) query = query.lte("measured_at", `${to}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "weight_lbs", "notes"],
      rows: (data || []).map((r: any) => ({ date: r.measured_at, weight_lbs: r.primary_value, notes: r.notes || "" })),
    };
  },

  sleep: async (supabase, userId, from, to) => {
    let query = supabase.from("oura_daily_metrics")
      .select("metric_date, sleep_score, sleep_duration_hours, deep_sleep_minutes, rem_sleep_minutes, resting_heart_rate, hrv_average, bedtime_start, bedtime_end")
      .eq("user_id", userId)
      .order("metric_date", { ascending: true });
    if (from) query = query.gte("metric_date", from);
    if (to) query = query.lte("metric_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "sleep_score", "sleep_hours", "deep_sleep_min", "rem_sleep_min", "resting_hr", "hrv_avg", "bedtime_start", "bedtime_end"],
      rows: (data || []).map((r: any) => ({
        date: r.metric_date, sleep_score: r.sleep_score, sleep_hours: r.sleep_duration_hours,
        deep_sleep_min: r.deep_sleep_minutes, rem_sleep_min: r.rem_sleep_minutes,
        resting_hr: r.resting_heart_rate, hrv_avg: r.hrv_average,
        bedtime_start: r.bedtime_start || "", bedtime_end: r.bedtime_end || "",
      })),
    };
  },

  nutrition: async (supabase, userId, from, to) => {
    let query = supabase.from("daily_nutrition")
      .select("entry_date, meal_type, meal_description, calories, protein_g, carbs_g, fats_g, fiber_g, sugar_g, water_ml")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true });
    if (from) query = query.gte("entry_date", from);
    if (to) query = query.lte("entry_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "meal_type", "description", "calories", "protein_g", "carbs_g", "fats_g", "fiber_g", "sugar_g", "water_ml"],
      rows: (data || []).map((r: any) => ({
        date: r.entry_date, meal_type: r.meal_type || "", description: r.meal_description,
        calories: r.calories, protein_g: r.protein_g, carbs_g: r.carbs_g, fats_g: r.fats_g,
        fiber_g: r.fiber_g, sugar_g: r.sugar_g, water_ml: r.water_ml,
      })),
    };
  },

  focus_sessions: async (supabase, userId, from, to) => {
    let query = supabase.from("focus_sessions")
      .select("started_at, completed_at, objective, planned_duration_minutes, actual_duration_minutes, status, rating, pillar, notes")
      .eq("user_id", userId)
      .order("started_at", { ascending: true });
    if (from) query = query.gte("started_at", from);
    if (to) query = query.lte("started_at", `${to}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["started_at", "completed_at", "objective", "planned_min", "actual_min", "status", "rating", "pillar", "notes"],
      rows: (data || []).map((r: any) => ({
        started_at: r.started_at, completed_at: r.completed_at || "", objective: r.objective,
        planned_min: r.planned_duration_minutes, actual_min: r.actual_duration_minutes,
        status: r.status, rating: r.rating || "", pillar: r.pillar || "", notes: r.notes || "",
      })),
    };
  },

  tasks: async (supabase, userId, from, to) => {
    let query = supabase.from("quick_tasks")
      .select("title, completed, completed_at, due_date, priority, position, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["title", "completed", "completed_at", "due_date", "priority", "created_at"],
      rows: (data || []).map((r: any) => ({
        title: r.title, completed: r.completed, completed_at: r.completed_at || "",
        due_date: r.due_date || "", priority: r.priority || "", created_at: r.created_at,
      })),
    };
  },

  journal: async (supabase, userId, from, to) => {
    let query = supabase.from("journal_entries")
      .select("entry_date, user_notes, intention_score, intention_reflection, ai_daily_insight, audio_transcript")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true });
    if (from) query = query.gte("entry_date", from);
    if (to) query = query.lte("entry_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "notes", "intention_score", "intention_reflection", "ai_insight", "audio_transcript"],
      rows: (data || []).map((r: any) => ({
        date: r.entry_date, notes: r.user_notes || "", intention_score: r.intention_score ?? "",
        intention_reflection: r.intention_reflection || "", ai_insight: r.ai_daily_insight || "",
        audio_transcript: r.audio_transcript || "",
      })),
    };
  },

  goals: async (supabase, userId, _from, _to) => {
    const { data, error } = await supabase.from("goals")
      .select("title, goal_type, metric_type, target_value, pillar, why, obstacles, strategies, implementation_intention, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return {
      columns: ["title", "goal_type", "metric_type", "target_value", "pillar", "why", "obstacles", "strategies", "implementation", "created_at", "updated_at"],
      rows: (data || []).map((r: any) => ({
        title: r.title, goal_type: r.goal_type, metric_type: r.metric_type,
        target_value: r.target_value, pillar: r.pillar || "", why: r.why || "",
        obstacles: r.obstacles || "", strategies: r.strategies || "",
        implementation: r.implementation_intention || "", created_at: r.created_at, updated_at: r.updated_at,
      })),
    };
  },

  habits: async (supabase, userId, from, to) => {
    let query = supabase.from("tactic_logs")
      .select("logged_date, completed_count, tactic_id, goal_tactics(title, frequency, target_count)")
      .eq("user_id", userId)
      .order("logged_date", { ascending: true });
    if (from) query = query.gte("logged_date", from);
    if (to) query = query.lte("logged_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "habit_name", "completed_count", "target_count", "frequency"],
      rows: (data || []).map((r: any) => ({
        date: r.logged_date, habit_name: r.goal_tactics?.title || "", completed_count: r.completed_count,
        target_count: r.goal_tactics?.target_count ?? "", frequency: r.goal_tactics?.frequency || "",
      })),
    };
  },

  books: async (supabase, userId, _from, _to) => {
    const { data, error } = await supabase.from("books")
      .select("title, author, status, category, started_at, finished_at, ranking, notes, operational_change")
      .eq("user_id", userId)
      .order("started_at", { ascending: true });
    if (error) throw error;
    return {
      columns: ["title", "author", "status", "category", "started_at", "finished_at", "ranking", "notes", "operational_change"],
      rows: (data || []).map((r: any) => ({
        title: r.title, author: r.author, status: r.status, category: r.category || "",
        started_at: r.started_at, finished_at: r.finished_at || "", ranking: r.ranking ?? "",
        notes: r.notes || "", operational_change: r.operational_change || "",
      })),
    };
  },

  bird_sightings: async (supabase, userId, from, to) => {
    let query = supabase.from("bird_sightings")
      .select("species_name, sighting_date, sighting_time, location_name, latitude, longitude, behavior_notes, field_marks")
      .eq("user_id", userId)
      .order("sighting_date", { ascending: true });
    if (from) query = query.gte("sighting_date", from);
    if (to) query = query.lte("sighting_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["species", "date", "time", "location", "latitude", "longitude", "behavior_notes", "field_marks"],
      rows: (data || []).map((r: any) => ({
        species: r.species_name, date: r.sighting_date, time: r.sighting_time || "",
        location: r.location_name || "", latitude: r.latitude ?? "", longitude: r.longitude ?? "",
        behavior_notes: r.behavior_notes || "", field_marks: r.field_marks || "",
      })),
    };
  },

  bloodwork: async (supabase, userId, from, to) => {
    let query = supabase.from("bloodwork_reports")
      .select("report_date, lab_name, biomarkers, ai_insights")
      .eq("user_id", userId)
      .order("report_date", { ascending: true });
    if (from) query = query.gte("report_date", from);
    if (to) query = query.lte("report_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "lab", "biomarkers", "ai_insights"],
      rows: (data || []).map((r: any) => ({
        date: r.report_date, lab: r.lab_name || "",
        biomarkers: JSON.stringify(r.biomarkers || {}),
        ai_insights: r.ai_insights || "",
      })),
    };
  },

  trading: async (supabase, userId, from, to) => {
    let query = supabase.from("trading_pnl")
      .select("trade_date, amount, notes, category")
      .eq("user_id", userId)
      .order("trade_date", { ascending: true });
    if (from) query = query.gte("trade_date", from);
    if (to) query = query.lte("trade_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "amount", "category", "notes"],
      rows: (data || []).map((r: any) => ({
        date: r.trade_date, amount: r.amount, category: r.category || "", notes: r.notes || "",
      })),
    };
  },
};

const AVAILABLE_RESOURCES = Object.keys(RESOURCE_HANDLERS);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");

    // If no resource specified, return list of available resources
    if (!resource) {
      return new Response(JSON.stringify({
        available_resources: AVAILABLE_RESOURCES,
        usage: "Add ?resource=<name> to export data. Optional: &from=2025-01-01&to=2025-12-31&format=csv",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!RESOURCE_HANDLERS[resource]) {
      return new Response(JSON.stringify({
        error: `Unknown resource: ${resource}`,
        available_resources: AVAILABLE_RESOURCES,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { userId, error: authError } = await resolveUserId(req);
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: authError || "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const format = url.searchParams.get("format") || "json";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { columns, rows } = await RESOURCE_HANDLERS[resource](supabase, userId, from, to);

    if (format === "csv") {
      const header = columns.join(",");
      const csvRows = rows.map((r: any) =>
        columns.map(col => {
          const val = r[col] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")
      );
      const csv = [header, ...csvRows].join("\n");
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${resource}.csv`,
        },
      });
    }

    return new Response(JSON.stringify({
      resource, count: rows.length, from: from || null, to: to || null, data: rows,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[export-data] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
