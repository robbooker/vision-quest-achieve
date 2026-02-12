import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const apiKey = authHeader.replace('Bearer ', '');

    // Look up user by API key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('api_key', apiKey)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = profile.user_id;

    // Get user's preferences for timezone from Lab preferences
    const { data: labPrefs } = await supabase
      .from('briefing_lab_preferences')
      .select('timezone, default_wake_time')
      .eq('user_id', userId)
      .maybeSingle();

    const timezone = labPrefs?.timezone || 'America/Chicago';
    
    // Get current time in user's timezone
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentTimeStr = userTime.toTimeString().slice(0, 5); // HH:MM

    // Calculate user's local midnight as actual UTC
    const offsetMs = userTime.getTime() - now.getTime();
    const localMidnightUtc = new Date(userTime);
    localMidnightUtc.setHours(0, 0, 0, 0);
    localMidnightUtc.setTime(localMidnightUtc.getTime() - offsetMs);

    // Get today's briefing from the NEW Lab episodes table
    const { data: briefing, error: briefingError } = await supabase
      .from('briefing_lab_episodes')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', localMidnightUtc.toISOString())
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (briefingError || !briefing) {
      return new Response(JSON.stringify({
        should_wake: false,
        status: 'no_briefing',
        message: 'No briefing ready for today'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if already played (generated_at is set and it was generated today)
    // Lab episodes use 'generated_at' for when it was completed, no 'played_at' field
    // For now, always return the briefing if it's ready
    
    // Get wake time from Lab preferences
    const wakeTimeStr = labPrefs?.default_wake_time?.slice(0, 5) || '07:00'; // HH:MM
    
    // Check if within 5-minute window of wake time
    const wakeMinutes = parseInt(wakeTimeStr.split(':')[0]) * 60 + parseInt(wakeTimeStr.split(':')[1]);
    const currentMinutes = parseInt(currentTimeStr.split(':')[0]) * 60 + parseInt(currentTimeStr.split(':')[1]);
    const diff = currentMinutes - wakeMinutes;

    // Should wake if within 0-5 minutes after wake time and briefing is ready
    const shouldWake = diff >= 0 && diff <= 5 && briefing.status === 'ready' && briefing.podcast_url;

    if (shouldWake) {
      return new Response(JSON.stringify({
        should_wake: true,
        podcast_url: briefing.podcast_url,
        briefing_id: briefing.id,
        wake_time: wakeTimeStr,
        categories: briefing.categories_used || [],
        duration_seconds: briefing.duration_seconds
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Always include podcast_url if available (for iOS Shortcuts that want to play regardless of time)
    return new Response(JSON.stringify({
      should_wake: false,
      status: briefing.status,
      next_wake_time: wakeTimeStr,
      categories: briefing.categories_used || [],
      current_time: currentTimeStr,
      minutes_until_wake: wakeMinutes - currentMinutes,
      podcast_url: briefing.podcast_url || null,
      briefing_id: briefing.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in briefing-wake-check:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
