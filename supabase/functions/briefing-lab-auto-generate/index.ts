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
 * Parse a locale string date safely using date components
 * Avoids issues with new Date(localeString) parsing differently across environments
 */
function parseLocaleDateTime(localeStr: string): Date {
  // Format: "1/15/2025, 7:30:00 AM" or "1/15/2025, 19:30:00"
  const match = localeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?/i);
  if (!match) {
    console.error('[parseLocaleDateTime] Failed to parse:', localeStr);
    return new Date(); // Fallback to now
  }
  
  const [, month, day, year, hourStr, minute, second = '0', ampm] = match;
  let hour = parseInt(hourStr, 10);
  
  // Handle 12-hour format
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
  }
  
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // Month is 0-indexed
    parseInt(day, 10),
    hour,
    parseInt(minute, 10),
    parseInt(second, 10)
  );
}

/**
 * Format date as YYYY-MM-DD using local components (NOT UTC)
 * This prevents timezone shift issues with toISOString()
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Auto-generate LAB briefings for users with SMS delivery enabled.
 * This function should be called by a cron job every 5 minutes.
 * 
 * It checks briefing_lab_preferences for users who:
 * 1. Have enabled = true
 * 2. Have sms_delivery_enabled = true  
 * 3. Are within 30 minutes of their default_wake_time
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

        // Get current time in user's timezone using locale string
        const now = new Date();
        const userTimeStr = now.toLocaleString('en-US', { timeZone: timezone });
        
        // Parse locale string safely (avoids new Date(localeString) issues)
        const userNow = parseLocaleDateTime(userTimeStr);
        
        // Use local date components to avoid UTC shift
        const userTodayStr = formatLocalDate(userNow);

        // Check if weekend and weekend is disabled
        const dayOfWeek = userNow.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend && !userPrefs.weekend_enabled) {
          skipped.push(`${userPrefs.user_id}: weekend disabled`);
          continue;
        }

        // Parse wake time (HH:MM:SS or HH:MM format) - already validated above
        const wakeTimeParts = wakeTime.split(':');
        const wakeHour = parseInt(wakeTimeParts[0], 10);
        const wakeMinute = parseInt(wakeTimeParts[1], 10);

        // Create wake time date object using the user's local "now" as base
        const wakeDateTime = new Date(userNow);
        wakeDateTime.setHours(wakeHour, wakeMinute, 0, 0);

        // Calculate minutes until wake time
        const minutesUntilWake = (wakeDateTime.getTime() - userNow.getTime()) / (1000 * 60);

        console.log(`[briefing-lab-auto-generate] User ${userPrefs.user_id}: ${minutesUntilWake.toFixed(1)} min until wake (${wakeTime} in ${timezone}), local date: ${userTodayStr}`);

        // Generate if within 35 minutes BEFORE wake time or up to 60 min AFTER
        // Wide post-wake window ensures retries succeed even if early attempts fail/timeout
        if (minutesUntilWake <= 35 && minutesUntilWake >= -60) {
          // Check if we already generated a Lab briefing today for this user
          // Use the user's local date, not UTC
          const { data: existingBriefing } = await supabase
            .from('briefing_lab_episodes')
            .select('id, podcast_url, status')
            .eq('user_id', userPrefs.user_id)
            .gte('created_at', `${userTodayStr}T00:00:00Z`)
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

          if (existingBriefing?.status === 'generating') {
            skipped.push(`${userPrefs.user_id}: already generating`);
            continue;
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
