import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validate time is in HH:MM or HH:MM:SS format
 */
function isValidTime(time: string): boolean {
  const pattern = /^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return pattern.test(time);
}

/**
 * Parse a locale string date safely using date components
 */
function parseLocaleDateTime(localeStr: string): Date {
  const match = localeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?/i);
  if (!match) {
    console.error('[parseLocaleDateTime] Failed to parse:', localeStr);
    return new Date();
  }
  
  const [, month, day, year, hourStr, minute, second = '0', ampm] = match;
  let hour = parseInt(hourStr, 10);
  
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
  }
  
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    hour,
    parseInt(minute, 10),
    parseInt(second, 10)
  );
}

/**
 * Format date as YYYY-MM-DD using local components
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Evening reminder SMS sender.
 * This function should be called by a cron job every 5 minutes.
 * 
 * It checks briefing_lab_preferences for users who:
 * 1. Have enabled = true
 * 2. Have sms_delivery_enabled = true
 * 3. Have evening_reminder_time set
 * 4. Are within 5 minutes of their evening_reminder_time
 * 5. Haven't already received an evening reminder today
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('[briefing-evening-reminder] Starting evening reminder check...');

    // Get all users with Lab briefings and SMS enabled who have evening reminder time set
    const { data: labUsers, error: usersError } = await supabase
      .from('briefing_lab_preferences')
      .select('*')
      .eq('enabled', true)
      .eq('sms_delivery_enabled', true)
      .not('evening_reminder_time', 'is', null);

    if (usersError) {
      console.error('[briefing-evening-reminder] Error fetching users:', usersError);
      throw usersError;
    }

    if (!labUsers || labUsers.length === 0) {
      console.log('[briefing-evening-reminder] No users with evening reminder enabled');
      return new Response(JSON.stringify({ 
        message: 'No users with evening reminder enabled', 
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[briefing-evening-reminder] Found ${labUsers.length} users with evening reminder configured`);

    const sent: string[] = [];
    const skipped: string[] = [];

    for (const userPrefs of labUsers) {
      try {
        const timezone = userPrefs.timezone || 'America/Chicago';
        const eveningTime = userPrefs.evening_reminder_time;

        if (!eveningTime || !isValidTime(eveningTime)) {
          skipped.push(`${userPrefs.user_id}: invalid evening_reminder_time`);
          continue;
        }

        // Get current time in user's timezone
        const now = new Date();
        const userTimeStr = now.toLocaleString('en-US', { timeZone: timezone });
        const userNow = parseLocaleDateTime(userTimeStr);
        const userTodayStr = formatLocalDate(userNow);

        // Check if weekend and weekend is disabled
        const dayOfWeek = userNow.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend && !userPrefs.weekend_enabled) {
          skipped.push(`${userPrefs.user_id}: weekend disabled`);
          continue;
        }

        // Parse evening reminder time
        const timeParts = eveningTime.split(':');
        const reminderHour = parseInt(timeParts[0], 10);
        const reminderMinute = parseInt(timeParts[1], 10);

        // Create reminder time date object
        const reminderDateTime = new Date(userNow);
        reminderDateTime.setHours(reminderHour, reminderMinute, 0, 0);

        // Calculate minutes until reminder time
        const minutesUntilReminder = (reminderDateTime.getTime() - userNow.getTime()) / (1000 * 60);

        console.log(`[briefing-evening-reminder] User ${userPrefs.user_id}: ${minutesUntilReminder.toFixed(1)} min until reminder (${eveningTime} in ${timezone}), local date: ${userTodayStr}`);

        // Send if within 5 minutes of reminder time (but not more than 10 min past)
        if (minutesUntilReminder <= 5 && minutesUntilReminder >= -10) {
          // Check if we already sent an evening reminder today
          const { data: existingReminder } = await supabase
            .from('evening_reminders_sent')
            .select('id')
            .eq('user_id', userPrefs.user_id)
            .eq('sent_date', userTodayStr)
            .maybeSingle();

          if (existingReminder) {
            skipped.push(`${userPrefs.user_id}: already sent today`);
            continue;
          }

          // Get user's phone number
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone_us, display_name')
            .eq('user_id', userPrefs.user_id)
            .single();

          if (!profile?.phone_us) {
            skipped.push(`${userPrefs.user_id}: no phone number`);
            continue;
          }

          // Send SMS
          const smsResult = await sendEveningReminderSMS(profile.phone_us, profile.display_name);
          
          if (smsResult.success) {
            // Record that we sent the reminder
            await supabase
              .from('evening_reminders_sent')
              .insert({
                user_id: userPrefs.user_id,
                sent_date: userTodayStr,
              });
            
            sent.push(userPrefs.user_id);
            console.log(`[briefing-evening-reminder] Sent to ${userPrefs.user_id}`);
          } else {
            skipped.push(`${userPrefs.user_id}: SMS failed - ${smsResult.error}`);
          }
        } else if (minutesUntilReminder > 5) {
          skipped.push(`${userPrefs.user_id}: too early (${minutesUntilReminder.toFixed(0)} min until reminder)`);
        } else {
          skipped.push(`${userPrefs.user_id}: too late (${Math.abs(minutesUntilReminder).toFixed(0)} min past reminder)`);
        }

      } catch (userError) {
        console.error(`[briefing-evening-reminder] Error processing user ${userPrefs.user_id}:`, userError);
        skipped.push(`${userPrefs.user_id}: processing error`);
      }
    }

    const result = {
      message: `Processed ${labUsers.length} users`,
      sent: sent.length,
      skipped: skipped.length,
      sentUserIds: sent,
      skippedReasons: skipped
    };

    console.log('[briefing-evening-reminder] Complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[briefing-evening-reminder] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Send evening reminder SMS
 */
async function sendEveningReminderSMS(
  phoneNumber: string, 
  displayName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, error: 'Twilio not configured' };
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    // Friendly evening reminder message
    const name = displayName || 'there';
    const smsBody = `🌙 Hey ${name}! Quick evening check-in from Toasty:

How was your day? What's one win you had today? 

Reply with anything on your mind - I'm here to listen. You can also set tomorrow's intention or ask me anything! 💬`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: fromNumber,
        Body: smsBody,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[briefing-evening-reminder] Twilio error:', result);
      return { success: false, error: result.message || 'SMS failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('[briefing-evening-reminder] SMS error:', error);
    return { success: false, error: String(error) };
  }
}
