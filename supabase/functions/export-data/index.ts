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
const RESOURCE_HANDLERS: Record<string, (supabase: any, userId: string, from: string | null, to: string | null, params?: URLSearchParams) => Promise<{ columns: string[]; rows: any[] }>> = {
  
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
      .select("metric_date, sleep_score, total_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds, resting_heart_rate, hrv_balance, manual_bedtime, manual_wake_time, sleep_efficiency, readiness_score, source")
      .eq("user_id", userId)
      .order("metric_date", { ascending: true });
    if (from) query = query.gte("metric_date", from);
    if (to) query = query.lte("metric_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["date", "sleep_score", "sleep_hours", "deep_sleep_min", "rem_sleep_min", "resting_hr", "hrv", "bedtime", "wake_time", "efficiency", "readiness_score", "source"],
      rows: (data || []).map((r: any) => ({
        date: r.metric_date, sleep_score: r.sleep_score,
        sleep_hours: r.total_sleep_seconds ? +(r.total_sleep_seconds / 3600).toFixed(2) : null,
        deep_sleep_min: r.deep_sleep_seconds ? Math.round(r.deep_sleep_seconds / 60) : null,
        rem_sleep_min: r.rem_sleep_seconds ? Math.round(r.rem_sleep_seconds / 60) : null,
        resting_hr: r.resting_heart_rate, hrv: r.hrv_balance,
        bedtime: r.manual_bedtime || "", wake_time: r.manual_wake_time || "",
        efficiency: r.sleep_efficiency, readiness_score: r.readiness_score,
        source: r.source || "",
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

  tasks: async (supabase, userId, from, to, params) => {
    const today = new Date().toISOString().split("T")[0];
    const effectiveTo = to || today;
    let query = supabase.from("quick_tasks")
      .select("title, category, pillar, completed, completed_at, due_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (from) query = query.gte("created_at", from);
    query = query.lte("created_at", `${effectiveTo}T23:59:59.999Z`);
    // status filter
    const status = params?.get("status");
    if (status === "open") query = query.eq("completed", false);
    else if (status === "completed") query = query.eq("completed", true);
    // category filter
    const category = params?.get("category");
    if (category === "personal" || category === "business") query = query.eq("category", category);
    const { data, error } = await query;
    if (error) throw error;
    return {
      columns: ["title", "category", "pillar", "completed", "completed_at", "due_date", "created_at"],
      rows: (data || []).map((r: any) => ({
        title: r.title, category: r.category || "", pillar: r.pillar || "",
        completed: r.completed, completed_at: r.completed_at || "",
        due_date: r.due_date || "", created_at: r.created_at,
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

  calendar: async (supabase, userId, from, to) => {
    // Get the user's Google Calendar tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      return {
        columns: ["error"],
        rows: [{ error: "Google Calendar not connected. Connect it in Settings first." }],
      };
    }

    let accessToken = tokenData.access_token;

    // Refresh token if expired
    const tokenExpiresAt = new Date(tokenData.token_expires_at);
    if (tokenExpiresAt <= new Date()) {
      const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!;
      const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!;

      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshRes.ok) {
        return {
          columns: ["error"],
          rows: [{ error: "Calendar token expired and refresh failed. Please reconnect in Settings." }],
        };
      }

      const refreshData = await refreshRes.json();
      accessToken = refreshData.access_token;

      // Update stored token
      await supabase
        .from("user_calendar_tokens")
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq("user_id", userId);
    }

    // Default to today + 7 days if no range specified
    const now = new Date();
    const timeMin = from ? `${from}T00:00:00Z` : now.toISOString();
    const defaultMax = new Date(now);
    defaultMax.setDate(defaultMax.getDate() + 7);
    const timeMax = to ? `${to}T23:59:59Z` : defaultMax.toISOString();

    const calendarId = tokenData.calendar_id || "primary";
    const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    eventsUrl.searchParams.set("timeMin", timeMin);
    eventsUrl.searchParams.set("timeMax", timeMax);
    eventsUrl.searchParams.set("singleEvents", "true");
    eventsUrl.searchParams.set("orderBy", "startTime");

    const eventsRes = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsRes.ok) {
      const errText = await eventsRes.text();
      console.error("Calendar API error:", errText);
      return {
        columns: ["error"],
        rows: [{ error: "Failed to fetch calendar events from Google." }],
      };
    }

    const eventsData = await eventsRes.json();
    const events = (eventsData.items || []).map((event: any) => ({
      title: event.summary || "Busy",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      all_day: !event.start?.dateTime,
      status: event.status || "",
    }));

    return {
      columns: ["title", "start", "end", "all_day", "status"],
      rows: events,
    };
  },

  intention: async (supabase, userId, _from, _to) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data, error } = await supabase.from("monthly_intentions")
      .select("word, description, month, created_at, updated_at")
      .eq("user_id", userId)
      .order("month", { ascending: false });
    if (error) throw error;
    const current = (data || []).find((r: any) => r.month === currentMonth);
    return {
      columns: ["month", "word", "description", "is_current", "created_at", "updated_at"],
      rows: (data || []).map((r: any) => ({
        month: r.month, word: r.word, description: r.description || "",
        is_current: r.month === currentMonth, created_at: r.created_at, updated_at: r.updated_at,
      })),
    };
  },

  goal_sprint: async (supabase, userId, _from, _to) => {
    const SPRINT_START = '2026-03-12';
    const SPRINT_END = '2026-03-26';
    const TOTAL_DAYS = 14;
    const GOALS_PER_DAY = 8;
    const GOAL_KEYS = ['morning_meditation', 'morning_diet', 'evening_routine_prev', 'strength', 'reading', 'cardio', 'afternoon_meditation', 'afternoon_diet'];

    const { data, error } = await supabase
      .from("goal_sprint_logs")
      .select("sprint_date, goal_key, completed, completed_sets, notes, created_at, updated_at")
      .eq("user_id", userId)
      .gte("sprint_date", SPRINT_START)
      .lte("sprint_date", SPRINT_END)
      .order("sprint_date", { ascending: true });
    if (error) throw error;

    const rows = (data || []).map((r: any) => ({
      date: r.sprint_date, goal_key: r.goal_key, completed: r.completed,
      completed_sets: r.completed_sets ?? null,
      notes: r.notes || "", created_at: r.created_at, updated_at: r.updated_at,
    }));

    // Compute summary
    const totalCompleted = rows.filter((r: any) => r.completed).length;
    const totalPossible = TOTAL_DAYS * GOALS_PER_DAY;

    // Today stats
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = rows.filter((r: any) => r.date === today);
    const todayCompleted = todayLogs.filter((r: any) => r.completed).length;
    const todayMissing = GOAL_KEYS.filter(k => !todayLogs.find((r: any) => r.goal_key === k && r.completed));

    // Week stats (current week = days 1-7 or 8-14)
    const startDate = new Date(SPRINT_START + 'T00:00:00');
    const nowDate = new Date(today + 'T00:00:00');
    const dayNumber = Math.floor((nowDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentWeek = dayNumber <= 7 ? 1 : 2;
    const weekStart = currentWeek === 1 ? SPRINT_START : '2026-03-19';
    const weekEnd = currentWeek === 1 ? '2026-03-18' : SPRINT_END;
    const weekLogs = rows.filter((r: any) => r.date >= weekStart && r.date <= weekEnd);
    const weekCompleted = weekLogs.filter((r: any) => r.completed).length;
    const weekDays = 7;
    const weekPossible = weekDays * GOALS_PER_DAY;

    // Per-day breakdown
    const byDay: Record<string, any> = {};
    for (const r of rows) {
      if (!byDay[r.date]) byDay[r.date] = { date: r.date, completed: [], incomplete: [] };
      if (r.completed) byDay[r.date].completed.push(r.goal_key);
      else byDay[r.date].incomplete.push(r.goal_key);
    }

    return {
      columns: ["date", "goal_key", "completed", "completed_sets", "notes", "created_at", "updated_at"],
      rows,
      summary: {
        sprint: { completed: totalCompleted, possible: totalPossible, percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0 },
        today: { date: today, day_number: dayNumber, completed: todayCompleted, possible: GOALS_PER_DAY, missing: todayMissing },
        week: { week: currentWeek, completed: weekCompleted, possible: weekPossible, percentage: weekPossible > 0 ? Math.round((weekCompleted / weekPossible) * 100) : 0 },
        by_day: Object.values(byDay),
      },
    };
  },

  trips: async (supabase, userId, from, to) => {
    // Fetch trips
    let tripQuery = supabase.from("trips")
      .select("id, destination, start_date, end_date, purpose, attendees, planned_activities, has_flight")
      .eq("user_id", userId)
      .order("start_date", { ascending: true });
    if (from) tripQuery = tripQuery.gte("start_date", from);
    if (to) tripQuery = tripQuery.lte("start_date", to);
    const { data: trips, error: tripError } = await tripQuery;
    if (tripError) throw tripError;

    if (!trips?.length) {
      return { columns: ["destination", "start_date", "end_date", "purpose", "logistics"], rows: [] };
    }

    // Fetch all logistics for these trips
    const tripIds = trips.map((t: any) => t.id);
    const { data: logistics, error: logError } = await supabase
      .from("trip_logistics")
      .select("trip_id, logistics_type, provider_name, confirmation_code, start_datetime, end_datetime, start_location, end_location, flight_number, seat_assignment, vehicle_type, contact_phone, notes")
      .in("trip_id", tripIds)
      .order("start_datetime", { ascending: true });
    if (logError) throw logError;

    // Group logistics by trip
    const logByTrip: Record<string, any[]> = {};
    for (const l of (logistics || [])) {
      if (!logByTrip[l.trip_id]) logByTrip[l.trip_id] = [];
      logByTrip[l.trip_id].push(l);
    }

    const rows = trips.map((t: any) => ({
      destination: t.destination,
      start_date: t.start_date,
      end_date: t.end_date,
      purpose: t.purpose || "",
      attendees: (t.attendees || []).join(", "),
      planned_activities: t.planned_activities || "",
      logistics: JSON.stringify((logByTrip[t.id] || []).map((l: any) => ({
        type: l.logistics_type,
        provider: l.provider_name || "",
        confirmation_code: l.confirmation_code || "",
        flight_number: l.flight_number || "",
        seat: l.seat_assignment || "",
        vehicle_type: l.vehicle_type || "",
        start_datetime: l.start_datetime || "",
        end_datetime: l.end_datetime || "",
        start_location: l.start_location || "",
        end_location: l.end_location || "",
        contact_phone: l.contact_phone || "",
        notes: l.notes || "",
      }))),
    }));

    return {
      columns: ["destination", "start_date", "end_date", "purpose", "attendees", "planned_activities", "logistics"],
      rows,
    };
  },
  big_three: async (supabase: any, userId: string) => {
    const { data: projects, error: pErr } = await supabase.from("big_three_projects").select("*").eq("user_id", userId).order("position");
    if (pErr) throw pErr;
    const { data: phases, error: phErr } = await supabase.from("big_three_phases").select("*").eq("user_id", userId).order("position");
    if (phErr) throw phErr;
    const { data: tasks, error: tErr } = await supabase.from("big_three_tasks").select("*").eq("user_id", userId).order("position");
    if (tErr) throw tErr;

    const tasksByPhase: Record<string, any[]> = {};
    for (const t of tasks || []) { if (!tasksByPhase[t.phase_id]) tasksByPhase[t.phase_id] = []; tasksByPhase[t.phase_id].push(t); }
    const phasesByProject: Record<string, any[]> = {};
    for (const ph of phases || []) { if (!phasesByProject[ph.project_id]) phasesByProject[ph.project_id] = []; phasesByProject[ph.project_id].push({ ...ph, tasks: tasksByPhase[ph.id] || [] }); }

    const rows = (projects || []).map((p: any) => ({ ...p, phases: phasesByProject[p.id] || [] }));
    return { columns: ["id", "title", "description", "position", "target_date", "completed", "phases"], rows };
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

    // === WRITE OPERATIONS (POST/PATCH) for tasks and goal_sprint ===
    if ((req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") && (resource === "tasks" || resource === "goal_sprint" || resource === "big_three")) {
      const { userId, error: authError } = await resolveUserId(req);
      if (authError || !userId) {
        return new Response(JSON.stringify({ error: authError || "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const body = await req.json();

      // === goal_sprint POST/PATCH ===
      if (resource === "goal_sprint") {
        const { date, goal_key, completed, completed_sets, notes } = body;
        if (!date || !goal_key) {
          return new Response(JSON.stringify({ error: "date and goal_key are required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const validKeys = ['morning_meditation', 'morning_diet', 'evening_routine_prev', 'strength', 'reading', 'cardio', 'afternoon_meditation', 'afternoon_diet'];
        if (!validKeys.includes(goal_key)) {
          return new Response(JSON.stringify({ error: `goal_key must be one of: ${validKeys.join(', ')}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // For strength, handle completed_sets and action:"add_set"
        let effectiveCompleted = completed;
        let effectiveSets = completed_sets;

        // Upsert
        const { data: existing } = await supabase
          .from("goal_sprint_logs")
          .select("id, completed_sets")
          .eq("user_id", userId)
          .eq("sprint_date", date)
          .eq("goal_key", goal_key)
          .maybeSingle();

        if (goal_key === 'strength') {
          const currentSets: number = existing?.completed_sets ?? 0;

          if (body.action === 'add_set') {
            // Increment by 1 set (each set = 10 reps)
            effectiveSets = Math.min(currentSets + 1, 5);
          } else if (typeof completed_sets === 'number') {
            effectiveSets = Math.max(0, Math.min(completed_sets, 5));
          }

          if (typeof effectiveSets === 'number') {
            effectiveCompleted = effectiveSets >= 5;
          }
        }

        if (existing) {
          const updates: Record<string, any> = { updated_at: new Date().toISOString() };
          if (typeof effectiveCompleted === "boolean") updates.completed = effectiveCompleted;
          if (typeof effectiveSets === "number") updates.completed_sets = effectiveSets;
          if (notes !== undefined) updates.notes = notes;
          const { error } = await supabase.from("goal_sprint_logs").update(updates).eq("id", existing.id);
          if (error) throw error;
        } else {
          const insertData: Record<string, any> = {
            user_id: userId,
            sprint_date: date,
            goal_key,
            completed: effectiveCompleted ?? false,
            notes: notes || null,
          };
          if (typeof effectiveSets === "number") insertData.completed_sets = effectiveSets;
          const { error } = await supabase.from("goal_sprint_logs").insert(insertData);
          if (error) throw error;
        }

        // Return full summary
        const result = await RESOURCE_HANDLERS.goal_sprint(supabase, userId, null, null);
        return new Response(JSON.stringify({
          success: true, resource: "goal_sprint", ...result,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // === tasks POST ===
      if (resource === "tasks" && req.method === "POST") {
        const { title, category, pillar, due_date } = body;
        if (!title) {
          return new Response(JSON.stringify({ error: "title is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: maxPosData } = await supabase
          .from("quick_tasks")
          .select("position")
          .eq("user_id", userId)
          .order("position", { ascending: false })
          .limit(1);
        const nextPosition = (maxPosData?.[0]?.position ?? -1) + 1;

        const { data, error } = await supabase
          .from("quick_tasks")
          .insert({
            user_id: userId,
            title,
            category: category || "personal",
            pillar: pillar || null,
            due_date: due_date || null,
            completed: false,
            position: nextPosition,
          })
          .select("id, title, category, pillar, completed, due_date, created_at")
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, task: data }), {
          status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // === tasks PATCH ===
      if (resource === "tasks" && req.method === "PATCH") {
        const { id, completed, title, category, pillar, due_date } = body;
        if (!id) {
          return new Response(JSON.stringify({ error: "id is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: existing, error: lookupErr } = await supabase
          .from("quick_tasks")
          .select("id")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (lookupErr || !existing) {
          return new Response(JSON.stringify({ error: "Task not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (typeof completed === "boolean") {
          updates.completed = completed;
          updates.completed_at = completed ? new Date().toISOString() : null;
        }
        if (title !== undefined) updates.title = title;
        if (category !== undefined) updates.category = category;
        if (pillar !== undefined) updates.pillar = pillar;
        if (due_date !== undefined) updates.due_date = due_date;

        const { data, error } = await supabase
          .from("quick_tasks")
          .update(updates)
          .eq("id", id)
          .select("id, title, category, pillar, completed, completed_at, due_date, created_at")
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, task: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // === big_three POST ===
      if (resource === "big_three" && req.method === "POST") {
        const { type, project_id, phase_id, title, description, position, target_date } = body;
        if (!type || !title) {
          return new Response(JSON.stringify({ error: "type and title are required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        let data, error;
        if (type === "project") {
          ({ data, error } = await supabase.from("big_three_projects").insert({
            user_id: userId, title, description: description || null, position: position ?? 1, target_date: target_date || null,
          }).select().single());
        } else if (type === "phase") {
          if (!project_id) return new Response(JSON.stringify({ error: "project_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          ({ data, error } = await supabase.from("big_three_phases").insert({
            user_id: userId, project_id, title, description: description || null, position: position ?? 0,
          }).select().single());
        } else if (type === "task") {
          if (!phase_id) return new Response(JSON.stringify({ error: "phase_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          ({ data, error } = await supabase.from("big_three_tasks").insert({
            user_id: userId, phase_id, title, description: description || null, position: position ?? 0,
          }).select().single());
        } else {
          return new Response(JSON.stringify({ error: "type must be project, phase, or task" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, type, data }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // === big_three PATCH ===
      if (resource === "big_three" && req.method === "PATCH") {
        const { type, id, ...updates } = body;
        if (!type || !id) return new Response(JSON.stringify({ error: "type and id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const table = type === "project" ? "big_three_projects" : type === "phase" ? "big_three_phases" : type === "task" ? "big_three_tasks" : null;
        if (!table) return new Response(JSON.stringify({ error: "type must be project, phase, or task" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const cleanUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (["title", "description", "completed", "position", "target_date"].includes(k)) cleanUpdates[k] = v;
        }
        if (typeof cleanUpdates.completed === "boolean" && type === "task") {
          cleanUpdates.completed_at = cleanUpdates.completed ? new Date().toISOString() : null;
        }
        
        const { data, error } = await supabase.from(table).update(cleanUpdates).eq("id", id).eq("user_id", userId).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, type, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // === big_three DELETE ===
      if (resource === "big_three" && req.method === "DELETE") {
        const { type, id } = body;
        if (!type || !id) return new Response(JSON.stringify({ error: "type and id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const table = type === "project" ? "big_three_projects" : type === "phase" ? "big_three_phases" : type === "task" ? "big_three_tasks" : null;
        if (!table) return new Response(JSON.stringify({ error: "type must be project, phase, or task" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, deleted: { type, id } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

    }

    // === Reject non-GET for other resources ===
    if (req.method !== "GET" && !(req.method === "POST" || req.method === "PATCH" || req.method === "DELETE")) {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no resource specified, return list of available resources
    if (!resource) {
      return new Response(JSON.stringify({
        available_resources: AVAILABLE_RESOURCES,
        usage: "GET ?resource=<name> to read data. POST/PATCH/DELETE ?resource=tasks|goal_sprint|big_three to write.",
        write_endpoints: {
          "POST tasks": { body: "{ title, category?, pillar?, due_date? }", description: "Create a new task" },
          "PATCH tasks": { body: "{ id, completed?, title?, category?, pillar?, due_date? }", description: "Update or complete a task" },
          "POST/PATCH goal_sprint": { body: "{ date, goal_key, completed?, completed_sets?, action?, notes? }", description: "Log or update a sprint goal." },
          "POST big_three": { body: "{ type: 'project'|'phase'|'task', title, description?, project_id?, phase_id?, position? }", description: "Create a project, phase, or task" },
          "PATCH big_three": { body: "{ type: 'project'|'phase'|'task', id, title?, description?, completed?, position? }", description: "Update a project, phase, or task" },
          "DELETE big_three": { body: "{ type: 'project'|'phase'|'task', id }", description: "Delete a project, phase, or task (cascades)" },
        },
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

    const result = await RESOURCE_HANDLERS[resource](supabase, userId, from, to, url.searchParams);
    const { columns, rows } = result;

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

    const response: any = { resource, count: rows.length, from: from || null, to: to || null, data: rows };
    // Include summary for goal_sprint
    if ((result as any).summary) {
      response.summary = (result as any).summary;
    }

    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[export-data] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
