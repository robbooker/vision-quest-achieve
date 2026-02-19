import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validate wake_time is in HH:MM or HH:MM:SS format
 */
function isValidWakeTime(wakeTime: string): boolean {
  const pattern = /^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return pattern.test(wakeTime);
}

/**
 * Get local date/time components for a timezone using stable Intl.DateTimeFormat parts.
 * This avoids regex-parsing toLocaleString which can vary across Deno runtime versions.
 */
function getLocalDateTime(timezone: string): { date: string; hours: number; minutes: number; dayOfWeek: number } {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const partsArr = formatter.formatToParts(now);
  const parts: Record<string, string> = {};
  for (const p of partsArr) {
    parts[p.type] = p.value;
  }

  // Map weekday short name to day number (0=Sun, 6=Sat)
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = weekdayMap[parts.weekday] ?? new Date().getDay();

  // Handle hour "24" edge case (midnight) — Intl can return "24" for hour12:false
  let hours = parseInt(parts.hour, 10);
  if (hours === 24) hours = 0;

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hours,
    minutes: parseInt(parts.minute, 10),
    dayOfWeek,
  };
}

/**
 * Calculate the UTC timestamp for the start of a user's local "today".
 * E.g., for America/Chicago (UTC-6), local midnight 2026-02-10 = 2026-02-10T06:00:00Z.
 */
function getLocalMidnightAsUTC(timezone: string): string {
  const now = new Date();
  
  // Get the user's local date components
  const local = getLocalDateTime(timezone);
  
  // Build a "fake" date object representing the user's local midnight using their date parts
  // We parse the local date as UTC, then adjust by the offset
  const localDateUtcFake = new Date(`${local.date}T00:00:00Z`);
  
  // Calculate the offset: difference between UTC now and what the local clock shows
  // local time = UTC + offset, so offset = local - UTC
  const localMinutesInDay = local.hours * 60 + local.minutes;
  const utcMinutesInDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  
  // Handle day boundary: if local is "tomorrow" relative to UTC, offset wraps
  let offsetMinutes = localMinutesInDay - utcMinutesInDay;
  // Normalize to [-720, +720] range
  if (offsetMinutes > 720) offsetMinutes -= 1440;
  if (offsetMinutes < -720) offsetMinutes += 1440;
  
  // Local midnight in UTC = local midnight date - offset
  const midnightUTC = new Date(localDateUtcFake.getTime() - offsetMinutes * 60 * 1000);
  
  return midnightUTC.toISOString();
}

