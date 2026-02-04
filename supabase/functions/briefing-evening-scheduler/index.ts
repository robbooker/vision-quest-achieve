import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Scheduler that checks which users should receive an evening reminder SMS.
 * Only sends to users who have:
 * 1. sms_delivery_enabled = true
 * 2. enabled = true (briefings enabled)
 * 3. Current time matches their evening_reminder_time in their timezone
 * 
 * Called by cron every 15 minutes.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[briefing-evening-scheduler] Starting evening reminder check...');

    // Get all users with SMS delivery enabled
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('briefing_preferences')
      .select('user_id, evening_reminder_time, timezone')
      .eq('enabled', true)
      .eq('sms_delivery_enabled', true);

    if (usersError) {
      console.error('[briefing-evening-scheduler] Error fetching users:', usersError);
      throw usersError;
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('[briefing-evening-scheduler] No eligible users found');
      return new Response(JSON.stringify({ 
        message: 'No eligible users', 
        sent: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[briefing-evening-scheduler] Found ${eligibleUsers.length} eligible users`);

    const sent: string[] = [];
    const skipped: string[] = [];

    for (const user of eligibleUsers) {
      try {
        const timezone = user.timezone || 'America/Chicago';
        const eveningTime = user.evening_reminder_time || '19:00:00';

        // Get current time in user's timezone
        const now = new Date();
        const userTimeStr = now.toLocaleString('en-US', { 
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        // Parse current time (format: "HH:MM")
        const [currentHour, currentMinute] = userTimeStr.split(':').map(Number);
        
        // Parse evening reminder time (format: "HH:MM:SS" or "HH:MM")
        const eveningParts = eveningTime.split(':');
        const reminderHour = parseInt(eveningParts[0]);
        const reminderMinute = parseInt(eveningParts[1]);

        // Check if current time is within 15-minute window of reminder time
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
        const diff = Math.abs(currentTotalMinutes - reminderTotalMinutes);

        // Match if within 7 minutes (half of 15-min cron interval)
        if (diff <= 7 || diff >= (24 * 60 - 7)) {
          console.log(`[briefing-evening-scheduler] Sending reminder to ${user.user_id} (${currentHour}:${currentMinute} matches ${reminderHour}:${reminderMinute})`);

          // Check if we already sent a reminder today
          const userTodayStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
          
          const { data: existingBriefing } = await supabase
            .from('morning_briefings')
            .select('id')
            .eq('user_id', user.user_id)
            .eq('wake_date', userTodayStr)
            .single();

          // Only send if no briefing scheduled for tomorrow yet
          const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            .toLocaleDateString('en-CA', { timeZone: timezone });
          
          const { data: tomorrowBriefing } = await supabase
            .from('morning_briefings')
            .select('id')
            .eq('user_id', user.user_id)
            .eq('wake_date', tomorrowStr)
            .single();

          if (tomorrowBriefing) {
            skipped.push(`${user.user_id}: already has tomorrow's briefing scheduled`);
            continue;
          }

          // Call the evening reminder function
          const { error: reminderError } = await supabase.functions.invoke('briefing-evening-reminder', {
            body: { user_id: user.user_id }
          });

          if (reminderError) {
            console.error(`[briefing-evening-scheduler] Reminder failed for ${user.user_id}:`, reminderError);
            skipped.push(`${user.user_id}: reminder error - ${reminderError.message}`);
          } else {
            sent.push(user.user_id);
            console.log(`[briefing-evening-scheduler] Successfully sent reminder to ${user.user_id}`);
          }
        } else {
          skipped.push(`${user.user_id}: not time yet (${currentHour}:${String(currentMinute).padStart(2, '0')} vs ${reminderHour}:${String(reminderMinute).padStart(2, '0')})`);
        }

      } catch (userError) {
        console.error(`[briefing-evening-scheduler] Error processing user ${user.user_id}:`, userError);
        skipped.push(`${user.user_id}: processing error`);
      }
    }

    const result = {
      message: `Processed ${eligibleUsers.length} eligible users`,
      sent: sent.length,
      skipped: skipped.length,
      sentIds: sent,
      skippedReasons: skipped.slice(0, 10) // Limit log size
    };

    console.log('[briefing-evening-scheduler] Complete:', { sent: sent.length, skipped: skipped.length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[briefing-evening-scheduler] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
