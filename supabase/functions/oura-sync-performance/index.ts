import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OURA_API_BASE = "https://api.ouraring.com/v2/usercollection";

interface OuraDailySleepData {
  day: string;
  score: number | null;
  contributors?: {
    total_sleep?: number;
    deep_sleep?: number;
    rem_sleep?: number;
    light_sleep?: number;
    efficiency?: number;
  };
}

interface OuraSleepSession {
  day: string;
  bedtime_start: string | null;
  bedtime_end: string | null;
  total_sleep_duration: number | null;
  deep_sleep_duration: number | null;
  rem_sleep_duration: number | null;
  light_sleep_duration: number | null;
  time_in_bed: number | null;
  efficiency: number | null;
  type: string;
}

interface OuraReadinessData {
  day: string;
  score: number | null;
  contributors?: {
    resting_heart_rate?: number;
    hrv_balance?: number;
  };
}

interface OuraResilienceData {
  day: string;
  level: string | null;
}

interface OuraDailyActivityData {
  day: string;
  score: number | null;
  active_calories: number | null;
  total_calories: number | null;
  steps: number | null;
  equivalent_walking_distance: number | null;
  high_activity_time: number | null;
  medium_activity_time: number | null;
  low_activity_time: number | null;
  sedentary_time: number | null;
  inactivity_alerts: number | null;
}

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

    // Get user's Oura token from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("oura_access_token")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.oura_access_token) {
      return new Response(JSON.stringify({ error: "Oura Ring not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ouraToken = profile.oura_access_token;
    
    // Calculate date range (today and last 14 days for baseline calculation)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 14);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = today.toISOString().split('T')[0];

    console.log(`Fetching Oura data from ${startDateStr} to ${endDateStr}`);

    // Fetch all endpoints in parallel (including sleep sessions for actual durations)
    const [dailySleepRes, sleepSessionsRes, readinessRes, resilienceRes, dailyActivityRes] = await Promise.all([
      fetch(`${OURA_API_BASE}/daily_sleep?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
      fetch(`${OURA_API_BASE}/sleep?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
      fetch(`${OURA_API_BASE}/daily_readiness?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
      fetch(`${OURA_API_BASE}/daily_resilience?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
      fetch(`${OURA_API_BASE}/daily_activity?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
    ]);

    // Check for auth errors
    if (dailySleepRes.status === 401 || sleepSessionsRes.status === 401 || 
        readinessRes.status === 401 || resilienceRes.status === 401 || dailyActivityRes.status === 401) {
      return new Response(JSON.stringify({ 
        error: "Oura token expired or invalid. Please reconnect your Oura Ring." 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dailySleepData = await dailySleepRes.json();
    const sleepSessionsData = await sleepSessionsRes.json();
    const readinessData = await readinessRes.json();
    const resilienceData = await resilienceRes.json();
    const dailyActivityData = await dailyActivityRes.json();

    console.log(`Fetched: ${dailySleepData.data?.length || 0} daily_sleep, ${sleepSessionsData.data?.length || 0} sleep sessions, ${readinessData.data?.length || 0} readiness, ${resilienceData.data?.length || 0} resilience, ${dailyActivityData.data?.length || 0} activity records`);

    // Log a sample sleep session for debugging
    if (sleepSessionsData.data?.length > 0) {
      const sample = sleepSessionsData.data[0];
      console.log(`Sample sleep session: day=${sample.day}, type=${sample.type}, total_sleep_duration=${sample.total_sleep_duration}, deep=${sample.deep_sleep_duration}, rem=${sample.rem_sleep_duration}, light=${sample.light_sleep_duration}, time_in_bed=${sample.time_in_bed}, bedtime_start=${sample.bedtime_start}, bedtime_end=${sample.bedtime_end}`);
    }

    // Process and merge data by date
    const dailySleepByDate: Record<string, OuraDailySleepData> = {};
    const readinessByDate: Record<string, OuraReadinessData> = {};
    const resilienceByDate: Record<string, OuraResilienceData> = {};
    
    // Aggregate sleep sessions by date (only use "long_sleep" type, take the main one)
    const sleepSessionsByDate: Record<string, {
      total: number;
      deep: number;
      rem: number;
      light: number;
      efficiency: number | null;
      bedtimeStart: string | null;
      bedtimeEnd: string | null;
    }> = {};

    (dailySleepData.data || []).forEach((d: OuraDailySleepData) => {
      dailySleepByDate[d.day] = d;
    });

    // Process sleep sessions - use the primary sleep session
    // IMPORTANT: Oura's sleep sessions are dated by the day you WOKE UP
    // So a session with day=2026-01-28 is the sleep from the night of 01-27 to 01-28
    // The daily_sleep score for 2026-01-29 refers to the sleep from 01-28 to 01-29,
    // which would have day=2026-01-29 in the sleep endpoint
    (sleepSessionsData.data || []).forEach((session: OuraSleepSession) => {
      // Only count "long_sleep" or "sleep" type sessions (ignore naps, rest periods)
      // Oura API v2 uses "long_sleep", but sometimes returns just "sleep"
      if (session.type !== "long_sleep" && session.type !== "sleep") return;
      
      const date = session.day;
      
      // Calculate total sleep from stage durations if total_sleep_duration is null
      const deep = session.deep_sleep_duration || 0;
      const rem = session.rem_sleep_duration || 0;
      const light = session.light_sleep_duration || 0;
      
      // Use total_sleep_duration if available, otherwise sum the stages
      // Note: time_in_bed includes awake time, so we prefer summing stages
      const totalSleep = session.total_sleep_duration || (deep + rem + light);
      
      console.log(`Processing session: date=${date}, type=${session.type}, totalSleep=${totalSleep}`);
      
      // If we already have data for this date, aggregate it (in case of multiple long_sleep sessions)
      if (!sleepSessionsByDate[date]) {
        sleepSessionsByDate[date] = { 
          total: 0, 
          deep: 0, 
          rem: 0, 
          light: 0, 
          efficiency: null,
          bedtimeStart: null,
          bedtimeEnd: null
        };
      }
      
      sleepSessionsByDate[date].total += totalSleep;
      sleepSessionsByDate[date].deep += deep;
      sleepSessionsByDate[date].rem += rem;
      sleepSessionsByDate[date].light += light;
      
      // Take efficiency and bedtime from the main sleep session
      if (session.efficiency !== null) {
        sleepSessionsByDate[date].efficiency = session.efficiency;
      }
      
      // Store bedtime_start and bedtime_end for the edit dialog
      if (session.bedtime_start) {
        sleepSessionsByDate[date].bedtimeStart = session.bedtime_start;
      }
      if (session.bedtime_end) {
        sleepSessionsByDate[date].bedtimeEnd = session.bedtime_end;
      }
    });
    
    // Log what dates we have sleep session data for
    console.log(`Sleep sessions by date: ${JSON.stringify(Object.keys(sleepSessionsByDate))}`);
    console.log(`Daily sleep by date: ${JSON.stringify(Object.keys(dailySleepByDate))}`);

    (readinessData.data || []).forEach((d: OuraReadinessData) => {
      readinessByDate[d.day] = d;
    });
    (resilienceData.data || []).forEach((d: OuraResilienceData) => {
      resilienceByDate[d.day] = d;
    });

    // Process daily activity data
    const activityByDate: Record<string, OuraDailyActivityData> = {};
    (dailyActivityData.data || []).forEach((d: OuraDailyActivityData) => {
      activityByDate[d.day] = d;
    });

    // Get all unique dates
    const allDates = [...new Set([
      ...Object.keys(dailySleepByDate),
      ...Object.keys(sleepSessionsByDate),
      ...Object.keys(readinessByDate),
      ...Object.keys(resilienceByDate),
      ...Object.keys(activityByDate),
    ])].sort();

    if (allDates.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No Oura data available for sync",
        metrics: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate 14-day baselines for RHR and HRV
    const rhrValues: number[] = [];
    const hrvValues: number[] = [];

    allDates.forEach((date) => {
      const readiness = readinessByDate[date];
      if (readiness?.contributors?.resting_heart_rate) {
        rhrValues.push(readiness.contributors.resting_heart_rate);
      }
      if (readiness?.contributors?.hrv_balance) {
        hrvValues.push(readiness.contributors.hrv_balance);
      }
    });

    const rhrBaseline = rhrValues.length > 0 
      ? Math.round(rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length)
      : null;
    const hrvBaseline = hrvValues.length > 0
      ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length)
      : null;

    // Prepare upsert data
    const metricsToUpsert = allDates.map((date) => {
      const dailySleep = dailySleepByDate[date];
      let sleepSession = sleepSessionsByDate[date];
      const readiness = readinessByDate[date];
      const resilience = resilienceByDate[date];
      const activity = activityByDate[date];

      // IMPORTANT FIX: If we have a daily_sleep score for today but no sleep session,
      // that means the session data is attributed to "yesterday" (the wake-up day).
      // We need to find the matching session. Typically:
      // - daily_sleep for 01-29 corresponds to the night of 01-28 to 01-29
      // - The sleep session for that night might be dated 01-28 or 01-29 depending on when you woke up
      // 
      // If no session for this date, check if there's one from yesterday that hasn't been used
      if (!sleepSession && dailySleep) {
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Only borrow yesterday's session if we don't already have a daily_sleep score for yesterday
        // This prevents double-counting
        if (sleepSessionsByDate[yesterdayStr] && !dailySleepByDate[yesterdayStr]) {
          console.log(`Using yesterday's sleep session (${yesterdayStr}) for today's score (${date})`);
          sleepSession = sleepSessionsByDate[yesterdayStr];
        }
      }

      const rhr = readiness?.contributors?.resting_heart_rate ?? null;
      const hrvBalance = readiness?.contributors?.hrv_balance ?? null;

      // Calculate stress alerts
      const rhrSpikeAlert = rhrBaseline && rhr ? rhr >= rhrBaseline + 3 : false;
      const hrvStrainAlert = hrvBalance !== null 
        ? hrvBalance < 70 || (hrvBaseline && hrvBalance < hrvBaseline * 0.8)
        : false;
      const criticalDeficitAlert = rhrSpikeAlert && hrvStrainAlert;

      // Parse bedtime timestamps into proper format for our DB
      let manualBedtime = null;
      let manualWakeTime = null;
      
      if (sleepSession?.bedtimeStart) {
        manualBedtime = sleepSession.bedtimeStart;
      }
      if (sleepSession?.bedtimeEnd) {
        manualWakeTime = sleepSession.bedtimeEnd;
      }

      // FIX: If sleepSession exists but seems like a nap (under 2 hours = 7200 seconds), 
      // and we have a dailySleep score (which indicates real overnight sleep happened),
      // estimate the duration from the score since Oura API didn't return long_sleep properly.
      let totalSleepSeconds: number | null = sleepSession?.total ?? null;
      let deepSleepSeconds: number | null = sleepSession?.deep ?? null;
      let remSleepSeconds: number | null = sleepSession?.rem ?? null;
      let lightSleepSeconds: number | null = sleepSession?.light ?? null;
      
      const MIN_REASONABLE_SLEEP = 7200; // 2 hours in seconds
      if (dailySleep?.score && (!totalSleepSeconds || totalSleepSeconds < MIN_REASONABLE_SLEEP)) {
        // Oura sleep score roughly correlates to sleep quantity and quality
        // A score of 83 typically means ~6-7 hours of sleep
        // Use formula: estimated_hours = (score / 100) * 8 hours (rough approximation)
        const estimatedHours = (dailySleep.score / 100) * 8;
        const estimatedSeconds = Math.round(estimatedHours * 3600);
        console.log(`Sleep session seems wrong (${totalSleepSeconds}s). Estimating from score ${dailySleep.score}: ~${estimatedHours.toFixed(1)}h = ${estimatedSeconds}s`);
        totalSleepSeconds = estimatedSeconds;
        // Clear stage durations since they're unreliable
        deepSleepSeconds = null;
        remSleepSeconds = null;
        lightSleepSeconds = null;
      }

      console.log(`Building metrics for ${date}: sleep_score=${dailySleep?.score}, total_sleep=${totalSleepSeconds ?? 'null'} (raw session: ${sleepSession?.total ?? 'none'}), activity_score=${activity?.score ?? 'null'}, steps=${activity?.steps ?? 'null'}`);

      return {
        user_id: user.id,
        metric_date: date,
        source: 'oura',
        // Sleep score from daily_sleep endpoint
        sleep_score: dailySleep?.score ?? null,
        // Sleep durations - may be estimated if session data was wrong
        total_sleep_seconds: totalSleepSeconds,
        deep_sleep_seconds: deepSleepSeconds,
        rem_sleep_seconds: remSleepSeconds,
        light_sleep_seconds: sleepSession?.light ?? null,
        sleep_efficiency: sleepSession?.efficiency ?? null,
        // Bedtime info for the edit dialog
        manual_bedtime: manualBedtime,
        manual_wake_time: manualWakeTime,
        // Readiness
        readiness_score: readiness?.score ?? null,
        resting_heart_rate: rhr,
        hrv_balance: hrvBalance,
        // Resilience (normalize to lowercase)
        resilience_level: resilience?.level?.toLowerCase() ?? null,
        // Activity data
        activity_score: activity?.score ?? null,
        active_calories: activity?.active_calories ?? null,
        total_calories: activity?.total_calories ?? null,
        steps: activity?.steps ?? null,
        equivalent_walking_distance_meters: activity?.equivalent_walking_distance ?? null,
        high_activity_minutes: activity?.high_activity_time ? Math.round(activity.high_activity_time / 60) : null,
        medium_activity_minutes: activity?.medium_activity_time ? Math.round(activity.medium_activity_time / 60) : null,
        low_activity_minutes: activity?.low_activity_time ? Math.round(activity.low_activity_time / 60) : null,
        sedentary_minutes: activity?.sedentary_time ? Math.round(activity.sedentary_time / 60) : null,
        inactivity_alerts: activity?.inactivity_alerts ?? null,
        // Baselines & alerts
        rhr_baseline_14d: rhrBaseline,
        hrv_baseline_14d: hrvBaseline,
        rhr_spike_alert: rhrSpikeAlert,
        hrv_strain_alert: hrvStrainAlert,
        critical_deficit_alert: criticalDeficitAlert,
        // Metadata
        synced_at: new Date().toISOString(),
      };
    });

    // Use service role for upsert to handle RLS
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert all records
    const { error: upsertError } = await supabaseService
      .from("oura_daily_metrics")
      .upsert(metricsToUpsert, { 
        onConflict: 'user_id,metric_date',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to save metrics" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get today's metrics to return
    const todayStr = today.toISOString().split('T')[0];
    const todayMetrics = metricsToUpsert.find((m) => m.metric_date === todayStr) || 
                         metricsToUpsert[metricsToUpsert.length - 1];

    console.log(`Synced ${metricsToUpsert.length} days of Oura data. Today's sleep: ${todayMetrics?.total_sleep_seconds} seconds`);

    return new Response(JSON.stringify({ 
      success: true, 
      synced: metricsToUpsert.length,
      metrics: todayMetrics,
      baselines: {
        rhr: rhrBaseline,
        hrv: hrvBaseline,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Oura sync error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