/**
 * Auto-generate LAB briefings for users with SMS delivery enabled.
 * This function should be called by a cron job every 5 minutes.
 * 
 * It checks briefing_lab_preferences for users who:
 * 1. Have enabled = true
 * 2. Have sms_delivery_enabled = true  
 * 3. Are within 35 minutes before or 60 minutes after their default_wake_time
 * 4. Haven't already received a briefing today
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[briefing-lab-auto-generate] Starting auto-generation check...');

    // Get all users with Lab briefings enabled and SMS delivery enabled
    const { data: labUsers, error: usersError } = await supabase
      .from('briefing_lab_preferences')
      .select('*')
      .eq('enabled', true)
      .eq('sms_delivery_enabled', true);

    if (usersError) {
      console.error('[briefing-lab-auto-generate] Error fetching users:', usersError);
      throw usersError;
    }

    if (!labUsers || labUsers.length === 0) {
      console.log('[briefing-lab-auto-generate] No users with Lab SMS enabled');
      return new Response(JSON.stringify({ 
        message: 'No users with Lab SMS enabled', 
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[briefing-lab-auto-generate] Found ${labUsers.length} users with Lab SMS enabled`);

    const generated: string[] = [];
    const smsSent: string[] = [];
    const skipped: string[] = [];
    const now = new Date();

    for (const userPrefs of labUsers) {
      try {
        const timezone = userPrefs.timezone || 'America/Chicago';
        const wakeTime = userPrefs.default_wake_time || '07:00:00';

        // Validate wake_time format
        if (!isValidWakeTime(wakeTime)) {
          console.error(`[briefing-lab-auto-generate] Invalid wake_time format for ${userPrefs.user_id}: ${wakeTime}`);
          skipped.push(`${userPrefs.user_id}: invalid wake_time format`);
          continue;
        }

        // Get current time in user's timezone using stable Intl.DateTimeFormat
        const localTime = getLocalDateTime(timezone);

        // Check if weekend and weekend is disabled
        const isWeekend = localTime.dayOfWeek === 0 || localTime.dayOfWeek === 6;
        if (isWeekend && !userPrefs.weekend_enabled) {
          skipped.push(`${userPrefs.user_id}: weekend disabled`);
          continue;
        }

        // Parse wake time (HH:MM:SS or HH:MM format) - already validated above
        const wakeTimeParts = wakeTime.split(':');
        const wakeHour = parseInt(wakeTimeParts[0], 10);
        const wakeMinute = parseInt(wakeTimeParts[1], 10);

        // Calculate minutes until wake time using local time components
        const localMinutesNow = localTime.hours * 60 + localTime.minutes;
        const wakeMinutesInDay = wakeHour * 60 + wakeMinute;
        const minutesUntilWake = wakeMinutesInDay - localMinutesNow;

        console.log(`[briefing-lab-auto-generate] User ${userPrefs.user_id}: ${minutesUntilWake.toFixed(1)} min until wake (${wakeTime} in ${timezone}), local date: ${localTime.date}, local time: ${localTime.hours}:${String(localTime.minutes).padStart(2, '0')}`);

        // Generate if within 35 minutes BEFORE wake time or up to 60 min AFTER
        // Wide post-wake window ensures retries succeed even if early attempts fail/timeout
        if (minutesUntilWake <= 35 && minutesUntilWake >= -60) {
          // Calculate proper UTC boundary for the user's local "today"
          // This correctly handles timezone offsets (e.g., CST midnight = 06:00 UTC)
          const todayStartUTC = getLocalMidnightAsUTC(timezone);

          console.log(`[briefing-lab-auto-generate] User ${userPrefs.user_id}: querying episodes since ${todayStartUTC}`);

          // Check if we already generated a Lab briefing today for this user
          const { data: existingBriefing } = await supabase
            .from('briefing_lab_episodes')
            .select('id, podcast_url, status, created_at')
            .eq('user_id', userPrefs.user_id)
            .gte('created_at', todayStartUTC)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingBriefing?.status === 'ready' && existingBriefing?.podcast_url) {
            // Already have a ready briefing - just need to send SMS if not sent yet
            console.log(`[briefing-lab-auto-generate] User ${userPrefs.user_id} already has briefing, checking SMS...`);
            
            // Try to send SMS
            const smsResult = await sendBriefingSMS(supabase, userPrefs.user_id, existingBriefing.podcast_url);
            if (smsResult.success) {
              smsSent.push(userPrefs.user_id);
            } else {
              skipped.push(`${userPrefs.user_id}: SMS failed - ${smsResult.error}`);
            }
            continue;
          }

          // BUG FIX: Recover stuck "generating" records older than 10 minutes
          if (existingBriefing?.status === 'generating') {
            const createdAt = new Date(existingBriefing.created_at);
            const ageMinutes = (now.getTime() - createdAt.getTime()) / 60000;
            if (ageMinutes > 10) {
              console.log(`[briefing-lab-auto-generate] User ${userPrefs.user_id}: stuck "generating" for ${ageMinutes.toFixed(0)} min, marking as failed`);
              await supabase
                .from('briefing_lab_episodes')
                .update({ status: 'failed', error_message: 'Timed out after 10 minutes' })
                .eq('id', existingBriefing.id);
              // Fall through to retry generation below
            } else {
              skipped.push(`${userPrefs.user_id}: already generating (${ageMinutes.toFixed(0)} min ago)`);
              continue;
            }
          }

          // Skip if too many failures today — cap retries at 3 to prevent runaway credit burn
          if (existingBriefing?.status === 'failed') {
            const { count: failureCount } = await supabase
              .from('briefing_lab_episodes')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userPrefs.user_id)
              .eq('status', 'failed')
              .gte('created_at', todayStartUTC);

            if ((failureCount ?? 0) >= 3) {
              skipped.push(`${userPrefs.user_id}: max retries reached (${failureCount} failures today)`);
              console.log(`[briefing-lab-auto-generate] User ${userPrefs.user_id}: skipping, ${failureCount} failures today`);
              continue;
            }

            const failedAt = new Date(existingBriefing.created_at);
            const failedAgeMin = (now.getTime() - failedAt.getTime()) / 60000;
            if (failedAgeMin < 5) {
              skipped.push(`${userPrefs.user_id}: recently failed, waiting before retry`);
              continue;
            }
            // Otherwise fall through to retry
            console.log(`[briefing-lab-auto-generate] User ${userPrefs.user_id}: retrying after previous failure (attempt ${(failureCount ?? 0) + 1}/3)`);
          }

          console.log(`[briefing-lab-auto-generate] Triggering Lab generation for ${userPrefs.user_id}`);

          // Call the briefing-lab-generate function
          const { data: genResult, error: genError } = await supabase.functions.invoke('briefing-lab-generate', {
            body: { user_id: userPrefs.user_id }
          });

          if (genError) {
            console.error(`[briefing-lab-auto-generate] Generation failed for ${userPrefs.user_id}:`, genError);
            skipped.push(`${userPrefs.user_id}: generation error - ${genError.message}`);
          } else {
            generated.push(userPrefs.user_id);
            console.log(`[briefing-lab-auto-generate] Successfully triggered generation for ${userPrefs.user_id}`);
            
            // If generation returned a podcast URL, send SMS
            if (genResult?.podcast_url) {
              const smsResult = await sendBriefingSMS(supabase, userPrefs.user_id, genResult.podcast_url);
              if (smsResult.success) {
                smsSent.push(userPrefs.user_id);
              }
            }
          }
        } else if (minutesUntilWake > 35) {
          skipped.push(`${userPrefs.user_id}: too early (${minutesUntilWake.toFixed(0)} min until wake)`);
        } else {
          skipped.push(`${userPrefs.user_id}: too late (${Math.abs(minutesUntilWake).toFixed(0)} min past wake)`);
        }

      } catch (userError) {
        console.error(`[briefing-lab-auto-generate] Error processing user ${userPrefs.user_id}:`, userError);
        skipped.push(`${userPrefs.user_id}: processing error`);
      }
    }

    const result = {
      message: `Processed ${labUsers.length} Lab users`,
      generated: generated.length,
      smsSent: smsSent.length,
      skipped: skipped.length,
      generatedUserIds: generated,
      smsSentUserIds: smsSent,
      skippedReasons: skipped
    };

    console.log('[briefing-lab-auto-generate] Complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[briefing-lab-auto-generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Send SMS with briefing link to user
 */
