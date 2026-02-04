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
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('briefing_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (prefsError || !prefs || !prefs.enabled) {
      return new Response(JSON.stringify({ message: 'Briefing not enabled for user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's phone number from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_us, display_name')
      .eq('user_id', user_id)
      .single();

    const phoneNumber = profile?.phone_us;
    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: 'No phone number configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const preferredChannel = prefs.preferred_channel || 'sms';

    // Send SMS reminder
    if (preferredChannel === 'sms' || preferredChannel === 'both') {
      const message = `What time would you like your morning briefing tomorrow?\n\nReply with a time like "6:30" or "7am"\nReply "skip" to skip tomorrow\n\n💡 Set your default topics in Settings → Morning Briefing`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append('To', phoneNumber);
      formData.append('From', TWILIO_PHONE_NUMBER);
      formData.append('Body', message);

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!twilioResponse.ok) {
        const errorData = await twilioResponse.text();
        console.error('Twilio SMS error:', errorData);
        throw new Error('Failed to send SMS');
      }

      console.log(`Sent evening reminder SMS to ${phoneNumber}`);
    }

    // Voice call (if preferred channel is call or both)
    if (preferredChannel === 'call' || preferredChannel === 'both') {
      // For voice calls, we'd initiate an outbound call with TwiML
      // This is more complex and would need a TwiML endpoint
      // For now, just log that we would call
      console.log(`Would initiate voice call to ${phoneNumber} for evening reminder`);
    }

    return new Response(JSON.stringify({ success: true, channel: preferredChannel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in briefing-evening-reminder:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
