import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OURA_API_BASE = "https://api.ouraring.com/v2/usercollection";

interface OuraSleepData {
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

    // Fetch all three endpoints in parallel
    const [sleepRes, readinessRes, resilienceRes] = await Promise.all([
      fetch(`${OURA_API_BASE}/daily_sleep?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
      fetch(`${OURA_API_BASE}/daily_readiness?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
      fetch(`${OURA_API_BASE}/daily_resilience?start_date=${startDateStr}&end_date=${endDateStr}`, {
        headers: { Authorization: `Bearer ${ouraToken}` },
      }),
    ]);

    // Check for auth errors
    if (sleepRes.status === 401 || readinessRes.status === 401 || resilienceRes.status === 401) {
      return new Response(JSON.stringify({ 
        error: "Oura token expired or invalid. Please reconnect your Oura Ring." 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sleepData = await sleepRes.json();
    const readinessData = await readinessRes.json();
    const resilienceData = await resilienceRes.json();

    console.log(`Fetched: ${sleepData.data?.length || 0} sleep, ${readinessData.data?.length || 0} readiness, ${resilienceData.data?.length || 0} resilience records`);

    // Process and merge data by date
    const sleepByDate: Record<string, OuraSleepData> = {};
    const readinessByDate: Record<string, OuraReadinessData> = {};
    const resilienceByDate: Record<string, OuraResilienceData> = {};

    (sleepData.data || []).forEach((d: OuraSleepData) => {
      sleepByDate[d.day] = d;
    });
    (readinessData.data || []).forEach((d: OuraReadinessData) => {
      readinessByDate[d.day] = d;
    });
    (resilienceData.data || []).forEach((d: OuraResilienceData) => {
      resilienceByDate[d.day] = d;
    });

    // Get all unique dates
    const allDates = [...new Set([
      ...Object.keys(sleepByDate),
      ...Object.keys(readinessByDate),
      ...Object.keys(resilienceByDate),
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
      const sleep = sleepByDate[date];
      const readiness = readinessByDate[date];
      const resilience = resilienceByDate[date];

      const rhr = readiness?.contributors?.resting_heart_rate ?? null;
      const hrvBalance = readiness?.contributors?.hrv_balance ?? null;

      // Calculate stress alerts
      const rhrSpikeAlert = rhrBaseline && rhr ? rhr >= rhrBaseline + 3 : false;
      const hrvStrainAlert = hrvBalance !== null 
        ? hrvBalance < 70 || (hrvBaseline && hrvBalance < hrvBaseline * 0.8)
        : false;
      const criticalDeficitAlert = rhrSpikeAlert && hrvStrainAlert;

      return {
        user_id: user.id,
        metric_date: date,
        source: 'oura',
        // Sleep
        sleep_score: sleep?.score ?? null,
        total_sleep_seconds: sleep?.contributors?.total_sleep ?? null,
        deep_sleep_seconds: sleep?.contributors?.deep_sleep ?? null,
        rem_sleep_seconds: sleep?.contributors?.rem_sleep ?? null,
        light_sleep_seconds: sleep?.contributors?.light_sleep ?? null,
        sleep_efficiency: sleep?.contributors?.efficiency ?? null,
        // Readiness
        readiness_score: readiness?.score ?? null,
        resting_heart_rate: rhr,
        hrv_balance: hrvBalance,
        // Resilience (normalize to lowercase)
        resilience_level: resilience?.level?.toLowerCase() ?? null,
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

    console.log(`Synced ${metricsToUpsert.length} days of Oura data`);

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
