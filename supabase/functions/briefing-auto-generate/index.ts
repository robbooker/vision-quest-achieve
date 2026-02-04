import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Auto-generate briefings that are scheduled within 30 minutes of wake time.
 * This function should be called by a cron job every 5 minutes.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[briefing-auto-generate] Starting auto-generation check...');

    // Get all scheduled briefings for today
    const { data: scheduledBriefings, error: briefingsError } = await supabase
      .from('morning_briefings')
      .select(`
        id,
        user_id,
        wake_date,
        wake_time,
        status
      `)
      .eq('status', 'scheduled');

    if (briefingsError) {
      console.error('[briefing-auto-generate] Error fetching briefings:', briefingsError);
      throw briefingsError;
    }

    if (!scheduledBriefings || scheduledBriefings.length === 0) {
      console.log('[briefing-auto-generate] No scheduled briefings found');
      return new Response(JSON.stringify({ 
        message: 'No scheduled briefings', 
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[briefing-auto-generate] Found ${scheduledBriefings.length} scheduled briefings`);

    const generated: string[] = [];
    const skipped: string[] = [];

    for (const briefing of scheduledBriefings) {
      try {
        // Get user's timezone from preferences
        const { data: prefs } = await supabase
          .from('briefing_preferences')
          .select('timezone')
          .eq('user_id', briefing.user_id)
          .single();

        const timezone = prefs?.timezone || 'America/Chicago';

        // Get current time in user's timezone
        const now = new Date();
        const userTimeStr = now.toLocaleString('en-US', { timeZone: timezone });
        const userNow = new Date(userTimeStr);
        const userTodayStr = userNow.toISOString().split('T')[0];

        // Check if this briefing is for today (in user's timezone)
        if (briefing.wake_date !== userTodayStr) {
          skipped.push(`${briefing.id}: not today (${briefing.wake_date} vs ${userTodayStr})`);
          continue;
        }

        // Parse wake time (HH:MM:SS or HH:MM format)
        const wakeTimeParts = briefing.wake_time.split(':');
        const wakeHour = parseInt(wakeTimeParts[0]);
        const wakeMinute = parseInt(wakeTimeParts[1]);

        // Create wake time date object in user's timezone
        const wakeDateTime = new Date(userNow);
        wakeDateTime.setHours(wakeHour, wakeMinute, 0, 0);

        // Calculate minutes until wake time
        const minutesUntilWake = (wakeDateTime.getTime() - userNow.getTime()) / (1000 * 60);

        console.log(`[briefing-auto-generate] Briefing ${briefing.id}: ${minutesUntilWake.toFixed(1)} min until wake (${briefing.wake_time})`);

        // Generate if within 30 minutes of wake time (but not past it by more than 5 min)
        // This gives a window: -5 min to +30 min from wake time
        if (minutesUntilWake <= 30 && minutesUntilWake >= -5) {
          console.log(`[briefing-auto-generate] Triggering generation for ${briefing.id}`);

          // Call the briefing-generate function
          const { error: genError } = await supabase.functions.invoke('briefing-generate', {
            body: { briefing_id: briefing.id }
          });

          if (genError) {
            console.error(`[briefing-auto-generate] Generation failed for ${briefing.id}:`, genError);
            skipped.push(`${briefing.id}: generation error - ${genError.message}`);
          } else {
            generated.push(briefing.id);
            console.log(`[briefing-auto-generate] Successfully triggered generation for ${briefing.id}`);
          }
        } else if (minutesUntilWake > 30) {
          skipped.push(`${briefing.id}: too early (${minutesUntilWake.toFixed(0)} min until wake)`);
        } else {
          skipped.push(`${briefing.id}: too late (${Math.abs(minutesUntilWake).toFixed(0)} min past wake)`);
        }

      } catch (userError) {
        console.error(`[briefing-auto-generate] Error processing briefing ${briefing.id}:`, userError);
        skipped.push(`${briefing.id}: processing error`);
      }
    }

    const result = {
      message: `Processed ${scheduledBriefings.length} briefings`,
      generated: generated.length,
      skipped: skipped.length,
      generatedIds: generated,
      skippedReasons: skipped
    };

    console.log('[briefing-auto-generate] Complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[briefing-auto-generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