async function sendBriefingSMS(
  supabase: any, 
  userId: string, 
  podcastUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMS already sent today for this user
    const now = new Date();
    const userPrefsRes = await supabase
      .from('briefing_lab_preferences')
      .select('timezone')
      .eq('user_id', userId)
      .single();
    const tz = userPrefsRes.data?.timezone || 'America/Chicago';
    const localDateStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD

    const { data: alreadySent } = await supabase
      .from('briefing_sms_sent')
      .select('id')
      .eq('user_id', userId)
      .eq('sent_date', localDateStr)
      .maybeSingle();

    if (alreadySent) {
      console.log(`[briefing-lab-auto-generate] SMS already sent today for user ${userId}`);
      return { success: true }; // Already sent, treat as success
    }

    // Get user's phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_us')
      .eq('user_id', userId)
      .single();

    if (!profile?.phone_us) {
      return { success: false, error: 'No phone number' };
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, error: 'Twilio not configured' };
    }

    // Send SMS
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    // Build nicely formatted message matching the old style
    const smsBody = `☀️ Your morning briefing is ready!

Listen now: ${podcastUrl}

Topics: your interests`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: profile.phone_us,
        From: fromNumber,
        Body: smsBody,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[briefing-lab-auto-generate] Twilio error:', result);
      return { success: false, error: result.message || 'SMS failed' };
    }

    console.log(`[briefing-lab-auto-generate] SMS sent to user ${userId}`);

    // Record that SMS was sent today
    await supabase
      .from('briefing_sms_sent')
      .insert({ user_id: userId, sent_date: localDateStr });

    return { success: true };
  } catch (error) {
    console.error('[briefing-lab-auto-generate] SMS error:', error);
    return { success: false, error: String(error) };
  }
}
